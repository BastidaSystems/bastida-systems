import * as THREE from 'three';

// One flame per existing vehicle, attached to its real exposed front surface.
// Only reads visual geometry; collision proxies and vehicle transforms are untouched.
export function planVehicleHoodFires({cars=[],vehicles=[]}={}){
 const plans=[],warnings=[],local=new THREE.Box3(),inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();
 const entries=[...cars.filter(c=>c.loaded&&c.visual).map((c,i)=>({id:'car-'+i,root:c.g,visual:c.visual,kind:'car'})),
  ...vehicles.filter(v=>v.visual&&v.root).map(v=>({id:v.entry.id,root:v.root,visual:v.visual,kind:v.entry.kind}))];
 for(const entry of entries){
  const {root,visual,id}=entry;root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();local.makeEmpty();const meshes=[];
  visual.traverse(o=>{if(!o.isMesh||o.userData.vehicleCollisionProxy) return;
   meshes.push(o);if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
   matrix.multiplyMatrices(inverse,o.matrixWorld);local.union(o.geometry.boundingBox.clone().applyMatrix4(matrix));
  });
  if(local.isEmpty()){warnings.push(id+': sin superficie visual');continue;}
  const center=local.getCenter(new THREE.Vector3()),size=local.getSize(new THREE.Vector3());
  const worldBounds=new THREE.Box3().setFromObject(visual,true),points=[];
  // Inspected original cars face local -Z; the cab of the placed fleet faces +Z.
  const front=entry.kind==='car'?-1:1,depth=['bus','ambulance'].includes(entry.kind)?.07:entry.kind==='trailer'?.10:.18;
  const seed=[...id].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0),preferred=seed%2?1:-1;
  for(const side of [preferred,-preferred]){
   let point=null;
   // Damaged hoods contain holes: search the same front band, always requiring
   // an actual exposed triangle. Never use the roof or an invented floating point.
   for(const inset of [depth,depth+.035,depth+.07]){
    for(const spread of [.16,.11,.07]){
     const z=front>0?local.max.z-size.z*inset:local.min.z+size.z*inset;
     const target=root.localToWorld(new THREE.Vector3(center.x+side*size.x*spread,center.y,z));
     const ray=new THREE.Raycaster(new THREE.Vector3(target.x,worldBounds.max.y+2,target.z),new THREE.Vector3(0,-1,0),0,worldBounds.max.y-worldBounds.min.y+4);
     const hit=ray.intersectObjects(meshes,false)[0];
     if(hit){point=hit.point.clone().add(new THREE.Vector3(0,.035,0));break;}
    }
    if(point)break;
   }
   if(point){points.push(point);break;}
  }
  if(!points.length)warnings.push(id+': cofre sin superficie');
  const variation=[.68,.85,1.05,.78,1.16,.94][seed%6];
  if(points.length===1)plans.push({id,kind:entry.kind,root,points,width:size.x,
   flameSize:[THREE.MathUtils.clamp(size.x*.48,.8,1.35)*variation,(entry.kind==='car'?1.55:1.85)*variation]});
 }
 return {plans,warnings};
}
