import * as THREE from 'three';
import {captureQuakeRest} from './quake-braces.js?v=20261017-stagger15';
import { createModelLoader } from './model-loader.js?v=20261015-mobile-memory1';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createSkinnedShotIndex } from './skinned-shot-index.js?v=20261014-shot1';
import {createFloatingDive} from './floating-dive.js?v=dive67';

// A separate enemy system: existing monster models, stats and FSM are untouched.
export const FLOATING_ALIEN_SETTINGS = Object.freeze({
  clearance: 2, hp: 136, speed: 2.3, detection: 26, attackRange: 3.4,
  attackExit: 4.2, damage: 12, reward: 100, windup: .6, attackCycle: 2.8,
  hurtTime: .45, deathTime: 1.6, deathSink: 1, firstSpawn: 20, respawn: 25, maxAlive: 1,
});
export function createFloatingAlienSystem({scene,resolvePosition,getGround=()=>0,
  getLandingGround=getGround,shootBlockers=[],onAttack=()=>{},onHit=()=>{},pickNearbySpawn=null,spawnPoints=[{x:0,z:-45}]}) {
  const state={ready:false,error:null,entities:[],spawnTimer:FLOATING_ALIEN_SETTINGS.firstSpawn};
  let template,templateQuakeRest,flightClip,deathClip,deathFloor,loading,gpuWarm,templateRadius=0,sequence=0,rayToken=0,seed=0x13a11e;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const vision=new THREE.Raycaster(),from=new THREE.Vector3(),direction=new THREE.Vector3(),trial=new THREE.Vector3();
  function visible(e,target) {
    from.set(e.g.position.x,e.g.position.y+2.2,e.g.position.z);
    direction.copy(target).sub(from);const length=direction.length();
    if(length<.01)return true;
    vision.set(from,direction.divideScalar(length));vision.far=length-.08;
    return !vision.intersectObjects(shootBlockers,false).length;
  }
  const dive=createFloatingDive({resolve:resolvePosition,getGround,canSee:visible,onContact:onAttack,
    windup:FLOATING_ALIEN_SETTINGS.windup,cycle:FLOATING_ALIEN_SETTINGS.attackCycle,damage:FLOATING_ALIEN_SETTINGS.damage});
  function transition(e,next){e.state=next;e.stateT=0;e.struck=false;}
  function face(e,x,z,dt) {
    const target=Math.atan2(x-e.g.position.x,z-e.g.position.z);
    const difference=Math.atan2(Math.sin(target-e.g.rotation.y),Math.cos(target-e.g.rotation.y));
    e.g.rotation.y+=difference*Math.min(1,dt*3.5);
  }
  function move(e,x,z,speed,dt) {
    const dx=x-e.g.position.x,dz=z-e.g.position.z,length=Math.hypot(dx,dz);
    if(length<.1)return;
    const goalYaw=Math.atan2(dx,dz),distance=Math.min(length,speed*dt);
    e.avoidT=Math.max(0,(e.avoidT||0)-dt);
    // Short collision-resolved steps prevent tunnelling even in a slow frame.
    for(let remaining=distance;remaining>1e-6;) {
      const step=Math.min(.12,remaining);remaining-=step;
      const forwardX=e.g.position.x+Math.sin(goalYaw)*step,forwardZ=e.g.position.z+Math.cos(goalYaw)*step;
      trial.set(forwardX,0,forwardZ);resolvePosition(trial,e.radius,true);
      const blocked=Math.hypot(trial.x-forwardX,trial.z-forwardZ)>.002;
      if(blocked&&e.avoidYaw===undefined){e.avoidYaw=goalYaw+e.steerSign*Math.PI/2;e.avoidT=.8;}
      else if(!blocked&&e.avoidT===0)e.avoidYaw=undefined;
      const yaw=e.avoidYaw??goalYaw,ux=Math.sin(yaw),uz=Math.cos(yaw);
      let best=-Infinity,bx=e.g.position.x,bz=e.g.position.z;
      for(const angle of [0,.45,-.45,.9,-.9,1.35,-1.35,Math.PI/2,-Math.PI/2]) {
        const a=yaw+angle*e.steerSign,tx=e.g.position.x+Math.sin(a)*step,tz=e.g.position.z+Math.cos(a)*step;
        trial.set(tx,0,tz);resolvePosition(trial,e.radius,true);
        if(Math.hypot(trial.x-tx,trial.z-tz)>.002)continue;
        const score=(trial.x-e.g.position.x)*ux+(trial.z-e.g.position.z)*uz-Math.abs(angle)*.0005+(angle>0?.00001:0);
        if(score>best){best=score;bx=trial.x;bz=trial.z;}
      }
      if(best===-Infinity)break;
      e.g.position.x=bx;e.g.position.z=bz;
    }
    face(e,x,z,dt);
  }
  function spawn(position) {
    if(!state.ready)return null;
    const g=cloneSkeleton(template),materials=[],meshes=[];
    g.name='Floating Alien';
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();o.material.transparent=true;o.material.forceSinglePass=true;materials.push(o.material);meshes.push(o);}});
    const mixer=new THREE.AnimationMixer(g),flight=mixer.clipAction(flightClip),death=mixer.clipAction(deathClip);
    death.setLoop(THREE.LoopOnce,1);death.clampWhenFinished=true;
    const e={g,mixer,flight,death,materials,meshes,quakeRest:templateQuakeRest,shotIndexes:meshes.map(createSkinnedShotIndex),hp:FLOATING_ALIEN_SETTINGS.hp,state:'IDLE',stateT:0,
      phase:random()*Math.PI*2,time:0,struck:false,lastKnown:null,memory:0,perception:0,
      seesPlayer:false,radius:templateRadius,
      steerSign:sequence++%2?1:-1,anchor:{x:position.x,z:position.z},patrol:null,flash:0,
      dive:null,attackRetry:0,motion:{speed:0,rate:1}};
    flight.setLoop(THREE.LoopRepeat,Infinity).play();flight.time=e.phase/(Math.PI*2)*flightClip.duration;mixer.update(0);
    g.position.set(position.x,getGround(position.x,position.z)+FLOATING_ALIEN_SETTINGS.clearance,position.z);
    resolvePosition(g.position,e.radius,true);e.anchor={x:g.position.x,z:g.position.z};
    g.userData.floatingAlien=e;scene.add(g);state.entities.push(e);updateSkinBounds(e);return e;
  }
  function damage(e,amount,point,headshot=false) {
    if(e.state==='DEATH'||!state.entities.includes(e)||amount<=0)return false;
    e.hp=Math.max(0,e.hp-amount);e.flash=1;
    transition(e,e.hp===0?'DEATH':'HURT');
    if(e.state==='DEATH'){
      e.dive=null;
      e.deathY=e.g.position.y;e.deathGround=getLandingGround(e.g.position.x,e.g.position.z);
      e.death.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.18).play();e.flight.fadeOut(.18);
    }else dive.interrupt(e);
    onHit(e,point,e.hp===0,headshot);return true;
  }
  function remove(e) {
    scene.remove(e.g);e.mixer.stopAllAction();e.mixer.uncacheRoot(e.g);
    for(const mesh of e.meshes)mesh.skeleton?.dispose();for(const m of e.materials)m.dispose();
    state.entities.splice(state.entities.indexOf(e),1);
  }
  function spawnNear(target) {
    const C=FLOATING_ALIEN_SETTINGS;
    if(!state.ready||state.entities.filter(e=>e.state!=='DEATH').length>=C.maxAlive)return null;
    if(pickNearbySpawn){
      const point=pickNearbySpawn();if(!point)return null;
      trial.set(point.x,0,point.z);resolvePosition(trial,templateRadius,true);
      const distance=Math.hypot(trial.x-target.x,trial.z-target.z);
      if(distance<12||distance>18||Math.hypot(trial.x-point.x,trial.z-point.z)>.05)return null;
      return spawn({x:trial.x,z:trial.z});
    }
    const nearby=[];
    for(const point of spawnPoints) {
      const dx=point.x-target.x,dz=point.z-target.z,len=Math.hypot(dx,dz);
      if(len<.1)continue;
      trial.set(target.x+dx/len*20,0,target.z+dz/len*20);
      resolvePosition(trial,templateRadius,true);
      const distance=Math.hypot(trial.x-target.x,trial.z-target.z);
      if(distance<12||distance>C.detection-2)continue;
      const p={x:trial.x,z:trial.z};
      if(visible({g:{position:new THREE.Vector3(p.x,getGround(p.x,p.z)+C.clearance,p.z)}},target))nearby.push(p);
    }
    const candidates=nearby.length?nearby:spawnPoints.filter(p=>Math.hypot(p.x-target.x,p.z-target.z)>12);
    return candidates.length?spawn(candidates[Math.floor(random()*candidates.length)]):null;
  }
  function update(dt,target,{autoSpawn=false}={}) {
    const C=FLOATING_ALIEN_SETTINGS;
    if(autoSpawn&&state.ready) {
      state.spawnTimer-=dt;
      if(state.spawnTimer<=0&&state.entities.filter(e=>e.state!=='DEATH').length<C.maxAlive) {
        // Project the existing street endpoints to a safe encounter distance.
        // Otherwise a stationary player might never meet a distant idle floater.
        spawnNear(target);
        state.spawnTimer=C.respawn;
      }
    }
    for(const e of [...state.entities]) {
      if(e.spawning)continue;
      e.time+=dt;e.stateT+=dt;e.memory+=dt;e.perception-=dt;e.flash=Math.max(0,e.flash-dt*4);
      const oldX=e.g.position.x,oldZ=e.g.position.z;
      const p=e.g.position,dist=Math.hypot(target.x-p.x,target.z-p.z);
      if(e.state==='DEATH') {
        const duration=deathClip.duration,fall=Math.min(1,e.stateT/1.2);
        const sample=Math.min(deathFloor.length-1,e.stateT/duration*(deathFloor.length-1)),index=Math.floor(sample);
        const low=THREE.MathUtils.lerp(deathFloor[index],deathFloor[Math.min(index+1,deathFloor.length-1)],sample-index);
        const grounded=e.deathGround+.02-low-C.deathSink;
        p.y=THREE.MathUtils.lerp(e.deathY,grounded,fall*fall);
        e.g.rotation.x*=Math.exp(-dt*7);e.g.rotation.z*=Math.exp(-dt*7);
        const fade=THREE.MathUtils.clamp((e.stateT-duration-.25)/.55,0,1);
        for(const m of e.materials){m.opacity=1-fade;}
        if(fade===1){remove(e);continue;}
      } else {
        e.attackRetry=Math.max(0,e.attackRetry-dt);let diveMoved=false;
        if(e.perception<=0) {
          e.perception=.2;e.seesPlayer=dist<C.detection&&visible(e,target);
          if(e.seesPlayer){e.lastKnown={x:target.x,z:target.z};e.memory=0;}
        }
        if(e.state==='HURT') {
          face(e,target.x,target.z,dt);
          if(e.dive){diveMoved=true;dive.update(e,dt,target);}
          if(e.stateT>=C.hurtTime&&!e.dive){e.lastKnown={x:target.x,z:target.z};e.memory=0;transition(e,'CHASE');}
        } else if(e.state==='ATTACK') {
          face(e,target.x,target.z,dt);
          diveMoved=true;if(!dive.update(e,dt,target))transition(e,'CHASE');
        } else if(e.seesPlayer) {
          if(dist<=C.attackRange&&e.attackRetry===0&&dive.begin(e,target)){transition(e,'ATTACK');diveMoved=true;face(e,target.x,target.z,dt);}
          else {if(dist<=C.attackRange&&e.attackRetry===0)e.attackRetry=.6;if(e.state!=='CHASE')transition(e,'CHASE');move(e,target.x,target.z,C.speed,dt);}
        } else if(e.state==='CHASE') {
          if(e.lastKnown&&e.memory<4)move(e,e.lastKnown.x,e.lastKnown.z,C.speed,dt);
          else transition(e,'IDLE');
        } else if(e.state==='IDLE') {
          e.g.rotation.y+=dt*.16;
          if(e.stateT>2.8) {
            const a=random()*Math.PI*2;e.patrol={x:e.anchor.x+Math.sin(a)*4,z:e.anchor.z+Math.cos(a)*4};
            transition(e,'PATROL');
          }
        } else if(e.state==='PATROL') {
          move(e,e.patrol.x,e.patrol.z,C.speed*.32,dt);
          if(e.stateT>8||Math.hypot(p.x-e.patrol.x,p.z-e.patrol.z)<.4)transition(e,'IDLE');
        }
        if(!diveMoved)p.y=getGround(p.x,p.z)+C.clearance+Math.sin(e.time*1.25+e.phase)*.14+Math.sin(e.time*.53+e.phase)*.035;
        e.g.rotation.x=Math.sin(e.time*.8+e.phase)*.022+(e.state==='HURT'?-.16*Math.sin(Math.min(1,e.stateT/C.hurtTime)*Math.PI):0);
        e.g.rotation.z=Math.sin(e.time*.67+e.phase)*.027;
        e.g.rotation.x+=e.dive?.pitch||0;
      }
      // Fly drives the skin; logical motion still comes entirely from the existing AI.
      const speed=Math.min(C.speed,Math.hypot(p.x-oldX,p.z-oldZ)/Math.max(dt,1e-6));
      e.motion.speed+=(speed-e.motion.speed)*(1-Math.exp(-dt*3.5));
      const rate=1+e.motion.speed/C.speed*.12;
      e.motion.rate+=(rate-e.motion.rate)*(1-Math.exp(-dt*3.5));
      if(e.state!=='DEATH')e.flight.setEffectiveTimeScale(e.motion.rate);e.mixer.update(dt);
      for(const m of e.materials)m.emissive.setRGB(e.flash*.25,0,0);
      updateSkinBounds(e);
    }
  }
  function updateSkinBounds(e) {
    e.g.updateMatrixWorld(true);
    for(const mesh of e.meshes){
      mesh.skeleton.update();
    }
  }
  return {state,spawn,spawnNear,damage,update,
    warmObjects(){
      if(!state.ready)return [];
      if(!gpuWarm){gpuWarm=cloneSkeleton(template);gpuWarm.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;m.material=m.material.clone();m.material.transparent=true;m.material.forceSinglePass=true;m.frustumCulled=false;}});}
      return [gpuWarm];
    },
    reset(){for(const e of [...state.entities])remove(e);state.spawnTimer=FLOATING_ALIEN_SETTINGS.firstSpawn;},
    raycast(ray){const hits=[];const token=++rayToken;for(const e of state.entities){if(e.state==='DEATH'||e.spawning)continue;
      updateSkinBounds(e);
      for(let i=0;i<e.meshes.length;i++){
        const hit=e.shotIndexes[i]?.cast(ray,token)||(!e.shotIndexes[i]?ray.intersectObject(e.meshes[i],false)[0]:null);
        if(hit)hits.push({...hit,enemy:e});
      }}
      return hits.sort((a,b)=>a.distance-b.distance)[0]||null;},
    load(){if(loading)return loading;loading=(async()=>{try{
      const gltf=await createModelLoader().loadAsync('assets/enemies/floating-alien/floating-fly.glb');
      const model=gltf.scene;
      flightClip=gltf.animations.find(c=>c.name==='fly')?.clone();
      deathClip=gltf.animations.find(c=>c.name==='death')?.clone();
      if(!deathClip||!flightClip||!model.getObjectByProperty('isSkinnedMesh',true))throw new Error('Fly needs a clip and a weighted skin');
      model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
      const restBox=new THREE.Box3().setFromObject(model,true),size=restBox.getSize(new THREE.Vector3());
      if(size.y<=0)throw new Error('Empty Fly skin');
      const scale=2.8/size.y;
      model.scale.multiplyScalar(scale);
      model.position.x-=(restBox.min.x+restBox.max.x)*.5*scale;
      model.position.y-=restBox.min.y*scale;
      model.position.z-=(restBox.min.z+restBox.max.z)*.5*scale;
      template=new THREE.Group();template.add(model);
      templateQuakeRest=captureQuakeRest(template);
      // Remove horizontal root motion in the real parent's coordinate system.
      // Keep Fly's vertical movement and all bone rotations.
      template.updateMatrixWorld(true);
      const hips=template.getObjectByName('mixamorigHips')||template.getObjectByName('mixamorig_Hips')||template.getObjectByName('mixamorig:Hips');
      if(!hips)throw new Error('Fly hips not found');
      const linear=new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld),inverse=linear.clone().invert();
      const rest=hips.position.clone(),relative=new THREE.Vector3();
      for(const clip of [flightClip,deathClip])for(const track of clip.tracks)if(track.name===hips.name+'.position'){
        for(let i=0;i<track.values.length;i+=3){relative.fromArray(track.values,i).sub(rest).applyMatrix3(linear);relative.x=relative.z=0;relative.applyMatrix3(inverse).add(rest).toArray(track.values,i);}
      }
      // Conservative footprint sampled over the flight cycle; unchanged collision solver.
      const mixer=new THREE.AnimationMixer(template),vertex=new THREE.Vector3(),envelopes=new Map();
      // The supplied death clip rolls onto its side. Turn its root gradually so
      // the face finishes upward, before sampling floor support and skin bounds.
      const skin=template.getObjectByProperty('isSkinnedMesh',true);
      const mask=skin.geometry.attributes._headmask,indices=skin.geometry.index;
      const facing=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
      const frontFaces=[];
      mixer.clipAction(flightClip).play();mixer.setTime(0);
      template.updateMatrixWorld(true);skin.skeleton.update();
      for(let i=0;i<indices.count;i+=3){
        const ia=indices.getX(i),ib=indices.getX(i+1),ic=indices.getX(i+2);
        if(mask.getX(ia)<.5||mask.getX(ib)<.5||mask.getX(ic)<.5)continue;
        skin.getVertexPosition(ia,a).applyMatrix4(skin.matrixWorld);
        skin.getVertexPosition(ib,b).applyMatrix4(skin.matrixWorld);
        skin.getVertexPosition(ic,c).applyMatrix4(skin.matrixWorld);
        if(b.sub(a).cross(c.sub(a)).normalize().z>.5)frontFaces.push([ia,ib,ic]);
      }
      mixer.stopAllAction();
      const deathAction=mixer.clipAction(deathClip).setLoop(THREE.LoopOnce,1);
      deathAction.clampWhenFinished=true;deathAction.play();mixer.setTime(deathClip.duration);
      template.updateMatrixWorld(true);skin.skeleton.update();
      for(const [ia,ib,ic]of frontFaces){
        skin.getVertexPosition(ia,a).applyMatrix4(skin.matrixWorld);
        skin.getVertexPosition(ib,b).applyMatrix4(skin.matrixWorld);
        skin.getVertexPosition(ic,c).applyMatrix4(skin.matrixWorld);
        facing.add(b.sub(a).cross(c.sub(a)));
      }
      if(facing.lengthSq()<1e-10)throw new Error('Fly face direction not found');
      facing.normalize();
      const parentRotation=hips.parent.getWorldQuaternion(new THREE.Quaternion());
      const correction=new THREE.Quaternion().setFromUnitVectors(facing,new THREE.Vector3(0,1,0));
      correction.premultiply(parentRotation.clone().invert()).multiply(parentRotation);
      mixer.stopAllAction();
      const turn=new THREE.Quaternion(),pose=new THREE.Quaternion();
      for(const track of deathClip.tracks)if(track.name===hips.name+'.quaternion'){
        for(let i=0;i<track.times.length;i++){
          const progress=THREE.MathUtils.smoothstep(track.times[i],.35,2.1);
          turn.identity().slerp(correction,progress);
          pose.fromArray(track.values,i*4).premultiply(turn).normalize().toArray(track.values,i*4);
        }
      }
      template.traverse(m=>{if(m.isSkinnedMesh)envelopes.set(m,new THREE.Box3());});
      const deathFrames=Math.ceil(deathClip.duration*30);deathFloor=new Float32Array(deathFrames+1);
      for(const clip of [flightClip,deathClip]){
        mixer.stopAllAction();const action=mixer.clipAction(clip).reset().play();
        if(clip===deathClip){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
        const frames=clip===deathClip?deathFrames:90;
        for(let frame=0;frame<=frames;frame++){
          mixer.setTime(clip.duration*frame/frames);template.updateMatrixWorld(true);let lowest=Infinity;
          template.traverse(mesh=>{if(mesh.isSkinnedMesh){mesh.skeleton.update();for(let i=0;i<mesh.geometry.attributes.position.count;i++){
            mesh.getVertexPosition(i,vertex);envelopes.get(mesh).expandByPoint(vertex);vertex.applyMatrix4(mesh.matrixWorld);
            lowest=Math.min(lowest,vertex.y);
            if(clip===flightClip)templateRadius=Math.max(templateRadius,Math.hypot(vertex.x,vertex.z)+.32);
          }}});
          if(clip===deathClip)deathFloor[frame]=lowest;
        }
      }
      for(const [mesh,box]of envelopes){
        box.expandByScalar(box.getSize(new THREE.Vector3()).length()*.03);
        mesh.boundingBox=box;mesh.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
      }
      mixer.stopAllAction();mixer.uncacheRoot(template);
      template.updateMatrixWorld(true);
      state.ready=true;
    }catch(error){state.error=error.message;console.warn('No cargó Floating Alien',error);}})();return loading;},
    info(){return {ready:state.ready,error:state.error,count:state.entities.length,
      enemies:state.entities.map(e=>({name:e.g.name,state:e.state,hp:e.hp,position:e.g.position.toArray(),radius:e.radius,animation:e.state==='DEATH'?'death':'fly',clipTime:e.state==='DEATH'?e.death.time:e.flight.time,flightMotion:{...e.motion}}))};},
  };
}
