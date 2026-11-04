// Primary contacts measured from the supplied FBXs (30 fps).
// Navigation owns root travel, not the FBX hip.
export const EXPLOSIVE_ATTACKS=Object.freeze([
 Object.freeze({clip:'attack2',source:'2',duration:52/30,contact:24/30,dodge:'Right',hand:'RightHand'}),
 Object.freeze({clip:'attack2Mirror',source:'2.1',duration:39/30,contact:18/30,dodge:'Left',hand:'LeftHand'}),
]);
// Warn during the real authored anticipation. Never delay or stretch an
// attack to make room for UI. The clip already contains its own recovery.
export const EXPLOSIVE_STRIKE=Object.freeze({range:2.05,cooldown:.65,sideOffset:.30,sideRadius:.72,forwardRadius:.9,dodgeCue:.7});
export function explosiveDodgeCue(mon){
 const a=mon?.attack;if(!a||a.struck)return null;
 const remaining=Math.max(0,a.contact-a.elapsed);
 return {remaining,side:a.dodge,now:remaining<=EXPLOSIVE_STRIKE.dodgeCue,source:a.source};
}
export function createExplosiveAttack({canSee=()=>false,onContact=()=>{}}={}){
 const C=EXPLOSIVE_STRIKE;
 function cancel(mon){if(mon.attack){mon.attack=null;mon.attackCooldown=C.cooldown;}}
 return {
  validateClips(clips){for(const spec of EXPLOSIVE_ATTACKS){const clip=clips.find(c=>c.name===spec.clip);if(!clip||Math.abs(clip.duration-spec.duration)>.002)throw Error('Invalid explosive strike clip');}},
  tick(mon,dt){mon.attackCooldown=Math.max(0,(mon.attackCooldown||0)-Math.max(0,dt));},
  tryStart(mon,player,play){
   if(!player||mon.attack||mon.spawning||mon.state==='dead'||mon.reactionLeft>0||(mon.attackCooldown||0)>0)return false;
   const p=mon.g.position,distance=Math.hypot(player.x-p.x,player.z-p.z);
   if(distance<.5||distance>C.range||!canSee(mon,distance))return false;
   const spec=EXPLOSIVE_ATTACKS[(mon.attackSequence||0)%2];if(!mon.actions[spec.clip])return false;
   mon.g.lookAt(player.x,p.y,player.z);
   mon.attack={...spec,clipContact:spec.contact,elapsed:0,struck:false,target:{x:player.x,z:player.z},heading:mon.g.rotation.y};
   mon.attackSequence=(mon.attackSequence||0)+1;mon.attackEvents=(mon.attackEvents||0)+1;
   mon.state='attack';mon.stateT=0;play(mon,spec.clip,{once:true});
   mon.actions[spec.clip].paused=true;mon.actions[spec.clip].time=0;return true;
  },
  update(mon,dt,player){
   const a=mon.attack;if(!a)return false;
   if(mon.state==='dead'||mon.reactionLeft>0||mon.spawning){cancel(mon);return false;}
   a.elapsed+=Math.max(0,dt);
   const action=mon.actions[a.clip];action.paused=true;
   action.time=Math.min(a.duration,a.elapsed);
   if(!a.struck&&a.elapsed>=a.contact){
    a.struck=true;mon.attackAttempts=(mon.attackAttempts||0)+1;
    if(player){
     // Fixed strike footprint, locked when the windup begins. The dangerous
     // side mirrors with the authored clip. Q moves the real capsule out of it;
     // there is no dodge immunity and no enemy homing after the windup.
     const x=player.x-a.target.x,z=player.z-a.target.z,c=Math.cos(a.heading),s=Math.sin(a.heading);
     const lateral=x*c-z*s,forward=-x*s-z*c,offset=a.dodge==='Left'?C.sideOffset:-C.sideOffset;
     const inStrike=((lateral-offset)/C.sideRadius)**2+(forward/C.forwardRadius)**2<=1;
     if(inStrike&&canSee(mon,Math.hypot(player.x-mon.g.position.x,player.z-mon.g.position.z))){mon.attackContacts=(mon.attackContacts||0)+1;onContact(mon);}
    }
   }
   if(a.elapsed>=a.duration){mon.attack=null;mon.attackCooldown=0;mon.state='idle';}
   return true;
  },
  cancel,
  info:mon=>({active:!!mon.attack,attack:mon.attack?{...mon.attack,target:{...mon.attack.target}}:null,sequence:mon.attackSequence||0,events:mon.attackEvents||0,attempts:mon.attackAttempts||0,contacts:mon.attackContacts||0,cooldown:mon.attackCooldown||0}),
 };
}
