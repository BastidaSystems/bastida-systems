import * as THREE from 'three';

const cache=new WeakMap(),getters=['getX','getY','getZ','getW'];
// Shared triangle references and conservative bone-local bounds; no copied mesh or skin.
function definition(mesh){
  const geometry=mesh.geometry,key=mesh.bindMatrix.elements.join(',')+'|'+mesh.skeleton.boneInverses.map(m=>m.elements.join(',')).join('|');
  let entries=cache.get(geometry);if(!entries){entries=new Map();cache.set(geometry,entries);}if(entries.has(key))return entries.get(key);
  const {position,skinIndex,skinWeight}=geometry.attributes,index=geometry.index;
  if(!position||!skinIndex||!skinWeight||Array.isArray(mesh.material)){entries.set(key,null);return null;}
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  const extent=Math.max(...geometry.boundingBox.getSize(new THREE.Vector3()).toArray()),cellSize=extent/10||1;
  const groups=new Map(),p=new THREE.Vector3(),centroid=new THREE.Vector3(),bonePoint=new THREE.Vector3();
  const vertex=k=>index?index.getX(k):k,count=index?index.count:position.count;
  for(let t=0;t<count;t+=3){
    centroid.set(0,0,0);const influence=new Map();
    for(let j=0;j<3;j++){const v=vertex(t+j);p.fromBufferAttribute(position,v);centroid.add(p);let sum=0;
      for(let k=0;k<4;k++){const w=skinWeight[getters[k]](v),bone=skinIndex[getters[k]](v);sum+=w;if(w>0)influence.set(bone,(influence.get(bone)||0)+w);}
      if(Math.abs(sum-1)>1e-4){entries.set(key,null);return null;}
    }
    centroid.multiplyScalar(1/3);let dominant=0,weight=-1;for(const [bone,w]of influence)if(w>weight){dominant=bone;weight=w;}
    const cell=dominant+':'+Math.floor(centroid.x/cellSize)+','+Math.floor(centroid.y/cellSize)+','+Math.floor(centroid.z/cellSize);
    let group=groups.get(cell);if(!group){group={triangles:[],bones:new Map()};groups.set(cell,group);}group.triangles.push(t);
    for(let j=0;j<3;j++){const v=vertex(t+j);p.fromBufferAttribute(position,v).applyMatrix4(mesh.bindMatrix);
      for(let k=0;k<4;k++){if(skinWeight[getters[k]](v)<=0)continue;const bone=skinIndex[getters[k]](v);let box=group.bones.get(bone);if(!box){box=new THREE.Box3();group.bones.set(bone,box);}bonePoint.copy(p).applyMatrix4(mesh.skeleton.boneInverses[bone]);box.expandByPoint(bonePoint);}
    }
  }
  const allBones=new Map();for(const group of groups.values())for(const [bone,bounds]of group.bones){if(!allBones.has(bone))allBones.set(bone,bounds.clone());else allBones.get(bone).union(bounds);}
  const result={vertex,count:count/3,bones:[...allBones].map(([bone,bounds])=>({bone,bounds})),margin:Math.max(extent*1e-4,1e-9),groups:[...groups.values()].map(g=>({triangles:new Uint32Array(g.triangles),bones:[...g.bones].map(([bone,bounds])=>({bone,bounds}))}))};entries.set(key,result);return result;
}
export function createSkinnedShotIndex(mesh){
  const data=definition(mesh);if(!data)return null;
  const boxes=data.groups.map(()=>new THREE.Box3()),matrices=mesh.skeleton.bones.map(()=>new THREE.Matrix4()),rootBounds=new THREE.Box3(),inverse=new THREE.Matrix4(),box=new THREE.Box3();
  let groupToken=-1;
  const ray=new THREE.Ray(),entry=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),point=new THREE.Vector3(),world=new THREE.Vector3();
  const candidates=[],state={groups:boxes.length,triangles:data.count,poseToken:-1,trianglesTested:0};
  function prepare(token){
    mesh.skeleton.update();rootBounds.makeEmpty();
    for(const part of data.bones){matrices[part.bone].multiplyMatrices(mesh.bindMatrixInverse,mesh.skeleton.bones[part.bone].matrixWorld);box.copy(part.bounds).applyMatrix4(matrices[part.bone]);rootBounds.union(box);}
    rootBounds.expandByScalar(data.margin);state.poseToken=token;groupToken=-1;
  }
  function cast(raycaster,token){
    if(!raycaster.layers.test(mesh.layers))return null;if(state.poseToken!==token)prepare(token);
    inverse.copy(mesh.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);candidates.length=0;state.trianglesTested=0;
    if(!ray.intersectBox(rootBounds,entry))return null;
    if(!rootBounds.containsPoint(ray.origin)&&entry.clone().applyMatrix4(mesh.matrixWorld).distanceTo(raycaster.ray.origin)>raycaster.far)return null;
    if(groupToken!==token){for(let i=0;i<boxes.length;i++){const bounds=boxes[i];bounds.makeEmpty();for(const part of data.groups[i].bones){box.copy(part.bounds).applyMatrix4(matrices[part.bone]);bounds.union(box);}bounds.expandByScalar(data.margin);}groupToken=token;}
    for(let i=0;i<boxes.length;i++){const bounds=boxes[i];if(!ray.intersectBox(bounds,entry))continue;const distance=bounds.containsPoint(ray.origin)?0:entry.distanceTo(ray.origin);candidates.push({i,distance});}
    candidates.sort((a,b)=>a.distance-b.distance);let best=null,bestLocal=Infinity;
    const range=mesh.geometry.drawRange;
    for(const candidate of candidates){if(candidate.distance>bestLocal)break;
      for(const t of data.groups[candidate.i].triangles){if(t<range.start||t+2>=range.start+range.count)continue;
        const ia=data.vertex(t),ib=data.vertex(t+1),ic=data.vertex(t+2);mesh.getVertexPosition(ia,a);mesh.getVertexPosition(ib,b);mesh.getVertexPosition(ic,c);state.trianglesTested++;
        const hit=mesh.material.side===THREE.BackSide?ray.intersectTriangle(c,b,a,true,point):ray.intersectTriangle(a,b,c,mesh.material.side!==THREE.DoubleSide,point);if(!hit)continue;
        world.copy(point).applyMatrix4(mesh.matrixWorld);const distance=world.distanceTo(raycaster.ray.origin);if(distance<raycaster.near||distance>raycaster.far||best&&(distance>best.distance||distance===best.distance&&t/3>=best.faceIndex))continue;
        best={distance,point:world.clone(),object:mesh,face:{a:ia,b:ib,c:ic,normal:THREE.Triangle.getNormal(a,b,c,new THREE.Vector3()),materialIndex:0},faceIndex:t/3};bestLocal=point.distanceTo(ray.origin);
      }
    }
    return best;
  }
  return {cast,state};
}
