import * as THREE from 'three';

// One existing directional light and one bounded map, shared by all characters.
// No duplicate models, floor decals, new lights or changes to graphical quality.
export function createEnemyShadows({renderer,scene,light}) {
  const radius=28,offset=light.position.clone().sub(light.target.position);
  const size=Math.min(2048,renderer.capabilities.maxTextureSize);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  light.castShadow=true;
  light.shadow.mapSize.set(size,size);
  Object.assign(light.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,near:1,far:100});
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias=-.00012;
  light.shadow.normalBias=.02;
  scene.add(light.target);
  const step=radius*2/size;
  const right=new THREE.Vector3(offset.z,0,-offset.x).normalize();
  const up=new THREE.Vector3().crossVectors(offset.clone().normalize(),right);
  const determinant=right.x*up.z-right.z*up.x;
  let receivers=0;
  function follow(position) {
    // Snap in the light's ground-plane axes to keep the map stable while walking.
    // Its world direction, intensity and colour stay exactly as authored.
    const horizontal=Math.round((right.x*position.x+right.z*position.z)/step)*step;
    const vertical=Math.round((up.x*position.x+up.z*position.z)/step)*step;
    const x=(horizontal*up.z-right.z*vertical)/determinant;
    const z=(right.x*vertical-horizontal*up.x)/determinant;
    light.target.position.set(x,0,z);
    light.position.copy(light.target.position).add(offset);
    light.target.updateMatrixWorld(true);
    light.updateMatrixWorld(true);
  }
  function prepareWorld() {
    receivers=0;
    scene.traverse(mesh=>{
      if(!mesh.isMesh||mesh.userData.buildingCollisionProxy)return;
      const materials=[mesh.material].flat();
      if(!materials.length||materials.some(m=>!m||m.transparent||!(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial||m.isMeshPhongMaterial||m.isMeshLambertMaterial)))return;
      mesh.receiveShadow=true;
      receivers++;
    });
  }
  return {follow,prepareWorld,info:()=>({enabled:renderer.shadowMap.enabled,mapSize:size,radius,receivers,lights:1,soft:true})};
}
