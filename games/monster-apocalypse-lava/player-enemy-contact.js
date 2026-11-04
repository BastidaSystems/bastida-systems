// The local explosive encounter has a solid torso, independent of animated
// fingers/ornaments. Keep ordinary world movement unchanged outside that lab.
export function movePlayerWithEnemyContacts(p,dx,dz,radius,enemies,resolveWorld){
  const bodies=enemies.filter(m=>m.explosiveLab&&!m.spawning&&m.state!=='dead');
  if(!bodies.length){p.x+=dx;p.z+=dz;resolveWorld(p,radius);return;}
  const skin=.001,bodyRadius=m=>radius+(m.collisionRadius??.65)+skin;
  const overlaps=q=>bodies.some(m=>Math.hypot(q.x-m.g.position.x,q.z-m.g.position.z)<bodyRadius(m)-1e-5);
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
  const probe={x:0,y:p.y,z:0};
  for(let step=0;step<steps;step++){
    const oldX=p.x,oldZ=p.z,wasClear=!overlaps(p);
    p.x+=dx/steps;p.z+=dz/steps;
    resolveWorld(p,radius);
    for(let pass=0;pass<4;pass++){
      for(const m of bodies){
        const c=m.g.position,r=bodyRadius(m);let x=p.x-c.x,z=p.z-c.z,d=Math.hypot(x,z);
        if(d>=r)continue;
        if(d<1e-8){x=oldX-c.x;z=oldZ-c.z;d=Math.hypot(x,z);}
        if(d<1e-8){x=-dx;z=-dz;d=Math.hypot(x,z);}
        if(d<1e-8){x=0;z=1;d=1;}
        p.x=c.x+x/d*r;p.z=c.z+z/d*r;
      }
      resolveWorld(p,radius);
      if(!overlaps(p))break;
    }
    if(!overlaps(p))continue;
    // If a wall blocks the correction, keep the last legal position instead
    // of pushing the player through the wall or the enemy.
    if(wasClear){p.x=oldX;p.z=oldZ;continue;}
    // Recover a pre-existing overlap (e.g. enemy movement), choosing the nearest
    // world-valid spot around the torso. No teleport across a valid contact.
    let best=Infinity,bestX=p.x,bestZ=p.z;
    for(const m of bodies){
      const c=m.g.position,r=bodyRadius(m),angle=Math.atan2(oldZ-c.z,oldX-c.x);
      for(let i=0;i<24;i++){
        const a=angle+i*Math.PI/12;probe.x=c.x+Math.cos(a)*r;probe.z=c.z+Math.sin(a)*r;
        resolveWorld(probe,radius);if(overlaps(probe))continue;
        const d=(probe.x-oldX)**2+(probe.z-oldZ)**2;
        if(d<best){best=d;bestX=probe.x;bestZ=probe.z;}
      }
    }
    p.x=bestX;p.z=bestZ;
  }
}
