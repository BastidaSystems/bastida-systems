// Pure timeline shared by the existing actor. No timers, physics or extra mixer.
// Skip the static tail of the fall and the prone hold at the start of Stand Up.
// The original complete assets are retained; moving portions play at 1x.
export const PLAYER_ACTIONS=Object.freeze({fallEnd:1.6,riseStart:.85,riseEnd:3.5,transition:.16,jumpFlight:.7});
export const HIT_BY_ATTACK=Object.freeze({attack2:'hit1',attack2Mirror:'hit2'});
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function createPlayerActionPose(){
 let kind=null,age=0,heading=0,events=0,wasGrounded=true,jumping=false,jumpAge=0,landing=0;
 const C=PLAYER_ACTIONS,riseDuration=C.riseEnd-C.riseStart,total=C.fallEnd+riseDuration;
 function info(){
  const rising=!!kind&&age>=C.fallEnd,done=age>=total;
  const blend=rising?smooth((age-C.fallEnd)/C.transition):0;
  return {active:!!kind&&!done,kind,age,heading,events,phase:!kind?'idle':rising?'standUp':'fall',
   clip:kind,time:Math.min(age,C.fallEnd),weight:kind&&!done?smooth(age/.08)*smooth((total-age)/.18):0,
   riseTime:C.riseStart+Math.max(0,age-C.fallEnd),riseBlend:blend,
   // Jump.fbx includes running lead-in/out. Use its actual hop, not a 4x-speed run.
   jumping,jumpAge,landing,jumpTime:34/30+Math.min(1,jumpAge/C.jumpFlight)*20/30,
   jumpWeight:jumping?smooth(jumpAge/.07)*(landing>0?smooth(landing/.12):1):0};
 }
 return {
  hit({attack,heading:yaw=0}={}){
   const next=HIT_BY_ATTACK[attack];if(!next||kind||!Number.isFinite(yaw))return false;
   kind=next;heading=yaw+Math.PI;age=0;events++;jumping=false;landing=0;return true;
  },
  update(dt,{playing=true,grounded=true}={}){
   if(!playing||!Number.isFinite(dt)||dt<0)return info();
   if(kind){age+=dt;if(age>=total)kind=null;}
   if(!kind){
    if(wasGrounded&&!grounded){jumping=true;jumpAge=0;landing=0;}
    if(jumping){jumpAge+=dt;if(!wasGrounded&&grounded)landing=.12;
     else if(landing>0){landing=Math.max(0,landing-dt);if(!landing)jumping=false;}}
   }
   wasGrounded=grounded;return info();
  },
  reset(){kind=null;age=events=0;heading=0;wasGrounded=true;jumping=false;jumpAge=landing=0;},
  cancel(){kind=null;jumping=false;landing=0;},info,
 };
}
