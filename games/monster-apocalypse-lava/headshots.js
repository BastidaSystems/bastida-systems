import * as THREE from 'three';
export const HEADSHOT_MULTIPLIER=3;
const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),point=new THREE.Vector3(),weights=new THREE.Vector3();

// Interpolate skin weights on the actual animated triangle hit by the bullet.
// This follows the head in crawl, run, recoil and every rotated/scaled variant.
export function isHeadshot(enemy,hit) {
  if(!hit)return false;
  const mesh=hit.object;
  if(mesh?.userData.enemyHead)return true;
  if(mesh?.isSkinnedMesh&&hit.face) {
    const indices=[hit.face.a,hit.face.b,hit.face.c],skin=mesh.geometry.attributes.skinIndex,influence=mesh.geometry.attributes.skinWeight;
    if(!skin||!influence)return false;
    mesh.getVertexPosition(indices[0],a);mesh.getVertexPosition(indices[1],b);mesh.getVertexPosition(indices[2],c);
    point.copy(hit.point);mesh.worldToLocal(point);
    THREE.Triangle.getBarycoord(point,a,b,c,weights);
    const weakSpot=mesh.geometry.getAttribute('_headmask');
    if(enemy.g.userData.floatingAlien&&weakSpot){
      let mask=0;for(let i=0;i<3;i++)mask+=Math.max(0,weights.getComponent(i))*weakSpot.getX(indices[i]);
      return mask>=.5;
    }
    let headWeight=0;
    for(let i=0;i<3;i++)for(let k=0;k<4;k++) {
      const bone=mesh.skeleton.bones[skin.getComponent(indices[i],k)];
      if(bone&&/^(?:mixamorig:?)?Head(?:Top_End)?$/.test(bone.name))
        headWeight+=Math.max(0,weights.getComponent(i))*influence.getComponent(indices[i],k);
    }
    return headWeight>=.5;
  }
  if(enemy.g.userData.floatingAlien) {
    point.copy(hit.point);enemy.g.worldToLocal(point);
    // The supplied floater has no skeleton: its central face is the weak spot.
    return (point.x/.38)**2+((point.y-2.35)/.4)**2<=1;
  }
  return false;
}
