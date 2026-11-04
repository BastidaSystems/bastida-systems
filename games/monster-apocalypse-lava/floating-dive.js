// A fixed, dodgeable swoop on the existing flying enemy. No new skin or spawner.
export const FLOATING_DIVE=Object.freeze({out:.65,back:.9,low:.25,standOff:1.3,hitRange:1.9});
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
export function createFloatingDive({resolve,getGround,canSee,onContact,windup=.6,cycle=2.8,damage=12}){
 const C=FLOATING_DIVE;
 function sweep(e,x,z,check=false){
  const p=e.g.position,ox=p.x,oz=p.z,n=Math.max(1,Math.ceil(Math.hypot(x-ox,z-oz)/.1));
  let clear=true;
  for(let i=1;i<=n;i++){
   const tx=mix(ox,x,i/n),tz=mix(oz,z,i/n),trial={x:tx,y:0,z:tz};resolve(trial,e.radius,true);
   if(Math.hypot(trial.x-tx,trial.z-tz)>.01){clear=false;break;}
   if(!check){p.x=tx;p.z=tz;}
  }
  return clear;
 }
 function begin(e,target){
  if(e.dive||!canSee(e,target))return false;
  const p=e.g.position,dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),travel=Math.max(0,d-C.standOff);
  const x=p.x+(d>0?dx/d*travel:0),z=p.z+(d>0?dz/d*travel:0);
  if(!sweep(e,x,z,true))return false;
  e.dive={phase:'windup',time:0,origin:{x:p.x,y:p.y,z:p.z},end:{x,y:getGround(x,z)+C.low,z},struck:false,pitch:0,cancelled:false};
  return true;
 }
 function returnFrom(e){const d=e.dive;d.phase='return';d.time=0;const p=e.g.position;d.from={x:p.x,y:p.y,z:p.z};d.returnPitch=d.pitch;}
 function interrupt(e){if(!e.dive)return;e.dive.cancelled=true;if(e.dive.phase!=='return'&&e.dive.phase!=='rest')returnFrom(e);}
 function update(e,dt,target){
  if(!e.dive)return false;
  // Small steps keep a low-frame-rate update from skipping the contact window.
  for(let left=Math.max(0,dt);left>1e-8&&e.dive;){
   const step=Math.min(left,1/60);left-=step;
   const d=e.dive,p=e.g.position;d.time+=step;
   if(d.phase==='windup'){
    p.y=d.origin.y+.12*Math.sin(Math.min(1,d.time/windup)*Math.PI);d.pitch=-.1*Math.sin(Math.min(1,d.time/windup)*Math.PI);
    if(d.time>=windup){if(!canSee(e,target)){interrupt(e);continue;}d.phase='out';d.time=0;p.y=d.origin.y;}
   }else if(d.phase==='out'){
    const u=Math.min(1,d.time/C.out),t=ease(u);
    if(!sweep(e,mix(d.origin.x,d.end.x,t),mix(d.origin.z,d.end.z,t))){interrupt(e);continue;}
    p.y=mix(d.origin.y,d.end.y,t)+.12*Math.sin(u*Math.PI);d.pitch=.3*Math.sin(u*Math.PI);
    if(!d.struck&&u>=.75&&Math.hypot(target.x-p.x,target.z-p.z)<=C.hitRange&&Math.abs(target.y-(p.y+1.4))<1.5&&canSee(e,target)){
     d.struck=true;onContact(e,damage);
    }
    if(u===1)returnFrom(e);
   }else if(d.phase==='return'){
    const u=Math.min(1,d.time/C.back),t=ease(u);
    sweep(e,mix(d.from.x,d.origin.x,t),mix(d.from.z,d.origin.z,t));
    p.y=mix(d.from.y,d.origin.y,t);d.pitch=mix(d.returnPitch,0,t);
    if(u===1){d.phase='rest';d.time=0;}
   }else if(d.phase==='rest'){
    d.pitch=0;
    if(d.time>=Math.max(.25,cycle-windup-C.out-C.back)){e.dive=null;}
   }
  }
  return !!e.dive;
 }
 return {begin,update,interrupt};
}
