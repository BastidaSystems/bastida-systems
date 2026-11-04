// Player-owned sounds use the existing effects bus/limiter, in both camera modes.
// Observe displacement AFTER collisions; never synthesize motion from buttons.
import {PLAYER_MOTION} from './player-step-timing.js?v=20261017-pace20';
export function createPlayerMovementAudio(audio){
  let ready=false,disposed=false,previous=null,distance=0,movingTime=0,phase='idle',sequence=0,breath=null;
  let lastFootfall=null;
  const mix={steps:.70,breathing:.70}; // Softer breathing; keep the approved footstep mix.
  const attackOffsets={a:.02,b:.05,c:.07,d:.08};
  const steps=new Set(),stats={steps:0,walkSteps:0,runSteps:0,cinematicSteps:0,errors:[]};
  function stop(){
    if(breath)audio.stopVoice(breath);breath=null;
    for(const v of steps)audio.stopVoice(v);steps.clear();
    previous=null;distance=0;movingTime=0;phase='idle';
  }
  function live(v){return v&&!v.stopped&&(v.loop||v.source.context.currentTime<v.movementEnds);}
  function setBreathing(volume){
    volume*=mix.breathing;
    if(breath&&!live(breath))breath=null;
    if(volume<=0){if(breath)audio.stopVoice(breath);breath=null;return;}
    if(!breath)breath=audio.playClip('env-player-breathing',{kind:'player-breathing',channel:'effects',loop:true,volume:0})||null;
    audio.setVoiceVolume(breath,volume,.25);
  }
  function step(running){
    const id=running?['c','d'][sequence++%2]:['a','b'][sequence++%2];
    if(steps.size>=2){const oldest=steps.values().next().value;audio.stopVoice(oldest);steps.delete(oldest);}
    const rate=running?1.06:1,offset=attackOffsets[id];
    const voice=audio.playClip('env-player-step-'+id,{kind:'player-step',channel:'effects',volume:(running?.65:.5)*mix.steps,rate,offset,loop:false});
    if(voice){voice.movementEnds=voice.source.context.currentTime+(voice.source.buffer.duration-offset)/rate;steps.add(voice);
      stats.steps++;stats[running?'runSteps':'walkSteps']++;}
  }
  function update(dt,{mode,position,grounded=true,blocked=false,hidden=false,footfall,locomotion,fatigue=0}={}){
    if(disposed||!ready||mode!=='playing'||hidden||!position||
      ![position.x,position.z,dt].every(Number.isFinite)||dt<=0){stop();return;}
    for(const v of steps)if(!live(v))steps.delete(v);
    if(blocked){
      // The quake has its own rumble/debris. Ordinary walking sounds do not fit this reaction.
      stop();
      return;
    }
    const old=previous;previous={x:position.x,z:position.z};
    if(!old){if(footfall)lastFootfall=footfall.sequence;return;}
    const moved=Math.hypot(position.x-old.x,position.z-old.z),speed=moved/dt;
    const tiredVolume=Number.isFinite(fatigue)&&fatigue>.15?Math.min(1,fatigue)*.8:0;
    // Teleports/restarts aren't footsteps. Real collisions and airborne travel are silent.
    if(!grounded||speed<.2||speed>10||dt>.15){
      if(footfall)lastFootfall=footfall.sequence;
      for(const v of steps)audio.stopVoice(v);steps.clear();
      distance=0;movingTime=0;phase='idle';setBreathing(tiredVolume);return;
    }
    phase=locomotion==='walk'||locomotion==='run'?locomotion:speed>(phase==='run'?PLAYER_MOTION.runExit:PLAYER_MOTION.runEnter)?'run':'walk';
    movingTime+=dt;distance+=moved;
    const running=phase==='run',stride=running?1.4685:.9265;
    const landed=footfall!==undefined?footfall&&footfall.sequence!==lastFootfall:distance>=stride;
    if(footfall)lastFootfall=footfall.sequence;
    if(landed){
      // At most one new footfall per frame; no burst of queued steps after a stall.
      distance%=stride;
      // The authored contact owns the sound, including the walk/run crossfade frame.
      step(footfall?.kind==='run'||(footfall?.kind!=='walk'&&running));
    }
    if(movingTime>=.25){
      setBreathing(Math.max(running?.8:.35,tiredVolume)*(running?.70:1));
    }
  }
  return {update,stop,
    async prepare(manifestURL='assets/audio/player-movement-v2/manifest.json'){
      try{const url=new URL(manifestURL,location.href),response=await fetch(url,{signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error('manifest');const manifest=await response.json();
        const loaded=await audio.loadClips(manifest.assets,new URL('./',url));
        if(disposed)return false;ready=true;if(loaded.some(ok=>!ok))stats.errors.push('Some player recordings unavailable');
        return true;
      }catch{stats.errors.push('Player audio unavailable; gameplay unchanged');return false;}
    },
    reset(){stop();sequence=0;lastFootfall=null;stats.steps=stats.walkSteps=stats.runSteps=stats.cinematicSteps=0;},
    dispose(){stop();disposed=true;},
    info:()=>({...stats,errors:[...stats.errors],ready,disposed,phase,movingTime,stepDistance:distance,
      activeSteps:[...steps].filter(live).length,breathing:!!live(breath),breathVolume:breath?.volume||0,
      maxVoices:3,channel:'effects'}),
  };
}
