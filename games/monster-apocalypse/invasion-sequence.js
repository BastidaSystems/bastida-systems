// One active-play clock; no timers, AI randomness, player writes or Score rules.
export const INVASION_SECONDS=10;
export const INVASION_TIMING=Object.freeze({explosion:4,shakeDelay:3,shakeDuration:2.8});
export function sampleQuakeShake(t,duration,strength=1){
 if(t<0||t>=duration)return [0,0,0];const envelope=Math.max(0,1-t/duration)**2*strength;
 return [((Math.sin(t*67)+.45*Math.sin(t*23+.4))*.026+.006*Math.sin(t*9))*envelope,((Math.sin(t*47+.2)+.6*Math.sin(t*13))*.040+.007*Math.sin(t*11))*envelope,(Math.sin(t*31)*.018+.003*Math.sin(t*7))*envelope];
}
export const INVASION_CUES=Object.freeze([
 {id:'city',at:0},{id:'helicopter',at:2},{id:'gunfire',at:3},
 {id:'explosion',at:INVASION_TIMING.explosion},{id:'debris',at:7},{id:'fire',at:8},{id:'settle',at:9},
]);
export function createInvasionSequence({event=()=>{},number=()=>{},complete=()=>{},pauseAudio=()=>{},reducedMotion=()=>false}={}){
 let run=null,phase='idle',elapsed=0,paused=false,lastNumber=null,events=[],numbers=[],ageAfter=0,blastElapsed=null;
 const fired=new Set();
 function emit(){for(const cue of INVASION_CUES)if(cue.at<=elapsed+1e-8&&!fired.has(cue.id)){fired.add(cue.id);events.push({...cue});if(cue.id==='explosion')blastElapsed=elapsed-cue.at<2?elapsed:cue.at;event(cue,Math.max(0,elapsed-cue.at));}}
 function count(){const value=Math.max(0,Math.ceil(INVASION_SECONDS-elapsed-1e-8));if(value!==lastNumber){lastNumber=value;numbers.push(value);number(value);}}
 return {
  get active(){return phase==='countdown';},
  begin(key){if(key==null||key===run)return false;pauseAudio();run=key;phase='countdown';elapsed=ageAfter=0;blastElapsed=null;paused=false;lastNumber=null;events=[];numbers=[];fired.clear();emit();count();return true;},
  update(dt,{playing=true,visible=true}={}){if(!playing||!visible||paused||!Number.isFinite(dt)||dt<0)return;if(phase==='done'){ageAfter+=dt;return;}if(phase!=='countdown')return;
   elapsed=Math.min(INVASION_SECONDS,elapsed+dt);emit();count();if(elapsed>=INVASION_SECONDS-1e-8){elapsed=INVASION_SECONDS;phase='done';complete();}
  },
  pause(){paused=true;pauseAudio();},resume(){paused=false;},
  cancel(){pauseAudio();phase='idle';paused=false;ageAfter=0;blastElapsed=null;},
  blastLight(){if(!['countdown','done'].includes(phase)||blastElapsed===null)return 0;
   const t=elapsed-blastElapsed+ageAfter;if(t<0||t>=1.6)return 0;
   const reduced=reducedMotion(),attack=Math.min(1,t/(reduced ? .22 : .07));
   return attack*Math.max(0,1-t/1.6)**2*(reduced ? .3 : 1);},
  dust(){if(!['countdown','done'].includes(phase)||blastElapsed===null)return 0;
   const t=elapsed-blastElapsed+ageAfter,smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
   // Three full active seconds separate the veiled blast from shake and dust.
   return smooth((t-INVASION_TIMING.shakeDelay)/(reducedMotion() ? 1 : .6))*(1-smooth((t-4.5)/3));},
  shake(){if(phase!=='countdown'||paused||reducedMotion()||blastElapsed===null)return [0,0,0];const start=blastElapsed+INVASION_TIMING.shakeDelay;if(elapsed<start)return [0,0,0];const t=elapsed-start,duration=Math.max(.1,Math.min(INVASION_TIMING.shakeDuration,INVASION_SECONDS-start));
   return sampleQuakeShake(t,duration);},
  info:()=>({run,phase,elapsed,paused,remaining:lastNumber,ageAfter,blastElapsed,shakeAt:blastElapsed===null?null:blastElapsed+INVASION_TIMING.shakeDelay,events:events.map(c=>({...c})),numbers:[...numbers]}),
 };
}
