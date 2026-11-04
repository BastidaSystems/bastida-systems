import * as THREE from 'three';

// One intro clock and the existing camera. Return before the quake/reaction starts.
export function sampleStratExplosionShot(intro){
  if(intro?.phase!=='countdown'||intro.preferences?.reduced||intro.systemReducedMotion)return {weight:0,phase:'idle'};
  const t=intro.elapsed,blast=intro.blastElapsed??4,start=3.1,holdEnd=blast+2,end=(intro.shakeAt??blast+3)-.1;
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
  if(t<=start||t>=end-1e-8)return {weight:0,phase:'idle'};
  if(t<4)return {weight:smooth((t-start)/.9),phase:'approach'};
  if(t<=holdEnd)return {weight:1,phase:'hold'};
  return {weight:1-smooth((t-holdEnd)/(end-holdEnd)),phase:'return'};
}

export function createStratExplosionCamera(){
  let run=null,captured=false,weight=0,phase='idle';
  const close=new THREE.Vector3(),target=new THREE.Vector3(),direction=new THREE.Vector3(),rotation=new THREE.Quaternion(),matrix=new THREE.Matrix4();
  return {
    apply(camera,intro,anchor){
      if(run!==intro?.run){run=intro?.run;captured=false;}
      ({weight,phase}=sampleStratExplosionShot(intro));
      if(!weight||!anchor){weight=0;return false;}
      if(!captured){
        anchor.getWorldPosition(target);
        direction.copy(camera.position).sub(target);direction.y=0;
        if(direction.lengthSq()<.001)direction.set(0,0,1);else direction.normalize();
        // Low-angle view: look up along the facade toward the upper blast.
        close.copy(target).addScaledVector(direction,62);close.y=Math.max(4,target.y-38);
        target.y-=14;
        matrix.lookAt(close,target,camera.up);rotation.setFromRotationMatrix(matrix);captured=true;
      }
      camera.position.lerp(close,weight);camera.quaternion.slerp(rotation,weight);
      camera.fov=THREE.MathUtils.lerp(camera.fov,64,weight);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
      return true;
    },
    // Scope this optical adjustment to the shot; gameplay fog is restored by the render guard.
    fogDensity(base){return base+(Math.min(base,.026)-base)*weight;},
    info:()=>({run,phase,weight,captured,lookAt:target.toArray(),closePosition:close.toArray()}),
  };
}
