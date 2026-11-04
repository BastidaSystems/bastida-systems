import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';
import { PLACED_VEHICLES } from './vehicle-catalog.js?v=20261014-vfx1';

const overlaps=(a,b)=>a.minX<b.maxX-1e-4&&a.maxX>b.minX+1e-4&&a.minZ<b.maxZ-1e-4&&a.maxZ>b.minZ+1e-4;
const rect=b=>({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});
export function createPlacedVehicleSystem({scene,colliders,shootBlockers,MAP,MAPREG,getExistingVehicles,groundSurfaces,onPlacementChanged,getTextureAnisotropy=()=>1}){
 const state={ready:false,error:null,records:[]};let loading;
 const proxyGeometry=new THREE.BoxGeometry(1,1,1),proxyMaterial=new THREE.MeshBasicMaterial();
 async function template(kind){
  const base='assets/vehicles/'+kind+'/';
  const [file,response]=await Promise.all([createModelLoader().loadAsync(base+'model.glb?v=20261013-fleet1'),fetch(base+'asset.json?v=20261013-fleet1')]);
  if(!response.ok)throw new Error('No cargó el descriptor de '+kind);
  const descriptor=await response.json();const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const triangles=meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
  if(meshes.length!==1||triangles!==descriptor.triangles||triangles>60000||triangles<30000)throw new Error('Vehículo fuera del presupuesto de geometría');
  for(const mesh of meshes){
   if(!mesh.geometry.attributes.uv||!mesh.geometry.attributes.normal||!mesh.material.map||!mesh.material.normalMap||!mesh.material.roughnessMap||!mesh.material.metalnessMap)throw new Error('Vehículo sin PBR completo');
   for(const texture of new Set([mesh.material.map,mesh.material.normalMap,mesh.material.roughnessMap,mesh.material.metalnessMap])){texture.anisotropy=Math.min(8,getTextureAnisotropy());texture.needsUpdate=true;}
  }
  return {file,descriptor,triangles};
 }
 return {state,
  load(environmentReady){if(loading)return loading;loading=(async()=>{
   const templates=new Map(),errors=[],reserved=[];
   for(const e of PLACED_VEHICLES)if(!templates.has(e.kind))templates.set(e.kind,template(e.kind));
   await Promise.allSettled([...templates.values(),environmentReady]);await environmentReady;
   for(const entry of PLACED_VEHICLES){try{
    const loaded=await templates.get(entry.kind),visual=loaded.file.scene.clone(true),root=new THREE.Group();root.name=entry.name+' - '+entry.id;root.add(visual);
    // All three inspected sources have their cab toward -X. Keep authored rollover poses.
    visual.rotation.y=Math.PI/2;root.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(root,true);const scale=entry.length/(bounds.max.z-bounds.min.z);
    visual.scale.multiplyScalar(scale);root.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(root,true);
    const center=bounds.getCenter(new THREE.Vector3());visual.position.add(new THREE.Vector3(-center.x,-bounds.min.y,-center.z));root.updateMatrixWorld(true);
    const size=new THREE.Box3().setFromObject(root,true).getSize(new THREE.Vector3());root.position.set(entry.position.x,0,entry.position.z);root.rotation.y=entry.yaw;root.updateMatrixWorld(true);
    const ray=new THREE.Raycaster(new THREE.Vector3(entry.position.x,.5,entry.position.z),new THREE.Vector3(0,-1,0),0,1);
    const supportY=ray.intersectObjects(groundSurfaces(),false)[0]?.point.y;
    if(supportY===undefined)throw new Error('Vehículo sin suelo de apoyo');root.position.y=supportY;root.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(root,true);
    const footprint=rect(bounds),P0={minX:-1.5,maxX:1.5,minZ:44.5,maxZ:47.5};
    if(footprint.minX<-MAP.halfW||footprint.maxX>MAP.halfW||footprint.minZ<-MAP.halfL||footprint.maxZ>MAP.halfL||overlaps(footprint,P0))throw new Error('Vehículo invade P0 o el límite');
    if([...MAPREG.buildings,...getExistingVehicles().map(c=>c.collider),...reserved].some(r=>overlaps(footprint,r)))throw new Error('Vehículo invade otro edificio o vehículo');
    const cos=Math.cos(entry.yaw),sin=Math.sin(entry.yaw),collider={...footprint,cx:entry.position.x,cz:entry.position.z,halfX:size.x/2,halfZ:size.z/2,cos,sin};
    const blockers=[];
    for(const [width,height,length,y]of [[size.x,size.y*.65,size.z,size.y*.325],[size.x*.85,size.y*.35,size.z*.88,size.y*.825]]){
     const proxy=new THREE.Mesh(proxyGeometry,proxyMaterial);proxy.scale.set(width,height,length);proxy.position.y=y;proxy.visible=false;proxy.userData.vehicleCollisionProxy=true;root.add(proxy);blockers.push(proxy);
    }
    root.updateMatrixWorld(true);scene.add(root);colliders.push(collider);shootBlockers.push(...blockers);reserved.push(footprint);
    state.records.push({entry,root,visual,bounds,collider,blockers,size,scale,supportY,triangles:loaded.triangles});
   }catch(error){errors.push(entry.id+': '+error.message);}}
   state.error=errors.length?errors.join('; '):null;state.ready=true;if(state.records.length)onPlacementChanged();
  })().catch(error=>{state.error=error.message;state.ready=true;});return loading;},
  info(){return {ready:state.ready,error:state.error,count:state.records.length,vehicles:state.records.map(r=>({id:r.entry.id,kind:r.entry.kind,name:r.entry.name,position:r.root.position.toArray(),yaw:r.entry.yaw,scale:r.scale,size:r.size.toArray(),triangles:r.triangles,groundY:r.bounds.min.y,supportY:r.supportY,bounds:{min:r.bounds.min.toArray(),max:r.bounds.max.toArray()},collisionBodies:1,shootBoxes:r.blockers.length}))};},
 };
}
