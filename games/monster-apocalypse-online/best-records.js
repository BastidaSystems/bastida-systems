// Per-browser best single-run totals; storage failures never interrupt a match.
export function createBestRecords({onChange=()=>{},getStorage=()=>globalThis.localStorage}={}) {
  const key='ma_best_records_v1';
  const valid=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  let best={waves:0,kills:0},timer=null,dirty=false;
  try { const saved=JSON.parse(getStorage().getItem(key)||'null');best={waves:valid(saved?.waves),kills:valid(saved?.kills)}; } catch (_) {}
  function flush(){
    if(timer!==null){clearTimeout(timer);timer=null;}
    if(!dirty)return;
    try {
      const storage=getStorage();let saved;try{saved=JSON.parse(storage.getItem(key)||'null');}catch(_){saved=null;}
      best.waves=Math.max(best.waves,valid(saved?.waves));best.kills=Math.max(best.kills,valid(saved?.kills));
      storage.setItem(key,JSON.stringify(best));dirty=false;
    } catch (_) { /* Records still work in memory when storage is blocked. */ }
  }
  onChange({...best});
  return {
    info:()=>({...best}),flush,
    update({waves=0,kills=0}) {
      const next={waves:Math.max(best.waves,valid(waves)),kills:Math.max(best.kills,valid(kills))};
      if(next.waves===best.waves&&next.kills===best.kills)return;
      best=next;dirty=true;onChange({...best});
      if(timer===null)timer=setTimeout(flush,300);
    },
  };
}
