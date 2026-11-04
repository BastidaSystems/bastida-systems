import * as THREE from 'three';

// Neon trim plus a softly luminous original print; no replacement artwork or bloom pass.
export async function addCompaRafaLighting(record,scene){
  const response=await fetch('assets/custom-buildings/compa-rafa/lighting.json?v=20261015-rafa1');if(!response.ok)throw Error('No cargó la iluminación COMPA RAFA');const d=await response.json(),[a,b,c]=d.plane,q=d.bounds,group=new THREE.Group();group.name='Neón COMPA RAFA';
  const corners=[[q.minX,q.minY],[q.maxX,q.minY],[q.maxX,q.maxY],[q.minX,q.maxY]].map(([x,y])=>new THREE.Vector3(x,y,a*x+b*y+c));const path=new THREE.CurvePath();for(let i=0;i<4;i++)path.add(new THREE.LineCurve3(corners[i],corners[(i+1)%4]));
  const frame=new THREE.Mesh(new THREE.TubeGeometry(path,96,.055,6,true),new THREE.MeshStandardMaterial({color:0x300300,emissive:0xff1608,emissiveIntensity:4,roughness:.3,metalness:.12}));frame.name='Marco rojo COMPA RAFA';group.add(frame);
  const padding=.45,minX=q.minX-padding,minY=q.minY-padding,width=q.maxX-q.minX+2*padding,height=q.maxY-q.minY+2*padding,cx=minX+width/2,cy=minY+height/2,canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.lineJoin='round';ctx.shadowBlur=19;ctx.shadowColor='#fff';ctx.strokeRect(padding/width*1024,padding/height*512,(width-padding*2)/width*1024,(height-padding*2)/height*512);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const geometry=new THREE.PlaneGeometry(width,height),p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,a*(p.getX(i)+cx)+b*(p.getY(i)+cy)+c-.025);geometry.computeVertexNormals();
  const halo=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map,color:0xff1003,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false}));halo.position.set(cx,cy,0);halo.name='Halo COMPA RAFA';group.add(halo);group.traverse(o=>{if(o.isMesh)o.userData.minimapDecoration=true;});
  let body;record.root.traverse(o=>{if(o.isMesh&&!o.userData.buildingCollisionProxy)body=o;});const material=body.material;
  // Keep the full-color print readable; emission is limited to the billboard plane and front face.
  material.onBeforeCompile=shader=>{shader.uniforms.rafaPanelZ={value:d.panelZ};shader.uniforms.rafaPrintGlow={value:.7};
    shader.vertexShader='varying vec3 vRafaPosition;\nvarying float vRafaFacing;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvRafaFacing=objectNormal.z;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRafaPosition=transformed;');
    shader.fragmentShader='varying vec3 vRafaPosition;\nvarying float vRafaFacing;\nuniform float rafaPanelZ;\nuniform float rafaPrintGlow;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat rafaMask=step(13.9,vRafaPosition.y)*step(vRafaPosition.y,19.9)*smoothstep(.35,.65,vRafaFacing)*(1.0-smoothstep(.25,.6,abs(vRafaPosition.z-rafaPanelZ)));\ntotalEmissiveRadiance+=diffuseColor.rgb*rafaMask*rafaPrintGlow;');
    material.userData.rafaShader=shader;
  };material.customProgramCacheKey=()=> 'compa-rafa-print-v1';material.needsUpdate=true;
  record.root.add(group);record.root.updateMatrixWorld(true);const lights=[];
  for(const x of [-5.5,5.5]){const position=record.root.localToWorld(new THREE.Vector3(x,13.2,d.panelZ+3.5)),target=new THREE.Object3D();target.position.copy(record.root.localToWorld(new THREE.Vector3(x*.55,17,d.panelZ)));scene.add(target);const light=new THREE.SpotLight(0xffddbd,20,8,Math.PI/3,.8,2);light.position.copy(position);light.target=target;light.name='Proyector COMPA RAFA';scene.add(light);lights.push(light);}
  record.lighting={group,frame,halo,body,lights};return {style:'red-neon-frame',lights:2,shadowLights:0,drawCalls:2,printGlow:.7,triangles:frame.geometry.index.count/3+2};
}
