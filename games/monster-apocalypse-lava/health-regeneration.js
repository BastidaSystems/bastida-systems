// Count gameplay time only: pausing never advances recovery.
export function createHealthRegeneration({delay=5,rate=20,maxHealth=100}={}) {
  let sinceHit=0;
  return {
    hit(){sinceHit=0;},
    reset(){sinceHit=0;},
    update(dt,state){
      if(state.mode!=='playing'||state.health<=0)return false;
      const before=sinceHit;sinceHit+=Math.max(0,dt);
      if(state.health>=maxHealth)return false;
      const recovery=sinceHit-Math.max(delay,before);
      if(recovery<=0)return false;
      state.health=Math.min(maxHealth,state.health+recovery*rate);
      return true;
    },
  };
}
