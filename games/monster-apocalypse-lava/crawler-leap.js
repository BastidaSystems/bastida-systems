// One optional attack for the existing crawling Alien 1. No spawner or score writes.
export const CRAWLER_LEAP=Object.freeze({minRange:2.8,maxRange:4.2,windup:.32,flight:.62,recovery:.28,height:.45,cooldown:5,standOff:1,hitRange:1.9});
export function createCrawlerLeap({resolve,canSee,onContact,onFinish}){
  const C=CRAWLER_LEAP;
  const eligible=m=>!!m.alien&&!!m.alien.actions.attack2&&m.chaseClip==='crawl'&&!m.swarm;
  function tick(mon,dt){
    if(!eligible(mon)||mon.state==='dead')return;
    if(mon.leapCooldown===undefined)mon.leapCooldown=1.2+(Math.abs(mon.g.position.x*1.13+mon.g.position.z*.73)%1)*1.8;
    mon.leapCooldown=Math.max(0,mon.leapCooldown-Math.max(0,dt));
  }
  function pathClear(mon,x,z){
    const p=mon.g.position,old={x:p.x,y:p.y,z:p.z};
    const count=Math.ceil(Math.hypot(x-p.x,z-p.z)/.2);
    try{
      for(let i=1;i<=count;i++){
        const px=old.x+(x-old.x)*i/count,pz=old.z+(z-old.z)*i/count;
        p.x=px;p.z=pz;resolve(mon);
        if(Math.hypot(p.x-px,p.z-pz)>.015)return false;
      }
      return true;
    }finally{p.x=old.x;p.y=old.y;p.z=old.z;mon.g.updateMatrixWorld?.(true);}
  }
  function tryStart(mon,player){
    if(!eligible(mon)||mon.state!=='chase'||mon.reactLeft>0||(mon.leapCooldown??1)>0)return false;
    const p=mon.g.position,dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);
    if(d<C.minRange||d>C.maxRange||!canSee(mon,d))return false;
    const x=player.x-dx/d*C.standOff,z=player.z-dz/d*C.standOff;
    if(!pathClear(mon,x,z)){mon.leapCooldown=.75;return false;}
    mon.leap={time:0,fromX:p.x,fromZ:p.z,x,z,launched:false,struck:false};
    mon.leapCooldown=C.cooldown;mon.state='leap';mon.stateT=0;mon.crowdFacing=null;mon.routeSteering=null;
    return true;
  }
  function cancel(mon){if(!mon.leap)return;mon.g.position.y=0;mon.leap=null;}
  function finish(mon){cancel(mon);resolve(mon);onFinish(mon);}
  function update(mon,dt,player){
    const jump=mon.leap;if(mon.state!=='leap'||!jump)return;
    jump.time+=Math.max(0,dt);const p=mon.g.position;
    if(jump.time<C.windup)return;
    if(!jump.launched){
      if(!canSee(mon,Math.hypot(player.x-p.x,player.z-p.z))||!pathClear(mon,jump.x,jump.z)){finish(mon);return;}
      jump.fromX=p.x;jump.fromZ=p.z;jump.launched=true;
    }
    const u=Math.max(0,Math.min(1,(jump.time-C.windup)/C.flight));
    const travel=u*u*(3-2*u);
    const x=jump.fromX+(jump.x-jump.fromX)*travel,z=jump.fromZ+(jump.z-jump.fromZ)*travel;
    // Small swept steps preserve the same body/static collision solver at low FPS.
    const ox=p.x,oz=p.z,count=Math.max(1,Math.ceil(Math.hypot(x-ox,z-oz)/.1));
    for(let i=1;i<=count;i++){
      const px=ox+(x-ox)*i/count,pz=oz+(z-oz)*i/count;p.x=px;p.z=pz;
      resolve(mon);if(Math.hypot(p.x-px,p.z-pz)>.03){finish(mon);return;}
    }
    p.y=4*C.height*u*(1-u);
    if(!jump.struck&&u>=.65&&Math.hypot(player.x-p.x,player.z-p.z)<=C.hitRange&&canSee(mon,C.hitRange)){
      jump.struck=true;onContact(mon);
    }
    if(jump.time>=C.windup+C.flight+C.recovery)finish(mon);
  }
  return {tick,tryStart,update,cancel,settings:C};
}
