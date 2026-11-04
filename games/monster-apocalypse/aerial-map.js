// Baked from the actual level. Canvas overlays use the same georeferenced bounds;
// no second renderer, camera loop, game simulation or exploration writes.
export function validateAerialMap(data){
  const b=data?.bounds;
  if(data?.schema!==1||data.projection!=='orthographic-top-down'||data.north!=='-Z'||data.east!=='+X'||
    !/^[a-z0-9-]+\.(webp|png)$/.test(data.image)||
    ![data.width,data.height].every(n=>Number.isInteger(n)&&n>0&&n<=2048)||data.width*data.height>2097152||
    !b||![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite)||b.maxX<=b.minX||b.maxZ<=b.minZ)
    throw Error('Invalid aerial map');
  const expected=(b.maxX-b.minX)/(b.maxZ-b.minZ);
  if(Math.abs(data.width/data.height-expected)>expected*.01)throw Error('Aerial projection aspect mismatch');
  return data;
}
export function projectAerialPoint(data,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  return {x:(x-data.bounds.minX)/(data.bounds.maxX-data.bounds.minX)*data.width,
    y:(z-data.bounds.minZ)/(data.bounds.maxZ-data.bounds.minZ)*data.height};
}
export function createAerialMap({canvas,drawArrow,onReady=()=>{},manifestURL='assets/map/aerial-v1.json'}){
  let status='idle',pending=null,metadata=null,image=null,disposed=false,draws=0,loads=0;
  let request=null;
  function load(){
    if(disposed)return Promise.resolve(false);if(status==='ready')return Promise.resolve(true);if(pending)return pending;
    status='loading';loads++;request=new AbortController();
    const timer=setTimeout(()=>request?.abort(),15000);
    pending=(async()=>{
      try{
        const url=new URL(manifestURL,location.href),response=await fetch(url,{signal:request.signal});
        if(!response.ok)throw Error('Aerial map unavailable');const data=validateAerialMap(await response.json());
        const candidate=new Image();
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>{candidate.src='';reject(Error('Aerial image timeout'));},15000);
          candidate.onload=()=>{clearTimeout(timer);resolve();};candidate.onerror=()=>{clearTimeout(timer);reject(Error('Aerial image unavailable'));};
          candidate.src=new URL(data.image,url).href;
        });
        if(disposed)return false;
        if(candidate.naturalWidth!==data.width||candidate.naturalHeight!==data.height)throw Error('Aerial image dimensions mismatch');
        metadata=data;image=candidate;status='ready';onReady();return true;
      }catch{if(!disposed)status='unavailable';return false;}
      finally{clearTimeout(timer);pending=null;request=null;}
    })();return pending;
  }
  return {
    load,
    draw(player,yaw){
      if(disposed)return false;
      if(status!=='ready'){void load();return false;}
      if(![player?.x,player?.z,yaw].every(Number.isFinite))return false;
      if(canvas.width!==metadata.width)canvas.width=metadata.width;
      if(canvas.height!==metadata.height)canvas.height=metadata.height;
      const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
      const rect=canvas.getBoundingClientRect(),scale=Math.max(.1,Math.min(rect.width/canvas.width,rect.height/canvas.height)),unit=1/scale;
      const p=projectAerialPoint(metadata,player.x,player.z),margin=15*unit;
      p.x=Math.max(margin,Math.min(canvas.width-margin,p.x));p.y=Math.max(margin,Math.min(canvas.height-margin,p.y));
      ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,12*unit,0,Math.PI*2);ctx.fillStyle='#04141cc9';ctx.fill();ctx.lineWidth=1.5*unit;ctx.strokeStyle='#8de1ff';ctx.stroke();
      drawArrow(ctx,p.x,p.y,8*unit,-yaw);ctx.restore();
      ctx.save();ctx.font=`700 ${12*unit}px system-ui`;ctx.textAlign='right';ctx.textBaseline='top';ctx.lineWidth=4*unit;ctx.strokeStyle='#05090fe6';ctx.fillStyle='#f0ebe2';
      ctx.strokeText('N ↑',canvas.width-10*unit,10*unit);ctx.fillText('N ↑',canvas.width-10*unit,10*unit);ctx.restore();draws++;return true;
    },
    dispose(){disposed=true;request?.abort();image=null;metadata=null;status='disposed';},
    info:()=>({status,draws,loads,id:metadata?.id??null,projection:'north-up',contexts:0,runtimeReadbacks:0,dimensions:metadata?[metadata.width,metadata.height]:null}),
  };
}
