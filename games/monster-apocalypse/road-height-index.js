import * as THREE from 'three';

// Exact vertical ray hits, indexed by horizontal cell. Rendering keeps every
// source triangle; oblique rays retain Three's standard InstancedMesh raycast.
export function indexRoadHeights(batch){
 const geometry=batch.geometry,positions=geometry.attributes.position,index=geometry.index;
 const bounds=geometry.boundingBox,columns=64,rows=64;
 const width=bounds.max.x-bounds.min.x,depth=bounds.max.z-bounds.min.z;
 const cellX=x=>Math.max(0,Math.min(columns-1,Math.floor((x-bounds.min.x)/width*columns)));
 const cellZ=z=>Math.max(0,Math.min(rows-1,Math.floor((z-bounds.min.z)/depth*rows)));
 const cells=Array.from({length:columns*rows},()=>[]),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 const read=offset=>{a.fromBufferAttribute(positions,index.getX(offset));b.fromBufferAttribute(positions,index.getX(offset+1));c.fromBufferAttribute(positions,index.getX(offset+2));};
 for(let offset=0;offset<index.count;offset+=3){
  read(offset);
  const x0=cellX(Math.min(a.x,b.x,c.x)),x1=cellX(Math.max(a.x,b.x,c.x));
  const z0=cellZ(Math.min(a.z,b.z,c.z)),z1=cellZ(Math.max(a.z,b.z,c.z));
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)cells[z*columns+x].push(offset);
 }
 const original=batch.raycast,instance=new THREE.Matrix4(),world=new THREE.Matrix4(),inverse=new THREE.Matrix4();
 const ray=new THREE.Ray(),point=new THREE.Vector3(),worldPoint=new THREE.Vector3();
 batch.raycast=function(raycaster,hits){
  if(Math.abs(raycaster.ray.direction.x)>1e-8||Math.abs(raycaster.ray.direction.z)>1e-8)return original.call(this,raycaster,hits);
  // Current road instances rotate only around Y. Fall back for other transforms.
  for(let id=0;id<this.count;id++){
   this.getMatrixAt(id,instance);world.multiplyMatrices(this.matrixWorld,instance);inverse.copy(world).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);
   if(Math.abs(ray.direction.x)>1e-8||Math.abs(ray.direction.z)>1e-8)return original.call(this,raycaster,hits);
  }
  for(let id=0;id<this.count;id++){
   this.getMatrixAt(id,instance);world.multiplyMatrices(this.matrixWorld,instance);inverse.copy(world).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);
   if(ray.origin.x<bounds.min.x||ray.origin.x>bounds.max.x||ray.origin.z<bounds.min.z||ray.origin.z>bounds.max.z)continue;
   for(const offset of cells[cellZ(ray.origin.z)*columns+cellX(ray.origin.x)]){
    read(offset);
    const side=this.material.side;
    const found=side===THREE.BackSide?ray.intersectTriangle(c,b,a,true,point):ray.intersectTriangle(a,b,c,side!==THREE.DoubleSide,point);
    if(!found)continue;
    worldPoint.copy(point).applyMatrix4(world);
    const distance=raycaster.ray.origin.distanceTo(worldPoint);
    if(distance<raycaster.near||distance>raycaster.far)continue;
    hits.push({distance,point:worldPoint.clone(),object:this,instanceId:id,faceIndex:offset/3,
     face:{a:index.getX(offset),b:index.getX(offset+1),c:index.getX(offset+2),normal:THREE.Triangle.getNormal(a,b,c,new THREE.Vector3()),materialIndex:0}});
   }
  }
 };
 return {cells:cells.length,triangles:index.count/3};
}
