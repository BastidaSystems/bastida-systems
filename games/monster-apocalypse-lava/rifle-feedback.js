// Shared recoil/bloom state for the existing rifle and both camera views.
// Camera offsets never overwrite the player's mouse, touch or gyro heading.
export function createRifleFeedback({baseSpread=.012}={}){
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),unit=x=>Number.isFinite(x)?clamp(x,0,1):0;
  let heat=0,pitch=0,yaw=0,shots=0,lastSpread=null;
  let aim=0,speed=0,fatigue=0,reduced=false,blocked=false;
  function options(o){
    if(o.aim!==undefined)aim=unit(o.aim);
    if(o.speed!==undefined)speed=unit(o.speed/3);
    if(o.fatigue!==undefined)fatigue=unit(o.fatigue);
    if(o.reduced!==undefined)reduced=!!o.reduced;
    if(o.blocked!==undefined)blocked=!!o.blocked;
    if(reduced||blocked)pitch=yaw=0;
  }
  const spread=()=>Math.min(.04,(baseSpread+.003*speed+.002*fatigue+.018*heat)*(1-.60*aim));
  const info=()=>({heat,pitch,yaw,spread:spread(),shots,aim,reduced,blocked,lastSpread:lastSpread?{...lastSpread}:null});
  return {
    update(dt,{active=true,...o}={}){
      if(!active||!Number.isFinite(dt)||dt<=0)return info();
      options(o);heat*=Math.exp(-dt*1.8);pitch*=Math.exp(-dt*11);yaw*=Math.exp(-dt*13);
      if(heat<.00001)heat=0;if(pitch<.000001)pitch=0;if(Math.abs(yaw)<.000001)yaw=0;
      return info();
    },
    fire(o={}){
      options(o);const previousPitch=pitch,previousYaw=yaw;
      heat=Math.min(1,heat+.18);
      if(!reduced&&!blocked){
        const focus=1-.55*aim;
        pitch=Math.min(.035,pitch+.011*focus);
        yaw=clamp(yaw+.0025*[.4,-.65,.8,-.35][shots%4]*focus,-.008,.008);
      }
      shots++;return {...info(),deltaPitch:pitch-previousPitch,deltaYaw:yaw-previousYaw};
    },
    sample(random=Math.random){
      // Uniform concentric disk, not three unrelated world-axis perturbations.
      // Its angular radius is exactly the value used by the reticle display.
      const x=clamp(random(),0,1)*2-1,y=clamp(random(),0,1)*2-1;
      let radius=0,angle=0;
      if(x!==0||y!==0){
        if(Math.abs(x)>Math.abs(y)){radius=x;angle=Math.PI/4*(y/x);}
        else{radius=y;angle=Math.PI/2-Math.PI/4*(x/y);}
      }
      const cone=spread(),scale=Math.tan(cone);
      lastSpread={x:radius*Math.cos(angle)*scale,y:radius*Math.sin(angle)*scale,spread:cone};
      return {...lastSpread};
    },
    reset(){heat=pitch=yaw=shots=aim=speed=fatigue=0;reduced=blocked=false;lastSpread=null;},
    info,
  };
}
