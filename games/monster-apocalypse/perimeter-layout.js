// Pure layout: exterior of the playable rectangle plus buildings that cross its boundary.
const intersects=(a,b)=>a.minX<b.maxX-1e-6&&a.maxX>b.minX+1e-6&&a.minZ<b.maxZ-1e-6&&a.maxZ>b.minZ+1e-6;
export function perimeterOutline(rectangles){
  const xs=[...new Set(rectangles.flatMap(r=>[r.minX,r.maxX]))].sort((a,b)=>a-b);
  const zs=[...new Set(rectangles.flatMap(r=>[r.minZ,r.maxZ]))].sort((a,b)=>a-b);
  const inside=xs.slice(0,-1).map((x,i)=>zs.slice(0,-1).map((z,j)=>{
    const cx=(x+xs[i+1])/2,cz=(z+zs[j+1])/2;
    return rectangles.some(r=>cx>r.minX&&cx<r.maxX&&cz>r.minZ&&cz<r.maxZ);
  }));
  const pieces=[];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++)if(inside[i][j]){
    if(!inside[i-1]?.[j])pieces.push({axis:'z',fixed:xs[i],min:zs[j],max:zs[j+1],nx:-1,nz:0,edge:'west'});
    if(!inside[i+1]?.[j])pieces.push({axis:'z',fixed:xs[i+1],min:zs[j],max:zs[j+1],nx:1,nz:0,edge:'east'});
    if(!inside[i]?.[j-1])pieces.push({axis:'x',fixed:zs[j],min:xs[i],max:xs[i+1],nx:0,nz:-1,edge:'north'});
    if(!inside[i]?.[j+1])pieces.push({axis:'x',fixed:zs[j+1],min:xs[i],max:xs[i+1],nx:0,nz:1,edge:'south'});
  }
  const groups=new Map();
  for(const p of pieces){const key=[p.axis,p.fixed,p.nx,p.nz].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  const outline=[];
  for(const group of groups.values()){
    group.sort((a,b)=>a.min-b.min);let current;
    for(const p of group){if(current&&Math.abs(current.max-p.min)<1e-6)current.max=p.max;else{current={...p};outline.push(current);}}
  }
  return outline;
}
function subtract(spans,min,max){return spans.flatMap(([a,b])=>max<=a||min>=b?[[a,b]]:[...(min>a?[[a,min]]:[]),...(max<b?[[max,b]]:[])]);}

export function planPerimeter({mapLimits,buildings,size,primary}){
  const map={minX:-mapLimits.halfW,maxX:mapLimits.halfW,minZ:-mapLimits.halfL,maxZ:mapLimits.halfL};
  const union=[map,...buildings.filter(r=>intersects(r,map))],outline=perimeterOutline(union),segments=[...primary];
  const margin=.15,corner=.75,overlap=2.5,targetHeight=6;
  const yawFor={south:Math.PI,north:0,west:Math.PI/2,east:-Math.PI/2};
  const maxDepth=(size.depth+size.width*.006)*targetHeight/size.height;
  for(const line of outline){
    const sign=line.nx||line.nz,near=line.fixed+sign*margin,far=near+sign*maxDepth;
    const normalMin=Math.min(near,far),normalMax=Math.max(near,far);
    let spans=[[line.min-corner,line.max+corner]];
    // Clip tangential corner extensions wherever they would intersect the city or a protected building.
    for(const r of union){
      const lo=line.axis==='x'?r.minZ:r.minX,hi=line.axis==='x'?r.maxZ:r.maxX;
      if(normalMin<hi&&normalMax>lo)spans=subtract(spans,(line.axis==='x'?r.minX:r.minZ)-margin,(line.axis==='x'?r.maxX:r.maxZ)+margin);
    }
    if(line.edge==='south'&&Math.abs(line.fixed-mapLimits.halfL)<.001)spans=subtract(spans,-18.5,18.5);
    for(const [a,b]of spans){
      if(line.edge==='south'&&Math.abs(line.fixed-mapLimits.halfL)<.001&&a>=-20&&b<=20)continue;
      const length=b-a;if(length<.05)continue;
      const turn=segments.length%2?.006:-.006,yaw=yawFor[line.edge]+turn;
      const c=Math.abs(Math.cos(turn)),s=Math.abs(Math.sin(turn));
      const unitWidth=size.width*c+size.depth*s,unitDepth=size.depth*c+size.width*s;
      const maxWidth=unitWidth*targetHeight/size.height;
      const count=Math.max(1,Math.ceil((length-overlap)/(maxWidth-overlap)));
      const width=(length+(count-1)*overlap)/count,scale=width/unitWidth,depth=unitDepth*scale;
      for(let i=0;i<count;i++){
        const tangent=a+width/2+i*(width-overlap),normal=near+sign*depth/2;
        const x=line.axis==='x'?tangent:normal,z=line.axis==='x'?normal:tangent;
        const rect=line.axis==='x'?{minX:tangent-width/2,maxX:tangent+width/2,minZ:normal-depth/2,maxZ:normal+depth/2}:
          {minX:normal-depth/2,maxX:normal+depth/2,minZ:tangent-width/2,maxZ:tangent+width/2};
        if(buildings.some(r=>intersects(rect,r)))throw new Error('Barricada sobre un edificio protegido');
        segments.push({x,y:-.02,z,yaw,scale,height:size.height*scale,edge:line.edge,lod:'perimeter',line:{...line},
          bounds:{min:[rect.minX,-.02,rect.minZ],max:[rect.maxX,size.height*scale-.02,rect.maxZ]}});
      }
    }
  }
  // Diagonal organic clusters bridge the visible cores, rather than only touching base boxes.
  const vertices=new Map();
  for(const line of outline)for(const tangent of [line.min,line.max]){
    const x=line.axis==='x'?tangent:line.fixed,z=line.axis==='x'?line.fixed:tangent,key=[x,z].join('|');
    if(!vertices.has(key))vertices.set(key,{x,z,lines:[]});vertices.get(key).lines.push(line);
  }
  const addCluster=(x,z,yaw,height,corner)=>{
    const scale=height/size.height,c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
    const w=(size.width*c+size.depth*s)*scale,d=(size.width*s+size.depth*c)*scale;
    const r={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
    if(buildings.some(b=>intersects(r,b)))return false;
    segments.push({x,y:-.02,z,yaw,scale,height,edge:'corner',lod:'perimeter',corner,
      bounds:{min:[r.minX,-.02,r.minZ],max:[r.maxX,height-.02,r.maxZ]}});return true;
  };
  for(const v of vertices.values()){
    if(v.lines.length!==2)continue;
    const nx=v.lines[0].nx+v.lines[1].nx,nz=v.lines[0].nz+v.lines[1].nz;
    if(!nx||!nz)continue;const yaw=Math.atan2(-nx,-nz),height=2.5,scale=height/size.height;
    const half=(size.width+size.depth)*scale/Math.sqrt(2)/2,corner={x:v.x,z:v.z};
    if(!addCluster(v.x+nx*1.5,v.z+nz*1.5,yaw,height,corner)){
      addCluster(v.x+nx*(half+margin),v.z+nz*1.5,yaw,height,corner);
      addCluster(v.x+nx*1.5,v.z+nz*(half+margin),yaw,height,corner);
    }
  }
  addCluster(-19,59.6,Math.PI/4,1.6,{x:-20,z:58});
  return {segments,outline,length:outline.reduce((n,l)=>n+l.max-l.min,0),map};
}

export function outsideFoundation(segments,ground){
  const pieces=[];
  for(const s of segments){const [x,,z]=s.bounds.min,[X,,Z]=s.bounds.max;
    if(x<ground.minX)pieces.push({minX:x,maxX:Math.min(X,ground.minX),minZ:z,maxZ:Z});
    if(X>ground.maxX)pieces.push({minX:Math.max(x,ground.maxX),maxX:X,minZ:z,maxZ:Z});
    const lo=Math.max(x,ground.minX),hi=Math.min(X,ground.maxX);
    if(hi>lo&&z<ground.minZ)pieces.push({minX:lo,maxX:hi,minZ:z,maxZ:Math.min(Z,ground.minZ)});
    if(hi>lo&&Z>ground.maxZ)pieces.push({minX:lo,maxX:hi,minZ:Math.max(z,ground.maxZ),maxZ:Z});
  }
  if(!pieces.length)return [];
  const xs=[...new Set(pieces.flatMap(p=>[p.minX,p.maxX]))].sort((a,b)=>a-b),result=[];
  for(let i=0;i<xs.length-1;i++){
    const x=xs[i],X=xs[i+1],mid=(x+X)/2,spans=pieces.filter(r=>mid>r.minX&&mid<r.maxX).map(r=>[r.minZ,r.maxZ]).sort((a,b)=>a[0]-b[0]);
    const merged=[];for(const [z,Z]of spans){const last=merged.at(-1);if(last&&z<=last[1]+1e-6)last[1]=Math.max(last[1],Z);else merged.push([z,Z]);}
    for(const [z,Z]of merged)result.push({minX:x,maxX:X,minZ:z,maxZ:Z});
  }
  return result;
}
