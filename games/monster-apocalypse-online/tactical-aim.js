// Tactical input supplies yaw only. Elevation follows a visible, physically
// reachable target; this module never rotates yaw, fires or changes damage.
export const TACTICAL_AIM=Object.freeze({range:22,bodyCone:6*Math.PI/180,weakCone:2.5*Math.PI/180,response:20,speed:2.4});
export function createTacticalAim(){
 let pitch=0,target=null,distance=10;
 return {
  update(dt,{enabled=false,origin,yaw=0,targets=[],preferredDistance=null,basePitch=0,visible=()=>false}={}){
   if(!enabled||!origin||![origin.x,origin.y,origin.z,yaw,dt].every(Number.isFinite)||dt<=0){target=null;if(Number.isFinite(preferredDistance))distance=preferredDistance;return this.info();}
   const options=[];
   for(const t of targets){
    const c=t.center;if(!c)continue;
    const x=c.x-origin.x,z=c.z-origin.z,y=c.y-origin.y,horizontal=Math.hypot(x,z),d=Math.hypot(horizontal,y);
    const error=Math.abs(Math.atan2(Math.sin(Math.atan2(-x,-z)-yaw),Math.cos(Math.atan2(-x,-z)-yaw)));
    const rangeError=Number.isFinite(preferredDistance)?Math.abs(horizontal-preferredDistance):0;
    if(!Number.isFinite(d)||horizontal<.25||d>TACTICAL_AIM.range||rangeError>3||error>((t.sac||t.weak)?TACTICAL_AIM.weakCone:TACTICAL_AIM.bodyCone))continue;
    options.push({t,d,error,rangeError,pitch:Math.atan2(y,horizontal)});
   }
   // Prefer exposed points near the chosen heading. The caller checks actual
   // geometry, including any enemy or obstacle in front of the selected point.
   options.sort((a,b)=>((b.t.sac||b.t.weak)?1:0)-((a.t.sac||a.t.weak)?1:0)||a.rangeError-b.rangeError||a.error-b.error||a.d-b.d);
   const best=options.slice(0,8).find(o=>visible(o.t));
   target=best?.t||null;distance=best?.d||(Number.isFinite(preferredDistance)?preferredDistance:10);
   const goal=Math.max(-1.25,Math.min(1.25,best?best.pitch:basePitch)),step=Math.min(.05,dt);
   const change=(goal-pitch)*(1-Math.exp(-TACTICAL_AIM.response*step));
   pitch+=Math.max(-TACTICAL_AIM.speed*step,Math.min(TACTICAL_AIM.speed*step,change));
   return this.info();
  },
  reset(){pitch=0;target=null;distance=10;},
  info:()=>({active:!!target,pitch,distance,index:target?.index??null,weak:!!target?.weak}),
 };
}
