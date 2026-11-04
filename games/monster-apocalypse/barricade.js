import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';
import { planPerimeter, outsideFoundation } from './perimeter-layout.js?v=20261013-perimeter1';

// All four limits; the two original south instances remain unchanged.
export const ALIEN_BARRICADE_CONFIG=Object.freeze({enabled:true,heights:[6,5.88],
  turns:[Math.PI+.006,Math.PI-.006],backEdge:61.85,collisionInset:1,
  model:'assets/barricades/alien/model.glb?v=20261013-barricade1',
  descriptor:'assets/barricades/alien/asset.json?v=20261013-barricade1',
  lod:'assets/barricades/alien/perimeter-lod.glb?v=20261013-perimeter1'});
const footprint=body=>({...body,rectangles:[body],boundaries:[
  {ax:body.minX,az:body.minZ,bx:body.maxX,bz:body.minZ,nx:0,nz:-1},
  {ax:body.minX,az:body.maxZ,bx:body.maxX,bz:body.maxZ,nx:0,nz:1},
  {ax:body.minX,az:body.minZ,bx:body.minX,bz:body.maxZ,nx:-1,nz:0},
  {ax:body.maxX,az:body.minZ,bx:body.maxX,bz:body.maxZ,nx:1,nz:0},
]});
export function createAlienBarricadeSystem({scene,colliders,shootBlockers,terrainReady,groundSurfaces,mapLimits,getBuildings}){
 const state={ready:false,error:null,legacy:null,legacies:[],batch:null,batches:[],proxies:[],collisions:[],segments:[]};let loading;
 const remove=(list,item)=>{const i=list.indexOf(item);if(i>=0)list.splice(i,1);};
 const geometryOf=file=>{file.scene.updateMatrixWorld(true);const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  if(meshes.length!==1)throw new Error('Se esperaba una malla de barricada');const mesh=meshes[0];
  const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);geometry.computeBoundingBox();
  const box=geometry.boundingBox,size=box.getSize(new THREE.Vector3());geometry.translate(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return {geometry,material:mesh.material,size,triangles:geometry.index.count/3};};
 const buildBatch=(geometry,material,records,name)=>{const batch=new THREE.InstancedMesh(geometry,material,records.length),t=new THREE.Object3D();batch.name=name;
  records.forEach((r,i)=>{t.position.set(r.x,r.y,r.z);t.rotation.set(0,r.yaw,0);t.scale.setScalar(r.scale);t.updateMatrix();batch.setMatrixAt(i,t.matrix);});
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();return batch;};
 return {state,
  register(wall){if(state.legacies.includes(wall))throw new Error('Muro repetido');state.legacies.push(wall);
   if(Math.abs(wall.position.z-58.8)<.001&&wall.geometry.parameters.width===40)state.legacy=wall;},
  load(){if(loading)return loading;loading=(async()=>{if(!ALIEN_BARRICADE_CONFIG.enabled)return;
   try{
    if(!state.legacy||state.legacies.length!==6)throw new Error('Faltan los seis muros de cierre');
    const [file,lodFile,response]=await Promise.all([createModelLoader().loadAsync(ALIEN_BARRICADE_CONFIG.model),createModelLoader().loadAsync(ALIEN_BARRICADE_CONFIG.lod),fetch(ALIEN_BARRICADE_CONFIG.descriptor)]);
    if(!response.ok)throw new Error('No cargó el descriptor de la barricada');const descriptor=await response.json();
    const high=geometryOf(file),low=geometryOf(lodFile),material=high.material;
    if(high.triangles!==descriptor.triangles||high.triangles>50000||low.triangles>20000||!material.map||!material.normalMap||!material.roughnessMap||!material.metalnessMap||
     !high.geometry.attributes.uv||!low.geometry.attributes.uv)throw new Error('Barricada sin materiales o presupuesto válido');
    low.material.dispose();await terrainReady();
    // Keep the accepted view from P0: same high-detail geometry, transforms and ground sampling.
    const primary=[],t=new THREE.Object3D(),wall=state.legacy;
    for(let i=0;i<2;i++){
     const scale=ALIEN_BARRICADE_CONFIG.heights[i]/high.size.y,yaw=ALIEN_BARRICADE_CONFIG.turns[i];
     t.position.set(0,0,0);t.rotation.set(0,yaw,0);t.scale.setScalar(scale);t.updateMatrix();
     const box=high.geometry.boundingBox.clone().applyMatrix4(t.matrix),x=i===0?-20-box.min.x:20-box.max.x,z=61.85-box.max.z;
     const ray=new THREE.Raycaster(new THREE.Vector3(x,.5,61.45),new THREE.Vector3(0,-1,0),0,1),y=ray.intersectObjects(groundSurfaces(),false)[0]?.point.y??-.02;
     t.position.set(x,y,z);t.updateMatrix();const b=high.geometry.boundingBox.clone().applyMatrix4(t.matrix);
     primary.push({x,y,z,yaw,scale,height:high.size.y*scale,edge:'south',lod:'primary',bounds:{min:b.min.toArray(),max:b.max.toArray()}});
    }
    const buildings=getBuildings(),plan=planPerimeter({mapLimits,buildings,size:{width:high.size.x,height:high.size.y,depth:high.size.z},primary});
    const batch=buildBatch(high.geometry,material,primary,'Barricada sur original - P0'),batches=[batch],groups=new Map();
    for(const r of plan.segments.filter(r=>r.lod==='perimeter')){const key=r.corner?['corner',r.corner.x,r.corner.z].join('|'):[r.edge,r.line.axis,r.line.fixed].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
    for(const [key,records]of groups)batches.push(buildBatch(low.geometry,material,records,'Barricada perímetro '+key));
    // Flat support only underneath portions outside the existing terrain; streets remain intact.
    const ground={minX:-72,maxX:56,minZ:-82,maxZ:62};
    // Reuse exterior support under explicitly oversized buildings, without changing city streets.
    const buildingSupport=buildings.filter(b=>b.supportOutsideGround).map(b=>({bounds:{min:[b.minX,0,b.minZ],max:[b.maxX,0,b.maxZ]}}));
    const pads=outsideFoundation([...plan.segments,...buildingSupport],ground);let foundation=null;
    if(pads.length){const geo=new THREE.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);
     foundation=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0x2a2724,roughness:1}),pads.length);foundation.name='Apoyo exterior de barricadas';
     pads.forEach((r,i)=>{t.position.set((r.minX+r.maxX)/2,-.022,(r.minZ+r.maxZ)/2);t.rotation.set(0,0,0);t.scale.set(r.maxX-r.minX,1,r.maxZ-r.minZ);t.updateMatrix();foundation.setMatrixAt(i,t.matrix);});
     foundation.instanceMatrix.needsUpdate=true;foundation.computeBoundingBox();foundation.computeBoundingSphere();}
    const proxies=[],unit=new THREE.BoxGeometry(1,1,1),proxyMat=wall.material;
    const addProxy=(x,z,w,d,name)=>{const p=new THREE.Mesh(unit,proxyMat);p.position.set(x,2,z);p.scale.set(w,4,d);p.visible=false;p.name=name;p.userData.boundaryProxy=name;p.updateMatrixWorld(true);proxies.push(p);return p;};
    const proxy=addProxy(0,57.8,40,1.5,'south-core'),collider=footprint({minX:-20,maxX:20,minZ:57.05,maxZ:58.55});
    const W=mapLimits.halfW,L=mapLimits.halfL;
    addProxy(0,L+.8,2*W,1.5,'south');addProxy(0,-L-.8,2*W,1.5,'north');addProxy(W+.8,0,1.5,2*L,'east');addProxy(-W-.8,0,1.5,2*L,'west');
    // Separate outside strips preserve minimap LOS and the original four playable limits.
    const outside=[
     {minX:-W-24,maxX:W+24,minZ:L,maxZ:L+24,edge:'south',b:{ax:-W,az:L,bx:W,bz:L,nx:0,nz:-1}},
     {minX:-W-24,maxX:W+24,minZ:-L-24,maxZ:-L,edge:'north',b:{ax:-W,az:-L,bx:W,bz:-L,nx:0,nz:1}},
     {minX:W,maxX:W+24,minZ:-L-24,maxZ:L+24,edge:'east',b:{ax:W,az:-L,bx:W,bz:L,nx:-1,nz:0}},
     {minX:-W-24,maxX:-W,minZ:-L-24,maxZ:L+24,edge:'west',b:{ax:-W,az:-L,bx:-W,bz:L,nx:1,nz:0}},
    ];
    const limits=outside.map(({b,edge,...body})=>({...body,rectangles:[body],boundaries:[b],edge}));
    if(state.legacies.some(w=>!scene.children.includes(w)||!shootBlockers.includes(w)))throw new Error('Falta un muro anterior');
    for(const w of state.legacies){scene.remove(w);remove(shootBlockers,w);}scene.add(...batches,...proxies);if(foundation)scene.add(foundation);
    const collisions=[collider,...limits];colliders.push(...collisions);
    Object.assign(state,{ready:true,batch,batches,proxy,proxies,collider,southLimit:limits[0],collisions,segments:plan.segments,outline:plan.outline,length:plan.length,
     overlap:primary[0].bounds.max[0]-primary[1].bounds.min[0],triangles:high.triangles,lodTriangles:low.triangles,descriptor,foundation,pads,buildings});
   }catch(error){state.error=error.message;console.warn('No cargó la barricada alienígena',error);}
  })();return loading;},
  restore(){if(!state.ready)return;scene.remove(...state.batches,...state.proxies);if(state.foundation)scene.remove(state.foundation);
   for(const c of state.collisions)remove(colliders,c);for(const p of state.proxies)remove(shootBlockers,p);
   for(const w of state.legacies){scene.add(w);shootBlockers.push(w);}state.ready=false;},
  info(){return {ready:state.ready,error:state.error,edges:['north','south','east','west'],length:state.length,instances:state.segments.length,
   primaryInstances:2,trianglesPerSegment:state.triangles,lodTriangles:state.lodTriangles,
   renderedTriangles:state.triangles*2+state.lodTriangles*(state.segments.length-2),batches:state.batches.length,
   overlap:state.overlap,segments:state.segments,outline:state.outline,collision:state.collider,foundationPieces:state.pads?.length||0,
   oldWallRemoved:state.ready&&state.legacies.every(w=>!scene.children.includes(w))};},
 };
}
