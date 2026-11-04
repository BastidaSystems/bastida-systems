// Recorded effects observe gameplay; they never write to enemy/player state or AI randomness.
export function createGameAudioSystem({getMode,enemyAudio=true}) {
  const state={ready:false,downloaded:false,total:0,loaded:0,errors:[],events:{},recent:[],maxVoices:0};
  const buffers=new Map(),raw=new Map(),voices=new Set(),tracked=new Map();
  const channels=new Map(),levels={ambience:1,music:1,effects:1},clipTasks=new Map();
  let preloadTask,decodeTask,context,master,limiter,ambient,playerHurtVoice,lastMode='menu',sequence=0,reloadSequence=0,groundVoiceSequence=0;
  function preload(){if(preloadTask)return preloadTask;preloadTask=(async()=>{
    try {const r=await fetch('assets/audio/manifest.json?v=20261017-continuous71');if(!r.ok)throw new Error('Audio manifest '+r.status);
      const manifest=await r.json();const assets=manifest.assets.filter(a=>enemyAudio||['shot','reloadA','reloadB','playerHurt'].includes(a.id));state.total=assets.length;
      await Promise.allSettled(assets.map(async a=>{try{const response=await fetch('assets/audio/'+a.path+'?v=20261017-continuous71');
        if(!response.ok)throw new Error(response.status);raw.set(a.id,await response.arrayBuffer());}
        catch(e){state.errors.push(a.id+': '+e.message);}}));state.downloaded=true;
    }catch(e){state.errors.push(e.message);state.downloaded=true;}
  })();return preloadTask;}
  function unlock(ac){context=ac;
    if(ac.state!=='running'&&ac.state!=='closed')ac.resume().catch(()=>{});
    if(decodeTask)return decodeTask;
    master=ac.createGain();master.gain.value=.85;limiter=ac.createDynamicsCompressor();
    limiter.threshold.value=-6;limiter.knee.value=12;limiter.ratio.value=4;limiter.attack.value=.003;limiter.release.value=.18;
    const safety=ac.createWaveShaper(),curve=new Float32Array(2049);
    for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);
      curve[i]=Math.sign(x)*(a<=.8?a:.8+.18*Math.tanh((a-.8)/.18));}
    safety.curve=curve;safety.oversample='2x';master.connect(limiter);limiter.connect(safety);safety.connect(ac.destination);
    for(const name of Object.keys(levels)){const bus=ac.createGain();bus.gain.value=levels[name];bus.connect(master);channels.set(name,bus);}
    decodeTask=(async()=>{await preload();await Promise.allSettled([...raw].map(async([id,data])=>{
      try{buffers.set(id,await ac.decodeAudioData(data.slice(0)));}catch(e){state.errors.push(id+': decode '+e.message);}
    }));raw.clear();state.loaded=buffers.size;state.ready=true;})();return decodeTask;
  }
  function ended(v){voices.delete(v);v.source.disconnect();v.envelope?.disconnect();v.gain.disconnect();v.pan?.disconnect();v.panner?.disconnect();if(ambient===v)ambient=null;if(playerHurtVoice===v)playerHurtVoice=null;}
  function stop(v){if(v.stopped)return;v.stopped=true;const now=context.currentTime;
    v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.006);
    try{v.source.stop(now+.035);}catch(e){/* already ended */}}
  function stopEntity(entity){for(const v of voices)if(v.entity===entity)stop(v);}
  function stopAll(){for(const v of voices)stop(v);ambient=null;}
  function spatial(v,listener,yaw){
    if(v.anchor){const p=v.anchor.position||v.anchor;
      if(![p.x,p.y,p.z].every(Number.isFinite)){stop(v);return;}
      const distance=Math.hypot(p.x-listener.x,p.y-listener.y,p.z-listener.z);
      // Inverse 3D attenuation plus a smooth hard-range tail; distant anchors are actually silent.
      v.gain.gain.setTargetAtTime(v.volume*Math.max(0,Math.min(1,(v.range-distance)/(v.range*.2))),context.currentTime,.08);
      if(v.panner.positionX){v.panner.positionX.value=p.x;v.panner.positionY.value=p.y;v.panner.positionZ.value=p.z;}
      else v.panner.setPosition(p.x,p.y,p.z);
      return;
    }
    if(!v.entity)return;const p=v.entity.g.position,dx=p.x-listener.x,dz=p.z-listener.z;
    const distance=Math.hypot(dx,dz,p.y-listener.y),falloff=Math.max(0,1-distance/v.range)**2;
    v.gain.gain.setTargetAtTime(v.volume*falloff,context.currentTime,.035);
    v.pan?.pan.setTargetAtTime(Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,distance))),context.currentTime,.035);
  }
  function play(id,{kind=id,volume=.3,rate=1,entity=null,anchor=null,channel='effects',range=36,refDistance=2,offset=0,loop=false,listener,yaw=0,duration}={}){
    const buffer=buffers.get(id);if(entity&&entity.type!=='monster'&&entity.type!=='zombie'&&!['floatRoar','floatVoice'].includes(id)&&!(entity.explosiveLab&&id==='alertScream'&&kind==='alert'))return false;
    if(!buffer||!master||getMode()!=='playing'||context.state!=='running')return false;
    if(!Number.isFinite(offset)||offset<0||!loop&&offset>=buffer.duration)return false;
    if(duration!==undefined&&(!Number.isFinite(duration)||duration<=.02||!Number.isFinite(rate)||rate<=0||loop))return false;
    const current=[...voices].filter(v=>!v.stopped);
    const group=current.filter(v=>kind==='shot'?v.kind==='shot':v.kind!=='shot'&&!v.loop);
    // Crowd effects may yield a slot; never cut the player's current recovery voice.
    if(group.length>=(kind==='shot'?12:10)){const victim=group.find(v=>v.kind!=='playerHurt');if(victim)stop(victim);}
    if(entity&&(kind==='pain'||kind==='death'))stopEntity(entity);
    else if(entity)for(const v of current)if(v.entity===entity&&v.kind===kind)stop(v);
    const source=context.createBufferSource(),gain=context.createGain(),pan=anchor?null:context.createStereoPanner?.(),panner=anchor?context.createPanner():null;
    source.buffer=buffer;source.playbackRate.value=rate;source.loop=loop;gain.gain.value=entity||anchor?0:volume;
    const output=channels.get(channel)||channels.get('effects');
    const span=duration===undefined?null:Math.min(duration,(buffer.duration-offset)/rate);
    const envelope=span===null?null:context.createGain();
    if(envelope){
      const now=context.currentTime,attack=Math.min(.006,span*.25),release=Math.min(.04,span*.5);
      envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(1,now+attack);
      envelope.gain.setValueAtTime(1,now+span-release);envelope.gain.linearRampToValueAtTime(0,now+span);
      source.connect(envelope);envelope.connect(gain);
    }else source.connect(gain);
    if(panner){panner.panningModel='equalpower';panner.distanceModel='inverse';panner.refDistance=Number.isFinite(refDistance)?Math.max(1,Math.min(35,refDistance)):2;panner.maxDistance=range;panner.rolloffFactor=1;gain.connect(panner);panner.connect(output);}
    else if(pan){gain.connect(pan);pan.connect(output);}else gain.connect(output);
    const v={id,kind,source,gain,envelope,pan,panner,entity,anchor,channel,range,volume,loop,stopped:false};voices.add(v);source.onended=()=>ended(v);
    if(listener)spatial(v,listener,yaw);source.start(0,loop?offset%buffer.duration:offset);
    if(span!==null)source.stop(context.currentTime+span);
    state.events[kind]=(state.events[kind]||0)+1;state.recent.push({id,kind,rate,volume,spatial:!!(entity||anchor),...(span===null?{}:{duration:span})});if(state.recent.length>48)state.recent.shift();
    state.maxVoices=Math.max(state.maxVoices,[...voices].filter(v=>!v.stopped).length);return v;
  }
  function groundVocal(legacy,options){
    if(!buffers.has('enemy1'))return play(legacy,options);
    // Use bounded excerpts of the supplied recording, never 16 seconds per nearby enemy.
    const voice=options.kind==='voice',roar=options.kind==='roar';
    return play('enemy1',{...options,
      rate:1,offset:voice?(groundVoiceSequence++%4)*3:roar?0:.14,
      duration:roar?2.4:voice?2:options.duration,
    });
  }
  function update(dt,now,listener,yaw,enemies){
    const mode=getMode();if(mode!=='playing'){if(lastMode==='playing')stopAll();lastMode=mode;return;}lastMode=mode;
    if(!state.ready||!context||context.state!=='running')return;
    const audibleEnemies=enemies.filter(e=>e.type==='monster'||e.type==='zombie');
    const present=new Set(enemies);
    for(const entity of enemies.filter(e=>!audibleEnemies.includes(e))){
      const s=entity.state.toLowerCase(),distance=Math.hypot(entity.g.position.x-listener.x,entity.g.position.z-listener.z);
      let t=tracked.get(entity);if(!t){t={state:s,nextVoice:now+7,lastRoar:-99};tracked.set(entity,t);}
      if(s==='death'||s==='dead'){stopEntity(entity);}
      else if(entity.explosiveLab&&s==='alert'){
        if(distance<36&&entity.arrivalLeft>.02&&(!t.alertVoice||t.alertVoice.stopped))t.alertVoice=play('alertScream',{kind:'alert',entity,volume:.38,range:36,listener,yaw,offset:Math.max(0,entity.stateT||0),duration:entity.arrivalLeft})||null;
        t.lastRoar=now;t.nextVoice=now+7;
      }
      else if(distance<36){
        if(t.lastRoar===-99||(s==='attack'&&t.state!=='attack'&&now-t.lastRoar>5)){
          play('floatRoar',{kind:'floatRoar',entity,volume:.32,range:36,listener,yaw});t.lastRoar=now;t.nextVoice=now+7;
        }else if(now>=t.nextVoice&&s!=='hurt'&&s!=='attack'){
          play('floatVoice',{kind:'floatVoice',entity,volume:.25,range:32,listener,yaw});t.nextVoice=now+8;
        }
      }
      t.state=s;
    }
    let nearest=null,nearestDistance=25;
    for(const entity of audibleEnemies){const p=entity.g.position,s=entity.state.toLowerCase(),dead=s==='dead'||s==='death';
      const distance=Math.hypot(p.x-listener.x,p.z-listener.z);let t=tracked.get(entity),fresh=!t;
      if(!t){t={state:s,hp:entity.hp,struck:false,x:p.x,z:p.z,walk:0,nextVoice:now+2+(sequence++%4),lastRoar:-99};tracked.set(entity,t);}
      if(dead){if(t.state!=='dead'&&t.state!=='death')groundVocal('roarB',{kind:'death',entity,volume:.22,rate:.8,offset:.14,duration:.30,listener,yaw});}
      else {
        if(entity.hp<t.hp){
          // Short reactions from the selected enemy voice; rapid hits never restart every bullet.
          if(now-(t.lastPain??-Infinity)>=.45){groundVocal('roarB',{kind:'pain',entity,volume:.20,rate:.85,offset:.14,duration:.22,listener,yaw});t.lastPain=now;}
          t.nextVoice=now+4;
        }
        else if(s==='alert'&&(!t.alertVoice||t.alertVoice.stopped)){
          // Start with the animation. Pausing stops voices; resume from its
          // current pose rather than replaying the beginning of the scream.
          t.alertVoice=play('alertScream',{kind:'alert',entity,volume:.38,range:36,listener,yaw,offset:Math.max(0,entity.stateT||0)})||null;
          t.lastRoar=now;t.nextVoice=now+9;
        }
        else if(s!=='alert'&&distance<36&&(fresh||s==='chase'&&['idle','patrol','search'].includes(t.state))&&now-t.lastRoar>3){
          const id=entity.variant==='bruto'?'roarHuge':['roarA','roarB','roarC'][sequence++%3];
          groundVocal(id,{kind:'roar',entity,volume:.38,listener,yaw});t.lastRoar=now;t.nextVoice=now+6;
        }
        if(s==='attack'&&entity.struck&&!t.struck)play('bite',{kind:'attack',entity,volume:.45,range:22,listener,yaw});
        if(distance<28&&now>=t.nextVoice&&s!=='hurt'&&s!=='attack'&&s!=='alert'){
          groundVocal(s==='idle'?'breath':['roarA','roarB','roarC'][sequence++%3],{kind:'voice',entity,volume:.22,range:30,listener,yaw});
          t.nextVoice=now+5+(sequence++%4);
        }
        const travelled=Math.hypot(p.x-t.x,p.z-t.z);if(['chase','search','idle'].includes(s)&&travelled<2){
          t.walk+=travelled;if(t.walk>1.6){if(distance<20)play('step',{kind:'step',entity,volume:.23,range:22,rate:entity.type==='zombie'?1.12:.95,listener,yaw});t.walk%=1.6;}}
        if((s==='chase'||s==='attack')&&distance<nearestDistance){nearest=entity;nearestDistance=distance;}
      }
      Object.assign(t,{state:s,hp:entity.hp,struck:entity.struck,x:p.x,z:p.z});
    }
    for(const entity of tracked.keys())if(!present.has(entity)){stopEntity(entity);tracked.delete(entity);}
    if(nearest){if(!ambient||ambient.stopped)ambient=play('stalk',{kind:'stalk',volume:.035,range:25,entity:nearest,loop:true,listener,yaw})||null;
      if(ambient)ambient.entity=nearest;
    }else if(ambient){stop(ambient);ambient=null;}
    for(const v of voices)if(!v.stopped&&(v.entity||v.anchor))spatial(v,listener,yaw);
  }
  async function loadClips(assets,baseURL){
    await preload();if(decodeTask)await decodeTask;
    return Promise.all(assets.map(asset=>{
      if(!/^env-[a-z0-9-]+$/.test(asset.id))return Promise.resolve(false);
      if(clipTasks.has(asset.id))return clipTasks.get(asset.id);
      const task=(async()=>{try{
        const response=await fetch(new URL(asset.path,baseURL),{signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error('HTTP '+response.status);
        const data=await response.arrayBuffer();if(data.byteLength>4*1024*1024)throw Error('Clip exceeds mobile budget');
        if(context)buffers.set(asset.id,await context.decodeAudioData(data));else raw.set(asset.id,data);
        state.loaded=buffers.size;return true;
      }catch{state.errors.push(asset.id+': unavailable environmental audio');return false;}})();
      clipTasks.set(asset.id,task);return task;
    }));
  }
  function setListener(position,forward,up={x:0,y:1,z:0}){
    if(!context||![position.x,position.y,position.z,forward.x,forward.y,forward.z,up.x,up.y,up.z].every(Number.isFinite))return;
    const l=context.listener;
    if(l.positionX){for(const [prefix,v] of [['position',position],['forward',forward],['up',up]])for(const key of ['x','y','z'])l[prefix+key.toUpperCase()].value=v[key];}
    else{l.setPosition(position.x,position.y,position.z);l.setOrientation(forward.x,forward.y,forward.z,up.x,up.y,up.z);}
  }
  return {state,preload,unlock,update,
    loadClips,setListener,
    playClip:play,stopVoice:v=>{if(v&&!v.stopped)stop(v);},
    setVoiceVolume(v,value,transition=.4){if(v&&!v.stopped&&Number.isFinite(value)){v.volume=Math.max(0,Math.min(1,value));if(!v.anchor)v.gain.gain.setTargetAtTime(v.volume,context.currentTime,Math.max(.01,Math.min(.4,transition)));}},
    setVolumes(values){for(const name of Object.keys(levels))if(Number.isFinite(values[name])){levels[name]=Math.max(0,Math.min(1,values[name]));if(context&&channels.has(name))channels.get(name).gain.setTargetAtTime(levels[name],context.currentTime,.06);}},
    output:name=>channels.get(name)||master,
    waveComplete:()=>!!play('waveComplete',{kind:'waveComplete',volume:.42}),
    shot:()=>!!play('shot',{kind:'shot',volume:.75}),
    playerHurt({strong=false}={}){
      if(getMode()!=='playing'||context?.state!=='running')return false;
      if(playerHurtVoice&&!playerHurtVoice.stopped&&voices.has(playerHurtVoice)){
        // Damage keeps its feedback, but the recording continues from its current sample.
        if(strong&&playerHurtVoice.volume<.62){playerHurtVoice.volume=.62;playerHurtVoice.gain.gain.setTargetAtTime(.62,context.currentTime,.04);}
        return true;
      }
      playerHurtVoice=play('playerHurt',{kind:'playerHurt',volume:strong?.62:.46});return !!playerHurtVoice;
    },
    reload(duration){const id=reloadSequence++%2?'reloadB':'reloadA',buffer=buffers.get(id);return !!play(id,{kind:'reload',volume:.65,rate:buffer?Math.max(1,buffer.duration/duration):1});},
    reset(){stopAll();tracked.clear();groundVoiceSequence=0;},
    info(){return {...state,errors:[...state.errors],events:{...state.events},recent:[...state.recent],context:context?.state||'locked',
      activeVoices:[...voices].filter(v=>!v.stopped).length,activeLoops:[...voices].filter(v=>!v.stopped&&v.loop).length,
      trackedEnemies:tracked.size,volumes:{...levels},decodedBytes:[...buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0),
      spatialAnchors:[...voices].filter(v=>!v.stopped&&v.anchor).map(v=>({id:v.id,range:v.range,volume:v.volume,gain:v.gain.gain.value})),
      mixVoices:[...voices].filter(v=>!v.stopped).map(v=>({id:v.id,channel:v.channel,target:v.volume,gain:v.gain.gain.value})),
      buffers:[...buffers].map(([id,b])=>({id,duration:b.duration,channels:b.numberOfChannels,rate:b.sampleRate}))};},
  };
}
