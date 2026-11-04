import * as THREE from 'three';

// Authored landmark only, measured once on its actual rendered geometry (not its box centre).
export function findStratTip(meshes){
  const v=new THREE.Vector3(),tip=new THREE.Vector3();let highest=-Infinity,count=0;
  for(const mesh of meshes){
    const position=mesh.geometry?.attributes.position;if(!position)continue;mesh.updateWorldMatrix(true,false);
    for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);highest=Math.max(highest,v.y);}
  }
  if(!Number.isFinite(highest))return null;
  for(const mesh of meshes){const position=mesh.geometry?.attributes.position;if(!position)continue;
    for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);if(v.y>=highest-.18){tip.add(v);count++;}}
  }
  if(!count)return null;tip.divideScalar(count);tip.y=highest+.04;return tip;
}
