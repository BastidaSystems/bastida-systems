import * as THREE from 'three';

// One existing camera, one world. North-up movement never follows the aiming yaw.
export function createTacticalView(camera,{initial='third'}={}){
  let view=initial==='tactical'?'tactical':'third',blend=view==='tactical'?1:0,lastBasis=0;
  const target=new THREE.Vector3(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),matrix=new THREE.Matrix4(),forward=new THREE.Vector3();
  function setView(next,yaw=0){
    if(!['third','tactical'].includes(next)||next===view)return false;
    camera.getWorldDirection(forward);lastBasis=Math.atan2(-forward.x,-forward.z)||0;view=next;return true;
  }
  return {
    setView,toggle(yaw){return setView(view==='third'?'tactical':'third',yaw);},
    get active(){return view==='tactical';},
    get elevated(){return view==='tactical'||blend>.02;},
    get blend(){return blend;},
    movementYaw(yaw){return blend>0?lastBasis:yaw;},
    update(dt,{player,jump=0}){
      const goal=view==='tactical'?1:0;
      blend=THREE.MathUtils.damp(blend,goal,8,Math.max(0,Math.min(.1,dt)));
      if(Math.abs(goal-blend)<.001)blend=goal;
      if(!blend)return;
      // Perspective, not an orthographic screenshot; all geometry retains depth.
      target.set(player.x,1+jump,player.z);position.set(target.x,target.y+16,target.z+11.33);
      matrix.lookAt(position,target,camera.up);rotation.setFromRotationMatrix(matrix);
      camera.position.lerp(position,blend);camera.quaternion.slerp(rotation,blend);
      camera.fov=THREE.MathUtils.lerp(camera.fov,50,blend);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
      camera.getWorldDirection(forward);lastBasis=Math.atan2(-forward.x,-forward.z)||0;
    },
    // Shared player/muzzle heading. The elevated render camera cannot shoot over walls.
    shotDirection(yaw,pitch,out){return out.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).normalize();},
    info:()=>({view,blend,oneWorld:true,height:16,inclinationDegrees:Math.atan2(16,11.33)*180/Math.PI}),
  };
}
