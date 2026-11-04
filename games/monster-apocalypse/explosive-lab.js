import * as THREE from 'three';
import {createExplosiveOrbGlow,EXPLOSIVE_ORB_HP,explosiveOrbMaskForWave} from './explosive-orbs.js?v=free116';

export function explosiveLabEnabled(location){
  return ['localhost','127.0.0.1','[::1]'].includes(location.hostname)
    && new URLSearchParams(location.search).get('explosiveLab')==='1';
}

export function createExplosiveLab({loader,enabled,clone=root=>root.clone(true),createShotIndex=()=>null,sampleFootSupport=()=>({feet:[]}),move,attacks=null,random=Math.random,emitWeakPoint=()=>0,getViewPosition=()=>null,getShotOrigin=getViewPosition,targetEffectsEnabled=()=>true,onTargetCount=()=>{}}){
  const state={enabled,ready:false,error:null,triangles:0,animations:0,height:3,orbHp:EXPLOSIVE_ORB_HP,reactionWindows:{hitLegs:.65},approachDistance:1.65,
    guard:{enabled:false},bodyHitCooldown:1.6,bodyHitLimit:2,stomach:{hits:12,requiresGuard:false}};
  let template=null,clips=[],footSupport=[],deathSupport=[],deathBodySupport=[],spotlightTexture=null;
  const targetCounts=new Map();
  async function load(){
    if(!enabled)return;
    try{
      const [gltf,reaction,stomach,deathData,alertData,deathContact,attackPair]=await Promise.all([
        loader.loadAsync('assets/enemies/explosive/explosive-animated.glb?v=health74'),
        loader.loadAsync('assets/enemies/explosive/hit-reaction-v78.glb'),
        loader.loadAsync('assets/enemies/explosive/stomach-reaction-v81.glb'),
        fetch('assets/enemies/explosive/death-v93.json').then(response=>{if(!response.ok)throw Error('Death clip unavailable');return response.json();}),
        fetch('assets/enemies/explosive/alert-v96.json').then(response=>{if(!response.ok)throw Error('Arrival clip unavailable');return response.json();}),
        fetch('assets/enemies/explosive/death-contact-v95.json').then(response=>{if(!response.ok)throw Error('Body contacts unavailable');return response.json();}),
        ...(attacks?[loader.loadAsync('assets/enemies/explosive/attack-pair-v118.glb')]:[]),
      ]);
      spotlightTexture=await new THREE.TextureLoader().loadAsync('assets/enemies/explosive/spotlight_08_a.png');
      spotlightTexture.colorSpace=THREE.SRGBColorSpace;spotlightTexture.generateMipmaps=false;spotlightTexture.minFilter=spotlightTexture.magFilter=THREE.LinearFilter;
      template=gltf.scene;delete gltf.parser;template.updateMatrixWorld(true);
      // Keep authored vertical motion, but let the existing ground navigation own X/Z.
      const deathClip=THREE.AnimationClip.parse(deathData.clip);
      if(deathClip.name!=='death'||Math.abs(deathClip.duration-2.3)>.001)throw Error('Invalid death clip');
      const alertClip=THREE.AnimationClip.parse(alertData.clip);
      if(alertClip.name!=='alert'||Math.abs(alertClip.duration-2.8)>.001)throw Error('Invalid arrival clip');
      if(attacks)attacks.validateClips(attackPair.animations);
      clips=[...gltf.animations,...reaction.animations,...stomach.animations,deathClip,alertClip,...(attackPair?.animations||[])].map(source=>{
        const clip=source.clone();
        for(const track of clip.tracks){
          if(!track.name.endsWith('.position'))continue;
          const name=THREE.PropertyBinding.parseTrackName(track.name).nodeName,bone=template.getObjectByName(name);
          if(!bone||!(/Hips$/.test(name)||name==='ExplosiveRig'))continue;
          const up=new THREE.Vector3(0,1,0).applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
          const delta=new THREE.Vector3();
          for(let i=0;i<track.values.length;i+=3){delta.fromArray(track.values,i).sub(bone.position);const vertical=delta.dot(up);delta.copy(up).multiplyScalar(vertical).add(bone.position).toArray(track.values,i);}
        }
        return clip;
      });
      const box=new THREE.Box3().setFromObject(template),size=box.getSize(new THREE.Vector3());
      if(!Number.isFinite(size.y)||size.y<=0)throw Error('Invalid model bounds');
      const scale=state.height/size.y,center=box.getCenter(new THREE.Vector3()),normalized=new THREE.Group();
      normalized.add(template);template.scale.multiplyScalar(scale);
      template.position.add(new THREE.Vector3(-center.x*scale,-box.min.y*scale,-center.z*scale));template=normalized;
      template.traverse(o=>{if(o.isMesh){state.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=true;o.receiveShadow=true;}});
      const meshes=[];template.traverse(o=>{if(o.isMesh)meshes.push(o);});
      if(!Array.isArray(deathData.groundSupport)||deathData.groundSupport.length!==meshes.length)throw Error('Missing death contacts');
      deathSupport=deathData.groundSupport.map((indices,n)=>{
        const count=meshes[n].geometry.attributes.position.count;
        if(deathData.meshVertices[n]!==count||!indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=count))throw Error('Invalid death contacts');
        return indices;
      });
      if(!Array.isArray(deathContact.bodySupport)||deathContact.bodySupport.length!==meshes.length||deathContact.target.sha256!==deathData.target.sha256)throw Error('Missing body contacts');
      deathBodySupport=deathContact.bodySupport.map((indices,n)=>{
        const count=meshes[n].geometry.attributes.position.count;
        if(deathContact.meshVertices[n]!==count||!indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=count))throw Error('Invalid body contacts');
        return indices;
      });
      footSupport=sampleFootSupport(template,Object.fromEntries(clips.map(c=>[c.name,c]))).feet;
      state.animations=clips.length;state.clips=clips.map(c=>c.name);state.ready=true;
    }catch{state.error='No se pudo cargar el explosivo animado. Reintenta la carga.';}
  }
  function play(mon,name,{once=false,rate=1}={}){
    if(mon.currentClip===name&&!once){mon.actions[name].paused=false;mon.actions[name].setEffectiveTimeScale(rate);return;}
    const previous=mon.currentClip===name?null:mon.actions[mon.currentClip],action=mon.actions[name];
    if(!action)return;
    for(const other of Object.values(mon.actions))if(other!==action&&other!==previous)other.stop();
    action.reset().stopFading().setEffectiveWeight(1).setEffectiveTimeScale(rate).setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
    action.clampWhenFinished=once;action.play();if(previous)previous.crossFadeTo(action,.14,false);
    mon.currentClip=name;
  }
  function create(point,id,{wave=1}={}){
    if(!enabled||!state.ready||!point)return null;
    const g=clone(template),mats=[],meshes=[],bones={};
    g.traverse(o=>{
      if(o.isBone)bones[o.name.replace(/^mixamorig[:_]?/,'')]=o;
      if(o.isMesh){meshes.push(o);const copy=m=>{const n=m.clone();mats.push(n);return n;};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);}
    });
    g.name='Explosivo';g.position.set(point.x,0,point.z);
    const mixer=new THREE.AnimationMixer(g),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));
    const mon={g,mats,meshes,bones,mixer,actions,type:'explosive',explosiveLab:true,hp:5*EXPLOSIVE_ORB_HP,maxHp:5*EXPLOSIVE_ORB_HP,
      speed:2,collisionRadius:.65,state:'idle',stateT:0,flash:0,hurtMul:1,partColor:0xd89a55,steerSign:id%2?1:-1,
      steerT:0,stuckT:0,stuckX:point.x,stuckZ:point.z,currentClip:null,reactionLeft:0,arrivalLeft:0,arrivalEvents:0,
      guardLeft:0,guardCooldown:0,guardEvents:0,stumbleEvents:0,orbScreamEvents:0,lastReaction:null,
      bodyHitCooldown:0,bodyHitEvents:0,
      stomachHits:0,stomachEvents:0,exposureEvents:0,
      explosiveVisual:{meshes,shotIndexes:meshes.map(createShotIndex)}};
    mon.visual=g.children[0];mon.baseY=mon.visual.position.y;
    mon.wave=Number.isInteger(wave)&&wave>0?wave:1;
    mon.orbGlow=createExplosiveOrbGlow(g,{activeOrbs:explosiveOrbMaskForWave(mon.wave),emitWeakPoint,spotlightTexture,getViewPosition,getShotOrigin,targetEffectsEnabled,onTargetCount(count){
      if(count)targetCounts.set(mon,count);else targetCounts.delete(mon);
      onTargetCount([...targetCounts.values()].reduce((sum,n)=>sum+n,0));
    }});
    mon.hp=mon.maxHp=mon.orbGlow.info().totalHealth;g.userData.monster=mon;return mon;
  }
  function beginArrival(mon){
    if(mon.arrivalEvents||mon.state==='dead')return false;
    play(mon,'alert',{once:true});mon.arrivalEvents++;
    mon.arrivalLeft=mon.actions.alert.getClip().duration;mon.state='alert';mon.stateT=0;
    mon.mixer.update(0);ground(mon);return true;
  }
  const supportPoint=new THREE.Vector3();
  function ground(mon){
    mon.visual.position.y=mon.baseY;mon.g.updateMatrixWorld(true);
    for(const mesh of mon.meshes)mesh.skeleton?.update();
    let sole=Infinity;
    const support=mon.state==='dead'?deathSupport:footSupport;
    mon.meshes.forEach((mesh,n)=>{for(const index of support[n]||[]){mesh.getVertexPosition(index,supportPoint);mesh.localToWorld(supportPoint);sole=Math.min(sole,supportPoint.y);}});
    if(mon.state==='dead'){
      let body=Infinity;
      mon.meshes.forEach((mesh,n)=>{for(const index of deathBodySupport[n]||[]){mesh.getVertexPosition(index,supportPoint);mesh.localToWorld(supportPoint);body=Math.min(body,supportPoint.y);}});
      // Long leg spurs must not hold the entire corpse above the ground.
      // Transfer contact smoothly to the torso as the authored fall lands.
      if(Number.isFinite(body)&&Number.isFinite(sole))sole=THREE.MathUtils.lerp(sole,body,THREE.MathUtils.smoothstep(mon.stateT,.7,1.5));
    }
    // Feet support locomotion; the authored fall also needs torso/arm contact.
    // Use compact contact samples without scanning the full mesh each frame.
    if(Number.isFinite(sole))mon.visual.position.y+=mon.g.position.y-sole+.002;
    mon.g.updateMatrixWorld(true);for(const mesh of mon.meshes)mesh.skeleton?.update();
  }
  function hit(mon,damage,point,hit){
    if(mon.state==='dead')return {accepted:false,damage:0,dead:false};
    const result=mon.orbGlow.hit(point,hit?.object,damage,hit);
    const orbState=mon.orbGlow.info();mon.hp=orbState.totalHealth;
    // Real body impacts still build toward the gut hold.
    // Do not build/restart pressure during exposure or a sac-destruction scream.
    if(result.bodyHit){
      const canBuildPressure=!orbState.vulnerable&&!(mon.reactionLeft>0&&['gutHit','alert'].includes(mon.currentClip));
      if(canBuildPressure)mon.stomachHits++;
      if(canBuildPressure&&mon.stomachHits>=state.stomach.hits){
        mon.stomachHits=0;mon.orbGlow.expose();mon.orbGlow.highlightTargets();mon.exposureEvents++;
        play(mon,'gutHit',{once:true});mon.reactionLeft=mon.actions.gutHit.getClip().duration;
        mon.bodyHitCooldown=mon.reactionLeft+.3;mon.bodyHitEvents++;mon.stomachEvents++;mon.lastReaction='stomachHit';
      }else if(!result.stomachHit&&mon.reactionLeft<=0&&mon.bodyHitCooldown<=0&&mon.bodyHitEvents-mon.stomachEvents<state.bodyHitLimit){
        // Ordinary flinches remain limited; earned gut holds repeat each cycle.
        play(mon,'bodyHit',{once:true});mon.reactionLeft=mon.actions.bodyHit.getClip().duration;
        mon.bodyHitCooldown=state.bodyHitCooldown;mon.bodyHitEvents++;mon.lastReaction='bodyHit';
      }
    }
    if(result.popped){
      mon.stomachHits=0;
      if(!result.dead){
        // Reuse the exact spawn scream, its active-time timer and audio path.
        // Do not increment arrivalEvents or start another materialization.
        play(mon,'alert',{once:true});mon.reactionLeft=mon.actions.alert.getClip().duration;
        mon.arrivalLeft=mon.reactionLeft;mon.stateT=0;mon.orbScreamEvents=(mon.orbScreamEvents||0)+1;
      }
      // Legacy diagnostic counts destroyed sacs; no stumble animation plays.
      mon.stumbleEvents++;mon.lastReaction='orbDestroyed';
    }
    if(result.dead&&result.accepted){
      play(mon,'death',{once:true});mon.reactionLeft=mon.actions.death.getClip().duration;
      mon.state='dead';mon.stateT=0;mon.lastReaction='death';
      mon.deathDuration=mon.reactionLeft+.45;
    }
    else if(mon.reactionLeft>0)mon.state=mon.currentClip==='alert'?'alert':'hurt';
    if(mon.currentClip!=='alert')mon.arrivalLeft=0;
    if(mon.reactionLeft>0||mon.state==='dead')attacks?.cancel(mon);
    return result;
  }
  function update(mon,dt,player){
    mon.stateT+=dt;mon.reactionLeft=Math.max(0,mon.reactionLeft-dt);
    mon.bodyHitCooldown=Math.max(0,mon.bodyHitCooldown-dt);
    if(mon.arrivalLeft>0&&mon.state!=='dead'){
      mon.arrivalLeft=Math.max(0,mon.arrivalLeft-dt);
      mon.mixer.update(dt);ground(mon);mon.orbGlow.update(dt);
      if(mon.arrivalLeft===0)mon.state='idle';
      return false;
    }
    if(mon.spawning)return false;
    attacks?.tick(mon,dt);
    let attacking=false;
    if(mon.state!=='dead'&&mon.reactionLeft<=0&&attacks){
      if(mon.attack||attacks.tryStart(mon,player,play))attacking=attacks.update(mon,dt,player);
    }
    if(mon.state!=='dead'&&mon.reactionLeft<=0&&!attacking){
      const distance=player?Math.hypot(player.x-mon.g.position.x,player.z-mon.g.position.z):0;
      if(player&&distance>state.approachDistance+.001&&move){
        mon.state='chase';
        move(mon,dt,Math.min(mon.speed,(distance-state.approachDistance)/Math.max(dt,.001)),player.x,player.z);
        const direction=mon.crowdFacing||mon.routeSteering||player;mon.g.lookAt(direction.x,0,direction.z);
        // Resume the gait even on a blocked frame: navigation recovery may
        // need several frames, and a previously held action must not stay frozen.
        play(mon,'run');
      }else{
        mon.state='idle';const action=mon.actions[mon.currentClip];
        // No idle asset was supplied. Hold its authored pose without an invented clip.
        if(action)action.paused=true;
      }
    }
    if(mon.reactionLeft>0&&mon.currentClip&&mon.actions[mon.currentClip])mon.actions[mon.currentClip].paused=false;
    mon.mixer.update(dt);ground(mon);
    mon.orbGlow.update(dt);
    if(mon.flash>0){mon.flash=Math.max(0,mon.flash-dt*6);for(const m of mon.mats)m.emissive?.setRGB(mon.flash*.55,mon.flash*.07,0);}
    if(mon.state==='dead'){
      const fade=THREE.MathUtils.clamp((mon.stateT-mon.deathDuration+.45)/.45,0,1);
      if(fade>0)for(const mat of mon.mats){if(!mat.transparent){mat.transparent=true;mat.needsUpdate=true;}mat.opacity=1-fade;}
      return mon.stateT>=mon.deathDuration;
    }
    return false;
  }
  function release(mon){mon.mixer.stopAllAction();mon.mixer.uncacheRoot(mon.g);mon.orbGlow.dispose();mon.g.removeFromParent();for(const m of mon.mats)m.dispose();for(const s of new Set(mon.meshes.map(m=>m.skeleton)))s?.dispose();}
  return {state,load,create,beginArrival,update,release,hit,ground,info:()=>({...state})};
}
