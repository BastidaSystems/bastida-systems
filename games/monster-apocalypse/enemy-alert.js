// Detection presentation and pursuit for upright Alien 1 only.
export const ENEMY_ALERT=Object.freeze({range:18,cooldown:18,runMultiplier:1.7});
export function createEnemyAlert({canSee,onFinish}){
 const eligible=m=>!!m.alien?.actions.alert&&!!m.alien?.actions.run&&m.chaseClip==='walk'&&!m.swarm;
 return {
  tick(mon,dt){if(mon.alertCooldown>0)mon.alertCooldown=Math.max(0,mon.alertCooldown-dt);},
  tryStart(mon,player){
   if(!eligible(mon)||!['idle','search','chase'].includes(mon.state)||!mon.seesPlayer||mon.alertEpisode||(mon.alertCooldown||0)>0)return false;
   const distance=Math.hypot(player.x-mon.g.position.x,player.z-mon.g.position.z);
   if(distance>ENEMY_ALERT.range||!canSee(mon,distance))return false;
   mon.alertEpisode=true;mon.alertPursuit=true;mon.alertCooldown=ENEMY_ALERT.cooldown;
   mon.state='alert';mon.stateT=0;mon.reactLeft=0;mon.crowdFacing=null;mon.routeSteering=null;
   return true;
  },
  update(mon){if(mon.state==='alert'&&mon.stateT>=mon.alien.actions.alert.getClip().duration)onFinish(mon);},
  resume(mon){if(eligible(mon)&&mon.alertEpisode)mon.alertPursuit=true;},
  reset(mon){mon.alertEpisode=false;mon.alertPursuit=false;},
  speed(mon){return mon.speed*(mon.alertPursuit&&['chase','hurt'].includes(mon.state)?ENEMY_ALERT.runMultiplier:1);},
 };
}
