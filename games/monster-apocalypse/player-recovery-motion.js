// Consume authored planar displacement once, via the existing collision owner.
// sample() returns meters in the captured hit heading; no visual-only root travel.
export function createRecoveryMotion({sample,move,riseStart}){
 let sequence=-1,last=null,kind=null,distance=0,requested=0;
 const subtract=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
 function at(p){
  const fall=subtract(sample(kind,p.time),sample(kind,0));
  if(p.phase!=='standUp')return fall;
  const rise=subtract(sample('standUp',p.riseTime),sample('standUp',riseStart));
  return {x:fall.x+rise.x*p.riseBlend,z:fall.z+rise.z*p.riseBlend};
 }
 return {
  update(p){
   if(!p.active){last=null;kind=null;return;}
   if(sequence!==p.events||kind!==p.kind){sequence=p.events;kind=p.kind;last={x:0,z:0};distance=requested=0;}
   const next=at(p),dx=next.x-last.x,dz=next.z-last.z;last=next;
   if(!Number.isFinite(dx)||!Number.isFinite(dz))return;
   requested+=Math.hypot(dx,dz);const actual=move(dx,dz)||{x:0,z:0};distance+=Math.hypot(actual.x,actual.z);
  },
  reset(){sequence=-1;last=kind=null;distance=requested=0;},
  info:()=>({sequence,kind,distance,requested}),
 };
}
