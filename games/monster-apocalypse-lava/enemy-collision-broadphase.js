// Only skip the existing solver when no part of the body can touch an obstacle.
// Bounds are conservative; nearby obstacles still use all original solver passes.
export function createEnemyCollisionBroadphase(colliders, halfW, halfL) {
  const cache=new WeakMap(),state={checks:0,clear:0};
  function bounds(c) {
    let b=cache.get(c);if(b)return b;
    if(c.halfX!==undefined){
      const x=Math.abs(c.cos)*c.halfX+Math.abs(c.sin)*c.halfZ;
      const z=Math.abs(c.sin)*c.halfX+Math.abs(c.cos)*c.halfZ;
      b={minX:c.cx-x,maxX:c.cx+x,minZ:c.cz-z,maxZ:c.cz+z};
    }else b={minX:c.minX,maxX:c.maxX,minZ:c.minZ,maxZ:c.maxZ};
    if(!Object.values(b).every(Number.isFinite))return null;
    cache.set(c,b);return b;
  }
  return {
    clear(p,points) {
      state.checks++;
      let minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity;
      for(const c of points){
        minX=Math.min(minX,p.x+c.x-c.r);maxX=Math.max(maxX,p.x+c.x+c.r);
        minZ=Math.min(minZ,p.z+c.z-c.r);maxZ=Math.max(maxZ,p.z+c.z+c.r);
      }
      // Include a rounding margin and the map edge, which also constrains bodies.
      const epsilon=1e-8;
      if(minX<=-halfW+epsilon||maxX>=halfW-epsilon||minZ<=-halfL+epsilon||maxZ>=halfL-epsilon)return false;
      for(const c of colliders){
        const b=bounds(c);if(!b)return false;
        if(maxX>=b.minX-epsilon&&minX<=b.maxX+epsilon&&maxZ>=b.minZ-epsilon&&minZ<=b.maxZ+epsilon)return false;
      }
      state.clear++;return true;
    },
    info:()=>({...state}),
  };
}
