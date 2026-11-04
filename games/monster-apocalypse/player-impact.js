// Feedback runs only for accepted player damage, never enemy hits or blocked attacks.
export function createPlayerImpact({mode,hidden,webEnabled,native=()=>globalThis.sgpPlayerFeedbackV1,vibrate=ms=>globalThis.navigator?.vibrate?.(ms),now=()=>performance.now()}){
 let left=0,lastPulse=-Infinity,lastStrength='normal',hits=0;
 let reduced=false,blocked=false;
 const camera={pitch:0,yaw:0,roll:0},velocity={pitch:0,yaw:0,roll:0};
 const clearCamera=()=>{for(const axis of Object.keys(camera))camera[axis]=velocity[axis]=0;};
 return {
  hit({source='normal'}={}){
   if(mode()!=='playing'||hidden())return false;
   const strong=source==='crawler-leap'||source==='floating-dive'||source==='explosive-hit';lastStrength=strong?'heavy':source==='spider'?'light':'normal';hits++;
   if(strong)left=Math.max(left,.7);
   if(!reduced&&!blocked){
    const light=source==='spider',sign=hits%2?1:-1;
    const kick={pitch:strong?.045:light?.003:.018,yaw:sign*(strong?.024:light?.002:.012),roll:sign*(strong?.014:light?.001:.006)};
    const limit={pitch:.065,yaw:.04,roll:.025};
    for(const axis of Object.keys(camera)){camera[axis]=Math.max(-limit[axis],Math.min(limit[axis],camera[axis]+kick[axis]));velocity[axis]*=.6;}
   }
   if(now()-lastPulse>=200){
    lastPulse=now();
    try{const host=native();if(typeof host?.hit==='function')host.hit(lastStrength);else if(webEnabled())vibrate(strong?65:source==='spider'?15:30);}catch{/* Unsupported haptics never interrupt combat. */}
   }
   return strong;
  },
  update(dt,options={}){
   if(mode()!=='playing'||hidden()||!Number.isFinite(dt)||dt<0)return;
   left=Math.max(0,left-dt);reduced=!!options.reduced;blocked=!!options.blocked;
   if(reduced||blocked){clearCamera();return;}
   // Exact damped spring: no new clock, timers, input-angle writes or combat effects.
   const damping=9,frequency=22,w=Math.sqrt(frequency*frequency-damping*damping),decay=Math.exp(-damping*dt),c=Math.cos(w*dt),s=Math.sin(w*dt);
   for(const axis of Object.keys(camera)){
    const p=camera[axis],v=velocity[axis];
    camera[axis]=decay*(p*c+(v+damping*p)/w*s);
    velocity[axis]=decay*(v*c-(damping*v+frequency*frequency*p)/w*s);
    if(Math.abs(camera[axis])<1e-7&&Math.abs(velocity[axis])<1e-6)camera[axis]=velocity[axis]=0;
   }
  },
  movementScale(){const t=1-left/.7;return .35+.65*t*t*(3-2*t);},
  get stunned(){return left>0;},
  reset(){left=0;lastPulse=-Infinity;lastStrength='normal';hits=0;reduced=blocked=false;clearCamera();},
  camera:()=>({...camera}),
  info:()=>({remaining:left,strength:lastStrength,hits,camera:{...camera}}),
 };
}
