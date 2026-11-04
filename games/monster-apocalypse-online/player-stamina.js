// Active gameplay time only; shared by keyboard, touch and the native controller.
export const SPRINT_ENDURANCE=Object.freeze({seconds:10,recoverySeconds:7,recoveryDelay:1.2,restartLevel:.35});
export function createPlayerStamina({unlimited=false}={}){
  if(unlimited){
    const info=()=>({level:1,exhausted:false,fatigue:0});
    return {canSprint:requested=>!!requested,consume:amount=>Number.isFinite(amount)&&amount>0,update:info,reset(){},info};
  }
  let level=1,exhausted=false,released=false,rest=0;
  const info=()=>({level,exhausted,fatigue:1-level});
  return {
    canSprint(requested){return !!requested&&!exhausted&&level>0;},
    consume(amount){
      if(!Number.isFinite(amount)||amount<=0||exhausted||level<amount)return false;
      level=Math.max(0,level-amount);rest=0;
      if(level<1e-8){level=0;exhausted=true;released=false;}
      return true;
    },
    update(dt,{requested=false,running=false,speed=0,active=true}={}){
      if(!active||!Number.isFinite(dt)||dt<=0)return info();
      // No catch-up drain after a stalled/background frame.
      dt=Math.min(dt,.05);
      if(exhausted&&!requested)released=true;
      if(running&&!exhausted&&speed>2.2){
        level=Math.max(0,level-dt/SPRINT_ENDURANCE.seconds);rest=0;
        if(level<1e-8){level=0;exhausted=true;released=false;}
      }else{
        const before=rest;rest+=dt;
        const recovery=Math.max(0,rest-SPRINT_ENDURANCE.recoveryDelay)-Math.max(0,before-SPRINT_ENDURANCE.recoveryDelay);
        level=Math.min(1,level+recovery/SPRINT_ENDURANCE.recoverySeconds);
        if(exhausted&&released&&level>=SPRINT_ENDURANCE.restartLevel)exhausted=false;
      }
      return info();
    },
    reset(){level=1;exhausted=false;released=false;rest=0;},info,
  };
}
