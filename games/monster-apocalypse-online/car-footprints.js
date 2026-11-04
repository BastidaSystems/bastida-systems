// Reuse the map's existing compound-footprint solver. Data is prepared offline
// from the original car meshes in their actual yaw/roll poses; no per-frame mesh work.
export function applyCarFootprint(car,data){
 const shape=data?.version===1&&data.shapes?.find(s=>s.kind===car.kind&&s.flipped===car.flipped&&Math.abs(s.yaw-car.rot)<1e-7);
 if(!shape||!shape.rectangles?.length||!shape.boundaries?.length)return false;
 const c=car.collider,dx=c.cx-car.x,dz=c.cz-car.z,cx=dx*c.cos-dz*c.sin,cz=dx*c.sin+dz*c.cos;
 const actual=[cx-c.halfX,cx+c.halfX,cz-c.halfZ,cz+c.halfZ];
 if(!shape.outer?.every((v,i)=>Number.isFinite(v)&&Math.abs(v-actual[i])<.005))return false;
 const rectangles=shape.rectangles.map(([x1,x2,z1,z2])=>({minX:x1+car.x,maxX:x2+car.x,minZ:z1+car.z,maxZ:z2+car.z}));
 const boundaries=shape.boundaries.map(([ax,az,bx,bz,nx,nz])=>({ax:ax+car.x,az:az+car.z,bx:bx+car.x,bz:bz+car.z,nx,nz}));
 if([...rectangles.flatMap(r=>Object.values(r)),...boundaries.flatMap(b=>Object.values(b))].some(v=>!Number.isFinite(v)))return false;
 Object.assign(car.collider,{rectangles,boundaries});delete car.collider.exitsByRadius;
 car.collisionFootprint={cell:data.cell,slab:data.slab,area:shape.area};return true;
}
