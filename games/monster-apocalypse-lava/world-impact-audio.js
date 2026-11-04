import * as THREE from 'three';

// Acoustic reactions to the EXISTING nearest bullet hit. Never add colliders,
// recast enemies, consume combat RNG or change damage/Score/credits.
export async function installWorldImpactAudio({audio,cars=[],vehicles,props,posts,buildings,casinos,
  getMode,getBlocked=()=>false,getListener,manifestURL='assets/audio/world-impacts-v1/manifest.json'}){
  const response=await fetch(manifestURL,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('World impact manifest unavailable');
  const manifest=await response.json();
  await audio.loadClips(manifest.assets,new URL('./',new URL(manifestURL,location.href)));
  const targets=new Map(),records=[],voices=new Set(),events=[],local=new THREE.Vector3();
  const limits={voices:4,globalCooldown:.035,targetCooldown:.12,range:30};
  let clock=-Infinity,serial=0,disposed=false;
  function register(id,type,meshes,{classify,bulb,lamp,light}={}){
    const record={id,type,meshes:[...meshes],classify,bulb,lamp,light,last:-Infinity,broken:new Set(),
      saved:lamp?{emissive:lamp.material.emissiveIntensity,intensity:light.intensity}:null};
    records.push(record);for(const mesh of meshes)targets.set(mesh,record);return record;
  }
  // Cars already have separate lower-body/cabin proxies. Side glass is an
  // acoustic zone of the existing cracked cabin, not a destructible building.
  function cabinGlass(hit,record){
    const index=record.meshes.indexOf(hit.object);
    if(index!==1)return null;
    hit.object.worldToLocal(local.copy(hit.point));
    if(Math.abs(local.x)>.49&&Math.abs(local.z)<.34&&local.y>-.24&&local.y<.2)
      return 'window-'+(local.x<0?'left':'right');
    return null; // Roof, pillars, hood and chassis stay metal.
  }
  for(const [i,car]of cars.entries())if(car.loaded)
    register('CAR-'+i,'car',car.blockers,{classify:cabinGlass});
  for(const record of vehicles?.state.records||[])
    register(record.entry.id,'car',record.blockers);
  for(const [i,bin]of (props?.state.trash||[]).entries())
    register('BARREL-'+i,'barrel',[bin.mesh]);
  for(const [i,post]of (posts?.state.records||[]).entries()){
    register('POST-'+i,'post',post.blockers,{bulb:post.bulb.clone(),lamp:post.original.lamp,light:post.original.light,
      classify(hit,record){return hit.object===record.meshes[1]&&hit.point.distanceTo(record.bulb)<.7?'bulb':null;}});
  }
  // The real VEGAS arch and car barricade have named authored records; no
  // blanket "metal/glass" tag on every opaque building in the city.
  for(const record of buildings?.state.records||[]){
    if(record.entry.id==='VEGAS-AC')register(record.entry.id,'sign',record.blockers);
    if(record.entry.id==='BARRIER-CE')register(record.entry.id,'car',record.blockers);
  }
  // Neon tubes are actual existing geometry. Bounds are used only to reject
  // obviously distant hits before a small, on-impact detail intersection.
  const neons=(casinos?.state.records||[]).filter(r=>r.neon).map(r=>({
    record:register('CASINO-NEON-'+r.def.id,'sign',[r.neon.tubes]),
    tubes:r.neon.tubes,bounds:new THREE.Box3().setFromObject(r.neon.tubes,true).expandByScalar(.08),
  }));
  function stop(){for(const voice of voices)audio.stopVoice(voice);voices.clear();}
  function reset(){
    stop();clock=-Infinity;serial=0;events.length=0;
    for(const record of records){record.last=-Infinity;record.broken.clear();
      if(record.saved){record.lamp.material.emissiveIntensity=record.saved.emissive;record.light.intensity=record.saved.intensity;}}
  }
  function impact(hit,{raycaster,now=performance.now()/1000}={}){
    if(disposed||getMode()!=='playing'||getBlocked()||!hit?.point||!Number.isFinite(now)||
      ![hit.point.x,hit.point.y,hit.point.z].every(Number.isFinite)||now-clock<limits.globalCooldown)return false;
    let record=targets.get(hit.object);
    if(raycaster)for(const neon of neons){
      if(!raycaster.ray.intersectsBox(neon.bounds))continue;
      const detail=raycaster.intersectObject(neon.tubes,false)[0];
      // Respect the current nearest blocker: never trigger through an occluding car/wall.
      if(detail&&detail.distance<=hit.distance+.12){record=neon.record;break;}
    }
    if(!record||now-record.last<limits.targetCooldown)return false;
    const listener=getListener();if(!listener||hit.point.distanceTo(listener)>=limits.range)return false;
    const zone=record.classify?.(hit,record),first=zone&&!record.broken.has(zone);
    let clip='metal-'+record.type,volume=.25;
    if(first&&zone==='bulb'){
      record.light.intensity=0;record.lamp.material.emissiveIntensity=0;
      clip='glass-bulb';volume=.3;
    }else if(first&&zone.startsWith('window-')){clip='glass-window';volume=.25;}
    if(first)record.broken.add(zone);
    record.last=clock=now;
    for(const voice of voices)if(voice.stopped)voices.delete(voice);
    // One-shot lifetime callbacks from the shared audio engine don't mark natural
    // ends stopped; bound our bookkeeping by actual AudioContext duration as well.
    for(const voice of voices)if(voice.source.context.currentTime>=voice.impactEnds)voices.delete(voice);
    if(voices.size>=limits.voices){const oldest=voices.values().next().value;audio.stopVoice(oldest);voices.delete(oldest);}
    const rate=[.97,1,1.025,1.01][serial++%4];
    const voice=audio.playClip('env-impact-'+clip,{kind:'world-impact',channel:'effects',volume,rate,
      anchor:hit.point.clone(),refDistance:3,range:limits.range,listener});
    if(voice){voice.impactEnds=voice.source.context.currentTime+voice.source.buffer.duration/rate;voices.add(voice);}
    events.push({id:record.id,type:record.type,zone:zone||null,clip,played:!!voice,position:hit.point.toArray()});
    if(events.length>32)events.shift();
    return true;
  }
  return {impact,stop,reset,dispose(){reset();disposed=true;targets.clear();},
    soundOnly(hit){const record=targets.get(hit?.object);if(!record||!hit?.point)return false;
      const zone=record.classify?.(hit,record);return zone==='bulb'||!!zone?.startsWith('window-');},
    info:()=>({disposed,limits:{...limits},targets:records.map(r=>({id:r.id,type:r.type,proxies:r.meshes.length,broken:[...r.broken],bulb:r.bulb?.toArray()})),
      events:events.map(e=>({...e,position:[...e.position]})),missing:manifest.missing,
      loaded:audio.info().buffers.filter(b=>b.id.startsWith('env-impact-')).length}),
  };
}
