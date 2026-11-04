export const DODGE=Object.freeze({distance:.8,cost:.18,recovery:.7});
const directions={Left:[-1,0],Right:[1,0]};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function createPlayerDodge(){
 let active=false,kind=null,age=0,duration=1,cooldown=0,x=0,z=0,heading=0,sequence=0;
 const info=()=>({active,kind,age,duration,cooldown,heading,sequence,progress:Math.min(1,age/duration)});
 return {
  start(next,{yaw=0,seconds=1,allowed=true}={}){
   if(!allowed||active||cooldown>0||!Object.hasOwn(directions,next)||!Number.isFinite(yaw)||!Number.isFinite(seconds)||seconds<.2)return false;
   const [side,forward]=directions[next];x=Math.cos(yaw)*side-Math.sin(yaw)*forward;z=-Math.sin(yaw)*side-Math.cos(yaw)*forward;
   active=true;kind=next;heading=yaw;age=0;duration=seconds;sequence++;return true;
  },
  update(dt,{playing=true,blocked=false}={}){
   if(!playing||!Number.isFinite(dt)||dt<=0)return {dx:0,dz:0,...info()};
   dt=Math.min(.05,dt);if(blocked&&active){active=false;cooldown=DODGE.recovery;}
   if(!active){cooldown=Math.max(0,cooldown-dt);return {dx:0,dz:0,...info()};}
   const previous=age;age=Math.min(duration,age+dt);
   const motionSeconds=Math.min(.58,duration*.7),distance=DODGE.distance*(smooth(age/motionSeconds)-smooth(previous/motionSeconds));
   if(age>=duration){active=false;cooldown=DODGE.recovery;}
   return {dx:x*distance,dz:z*distance,...info()};
  },
  cancel(){if(active)cooldown=DODGE.recovery;active=false;},
  reset(){active=false;kind=null;age=0;cooldown=0;sequence=0;duration=1;heading=x=z=0;},
  info,
 };
}
