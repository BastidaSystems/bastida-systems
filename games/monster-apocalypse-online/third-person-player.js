import * as THREE from 'three';
import {retargetPositionTracks} from './player-animation-retarget.js?v=20261021-arms2';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';
import {sampleChaosReaction,samplePeriodicReaction} from './chaos-reaction.js?v=20261017-slip16';
import {PLAYER_MOTION,WALK_CONTACTS,RUN_CONTACTS,crossedContacts} from './player-step-timing.js?v=20261017-pace20';
import {gaitSample} from './player-gait-phase.js?v=20261017-shooter28';
import {createPlayerActionPose,PLAYER_ACTIONS} from './player-action-pose.js?v=121';
import {createRecoveryMotion} from './player-recovery-motion.js?v=120';

import {SHOOTER_GAITS,SHOOTER_NAMES,selectShooterLocomotion,validateShooterClips} from './player-shooter-motion.js?v=20261017-run30';

const UP=new THREE.Vector3(0,1,0),IDENTITY=new THREE.Quaternion();
const LOWER=/Hips|UpLeg|Leg|Foot|Toe/;
const shortName=name=>name.replace(/^mixamorig[:_]?/,'');
export function createThirdPersonPlayer({scene,camera,blockers,moveCinematic=()=>{},moveReaction=()=>({x:0,z:0}),brace=()=>{},characterId='julian',characterName='Julián',modelUrl='assets/player/julian.glb?v=20261015-julian-pbr1'}) {
  const root=new THREE.Group();root.name=characterId+'Player';root.visible=false;scene.add(root);
  const state={character:characterId,characterName,ready:false,error:null,current:'idle',upper:'idle',cameraDistance:0,obstructed:false,scopeView:false,motionPack:'original',motionPackError:null,runAnimation:characterName+' / Rifle Run'};
  const bones={},actions={lower:{},upper:{}};
  const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),pivot=new THREE.Vector3(),desired=new THREE.Vector3();
  const right=new THREE.Vector3(),offset=new THREE.Vector3(),gunForward=new THREE.Vector3(),hand=new THREE.Vector3();
  const rotation=new THREE.Quaternion(),delta=new THREE.Quaternion(),matrix=new THREE.Matrix4();
  const handGrips={},fingerRest={};
  const gait={phase:0,runOffset:0,walkCycles:2,runCycles:1,distances:{walk:3.706,run:2.937},offsets:{},durations:{}};
  let locomotionNames=['walk','run'],locomotionKind='idle';
  let footfall=null,footfallSequence=0;
  const reaction={ready:false,error:null,periodicReady:false,periodicError:null,time:0,weight:0,groundOffset:0,supportHeight:0,distance:0,gripError:0};let reactionAction,periodicReactionAction,reactionGroundHeight=0,reactionHipHeight=1;
  const hurtPose={ready:false,error:null,active:false,age:0,time:0,weight:0,events:0,gripError:0};
  const hitTracks=[],hitRotation=new THREE.Quaternion();let hitDuration=0;
  const reloadPose={ready:false,error:null,progress:0,time:0,weight:0,gripError:0};
  const dodgePose={ready:false,error:null,kind:null,time:0,weight:0,sequence:0,gripError:0},dodgeActions={};
  const actionTimeline=createPlayerActionPose(),fullActions={},bodySamples=[];
  const actionPose={ready:false,error:null,gripError:0};
  const actionMotionTracks={},actionMotionBasis=new THREE.Matrix3(),actionMotionPoint=new THREE.Vector3();
  let actionCameraY=0,actionReferenceHipHeight=1;
  const recoveryMotion=createRecoveryMotion({riseStart:PLAYER_ACTIONS.riseStart,move:moveReaction,sample(name,time){
    const track=actionMotionTracks[name];if(!track)return {x:0,z:0};
    actionMotionPoint.fromArray(track.evaluate(time)).applyMatrix3(actionMotionBasis);
    return {x:actionMotionPoint.x,z:actionMotionPoint.z};
  }});
  let dodgeContactAge=0,dodgeContactSequence=-1;
  let motionTrack,motionAxis=1,motionStarted=false,cameraBob=0,gripRotation=null;
  const motionStart=new THREE.Vector3(),motionLast=new THREE.Vector3(),motionNow=new THREE.Vector3(),motionStep=new THREE.Vector3(),motionBasis=new THREE.Matrix3();
  const gripFingers={};
  const soleSamples=[];
  function prepareSoles(){
    // Cache a small sole grid once, not a full skinned-mesh scan every frame.
    model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;
      const indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,components=['getX','getY','getZ','getW'];
      for(const side of ['Left','Right']){
        const points=[],footBones=new Set(mesh.skeleton.bones.flatMap((bone,i)=>new RegExp(side+'(Foot|Toe)').test(bone.name)?[i]:[]));
        for(let i=0;i<indices.count;i++){
          let weight=0;for(const get of components)if(footBones.has(indices[get](i)))weight+=weights[get](i);
          if(weight>.5){mesh.getVertexPosition(i,hand).applyMatrix4(mesh.matrixWorld);points.push({i,x:hand.x,y:hand.y,z:hand.z});}
        }
        if(!points.length)continue;
        const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z)),cells=new Map();
        for(const p of points){const x=Math.min(3,Math.floor((p.x-minX)/Math.max(.0001,maxX-minX)*4)),z=Math.min(3,Math.floor((p.z-minZ)/Math.max(.0001,maxZ-minZ)*4)),key=x+4*z;
          if(!cells.has(key)||cells.get(key).y>p.y)cells.set(key,p);}
        for(const p of cells.values())soleSamples.push({mesh,index:p.i});
      }
    });
  }
  function palmPosition(side,target=new THREE.Vector3()){
    const wrist=bones[side+'Hand'].getWorldPosition(target),origin=wrist.clone();
    for(const name of ['Index','Middle','Pinky'])wrist.addScaledVector(bones[side+'Hand'+name+'1'].getWorldPosition(new THREE.Vector3()).sub(origin),.55/3);
    return wrist;
  }
  function advanceReaction(intro,position){
    if(!motionTrack||intro?.phase!=='countdown'||intro.shakeAt===null||intro.elapsed<=intro.shakeAt)return;
    root.updateMatrixWorld(true);
    if(!motionStarted){motionBasis.setFromMatrix4(bones.Hips.parent.matrixWorld);motionLast.set(0,0,0);motionStarted=true;}
    const sampled=sampleChaosReaction(intro,reactionAction.getClip().duration),time=sampled.time;
    motionNow.fromArray(motionTrack.evaluate(time)).sub(motionStart).setComponent(motionAxis,0);
    motionStep.copy(motionNow).sub(motionLast).applyMatrix3(motionBasis);motionStep.y=0;motionLast.copy(motionNow);
    const x=position.x,z=position.z;moveCinematic(motionStep.x,motionStep.z);
    reaction.distance+=Math.hypot(position.x-x,position.z-z);
    root.position.x=position.x;root.position.z=position.z;
  }
  function reactionSupportHeight(){
    let height=Infinity;
    if(soleSamples.length){for(const {mesh,index}of soleSamples){mesh.getVertexPosition(index,hand).applyMatrix4(mesh.matrixWorld);height=Math.min(height,hand.y);}return height;}
    for(const name of ['LeftFoot','RightFoot','LeftToeBase','RightToeBase'])height=Math.min(height,bones[name].getWorldPosition(hand).y);
    return height;
  }
  const layerWeights=new Map();
  let torsoReference=new THREE.Quaternion();
  let weaponAnchors={stock:new THREE.Vector3(0,-.035,.46),right:new THREE.Vector3(.018,-.085,.208),left:new THREE.Vector3(-.065,-.059,-.092)};
  let model,mixer,weapon,dead=false,shotTime=0,firstCamera=true,bodyYaw=0,smoothedHipHeight=null;
  function play(layer,name,once=false) {
    const key=layer==='lower'?'current':'upper',next=actions[layer][name];
    if(!next||state[key]===name)return;
    // Returning to a partially blended pose keeps its clock and weight.
    if(!locomotionNames.includes(name)){
      const weight=next.getEffectiveWeight();
      if(weight<.001)next.reset().setEffectiveWeight(weight);
      next.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;next.play();
    }
    state[key]=name;
  }
  function blendLayers(dt){
    const alpha=1-Math.exp(-dt/ .13);
    for(const layer of ['lower','upper']){
      const target=state[layer==='lower'?'current':'upper'];
      for(const [name,action]of Object.entries(actions[layer])){
        const desired=name===target?1:0;
        const weight=THREE.MathUtils.lerp(layerWeights.get(action)??action.getEffectiveWeight(),desired,alpha);
        layerWeights.set(action,weight);action.stopFading().setEffectiveWeight(weight);
      }
    }
  }
  function calibrateGait(){
    const count=64;
    const signals={};
    for(const name of ['walk','run']){
      mixer.stopAllAction();const action=actions.lower[name];action.reset().setEffectiveWeight(1).play();action.paused=true;
      signals[name]=[];
      // Compare ONE left/right cycle from each clip, not two walk cycles against one run cycle.
      for(let i=0;i<count;i++){action.time=i/count*action.getClip().duration/(name==='walk'?gait.walkCycles:gait.runCycles);mixer.update(0);root.updateMatrixWorld(true);
        const left=bones.LeftFoot.getWorldPosition(new THREE.Vector3()),right=bones.RightFoot.getWorldPosition(new THREE.Vector3());
        signals[name].push(state.motionPack==='original'?left.z-right.z:left.y-right.y);}
    }
    let best=-Infinity;
    for(let offset=0;offset<count;offset++){
      const score=signals.walk.reduce((sum,value,i)=>sum+value*signals.run[(i+offset)%count],0);
      if(score>best){best=score;gait.runOffset=offset/count;}
    }
    gait.offsets={walk:0,run:gait.runOffset};
    for(const name of locomotionNames.filter(n=>n!=='walk'&&n!=='run')){
      mixer.stopAllAction();const action=actions.lower[name];action.reset().setEffectiveWeight(1).play();action.paused=true;const signal=[];
      for(let i=0;i<count;i++){action.time=i/count*action.getClip().duration;mixer.update(0);root.updateMatrixWorld(true);signal.push(bones.LeftFoot.getWorldPosition(new THREE.Vector3()).y-bones.RightFoot.getWorldPosition(new THREE.Vector3()).y);}
      let best=-Infinity;for(let offset=0;offset<count;offset++){const score=signals.walk.reduce((sum,v,i)=>sum+v*signal[(i+offset)%count],0);if(score>best){best=score;gait.offsets[name]=offset/count;}}
    }
  }
  let animationPositionOffsets={};
  async function loadMotion(url){
    const pack=await createModelLoader().loadAsync(url);
    retargetPositionTracks(pack.animations,animationPositionOffsets);return pack;
  }
  async function load() {
    try {
      const gltf=await createModelLoader().loadAsync(modelUrl);
      model=gltf.scene;root.add(model);mixer=new THREE.AnimationMixer(model);
      model.traverse(o=>{if(o.userData?.animationPositionOffsets)animationPositionOffsets=o.userData.animationPositionOffsets;if(o.isBone)bones[shortName(o.name)]=o;if(o.isMesh){o.frustumCulled=false;o.castShadow=true;}});
      for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(let joint=1;joint<=3;joint++){const name='LeftHand'+finger+joint;fingerRest[name]=bones[name].quaternion.clone();}
      if(!bones.RightHand||!model.getObjectByProperty('isSkinnedMesh',true))throw Error(characterName+' no tiene una malla con skin válida');
      // Import animation tracks only. The approved actor, materials and original clips stay intact.
      if(new URLSearchParams(location.search).get('shooterMotion')!=='original')try{
        const extra=await loadMotion('assets/player/shooter-movement.glb?v=20261017-shooter28');
        // The supplied pack's run is retained as a resource; use Julián's other Rifle Run.
        const clips=validateShooterClips(extra.animations,model).filter(c=>c.name!=='run');
        const aim=clips.find(c=>c.name==='idle').clone();aim.name='aim';clips.push(aim);
        const replacements=new Set(clips.map(c=>c.name));
        gltf.animations=[...gltf.animations.filter(c=>!replacements.has(c.name)),...clips];
        locomotionNames=[...SHOOTER_NAMES];gait.walkCycles=gait.runCycles=1;state.motionPack='Slim + Basic Shooter';
      }catch{state.motionPackError='Pack no disponible; se conservan las animaciones originales.';}
      try{
        const extra=await loadMotion('assets/player/rifle-reload.glb?v=20261017-reload32');
        const clip=extra.animations.find(c=>c.name==='reload');
        if(!clip||clip.duration<=0||clip.tracks.some(t=>!model.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error('Recarga incompatible');
        gltf.animations.push(clip);reloadPose.ready=true;
      }catch{reloadPose.error='Animación de recarga no disponible; se conserva el respaldo visual.';}
      try{
        const extra=await loadMotion('assets/player/player-hit.glb?v=20261017-hit33');
        const source=extra.animations.find(c=>c.name==='hit');
        if(!source||source.duration<=0||source.tracks.some(t=>!model.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error('Reacción incompatible');
        // Cache local additive rotations. Apply after the walking posture correction,
        // on the existing actor: no second mixer, root motion, input lock or damage timer.
        const tracks=source.tracks.filter(t=>t.ValueTypeName==='quaternion'&&!LOWER.test(t.name)&&!/Hand(Thumb|Index|Middle|Ring|Pinky)/.test(t.name)).map(t=>t.clone());
        if(!tracks.length)throw Error('Reacción sin torso');
        const clip=THREE.AnimationUtils.makeClipAdditive(new THREE.AnimationClip('playerHit',source.duration,tracks));
        for(const track of clip.tracks)hitTracks.push({bone:model.getObjectByName(THREE.PropertyBinding.parseTrackName(track.name).nodeName),sample:track.createInterpolant(new Float32Array(4))});
        hitDuration=source.duration;hurtPose.ready=true;
      }catch{hurtPose.error='Reacción no disponible; daño y controles conservados.';}
      // Mixamo's FBX unit conversion is 1/100; normalize once from the actual bind mesh.
      model.updateMatrixWorld(true);
      const height=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y;
      model.scale.multiplyScalar(1.8/height);model.updateMatrixWorld(true);
      // Hips has a rotated parent in this export: determine its local vertical axis.
      const hip=bones.Hips,vertical=[0,1,2].map(i=>{
        const v=new THREE.Vector3();v.setComponent(i,1);return Math.abs(v.transformDirection(hip.parent.matrixWorld).y);
      });
      const verticalAxis=vertical.indexOf(Math.max(...vertical));
      for(const clip of gltf.animations)for(const track of clip.tracks){
        if(!/Hips\.position$/.test(track.name))continue;
        if(locomotionNames.includes(clip.name)){
          const start=new THREE.Vector3().fromArray(track.values).applyMatrix4(hip.parent.matrixWorld);
          const end=new THREE.Vector3().fromArray(track.values,track.values.length-3).applyMatrix4(hip.parent.matrixWorld);
          const distance=Math.hypot(end.x-start.x,end.z-start.z);if(distance>.01)gait.distances[clip.name]=distance;
        }
        for(let k=0;k<track.values.length;k+=3)for(let axis=0;axis<3;axis++)if(axis!==verticalAxis)track.values[k+axis]=track.values[axis];
      }
      const activeClips=new Set(['idle',...locomotionNames,'aim','fire','death','reload']);
      for(const clip of gltf.animations.filter(c=>activeClips.has(c.name)))for(const layer of ['lower','upper']){
        if(clip.name==='reload'&&layer==='lower')continue;
        const tracks=clip.tracks.filter(t=>LOWER.test(t.name)===(layer==='lower'));
        if(tracks.length)actions[layer][clip.name]=mixer.clipAction(new THREE.AnimationClip(clip.name+'-'+layer,clip.duration,tracks));
      }
      for(const name of ['idle','walk','run','aim','fire','death'])if(!actions.lower[name]||!actions.upper[name])throw Error('Falta el clip '+name);
      for(const name of locomotionNames)gait.durations[name]=actions.lower[name].getClip().duration;
      calibrateGait();reset();
      root.updateMatrixWorld(true);
      prepareSoles();
      // Cached surface extrema per dominant bone cover back, head and arms.
      // Falls cannot be grounded using only soles: the feet are above the torso.
      model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;
        const indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,cells=new Map();
        for(let i=0;i<indices.count;i++){
          let joint=0,largest=-1;for(let j=0;j<4;j++){const w=weights.getComponent(i,j);if(w>largest){largest=w;joint=indices.getComponent(i,j);}}
          mesh.getVertexPosition(i,hand).applyMatrix4(mesh.matrixWorld);
          for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const key=joint+':'+axis+':'+sign,value=hand.getComponent(axis)*sign;
            if(!cells.has(key)||value<cells.get(key).value)cells.set(key,{value,index:i});}
        }
        for(const index of new Set([...cells.values()].map(c=>c.index)))bodySamples.push({mesh,index});
      });
      reactionGroundHeight=reactionSupportHeight()-root.position.y;
      reactionHipHeight=bones.Hips.getWorldPosition(hand).y-root.position.y;
      torsoReference=bones.Spine2.getWorldQuaternion(new THREE.Quaternion()).invert();
      const referenceGun=new THREE.Quaternion().setFromAxisAngle(UP,Math.PI).invert();
      for(const side of ['Right','Left']){
        const wrist=bones[side+'Hand'],origin=wrist.getWorldPosition(new THREE.Vector3()),q=wrist.getWorldQuaternion(new THREE.Quaternion());
        const index=bones[side+'HandIndex1'].getWorldPosition(new THREE.Vector3()).sub(origin);
        const pinky=bones[side+'HandPinky1'].getWorldPosition(new THREE.Vector3()).sub(origin);
        const normal=new THREE.Vector3().crossVectors(index,pinky).normalize().multiplyScalar(side==='Left'?-1:1).applyQuaternion(referenceGun);
        const correction=new THREE.Quaternion().setFromUnitVectors(normal,new THREE.Vector3(side==='Left'?1:-1,0,0));
        handGrips[side]={rotation:correction.multiply(referenceGun.clone().multiply(q))};
      }
      // Only an animation is imported. Keep the existing PBR skin, mixer and actor.
      try{
        const extra=await loadMotion('assets/player/chaos-reaction-dodge.glb?v=20261017-dodge4');
        const clip=extra.animations.find(c=>c.name==='chaosReaction');
        if(!clip||clip.tracks.some(t=>!model.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error('Esqueleto de reacción incompatible');
        const idleHip=gltf.animations.find(c=>c.name==='idle').tracks.find(t=>/Hips\.position$/.test(t.name));
        for(const track of clip.tracks)if(/Hips\.position$/.test(track.name)){
          // The controller applies horizontal root motion through its existing collisions.
          motionTrack=track.clone().createInterpolant(new Float32Array(3));motionStart.fromArray(track.values);motionAxis=verticalAxis;
          for(let i=0;i<track.values.length;i+=3)for(let axis=0;axis<3;axis++)if(axis!==verticalAxis)track.values[i+axis]=idleHip.values[axis];
        }
        reactionAction=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);reactionAction.clampWhenFinished=true;
        reactionAction.play();reactionAction.paused=true;reactionAction.setEffectiveWeight(0);reaction.ready=true;
      }catch{reaction.error='Reacción no disponible; se conserva la introducción normal';}
      // Keep the approved introduction intact; Edge Slip belongs only to later quakes.
      try{
        const extra=await loadMotion('assets/player/chaos-reaction.glb?v=20261017-slip16');
        const clip=extra.animations.find(c=>c.name==='chaosReaction');
        if(!clip||clip.tracks.some(t=>!model.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error('Esqueleto de Edge Slip incompatible');
        const idleHip=gltf.animations.find(c=>c.name==='idle').tracks.find(t=>/Hips\.position$/.test(t.name));
        for(const track of clip.tracks)if(/Hips\.position$/.test(track.name))for(let i=0;i<track.values.length;i+=3)for(let axis=0;axis<3;axis++)if(axis!==verticalAxis)track.values[i+axis]=idleHip.values[axis];
        clip.name='periodicEdgeSlip';
        periodicReactionAction=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);periodicReactionAction.clampWhenFinished=true;
        periodicReactionAction.play();periodicReactionAction.paused=true;periodicReactionAction.setEffectiveWeight(0);reaction.periodicReady=true;
      }catch{reaction.periodicError='Edge Slip no disponible; se conserva el temblor.';}
      try{
        const extra=await loadMotion('assets/player/player-dodge.glb?v=113');
        const idleHip=gltf.animations.find(c=>c.name==='idle').tracks.find(t=>/Hips\.position$/.test(t.name));
        for(const kind of ['Left','Right']){
          const source=extra.animations.find(c=>c.name==='dodge'+kind);
          if(!source||source.duration<.2)throw Error('Falta esquiva '+kind);
          const tracks=source.tracks.filter(t=>t.name.endsWith('.quaternion')||/Hips\.position$/.test(t.name)).map(t=>t.clone());
          for(const track of tracks){
            const node=model.getObjectByName(THREE.PropertyBinding.parseTrackName(track.name).nodeName);
            if(!node?.isBone||!Array.from(track.values).every(Number.isFinite))throw Error('Esquiva incompatible');
            if(/Hips\.position$/.test(track.name))for(let i=0;i<track.values.length;i+=3)for(let axis=0;axis<3;axis++)if(axis!==verticalAxis)track.values[i+axis]=idleHip.values[axis];
          }
          const action=mixer.clipAction(new THREE.AnimationClip('playerDodge'+kind,source.duration,tracks)).setLoop(THREE.LoopOnce,1);
          action.clampWhenFinished=true;action.play();action.paused=true;action.setEffectiveWeight(0);dodgeActions[kind]=action;
        }
        dodgePose.ready=true;
      }catch{dodgePose.error='Esquivas no disponibles; se conserva el movimiento normal.';for(const a of Object.values(dodgeActions))a.setEffectiveWeight(0);}
      try{
        const extra=await loadMotion('assets/player/player-actions-v119.glb');
        const idleHip=gltf.animations.find(c=>c.name==='idle').tracks.find(t=>/Hips\.position$/.test(t.name));
        for(const name of ['hit1','hit2','standUp','jump']){
          const source=extra.animations.find(c=>c.name===name);if(!source||source.duration<.5)throw Error('Acción ausente');
          const rootTrack=source.tracks.find(t=>/Hips\.position$/.test(t.name));
          if(!rootTrack)throw Error('Acción sin desplazamiento');
          if(name!=='jump')actionMotionTracks[name]=rootTrack.clone().createInterpolant(new Float32Array(3));
          const tracks=source.tracks.filter(t=>t.name.endsWith('.quaternion')||/Hips\.position$/.test(t.name)).filter(t=>name!=='jump'||LOWER.test(t.name)).map(t=>t.clone());
          for(const t of tracks){
            if(!model.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)?.isBone||!Array.from(t.values).every(Number.isFinite))throw Error('Acción incompatible');
            if(/Hips\.position$/.test(t.name))for(let i=0;i<t.values.length;i+=3)for(let axis=0;axis<3;axis++)if(axis!==verticalAxis||name==='jump')t.values[i+axis]=idleHip.values[axis];
          }
          const a=mixer.clipAction(new THREE.AnimationClip('playerAction-'+name,source.duration,tracks)).setLoop(THREE.LoopOnce,1);
          a.clampWhenFinished=true;a.play();a.paused=true;a.setEffectiveWeight(0);fullActions[name]=a;
        }
        actionPose.ready=true;
      }catch{actionPose.error='Nuevas acciones no disponibles; se conservan las reacciones anteriores.';for(const a of Object.values(fullActions))a.setEffectiveWeight(0);}
      state.ready=true;
    } catch(error) {state.error=String(error);console.error('No cargó '+characterName,error);}
  }
  function mountWeapon(group,anchors) {weapon=group;if(anchors)weaponAnchors=anchors;scene.add(weapon);weapon.visible=false;}
  function setScopeView(active){
    state.scopeView=active;
    if(model)model.traverse(o=>{if(o.isMesh)o.visible=!active&&state.cameraDistance>.65;});
  }
  function reset() {
    dead=false;shotTime=0;firstCamera=true;bodyYaw=0;gait.phase=0;smoothedHipHeight=null;actionCameraY=0;
    reaction.time=reaction.weight=reaction.groundOffset=0;reaction.source=reaction.animation=null;
    reaction.distance=reaction.gripError=0;motionStarted=false;motionLast.set(0,0,0);cameraBob=0;gripRotation=null;
    footfall=null;footfallSequence=0;locomotionKind='idle';
    reloadPose.progress=reloadPose.time=reloadPose.weight=reloadPose.gripError=0;
    hurtPose.active=false;hurtPose.age=hurtPose.time=hurtPose.weight=hurtPose.events=hurtPose.gripError=0;
    dodgePose.kind=null;dodgePose.time=dodgePose.weight=dodgePose.sequence=dodgePose.gripError=0;dodgeContactAge=0;dodgeContactSequence=-1;
    actionTimeline.reset();recoveryMotion.reset();actionPose.gripError=0;
    layerWeights.clear();
    if(mixer&&actions.lower.idle&&actions.upper.idle){
      mixer.stopAllAction();
      for(const layer of ['lower','upper']){
        for(const action of Object.values(actions[layer]))action.reset().stopFading().setEffectiveWeight(0);
        actions[layer].idle.setEffectiveWeight(1).play();
        for(const name of locomotionNames){const action=actions[layer][name];action.setLoop(THREE.LoopRepeat,Infinity).play();action.paused=true;}
      }
      state.current=state.upper='idle';mixer.update(0);
      if(reactionAction){reactionAction.reset().setEffectiveWeight(0).play();reactionAction.paused=true;}
      if(periodicReactionAction){periodicReactionAction.reset().setEffectiveWeight(0).play();periodicReactionAction.paused=true;}
      for(const a of Object.values(dodgeActions)){a.reset().setEffectiveWeight(0).play();a.paused=true;}
      for(const a of Object.values(fullActions)){a.reset().setEffectiveWeight(0).play();a.paused=true;}
    }
  }
  function shoot() {shotTime=.22;}
  function hurt({strong=false,attack,heading}={}){
    if(!state.ready||dead)return false;
    if(actionPose.ready&&actionTimeline.hit({attack,heading})){
      hurtPose.active=false;hurtPose.weight=0;actionCameraY=0;recoveryMotion.reset();
      bodyYaw=actionTimeline.info().heading;root.rotation.y=bodyYaw;root.updateMatrixWorld(true);
      actionMotionBasis.setFromMatrix4(bones.Hips.parent.matrixWorld);
      actionReferenceHipHeight=bones.Hips.getWorldPosition(hand).y-root.position.y;
      return true;
    }
    if(actionTimeline.info().active)return false;
    if(!state.ready||dead||!hurtPose.ready)return false;
    hurtPose.intensity=strong?1:.85;hurtPose.active=true;hurtPose.age=hurtPose.time=hurtPose.weight=0;hurtPose.events++;return true;
  }
  function die() {actionTimeline.cancel();recoveryMotion.reset();for(const a of Object.values(fullActions))a.setEffectiveWeight(0);hurtPose.active=false;hurtPose.weight=0;dead=true;play('lower','death',true);play('upper','death',true);}
  function solveArm(side,target) {
    const arm=bones[side+'Arm'],fore=bones[side+'ForeArm'],wrist=bones[side+'Hand'];
    let a=arm.getWorldPosition(new THREE.Vector3()),b=fore.getWorldPosition(new THREE.Vector3()),c=wrist.getWorldPosition(new THREE.Vector3());
    const reach=a.distanceTo(b)+b.distanceTo(c)-.012;
    if(side==='Left'&&a.distanceTo(target)>reach){
      // Natural clavicle protraction supplies reach without stretching either arm bone.
      const shoulder=bones.LeftShoulder,center=shoulder.getWorldPosition(new THREE.Vector3());
      const torso=bones.Spine2.getWorldQuaternion(new THREE.Quaternion()).multiply(torsoReference),axis=UP.clone().applyQuaternion(torso);
      const clavicle=a.clone().sub(center),from=clavicle.clone().addScaledVector(axis,-clavicle.dot(axis)).normalize();
      const toward=target.clone().sub(center);toward.addScaledVector(axis,-toward.dot(axis)).normalize();
      const angle=THREE.MathUtils.clamp(Math.atan2(new THREE.Vector3().crossVectors(from,toward).dot(axis),from.dot(toward)),-.61,.61);
      const distance=t=>center.clone().add(clavicle.clone().applyAxisAngle(axis,angle*t)).distanceTo(target);
      if(distance(1)<distance(0)){
        let low=0,high=1;for(let i=0;i<7;i++){const mid=(low+high)/2;if(distance(mid)>reach)low=mid;else high=mid;}
        const change=new THREE.Quaternion().setFromAxisAngle(axis,angle*high),parent=shoulder.parent.getWorldQuaternion(new THREE.Quaternion());
        shoulder.quaternion.premultiply(parent.clone().invert().multiply(change).multiply(parent));root.updateMatrixWorld(true);
        a=arm.getWorldPosition(new THREE.Vector3());b=fore.getWorldPosition(new THREE.Vector3());c=wrist.getWorldPosition(new THREE.Vector3());
      }
    }
    const lengthA=a.distanceTo(b),lengthB=b.distanceTo(c),axis=target.clone().sub(a);
    const distance=THREE.MathUtils.clamp(axis.length(),Math.abs(lengthA-lengthB)+.0001,lengthA+lengthB-.0001);axis.normalize();
    const along=(lengthA*lengthA-lengthB*lengthB+distance*distance)/(2*distance);
    const pole=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis)).normalize();
    const elbow=a.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,lengthA*lengthA-along*along)));
    for(const [bone,from,to] of [[arm,b.clone().sub(a),elbow.clone().sub(a)]]){
      const change=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
      const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());
      bone.quaternion.premultiply(parent.clone().invert().multiply(change).multiply(parent));root.updateMatrixWorld(true);
    }
    const elbowNow=fore.getWorldPosition(new THREE.Vector3()),handNow=wrist.getWorldPosition(new THREE.Vector3());
    const change=new THREE.Quaternion().setFromUnitVectors(handNow.sub(elbowNow).normalize(),target.clone().sub(elbowNow).normalize());
    const parent=fore.parent.getWorldQuaternion(new THREE.Quaternion());
    fore.quaternion.premultiply(parent.clone().invert().multiply(change).multiply(parent));root.updateMatrixWorld(true);
  }
  function closeSupportHand(){
    // A fixed grip overrides only the left finger joints; the wrist and arm remain on their IK targets.
    for(const [name,pose] of Object.entries(fingerRest))bones[name].quaternion.copy(pose);
    bones.LeftHand.updateWorldMatrix(true,true);
    const inward=new THREE.Vector3(1,0,0).applyQuaternion(weapon.quaternion);
    for(const finger of ['Thumb','Index','Middle','Ring','Pinky']){
      const base=bones['LeftHand'+finger+'1'],next=bones['LeftHand'+finger+'2'];
      const direction=next.getWorldPosition(new THREE.Vector3()).sub(base.getWorldPosition(new THREE.Vector3())).normalize();
      const hinge=new THREE.Vector3().crossVectors(direction,inward).normalize();
      const angles=finger==='Thumb'?[.25,.45,.4]:[.75,1.1,.75];
      for(let joint=1;joint<=3;joint++){
        const bone=bones['LeftHand'+finger+joint],parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());
        const local=hinge.clone().applyQuaternion(parent.invert());
        bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(local,angles[joint-1]));
        bone.updateWorldMatrix(false,true);
      }
    }
  }
  function updateCamera(dt,{position,yaw,pitch,aim=0,jump=0,followReaction=false,reducedMotion=false,reactionMotionScale=1}) {
    camera.rotation.set(pitch,yaw,0);camera.updateMatrixWorld(true);
    // Close shoulder framing; the aspect cap keeps the torso visible in portrait.
    pivot.set(position.x,THREE.MathUtils.lerp(1.40,1.43,aim)+jump+actionCameraY,position.z);
    const targetBob=followReaction&&!reducedMotion&&reaction.weight>0?(bones.Hips.getWorldPosition(hand).y-jump-reactionHipHeight)*reactionMotionScale:0;
    cameraBob=THREE.MathUtils.lerp(cameraBob,targetBob,1-Math.exp(-Math.max(0,dt)/.08));
    if(Math.abs(cameraBob)<.00001)cameraBob=0;
    pivot.y+=cameraBob;
    // Free the center of the view without moving the player's physical body.
    const lateral=THREE.MathUtils.lerp(.39,.56,THREE.MathUtils.smoothstep(camera.aspect,1,1.6));
    const aspectLimit=camera.aspect>=1?.32:.24;
    const shoulder=Math.min(THREE.MathUtils.lerp(lateral,.36,aim),camera.aspect*THREE.MathUtils.lerp(aspectLimit,.20,aim));
    offset.set(shoulder,.10,THREE.MathUtils.lerp(.74,.80,aim)).applyQuaternion(camera.quaternion);
    desired.copy(pivot).add(offset);direction.copy(offset).normalize();
    const length=offset.length();let distance=length;
    right.set(1,0,0).applyQuaternion(camera.quaternion);
    // Five short rays reserve clearance for the camera's near plane.
    ray.far=length+.2;ray.near=0;
    for(const [x,y] of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]]){
      ray.set(pivot.clone().addScaledVector(right,x).addScaledVector(UP,y),direction);
      const hit=ray.intersectObjects(blockers,false)[0];
      if(hit)distance=Math.min(distance,Math.max(.12,hit.distance-.22));
    }
    state.obstructed=distance<length-.01;
    // Move inward immediately; ease outward so wall clearance never lags.
    state.cameraDistance=firstCamera||distance<state.cameraDistance?distance:THREE.MathUtils.lerp(state.cameraDistance,distance,1-Math.exp(-dt*12));
    firstCamera=false;camera.position.copy(pivot).addScaledVector(direction,state.cameraDistance);
    camera.position.lerp(new THREE.Vector3(position.x,1.7+jump,position.z),aim);camera.updateMatrixWorld(true);
    if(model){model.traverse(o=>{if(o.isMesh)o.visible=!state.scopeView&&aim<.3&&state.cameraDistance>.65;});}
  }
  function update(dt,{position,yaw,pitch,velocity,aim=0,jump=0,grounded=true,reloading=false,reloadProgress=0,recoil=0,mode='playing',intro=null,quake=null,dodge=null}) {
    if(!state.ready)return;
    root.visible=mode!=='menu'&&mode!=='loading';if(weapon)weapon.visible=root.visible;
    if(mode==='paused'||mode==='menu'||mode==='loading')return;
    const full=actionTimeline.update(dt,{playing:mode==='playing'&&!dead,grounded});
    if(actionPose.ready&&mode==='playing'&&!dead)recoveryMotion.update(full);
    const fullWeight=actionPose.ready?full.weight:0,jumpWeight=actionPose.ready?full.jumpWeight:0;
    if(hurtPose.active&&!dead){
      hurtPose.age=Math.min(hitDuration,hurtPose.age+Math.max(0,dt));hurtPose.time=hurtPose.age;
      const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
      hurtPose.weight=(hurtPose.intensity??.85)*smooth(hurtPose.age/.06)*smooth((hitDuration-hurtPose.age)/.12);
      if(hurtPose.age>=hitDuration){hurtPose.active=false;hurtPose.weight=0;}
    }
    root.position.set(position.x,jump,position.z);
    const speed=Math.hypot(velocity.x,velocity.z);
    const firing=shotTime>0;
    const moving=grounded&&speed>(state.current==='idle'?.28:.12);
    const kind=moving?(speed>(locomotionKind==='run'?PLAYER_MOTION.runExit:PLAYER_MOTION.runEnter)?'run':'walk'):'idle';
    locomotionKind=kind;
    const locomotion=state.motionPack==='original'?kind:selectShooterLocomotion(kind,velocity,yaw,aim>.05||firing||reloading);
    let facing=yaw+Math.PI;
    if(speed>.3&&aim<.1&&!firing&&!reloading&&!dodge?.active)facing=Math.atan2(velocity.x,velocity.z);
    bodyYaw+=Math.atan2(Math.sin(facing-bodyYaw),Math.cos(facing-bodyYaw))*(1-Math.exp(-dt*9));
    root.rotation.y=bodyYaw;
    if(full.active){bodyYaw=full.heading;root.rotation.y=bodyYaw;}
    advanceReaction(dead?null:intro,position);
    if(!dead){
      play('lower',locomotion);
      const upper=reloading&&actions.upper.reload?'reload':firing?'fire':aim>.05?'aim':locomotion;
      play('upper',upper,upper==='reload');
    }
    blendLayers(dt);
    const activeReaction=intro?reactionAction:periodicReactionAction;
    const sampled=intro?sampleChaosReaction(dead?null:intro,activeReaction?.getClip().duration):samplePeriodicReaction(dead?null:quake,activeReaction?.getClip().duration);
    // Retain a locomotion contribution when the player keeps moving during a quake.
    if(!intro&&moving)sampled.weight*=.7;
    reaction.source=sampled.weight>0?(intro?'intro':'periodic'):null;
    reaction.animation=sampled.weight>0?(intro?'Dodging Back':'Edge Slip'):null;
    reaction.time=sampled.time;reaction.weight=sampled.weight;reaction.groundOffset=0;
    for(const action of [reactionAction,periodicReactionAction])action?.setEffectiveWeight(0);
    if(activeReaction){
      activeReaction.time=sampled.time;activeReaction.setEffectiveWeight(sampled.weight);
      for(const layer of ['lower','upper'])for(const action of Object.values(actions[layer]))action.setEffectiveWeight(action.getEffectiveWeight()*(1-sampled.weight));
    }
    dodgePose.weight=0;
    for(const action of Object.values(dodgeActions))action.setEffectiveWeight(0);
    if(dodgePose.ready&&dodge?.active&&!dead&&!intro&&!sampled.weight){
      const action=dodgeActions[dodge.kind],smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
      dodgePose.kind=dodge.kind;dodgePose.time=dodge.age;dodgePose.sequence=dodge.sequence;
      dodgePose.weight=smooth(dodge.age/.10)*smooth((dodge.duration-dodge.age)/.16);
      action.time=Math.min(action.getClip().duration,dodge.age);action.setEffectiveWeight(dodgePose.weight);
      for(const layer of ['lower','upper'])for(const a of Object.values(actions[layer]))a.setEffectiveWeight(a.getEffectiveWeight()*(1-dodgePose.weight));
      if(dodgeContactSequence!==dodge.sequence){dodgeContactSequence=dodge.sequence;dodgeContactAge=0;}
      if(speed>.2)for(const [i,contact]of [.15,.45].entries())if(dodgeContactAge<contact&&dodge.age>=contact)footfall={sequence:++footfallSequence,kind:'walk',side:i?'Left':'Right'};
      dodgeContactAge=dodge.age;
    }
    for(const a of Object.values(fullActions))a.setEffectiveWeight(0);
    if(fullWeight>0&&!dead){
      fullActions[full.kind].time=full.time;fullActions[full.kind].setEffectiveWeight(fullWeight*(1-full.riseBlend));
      fullActions.standUp.time=full.riseTime;fullActions.standUp.setEffectiveWeight(fullWeight*full.riseBlend);
      for(const layer of ['lower','upper'])for(const a of Object.values(actions[layer]))a.setEffectiveWeight(a.getEffectiveWeight()*(1-fullWeight));
      for(const a of [reactionAction,periodicReactionAction,...Object.values(dodgeActions)])a?.setEffectiveWeight(a.getEffectiveWeight()*(1-fullWeight));
    }else if(jumpWeight>0&&!dead&&!intro&&!sampled.weight&&!dodgePose.weight){
      fullActions.jump.time=full.jumpTime;fullActions.jump.setEffectiveWeight(jumpWeight);
      for(const a of Object.values(actions.lower))a.setEffectiveWeight(a.getEffectiveWeight()*(1-jumpWeight));
    }
    let walkWeight=0,runWeight=0,walkDistance=0,runDistance=0;
    for(const name of locomotionNames){const w=actions.lower[name].getEffectiveWeight(),running=name==='run'||name==='runBack';if(running){runWeight+=w;runDistance+=w*gait.distances[name];}else{walkWeight+=w;walkDistance+=w*gait.distances[name];}}
    walkDistance=walkWeight>.001?walkDistance/walkWeight:gait.distances.walk;runDistance=runWeight>.001?runDistance/runWeight:gait.distances.run;
    const gaitFrame=gaitSample(gait.phase,!dead&&grounded?dt:0,speed,{walkWeight,runWeight,walkDistance,runDistance,runOffset:gait.runOffset,walkCycles:gait.walkCycles,runCycles:gait.runCycles});
    if(!dead&&grounded){
      if(moving&&!intro&&!dodge?.active&&!full.active){
        const contacts=state.motionPack!=='original'
          ?crossedContacts(gait.phase,gaitFrame.advance,SHOOTER_GAITS[locomotion].contacts,gait.offsets[locomotion]||0)
          :locomotion==='run'
          ?crossedContacts(gaitFrame.runStart,gaitFrame.runAdvance,RUN_CONTACTS,gait.runOffset)
          :crossedContacts(gait.phase,gaitFrame.advance,WALK_CONTACTS);
        for(const contact of contacts)footfall={sequence:++footfallSequence,kind,side:contact.index%2?'Right':'Left'};
      }
      gait.phase=gaitFrame.phase;
    }
    for(const layer of ['lower','upper'])for(const name of locomotionNames){
      const action=actions[layer][name];const phase=state.motionPack==='original'?gaitFrame[name]:(gait.phase+(gait.offsets[name]||0))%1;
      action.time=phase*action.getClip().duration;
    }
    if(actions.upper.reload){
      const action=actions.upper.reload;action.paused=true;
      if(reloading){reloadPose.progress=THREE.MathUtils.clamp(Number.isFinite(reloadProgress)?reloadProgress:0,0,1);action.time=reloadPose.progress*action.getClip().duration;}
      reloadPose.time=action.time;reloadPose.weight=action.getEffectiveWeight();
    }
    mixer.update(dt);shotTime=Math.max(0,shotTime-dt);
    if(!dead&&!intro&&!sampled.weight&&!dodgePose.weight&&!fullWeight)brace(bones);
    // The pack's forward walk raises the authored chest ~20 degrees. A rifle-ready
    // upper body must not inherit that elevation. Correct the spine in world space,
    // before applying the player's view pitch; hips, legs and footfall phase stay authored.
    const forwardWeight=actions.upper.walk.getEffectiveWeight();
    if(state.motionPack!=='original'&&!dead&&!intro&&!sampled.weight&&!dodgePose.weight&&!fullWeight&&forwardWeight>1e-5){
      root.updateMatrixWorld(true);
      bones.Spine2.getWorldQuaternion(rotation).multiply(torsoReference);
      direction.set(0,0,1).applyQuaternion(rotation).normalize();
      right.copy(direction);right.y=0;
      if(right.lengthSq()>1e-6){
        right.normalize();delta.setFromUnitVectors(direction,right).slerp(IDENTITY,1-forwardWeight);
        const parent=bones.Spine.parent.getWorldQuaternion(rotation);
        bones.Spine.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
      }
    }
    if(hurtPose.weight>0)for(const {bone,sample}of hitTracks){
      hitRotation.fromArray(sample.evaluate(hurtPose.time)).normalize().slerp(IDENTITY,1-hurtPose.weight);
      bone.quaternion.multiply(hitRotation);
    }
    // Lean the existing rifle poses with the view; locomotion and collision stay independent.
    if(!dead)for(const name of ['Spine','Spine1','Spine2']){
      const bone=bones[name];if(!bone)continue;
      root.updateMatrixWorld(true);right.set(-1,0,0).applyQuaternion(root.quaternion);
      bone.parent.getWorldQuaternion(rotation).invert();right.applyQuaternion(rotation);
      delta.setFromAxisAngle(right,THREE.MathUtils.clamp(pitch,-.9,.9)/3*(1-reaction.weight)*(1-dodgePose.weight)*(1-fullWeight));
      bone.quaternion.premultiply(delta);
    }
    root.updateMatrixWorld(true);
    if(!dead){
      const hipHeight=bones.Hips.getWorldPosition(hand).y-jump;
      if(smoothedHipHeight===null||reaction.weight>0||dodgePose.weight>0||fullWeight>0)smoothedHipHeight=hipHeight;
      smoothedHipHeight=THREE.MathUtils.lerp(smoothedHipHeight,hipHeight,1-Math.exp(-dt/.10));
      // Keep authored body sway, smoothed at the pelvis. During normal locomotion, foot contact does
      // not move the close-camera torso; jumping remains immediate.
      root.position.y+=smoothedHipHeight-hipHeight;
      root.updateMatrixWorld(true);
      if(fullWeight>0){
        let support=Infinity;for(const {mesh,index}of bodySamples){mesh.getVertexPosition(index,hand).applyMatrix4(mesh.matrixWorld);support=Math.min(support,hand.y);}
        const lift=Math.max(0,jump+Math.max(0,reactionGroundHeight)-support);root.position.y+=lift;smoothedHipHeight+=lift;root.updateMatrixWorld(true);
        actionPose.supportHeight=support+lift;
      }
      if(!fullWeight&&(reaction.weight>0||dodgePose.weight>0)){
        // Keep the imported vertical offset at normal sole level; horizontal
        // displacement belongs to the controller and its collision resolver.
        reaction.groundOffset=reactionGroundHeight+jump-reactionSupportHeight();
        root.position.y+=reaction.groundOffset;smoothedHipHeight+=reaction.groundOffset;
        root.updateMatrixWorld(true);
        reaction.supportHeight=reactionSupportHeight();
      }
    }
    const targetActionY=full.active&&!dead?bones.Hips.getWorldPosition(hand).y-jump-actionReferenceHipHeight:0;
    actionCameraY=THREE.MathUtils.lerp(actionCameraY,targetActionY,1-Math.exp(-Math.max(0,dt)/.055));
    if(Math.abs(actionCameraY)<.00001)actionCameraY=0;
    if(weapon&&!state.scopeView){
      weapon.scale.setScalar(.86);
      // Follow the animated torso frame, including the run's hip lean and twist.
      const torso=bones.Spine2.getWorldQuaternion(new THREE.Quaternion()).multiply(torsoReference);
      const bodyRight=new THREE.Vector3(-1,0,0).applyQuaternion(torso),y=UP.clone().applyQuaternion(torso);
      gunForward.set(0,0,1).applyQuaternion(torso);
      const z=gunForward.clone().negate(),x=bodyRight;
      matrix.makeBasis(x,y,z);weapon.quaternion.setFromRotationMatrix(matrix);
      if(reloading&&!actions.upper.reload)weapon.rotateX(-Math.sin(Math.PI*reloadProgress)*.35);
      weapon.rotateX(recoil*.025);
      if(!dead){
        // Butt pad sits on the outside/front of the right shoulder, never inside the torso.
        const runWeight=Math.max(...['lower','upper'].map(layer=>actions[layer].run.getEffectiveWeight()));
        const stock=bones.RightArm.getWorldPosition(new THREE.Vector3()).addScaledVector(gunForward,.115+.075*runWeight).addScaledVector(bodyRight,.025).addScaledVector(y,.04);
        weapon.position.copy(stock).sub(weaponAnchors.stock.clone().multiplyScalar(.86).applyQuaternion(weapon.quaternion));
      }else{
        bones.RightHand.getWorldPosition(hand);weapon.position.copy(hand).sub(weaponAnchors.right.clone().multiplyScalar(.86).applyQuaternion(weapon.quaternion));
      }
      weapon.updateMatrixWorld(true);
      if(!dead){
        // Authored reload/stagger arms must survive normal rifle IK. Keep the right-hand
        // grip, while letting the left hand leave the foregrip and reach the magazine.
        const gripBlend=Math.max(fullWeight,dodgePose.weight,hurtPose.weight,reloadPose.weight,Math.min(1,reaction.weight/(intro?.preferences?.reduced||intro?.systemReducedMotion||quake?.reduced ? .5 : 1)));
        const authored=gripBlend>1e-5?Object.fromEntries(['RightShoulder','RightArm','RightForeArm','RightHand','LeftShoulder','LeftArm','LeftForeArm','LeftHand',...Object.keys(fingerRest)].map(name=>[name,bones[name].quaternion.clone()])):null;
        for(const side of ['Right','Left']){
          const wrist=bones[side+'Hand'],origin=wrist.getWorldPosition(new THREE.Vector3()),inverse=wrist.getWorldQuaternion(new THREE.Quaternion()).invert();
          const index=bones[side+'HandIndex1'].getWorldPosition(new THREE.Vector3()).sub(origin).applyQuaternion(inverse);
          const middle=bones[side+'HandMiddle1'].getWorldPosition(new THREE.Vector3()).sub(origin).applyQuaternion(inverse);
          const pinky=bones[side+'HandPinky1'].getWorldPosition(new THREE.Vector3()).sub(origin).applyQuaternion(inverse);
          const offset=index.clone().add(middle).add(pinky).multiplyScalar(.55/3);
          const orientation=weapon.quaternion.clone().multiply(handGrips[side].rotation);
          const normal=new THREE.Vector3().crossVectors(index,pinky).normalize().multiplyScalar(side==='Left'?-1:1).applyQuaternion(orientation);
          const targetNormal=new THREE.Vector3(side==='Left'?1:-1,0,0).applyQuaternion(weapon.quaternion);
          orientation.premultiply(new THREE.Quaternion().setFromUnitVectors(normal,targetNormal));
          // Keep the support fingers horizontal around the front grip, rather than hanging below it.
          if(side==='Left')orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(targetNormal,Math.PI/4));
          const palm=weapon.localToWorld(weaponAnchors[side.toLowerCase()].clone());
          solveArm(side,palm.sub(offset.applyQuaternion(orientation)));
          const parent=wrist.parent.getWorldQuaternion(new THREE.Quaternion());
          wrist.quaternion.copy(parent.invert().multiply(orientation));root.updateMatrixWorld(true);
        }
        closeSupportHand();
        if(authored){
          for(const [name,q]of Object.entries(authored))bones[name].quaternion.slerp(q,gripBlend);
          for(const [name,q]of Object.entries(gripFingers))bones[name].quaternion.slerp(q,gripBlend);
          root.updateMatrixWorld(true);
          const wrist=bones.RightHand.getWorldQuaternion(new THREE.Quaternion());
          const held=wrist.multiply(gripRotation||handGrips.Right.rotation.clone().invert());
          weapon.quaternion.slerp(held,gripBlend);
          const grip=palmPosition('Right').sub(weaponAnchors.right.clone().multiplyScalar(.86).applyQuaternion(weapon.quaternion));
          weapon.position.copy(grip);weapon.updateMatrixWorld(true);
          const gripError=palmPosition('Right').distanceTo(weapon.localToWorld(weaponAnchors.right.clone()));
          dodgePose.gripError=dodgePose.weight>1e-5?gripError:0;reaction.gripError=gripError;reloadPose.gripError=reloadPose.weight>1e-5?gripError:0;hurtPose.gripError=hurtPose.weight>1e-5?gripError:0;
          actionPose.gripError=fullWeight>1e-5?gripError:0;
        }else{
          gripRotation=bones.RightHand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(weapon.quaternion);
          for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(let joint=1;joint<=3;joint++){const name='RightHand'+finger+joint;gripFingers[name]=bones[name].quaternion.clone();}
          reaction.gripError=reloadPose.gripError=hurtPose.gripError=0;
        }
      }
    }
  }
  function dispose(){
    root.visible=false;scene.remove(root);mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model);
    const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
    root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);
      for(const material of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
    for(const texture of textures){texture.dispose();texture.source?.data?.close?.();}
    for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const skeleton of skeletons)skeleton.dispose();
    root.clear();state.ready=false;model=null;
  }
  function info(){return {...state,actionPose:{...actionPose,...actionTimeline.info(),motion:recoveryMotion.info(),cameraY:actionCameraY},reaction:{...reaction},reload:{...reloadPose},hurt:{...hurtPose},dodge:{...dodgePose},gait:{phase:gait.phase,runOffset:gait.runOffset,walkCycles:gait.walkCycles,runCycles:gait.runCycles,offsets:{...gait.offsets},durations:{...gait.durations},distances:{...gait.distances},layers:Object.fromEntries(['lower','upper'].map(layer=>[layer,{weights:Object.fromEntries(Object.entries(actions[layer]).map(([name,a])=>[name,a.getEffectiveWeight()])),walkTime:actions[layer].walk.time,runTime:actions[layer].run.time}]))},clips:Object.keys(actions.lower),bones:Object.keys(bones).length,weaponMounted:!!weapon,
    modelVisible:root.visible&&!!model?.getObjectByProperty('isSkinnedMesh',true)?.visible,position:root.position.toArray()};}
  return {root,state,bones,load,dispose,mountWeapon,setScopeView,reset,shoot,hurt,hitWeight:()=>hurtPose.weight,die,updateCamera,update,info,
    get recovering(){return actionPose.ready&&actionTimeline.info().active;},
    get followingAction(){return actionTimeline.info().active||Math.abs(actionCameraY)>.00001;},
    dodgeDuration:kind=>dodgePose.ready?dodgeActions[kind]?.getClip().duration||0:0,
    footstepState:()=>({footfall,locomotion:locomotionKind})};
}
