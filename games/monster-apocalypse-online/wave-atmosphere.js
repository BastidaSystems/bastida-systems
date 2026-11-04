import * as THREE from 'three';

const SWEEP_SECONDS=8;
const smooth=t=>t*t*(3-2*t);
function createSweep(){
  if(typeof document==='undefined')return null;
  const overlay=document.createElement('div');overlay.id='wave-night-sweep';
  overlay.setAttribute('aria-hidden','true');overlay.hidden=true;
  // Canvas only: the HUD, menus and controls retain their own contrast and touch.
  overlay.style.cssText='position:fixed;inset:0;z-index:1;pointer-events:none;';
  document.getElementById('game-canvas').after(overlay);return overlay;
}

// Presentation only: no wave, enemy, player or Score writes.
export function createWaveAtmosphere({scene,keyLight,fillLight,storm,audio,onWeatherChange=()=>{}}){
  const flashlight=new THREE.SpotLight(0xffedce,0,30,Math.PI/7,.65,1.5);
  flashlight.name='Linterna de Julián';flashlight.castShadow=false;
  const target=new THREE.Object3D();target.name='Objetivo de linterna';flashlight.target=target;
  const forward=new THREE.Vector3(0,0,-1),right=new THREE.Vector3();
  scene.add(flashlight,target); // Stable light count: intensity zero outside wave two.
  let active=false,saved=null,voice=null,elapsed=0,ready=false,error=null,duration=0;
  let lastMode='menu',starts=0,voiceOffset=0,voiceStartedAt=0;
  let mix=0,transition=null;const nightFog=new THREE.Color(0x030508),overlay=createSweep();
  const audioTime=()=>audio.output('ambience')?.context.currentTime||0;
  function syncElapsed(){if(voice)elapsed=Math.min(duration,voiceOffset+Math.max(0,audioTime()-voiceStartedAt));}
  const cue='env-wave-two';
  function stop(){if(voice){syncElapsed();audio.stopVoice(voice);}voice=null;}
  function applyMix(){
    if(saved){
      keyLight.intensity=saved.key*(1-.955*mix);fillLight.intensity=saved.fill*(1-.965*mix);
      scene.fog.color.copy(saved.fog).lerp(nightFog,mix);
      if(!transition&&mix===0)saved=null;
    }
    onWeatherChange();
  }
  function setWave(number,phase){
    const next=number===2&&phase==='active',reset=number===0||number===1;
    if(next===active&&(!reset||!transition&&mix===0))return;
    storm.suspend();stop();active=next;
    if(active){
      if(!saved)saved={key:keyLight.intensity,fill:fillLight.intensity,fog:scene.fog.color.clone()};
      elapsed=0;
    }
    if(reset){mix=0;transition=null;flashlight.intensity=0;if(overlay)overlay.hidden=true;applyMix();return;}
    transition={from:mix,to:next?1:0,elapsed:0};
    applyMix();
  }
  async function prepare(){
    const result=await audio.loadClips([{id:cue,path:'assets/audio/wave-two/nivel2.mp3'}],new URL('./',location.href));
    ready=result[0]===true;
    if(ready)duration=audio.info().buffers.find(b=>b.id===cue)?.duration||0;
    else error='No se pudo cargar nivel2.mp3';
    return ready;
  }
  function aim(position,direction){
    if(flashlight.intensity<=0)return;
    // The source must stay in front of the head, not inside the hair. Ignore
    // vertical look for the mount, so pitching the camera cannot pull it back.
    if(direction.x*direction.x+direction.z*direction.z>1e-6)forward.set(direction.x,0,direction.z).normalize();
    right.set(-forward.z,0,forward.x);
    flashlight.position.copy(position).addScaledVector(forward,1.05).addScaledVector(right,.16);
    flashlight.position.y+=.03;
    target.position.copy(flashlight.position).addScaledVector(direction,20);target.updateMatrixWorld();
  }
  function update(dt,{mode,hidden=false,position,direction}){
    const visible=mode==='playing'&&!hidden;
    if(transition&&visible){
      transition.elapsed=Math.min(SWEEP_SECONDS,transition.elapsed+Math.max(0,Math.min(.25,dt)));
      const progress=transition.elapsed/SWEEP_SECONDS;
      mix=THREE.MathUtils.lerp(transition.from,transition.to,smooth(progress));
      if(progress===1){mix=transition.to;transition=null;}
      applyMix();
    }
    if(overlay){
      const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      overlay.hidden=!transition||!visible||!!reduced;
      if(!overlay.hidden){
        const progress=transition.elapsed/SWEEP_SECONDS,edge=112-progress*124;
        const tint='rgba(0,2,5,'+(.55*Math.sin(Math.PI*progress)).toFixed(4)+')';
        overlay.style.background=transition.to===1
          ?`linear-gradient(to right,transparent ${edge-18}%,${tint} ${edge+18}%)`
          :`linear-gradient(to right,${tint} ${edge-18}%,transparent ${edge+18}%)`;
      }
    }
    const playing=active&&visible;
    flashlight.intensity=visible?22*mix:0;
    if(visible&&mix>0&&position&&direction)aim(position,direction);
    if(playing){
      if(ready&&!duration)duration=audio.info().buffers.find(b=>b.id===cue)?.duration||0;
      syncElapsed();if(voice?.stopped)voice=null;
      if(ready&&elapsed<duration){
        if(!voice){voice=audio.playClip(cue,{kind:cue,channel:'ambience',volume:.48,offset:elapsed})||null;if(voice){starts++;voiceOffset=elapsed;voiceStartedAt=audioTime();}}
        // Locked audio does not consume the cue. The shared audio clock keeps
        // resume offsets exact even if rendering slows down.
      }
    }else stop();
    lastMode=mode;
  }
  return {prepare,setWave,update,aim,suspend(){stop();flashlight.intensity=0;if(overlay)overlay.hidden=true;},get active(){return active;},
    get rainAmount(){return 1-mix;},get suppressStorm(){return active||mix>0;},flashlight,
    info:()=>({active,mix,rainAmount:1-mix,rainEnabled:mix<1,transition:transition?{...transition,duration:SWEEP_SECONDS,direction:'right-to-left'}:null,ready,error,duration,elapsed,starts,mode:lastMode,
      flashlight:{enabled:flashlight.intensity>0,intensity:flashlight.intensity,range:flashlight.distance,position:flashlight.position.toArray(),target:target.position.toArray()}})};
}
