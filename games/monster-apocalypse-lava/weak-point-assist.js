// Small, bounded input correction. This never selects hits or awards damage;
// the visible camera/weapon moves and the existing physical shot still decides.
export const WEAK_POINT_ASSIST=Object.freeze({angle:3.2*Math.PI/180,minAngle:.9*Math.PI/180,range:18,speed:12*Math.PI/180,response:10});
export function createWeakPointAssist(){
 let state={active:false,index:null,yaw:0,pitch:0};
 const clear=()=>state={active:false,index:null,yaw:0,pitch:0};
 return {
  update(dt,{enabled=false,origin,direction,targets=[],visible=()=>false}={}){
   clear();if(!enabled||!Number.isFinite(dt)||dt<=0||!origin||!direction)return {...state};
   const length=Math.hypot(direction.x,direction.y,direction.z);
   if(!Number.isFinite(length)||length<.001)return {...state};
   const heading=Math.atan2(-direction.x,-direction.z),elevation=Math.asin(Math.max(-1,Math.min(1,direction.y/length))),options=[];
   for(const target of targets){
    const c=target.center;if(!c||!Number.isFinite(target.radius)||target.radius<=0)continue;
    const x=c.x-origin.x,y=c.y-origin.y,z=c.z-origin.z,distance=Math.hypot(x,y,z);
    if(!Number.isFinite(distance)||distance<.2||distance>WEAK_POINT_ASSIST.range)continue;
    const dot=(x*direction.x+y*direction.y+z*direction.z)/(distance*length),angle=Math.acos(Math.max(-1,Math.min(1,dot)));
    const limit=Math.min(WEAK_POINT_ASSIST.angle,Math.max(WEAK_POINT_ASSIST.minAngle,Math.atan2(target.radius*1.8,distance)));
    if(angle>limit)continue;
    const error=Math.atan2(-x,-z)-heading,yaw=Math.atan2(Math.sin(error),Math.cos(error)),pitch=Math.asin(y/distance)-elevation;
    options.push({target,yaw,pitch,angle,limit});
   }
   options.sort((a,b)=>a.angle-b.angle);
   const best=options.find(o=>visible(o.target));if(!best)return {...state};
   const error=Math.hypot(best.yaw,best.pitch),step=Math.min(.05,dt),strength=.45+.55*(1-(best.angle/best.limit)**2);
   const amount=Math.min(error*(1-Math.exp(-WEAK_POINT_ASSIST.response*step)),WEAK_POINT_ASSIST.speed*step)*strength;
   const scale=error>1e-9?amount/error:0;
   state={active:true,index:best.target.index,yaw:best.yaw*scale,pitch:best.pitch*scale};
   return {...state};
  },
  reset:clear,
  info:()=>({...state}),
 };
}
