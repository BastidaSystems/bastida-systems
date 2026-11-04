import * as THREE from 'three';
import {createEnvironmentFlipbooks} from './environment-flipbooks.js?v=20261017-hood42';
import {createEnvironmentAudio} from './environment-audio.js';
import {createEnvironmentSparks} from './environment-sparks.js?v=particles79';

// Explicit vehicle/rubble anchors, with optional authored spark anchors. Never distributes across the map.
export async function createEnvironmentSystem({scene,audio,vehicle,smokeZone,sparkAnchors={},sparksEnabled=true,sparkCapacity=96,flipbookCapacity=12,particleBudget=96,preloadExplosion=false,additionalAudio=[],placement={},manifestURL='assets/atmosphere/v2/manifest.json'}){
  if(!vehicle||!smokeZone)throw Error('Vehicle and smoke-zone anchors are required');
  const url=new URL(manifestURL,location.href),baseURL=new URL('./',url),response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Environmental manifest unavailable');
  const manifest=await response.json(),vfx=createEnvironmentFlipbooks(scene,{maxEffects:flipbookCapacity}),errors=[];
  const fireAnchor=new THREE.Object3D();fireAnchor.position.fromArray(placement.fireOffset||[0,.8,0]);vehicle.add(fireAnchor);
  const emberAnchor=new THREE.Object3D();emberAnchor.position.fromArray(placement.emberOffset||[0,3.5,0]);vehicle.add(emberAnchor);
  const sound=createEnvironmentAudio(audio,{fireAnchor,additionalFireAnchors:placement.additionalFireAnchors||[]});let disposed=false,sparks=null,enabled=true,sparksRequested=sparksEnabled,sparkBudget=Math.min(84,sparkCapacity),weakTargets=0;
  const updateParticleBudget=()=>sparks?.setBudget(Math.min(sparkBudget-weakTargets,particleBudget-vfx.visibleCount()-weakTargets));
  await Promise.all([
    ...manifest.particles.filter(a=>['fire','smoke',...(preloadExplosion?['explosion']:[])].includes(a.id)).map(a=>vfx.load(a,baseURL).catch(e=>errors.push(a.id+': '+e.message))),
    audio.loadClips([...manifest.audio,...additionalAudio],baseURL),
    createEnvironmentSparks(scene,{anchors:{embers:emberAnchor,...sparkAnchors},enabled:sparksEnabled,capacity:sparkCapacity})
      .then(layer=>{sparks=layer;}).catch(()=>errors.push('No se pudieron cargar las brasas y chispas; fuego y humo siguen disponibles.')),
  ]);
  const arrivals=new Set(),weakPointOrigin=new THREE.Vector3();
  function clearEnemyArrivals(){for(const h of arrivals)vfx.remove(h.smoke);arrivals.clear();sparks?.clearTransient();}
  const anchors={vehicle:fireAnchor,rubble:smokeZone,...placement.anchors};
  const effects=placement.effects||[
    {asset:'fire',anchor:'vehicle',offset:[0,2.2,-1.8],size:[2.2,4.4],opacity:.9},
    {asset:'fire',anchor:'vehicle',offset:[.4,2.1,1.8],size:[1.8,3.6],opacity:.82,phase:30},
    {asset:'smoke',anchor:'vehicle',offset:[0,3.4,0],size:[4,4],opacity:.63,phase:24},
    {asset:'smoke',anchor:'rubble',offset:[0,2.5,0],size:[5,5],opacity:.52,phase:8},
  ];
  const effectsByID=new Map();let blastGlow=null,blastWarmup=null;
  for(const effect of effects){const e=vfx.add({...effect,anchor:anchors[effect.anchor]});if(effect.id&&e)effectsByID.set(effect.id,e);}
  return {
    emitWeakPoint(anchor){
      if(disposed||!enabled||!sparksRequested||!anchor?.isEffectActive?.())return 0;
      updateParticleBudget();
      return sparks?.burstAt(anchor.getWorldPosition(weakPointOrigin),{radius:.12,height:.12,count:1,weakPoint:true,anchor})||0;
    },
    beginEnemyArrival(position,{radius=.6,height=1.8}={}){
      if(disposed||!enabled)return null;
      const point=new THREE.Vector3(position.x,position.y,position.z),anchor=new THREE.Object3D();anchor.position.copy(point);anchor.updateMatrixWorld(true);
      const smoke=sparksRequested?vfx.add({asset:'smoke',anchor,offset:[0,height*.45,0],size:[Math.max(1.2,radius*3),Math.max(1.3,height*1.25)],opacity:0,phase:10,loop:true}):null;
      updateParticleBudget();
      const particles=sparksRequested?sparks?.burstAt(point,{radius,height,count:8})||0:0;
      if(!smoke&&!particles)return null;
      const handle={smoke,point,radius,height,age:0};arrivals.add(handle);return handle;
    },
    revealEnemyArrival(handle){if(arrivals.has(handle)&&enabled&&sparksRequested)sparks?.burstAt(handle.point,{radius:handle.radius,height:handle.height,count:6});},
    cancelEnemyArrival(handle){if(arrivals.delete(handle))vfx.remove(handle.smoke);},
    clearEnemyArrivals,
    setWeakTargetCount(count){weakTargets=Math.max(0,Math.min(particleBudget,Number.isFinite(count)?Math.floor(count):0));updateParticleBudget();},
    setQuality(profile){sparkBudget=Math.min(84,profile.sparks);updateParticleBudget();vfx.setDistance(profile.effectDistance);},
    pause(){sound.stop();sparks?.clear();vfx.setGlowStrength(blastGlow,0);},
    setEnabled(value){if(disposed)return;enabled=!!value;if(!enabled)clearEnemyArrivals();vfx.setEnabled(enabled);sparks?.setEnabled(enabled&&sparksRequested);if(!enabled)sound.stop();},
    setSparksEnabled(value){sparksRequested=!!value;if(!sparksRequested)clearEnemyArrivals();sparks?.setEnabled(enabled&&sparksRequested);},
    setEffectEnabled(id,value){vfx.setEffectEnabled(effectsByID.get(id),value);},
    setEffectOpacity(id,value){const e=effectsByID.get(id);if(e&&Number.isFinite(value))e.object.material.opacity=Math.max(0,Math.min(1,value));},
    setSparkKindEnabled:(kind,value)=>sparks?.setKindEnabled(kind,value),
    setSparkAdditionalAnchors:(kind,anchors)=>sparks?.setAdditionalAnchors(kind,anchors),
    setEmberAnchors:anchors=>sparks?.setAdditionalAnchors('embers',anchors),
    burstStrat:()=>sparks?.burstKind('electricLarge',10),
    flashExplosion(anchor=smokeZone,maxDistance=55,{size=[6,6],offset=[0,2,0],cinematic=false,emissiveFogScale=1,softness=0,opacity=1}={}){if(!disposed&&enabled)return vfx.add({asset:'explosion',anchor,offset,size,loop:false,maxDistance,cinematic,emissiveFogScale,softness,opacity});return null;},
    prepareBlastGlow(anchor){if(!disposed&&!blastGlow)blastGlow=vfx.addGlow(anchor);},
    prepareBlastExplosion(anchor,options){if(!disposed&&!blastWarmup)blastWarmup=vfx.prepareExplosion(anchor,options);},
    warmObjects:()=>[blastGlow?.object,blastWarmup].filter(Boolean),
    flashGlow(anchor){if(!disposed&&enabled){if(!blastGlow)blastGlow=vfx.addGlow(anchor);vfx.resetGlow(blastGlow,anchor,true);}return blastGlow;},
    setBlastLight:value=>vfx.setGlowStrength(blastGlow,value),
    clearBlastGlow(){vfx.resetGlow(blastGlow,null,false);},
    removeEffect:e=>vfx.remove(e),
    previewSparkBurst(){return sparks?.burst()||0;},
    update(dt,frame){if(disposed||!enabled)return;if(frame.mode==='playing')for(const h of arrivals){h.age+=dt;
      if(h.smoke){const t=Math.min(1,h.age/1.6),fade=Math.min(1,h.age/.18)*(1-t*t);h.smoke.object.material.opacity=.52*fade;h.smoke.offset.y=h.height*.45+h.age*.18;const grow=1+t*.25;h.smoke.object.scale.set(Math.max(1.2,h.radius*3)*grow,Math.max(1.3,h.height*1.25)*grow,1);}
      if(h.age>=1.6){vfx.remove(h.smoke);arrivals.delete(h);}}
    vfx.update(dt,{listener:frame.listener,playing:frame.mode==='playing'});updateParticleBudget();sound.update(dt,frame);sparks?.update(dt,frame);},
    async previewExplosion(anchor=smokeZone){
      if(disposed||!enabled)return null;const a=manifest.particles.find(a=>a.id==='explosion');if(!a)return null;
      try{await vfx.load(a,baseURL);if(disposed)return null;return vfx.add({asset:'explosion',anchor,offset:[0,2,0],size:[4,4],loop:false});}
      catch(e){errors.push('explosion: '+e.message);return null;}
    },
    dispose(){if(disposed)return;disposed=true;clearEnemyArrivals();sound.dispose();vfx.dispose();sparks?.dispose();vehicle.remove(fireAnchor,emberAnchor);},
    info:()=>({errors:[...errors],disposed,enabled,weakTargets,arrivals:arrivals.size,anchors:2+Object.values(sparkAnchors).filter(Boolean).length,vfx:vfx.info(),audio:sound.info(),sparks:sparks?.info()||null}),
  };
}
