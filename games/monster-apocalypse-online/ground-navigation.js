// One shared ground graph, built during loading from the existing collision solver.
// No scene objects, model copies or per-frame path searches.
export function createGroundNavigation({halfW,halfL,resolve,radius=1.9,step=2,anchor={x:0,z:46}}){
  const cols=Math.floor(halfW*2/step),rows=Math.floor(halfL*2/step),count=cols*rows;
  const ox=-halfW+step/2,oz=-halfL+step/2;
  const free=new Uint8Array(count),edges=new Uint8Array(count),connected=new Uint8Array(count);
  const queue=new Int32Array(count),parent=new Int32Array(count),seen=new Uint32Array(count);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]],opposite=[1,0,3,2,5,4,7,6];
  const probe={x:0,y:0,z:0},state={ready:false,nodes:count,reachable:0,paths:0,buildMs:0};let stamp=0;
  const xAt=i=>ox+(i%cols)*step,zAt=i=>oz+Math.floor(i/cols)*step;
  function clear(x,z){
    if(Math.abs(x)>halfW-radius||Math.abs(z)>halfL-radius)return false;
    probe.x=x;probe.z=z;resolve(probe,radius,true);
    return Math.hypot(probe.x-x,probe.z-z)<1e-5;
  }
  function line(ax,az,bx,bz){
    const samples=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);
    for(let i=0;i<=samples;i++){
      const t=samples?i/samples:0;if(!clear(ax+(bx-ax)*t,az+(bz-az)*t))return false;
    }return true;
  }
  function nearest(x,z,mask){
    let best=-1,distance=Infinity;
    for(let i=0;i<count;i++)if(mask[i]){const d=(x-xAt(i))**2+(z-zAt(i))**2;if(d<distance){distance=d;best=i;}}
    return best;
  }
  function prepare(){
    if(state.ready)return;const start=performance.now();
    for(let i=0;i<count;i++)free[i]=clear(xAt(i),zAt(i))?1:0;
    for(let i=0;i<count;i++)if(free[i]){
      const x=i%cols,z=Math.floor(i/cols);
      for(const d of [0,2,4,6]){
        const [dx,dz]=dirs[d],nx=x+dx,nz=z+dz,n=nz*cols+nx;
        if(nx<0||nx>=cols||nz<0||nz>=rows||!free[n])continue;
        if(dx&&dz&&(!free[z*cols+nx]||!free[nz*cols+x]))continue;
        if(!line(xAt(i),zAt(i),xAt(n),zAt(n)))continue;
        edges[i]|=1<<d;edges[n]|=1<<opposite[d];
      }
    }
    const seed=nearest(anchor.x,anchor.z,free);if(seed<0)throw Error('No hay suelo libre para los enemigos');
    let read=0,write=1;queue[0]=seed;connected[seed]=1;
    while(read<write){const i=queue[read++];for(let d=0;d<8;d++)if(edges[i]&(1<<d)){
      const n=i+dirs[d][0]+dirs[d][1]*cols;if(!connected[n]){connected[n]=1;queue[write++]=n;}
    }}
    state.reachable=write;state.ready=true;state.buildMs=performance.now()-start;
  }
  function spawn(point,occupied=[]){
    if(!state.ready)return point;
    let best=-1,distance=Infinity;
    for(let i=0;i<count;i++)if(connected[i]){
      const x=xAt(i),z=zAt(i),d=(point.x-x)**2+(point.z-z)**2;
      if(d>=distance||occupied.some(p=>(x-p.x)**2+(z-p.z)**2<(radius*2+.2)**2))continue;
      distance=d;best=i;
    }
    const i=best<0?nearest(point.x,point.z,connected):best;return {x:xAt(i),z:zAt(i)};
  }
  // Bounded local encounters on the existing connected street graph. If a safe
  // nearby slot is unavailable the wave retries; never fall back to a distant edge.
  function spawnNear(target,{occupied=[],min=10,max=16,random=Math.random}={}){
    if(!state.ready)return null;
    const candidates=[];
    for(let i=0;i<count;i++)if(connected[i]){
      const x=xAt(i),z=zAt(i),d=Math.hypot(x-target.x,z-target.z);
      if(d<min||d>max||occupied.some(p=>Math.hypot(x-p.x,z-p.z)<radius*2+.2))continue;
      candidates.push({x,z});
    }
    for(let tries=0;tries<12&&candidates.length;tries++){
      const i=Math.floor(random()*candidates.length),point=candidates.splice(i,1)[0];
      const route=path(target,point.x,point.z);let length=0,last=target;
      for(const p of route){length+=Math.hypot(p.x-last.x,p.z-last.z);last=p;}
      if(route.length&&length<=max*1.6)return point;
    }
    return null;
  }
  function path(from,tx,tz){
    state.paths++;
    // Preserve direct pursuit in open streets; graph searches are only for blocked routes.
    if(line(from.x,from.z,tx,tz))return [{x:tx,z:tz}];
    const start=nearest(from.x,from.z,connected),goal=nearest(tx,tz,connected);
    if(start<0||goal<0)return [];
    if(++stamp===0xffffffff){seen.fill(0);stamp=1;}
    let read=0,write=1;queue[0]=start;seen[start]=stamp;parent[start]=-1;
    while(read<write&&seen[goal]!==stamp){const i=queue[read++];for(let d=0;d<8;d++)if(edges[i]&(1<<d)){
      const n=i+dirs[d][0]+dirs[d][1]*cols;
      if(seen[n]!==stamp){seen[n]=stamp;parent[n]=i;queue[write++]=n;}
    }}
    if(seen[goal]!==stamp)return [];
    const indices=[];for(let i=goal;i!==-1;i=parent[i])indices.push(i);indices.reverse();
    const result=[];
    for(let i=0;i<indices.length;i++){
      // Remove only collinear intermediate cells; every retained edge was checked.
      if(i>0&&i<indices.length-1&&indices[i]-indices[i-1]===indices[i+1]-indices[i])continue;
      result.push({x:xAt(indices[i]),z:zAt(indices[i])});
    }
    if(line(xAt(goal),zAt(goal),tx,tz))result.push({x:tx,z:tz});
    return result;
  }
  function waypoint(mon,dt,tx,tz){
    if(!state.ready)return null;
    let nav=mon.navigation;
    if(!nav)nav=mon.navigation={path:[],index:0,x:Infinity,z:Infinity,retry:0,recovering:false};
    // Keep direct combat pursuit, including doorways, until an actual blockage.
    if(mon.state!=='idle'&&!nav.recovering)return null;
    nav.retry-=dt;
    const changed=Math.hypot(tx-nav.x,tz-nav.z)>3;
    if(changed||(!nav.path.length&&nav.retry<=0)){
      nav.path=path(mon.g.position,tx,tz);nav.index=0;nav.x=tx;nav.z=tz;nav.retry=1;
    }
    while(nav.index<nav.path.length-1&&Math.hypot(nav.path[nav.index].x-mon.g.position.x,nav.path[nav.index].z-mon.g.position.z)<.1)nav.index++;
    const point=nav.path[nav.index];
    if(point&&nav.index===nav.path.length-1&&Math.hypot(point.x-mon.g.position.x,point.z-mon.g.position.z)<.45&&nav.retry<=0){
      nav.path=[];return waypoint(mon,0,tx,tz);
    }
    return point||null;
  }
  return {prepare,spawn,spawnNear,waypoint,
    arrived(mon){const nav=mon.navigation,p=nav?.path[nav.index];return !!p&&nav.index===nav.path.length-1&&Math.hypot(p.x-mon.g.position.x,p.z-mon.g.position.z)<.5;},
    resetRoute(mon,recover=false){if(mon.navigation){mon.navigation.path=[];mon.navigation.retry=0;mon.navigation.recovering=recover;}},
    info:()=>({...state,radius,step,bytes:free.byteLength+edges.byteLength+connected.byteLength+queue.byteLength+parent.byteLength+seen.byteLength})};
}
