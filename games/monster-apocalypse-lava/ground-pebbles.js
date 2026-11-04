import * as THREE from 'three';

// New centimetre-sized decorative stones, not a replacement/LOD for the five
// original rock models. Use their existing local albedo; no new texture files,
// colliders, ray blockers, timers or gameplay randomness.
export const PEBBLE_SIZES=Object.freeze([.045,.06,.08,.105,.135,.17,.21,.255,.305,.36]);

export function addGroundPebbles({scene,material,MAP,MAPREG,resolvePosition,groundY}){
 let seed=0x1085ea;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const plans=[],point=new THREE.Vector3(),batches=[],matrix=new THREE.Object3D(),cells=new Map();
 const cellKey=(x,z)=>x+','+z,cellSize=.75;
 const stoneMaterial=material.clone();stoneMaterial.specular?.setScalar(.08);stoneMaterial.shininess=12;
 function place(x,z){
  if(Math.abs(x)>MAP.halfW-1||Math.abs(z)>MAP.halfL-1)return;
  if(MAPREG.buildings.some(b=>x>b.minX-.1&&x<b.maxX+.1&&z>b.minZ-.1&&z<b.maxZ+.1))return;
  point.set(x,0,z);resolvePosition(point,.12,true);
  if(Math.hypot(point.x-x,point.z-z)>.001)return;
  const y=groundY(x,z);
  if(Math.abs(groundY(x+.12,z)-y)>.025||Math.abs(groundY(x,z+.12)-y)>.025)return;
  const sizeIndex=Math.min(9,Math.floor(Math.pow(random(),1.9)*PEBBLE_SIZES.length)),width=PEBBLE_SIZES[sizeIndex],radius=width*.8;
  const cx=Math.floor(x/cellSize),cz=Math.floor(z/cellSize);
  // Leave clear ground between stones, including the larger sizes. The spatial
  // hash is used once at loading; it adds no collision or per-frame work.
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)
   for(const p of cells.get(cellKey(cx+dx,cz+dz))||[])
    if(Math.hypot(x-p.x,z-p.z)<radius+p.radius+.09)return;
  const plan={x,y:y-.004,z,width,sizeIndex,radius,yaw:random()*Math.PI*2,stretch:.65+random()*.55,shade:.68+random()*.32};
  plans.push(plan);const key=cellKey(cx,cz);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(plan);
 }
 // Loose, wider clusters break up the empty regular streets, with sparse loose stones
 // between them. Distribution is reproducible and never aligned to a grid.
 for(let c=0;c<110;c++){
  const x=(random()-.5)*(MAP.halfW*2-3),z=(random()-.5)*(MAP.halfL*2-3);
  for(let j=0;j<30;j++){const angle=random()*Math.PI*2,radius=Math.pow(random(),.65)*4.6;place(x+Math.cos(angle)*radius,z+Math.sin(angle)*radius);}
 }
 for(let i=0;i<1400;i++)place((random()-.5)*(MAP.halfW*2-3),(random()-.5)*(MAP.halfL*2-3));
 for(let kind=0;kind<4;kind++){
  const geometry=new THREE.IcosahedronGeometry(.5,0),positions=geometry.attributes.position;
  // Consistent deformation per shared vertex avoids seams between faces.
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),r=1+.15*Math.sin(x*17+y*11+z*23+kind*2);
   positions.setXYZ(i,x*r,(y*r+.58)*(.45+kind*.045),z*r);
  }
  positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();
  geometry.translate(0,-geometry.boundingBox.min.y,0);
  const entries=plans.filter((_,i)=>i%4===kind),batch=new THREE.InstancedMesh(geometry,stoneMaterial,entries.length);
  batch.name='Piedritas de suelo '+kind;batch.receiveShadow=true;batch.userData.groundPebbles=true;
  const color=new THREE.Color();
  entries.forEach((p,i)=>{
   matrix.position.set(p.x,p.y,p.z);matrix.rotation.set(0,p.yaw,0);matrix.scale.set(p.width,p.width,p.width*p.stretch);matrix.updateMatrix();
   batch.setMatrixAt(i,matrix.matrix);batch.setColorAt(i,color.setRGB(p.shade,p.shade*.98,p.shade*.94));
  });
  batch.instanceMatrix.needsUpdate=true;if(batch.instanceColor)batch.instanceColor.needsUpdate=true;
  batch.computeBoundingBox();batch.computeBoundingSphere();scene.add(batch);batches.push(batch);
 }
 return {batches,info:()=>({count:plans.length,batches:batches.length,triangles:plans.length*20,sizeVariants:PEBBLE_SIZES.length,sizes:PEBBLE_SIZES.map((width,i)=>({width,count:plans.filter(p=>p.sizeIndex===i).length})),clearance:.09,minWidth:Math.min(...plans.map(p=>p.width)),maxWidth:Math.max(...plans.map(p=>p.width)),textureAssetsAdded:0,sharedTextures:1,textureSize:[stoneMaterial.map.image.width,stoneMaterial.map.image.height],colliders:0,seed:'1085ea'})};
}

// Add fine irregular aggregate to the existing road material, preserving every
// original map/normal/UV and its resolution. World-space grain avoids matching
// tile seams; derivative filtering fades tiny detail before it can shimmer.
export function addGroundGrain(surfaces){
 const strength={value:1},materials=new Map();
 for(const surface of surfaces){
  const original=surface.material;if(!original||Array.isArray(original))continue;
  if(!materials.has(original)){
   const material=original.clone(),key=original.customProgramCacheKey();
   material.onBeforeCompile=function(shader,renderer){
    original.onBeforeCompile.call(original,shader,renderer);shader.uniforms.groundGrainStrength=strength;
    shader.vertexShader='varying vec2 vGroundGrain;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
     vec4 grainPosition=vec4(transformed,1.0);
     #ifdef USE_INSTANCING
      grainPosition=instanceMatrix*grainPosition;
     #endif
     vGroundGrain=(modelMatrix*grainPosition).xz;
    `);
    shader.fragmentShader=`varying vec2 vGroundGrain;
     uniform float groundGrainStrength;
     float grainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
     float grainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(grainHash(i),grainHash(i+vec2(1.,0.)),f.x),mix(grainHash(i+vec2(0.,1.)),grainHash(i+1.),f.x),f.y);}
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     float grainFilter=1.0-smoothstep(.015,.09,max(fwidth(vGroundGrain.x),fwidth(vGroundGrain.y)));
     float aggregate=(grainNoise(vGroundGrain*19.0)-.5)*.8*grainFilter;
     float mottling=(grainNoise(vGroundGrain*1.8)-.5)*.3;
     diffuseColor.rgb*=1.0+groundGrainStrength*(aggregate+mottling);
    `);
   };
   material.extensions={...material.extensions,derivatives:true};
   material.customProgramCacheKey=()=>key+'|ground-grain108';material.needsUpdate=true;materials.set(original,material);
  }
  surface.material=materials.get(original);
 }
 return {strength,info:()=>({materials:materials.size,extraTextures:0,extraDrawCalls:0,originalMapsPreserved:true})};
}
