import * as THREE from 'three';

// A movable cursor on the horizontal firing plane. Screen Y changes distance
// across the map, never manual gun elevation. The height helper stays separate.
export function createTacticalPointer(){
 const ndc=new THREE.Vector2(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3(),initial=new THREE.Vector3();
 let active=false,offset=0,last=null;
 function initialize(camera,origin,yaw){
  if(active)return;
  initial.set(-Math.sin(yaw)*8,0,-Math.cos(yaw)*8).add(origin).project(camera);
  ndc.set(THREE.MathUtils.clamp(initial.x,-.94,.94),THREE.MathUtils.clamp(initial.y,-.90,.90));active=true;
 }
 return {
  move(dx,dy,{camera,origin,yaw,width,height,sensitivity=1}){
   if(![dx,dy,width,height,sensitivity].every(Number.isFinite)||width<=0||height<=0)return;
   initialize(camera,origin,yaw);ndc.x=THREE.MathUtils.clamp(ndc.x+dx*2/width*sensitivity,-.96,.96);ndc.y=THREE.MathUtils.clamp(ndc.y-dy*2/height*sensitivity,-.92,.92);offset=0;
  },
  absolute(x,y,{width,height}){
   if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return;
   ndc.set(THREE.MathUtils.clamp(x*2/width-1,-.96,.96),THREE.MathUtils.clamp(1-y*2/height,-.92,.92));active=true;offset=0;
  },
  update(camera,origin){
   if(!active)return null;
   plane.constant=-origin.y;ray.setFromCamera(ndc,camera);
   if(!ray.ray.intersectPlane(plane,point))return null;
   const x=point.x-origin.x,z=point.z-origin.z,distance=Math.hypot(x,z);
   if(!Number.isFinite(distance)||distance<.0001)return null;
   last={yaw:Math.atan2(-x,-z)+offset,distance:Math.min(120,distance),x:ndc.x,y:ndc.y,worldX:point.x,worldY:point.y,worldZ:point.z};return {...last};
  },
  assist(delta){if(active&&Number.isFinite(delta))offset=THREE.MathUtils.clamp(offset+delta,-.06,.06);},
  worldPoint(out){if(!active||!last)return false;out.set(last.worldX,last.worldY,last.worldZ);return true;},
  reset(){active=false;offset=0;last=null;},
  get active(){return active;},
  info:()=>({active,offset,...last}),
 };
}
