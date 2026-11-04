// Creature-to-creature avoidance only. Static world collisions remain in game.js.
export function crowdPeers(a,b){
  return a!==b&&!a.spawning&&!b.spawning&&a.state!=='dead'&&b.state!=='dead'&&!!a.swarm===!!b.swarm;
}
export function crowdRadius(mon){
  return mon.swarm?mon.radius*.65:.26*(mon.g.scale?.x??1);
}
export function steerCrowd(mon,peers,dt,x,z){
  const p=mon.g.position,r=crowdRadius(mon);
  let pressure=0;
  for(const other of peers){
    if(!crowdPeers(mon,other))continue;
    const dx=other.g.position.x-p.x,dz=other.g.position.z-p.z;
    const ahead=dx*x+dz*z,side=dx*z-dz*x;
    const width=r+crowdRadius(other)+.18;
    // Keep right before meeting another body; no wall/route information is replaced.
    if(ahead>0&&ahead<1.9&&Math.abs(side)<width)
      pressure=Math.max(pressure,(1-ahead/1.9)*(1-Math.abs(side)/width));
  }
  mon.crowdTurn=(mon.crowdTurn||0)+(pressure*.95-(mon.crowdTurn||0))*(1-Math.exp(-10*Math.max(0,dt)));
  const turn=mon.crowdTurn,n=Math.hypot(1,turn);
  const out=mon.crowdDirection||(mon.crowdDirection={x:0,z:0});
  out.x=(x+z*turn)/n;out.z=(z-x*turn)/n;
  return out;
}
export function separateCrowd(peers,dt,resolveWorld){
  const cap=.75*Math.max(0,Math.min(dt,.05));
  if(!cap)return;
  for(const mon of peers){mon.crowdPushX=0;mon.crowdPushZ=0;}
  for(let i=0;i<peers.length;i++)for(let j=i+1;j<peers.length;j++){
    const a=peers[i],b=peers[j];if(!crowdPeers(a,b))continue;
    const dx=b.g.position.x-a.g.position.x,dz=b.g.position.z-a.g.position.z;
    const distance=Math.hypot(dx,dz),overlap=crowdRadius(a)+crowdRadius(b)-distance;
    if(overlap<=0)continue;
    // Stable root discs, never animated hands/feet: avoid a tug of war each pose.
    const x=distance>1e-5?dx/distance:1,z=distance>1e-5?dz/distance:0;
    const push=Math.min(overlap*.5,cap);
    a.crowdPushX-=x*push;a.crowdPushZ-=z*push;
    b.crowdPushX+=x*push;b.crowdPushZ+=z*push;
  }
  for(const mon of peers){
    const length=Math.hypot(mon.crowdPushX,mon.crowdPushZ);
    if(!length||mon.state==='dead')continue;
    const factor=Math.min(1,cap/length);
    mon.g.position.x+=mon.crowdPushX*factor;mon.g.position.z+=mon.crowdPushZ*factor;
    resolveWorld(mon);
  }
}
