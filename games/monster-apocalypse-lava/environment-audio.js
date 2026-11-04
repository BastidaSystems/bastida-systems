// Environmental orchestration only. Context, decoding, limiter, buses and voices belong to game-audio.js.
export function createEnvironmentAudio(audio,{fireAnchor,additionalFireAnchors=[],volumes={ambience:.55,music:.32,effects:1}}={}){
  const voices=new Map();let lastPhase=null,disposed=false;
  const fires=[fireAnchor,...additionalFireAnchors].filter(Boolean).map(anchor=>({anchor,position:anchor.position.clone()}));
  audio.setVolumes(volumes);
  function stop(){for(const v of voices.values())audio.stopVoice(v);voices.clear();lastPhase=null;}
  function ensure(key,id,options){
    const previous=voices.get(key);if(previous&&!previous.stopped)return previous;
    const v=audio.playClip(id,options);if(v)voices.set(key,v);return v;
  }
  return {
    update(dt,{mode,phase='explore',listener,forward,up}={}){
      if(disposed)return;
      if(mode!=='playing'){stop();return;}
      audio.setListener(listener,forward,up);
      for(const [i,fire]of fires.entries()){
        if(fire.anchor.userData?.environmentAudioEnabled===false){const v=voices.get('fire-'+i);if(v)audio.stopVoice(v);voices.delete('fire-'+i);continue;}
        fire.anchor.getWorldPosition(fire.position);
        ensure('fire-'+i,'env-fire',{kind:i===0?'environment-fire':'environment-fire-'+i,channel:'effects',anchor:fire.position,range:32,volume:.25,loop:true,listener});}
      const strat=fires.find(f=>f.anchor.userData?.environmentStructure);
      if(strat&&strat.anchor.userData.environmentAudioEnabled!==false)ensure('structure','env-intro-debris',{kind:'environment-structure',channel:'effects',anchor:strat.position,range:35,volume:.055,loop:true,listener});
      else if(voices.has('structure')){audio.stopVoice(voices.get('structure'));voices.delete('structure');}
      const oldCity=voices.get('city'),oldMusic=voices.get('wave');
      const city=ensure('city','env-city',{kind:'environment-city',channel:'ambience',volume:phase==='invasion'?0:phase==='active'?.07:.13,loop:true});
      const music=ensure('wave','env-wave',{kind:'environment-wave',channel:'music',volume:0,loop:true});
      // Gain automation crossfades continuously without stopping/restarting loops on every phase change.
      if(phase!==lastPhase||city!==oldCity||music!==oldMusic){
        audio.setVoiceVolume(city,phase==='invasion'?0:phase==='active'?.07:.13);
        audio.setVoiceVolume(music,phase==='active'?.18:0);lastPhase=phase;
      }
    },
    stop,dispose(){stop();disposed=true;},
    info:()=>({phase:lastPhase,voices:[...voices.values()].filter(v=>!v.stopped).length}),
  };
}
