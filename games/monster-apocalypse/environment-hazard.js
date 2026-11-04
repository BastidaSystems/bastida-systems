// Authored environmental contact only; damage/death/Score stay in the game's existing pipeline.
export const STRAT_ELECTRIC_HAZARD=Object.freeze({radius:3.2,height:4,damage:10,interval:1,warningDelay:.4});
export function createElectricalHazard({position,onDamage,rules=STRAT_ELECTRIC_HAZARD}){
  if(!position||![position.x,position.y,position.z,rules.radius,rules.height,rules.damage,rules.interval,rules.warningDelay].every(Number.isFinite)||
    [rules.radius,rules.height,rules.damage,rules.interval].some(v=>v<=0)||rules.warningDelay<0)throw Error('Invalid electrical hazard');
  let cooldown=0,inside=false,hits=0,enabled=true,exposure=0;
  return {
    setEnabled(value){enabled=!!value;inside=false;if(!enabled)exposure=0;},
    update(dt,{mode,listener,playerPosition=listener,jumpY=0}={}){
      inside=false;
      if(['menu','loading','dead'].includes(mode)){cooldown=0;exposure=0;return;}
      if(!enabled||mode!=='playing'||!playerPosition)return;
      dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));cooldown=Math.max(0,cooldown-dt);
      const y=playerPosition.y+(Number.isFinite(jumpY)?jumpY:0);
      inside=Math.hypot(playerPosition.x-position.x,playerPosition.z-position.z)<=rules.radius&&y>=position.y-.5&&y<=position.y+rules.height;
      exposure=inside?exposure+dt:0;
      if(inside&&exposure>=rules.warningDelay&&cooldown===0&&onDamage?.(rules.damage)===true){cooldown=rules.interval;hits++;}
    },
    info:()=>({enabled,inside,hits,cooldown,exposure,...rules,position:[position.x,position.y,position.z]}),
  };
}
