// Local, unverified Score V1. No network transport, credentials or ranking authority.
export const SCORE_RULES = Object.freeze({version:'ma-score-v1',kill:100,headshotKill:25,swarmKill:1,
  completedWave:250,survivalPerSecond:1,survivalCap:60});
const STORAGE_KEY='ma_score_record_v1';
const validScore=n=>Number.isSafeInteger(n)&&n>=0;

export function createScoreSystem({getStorage=()=>globalThis.localStorage,
  onChange=()=>{},onEvent=()=>{},newRunId=()=>globalThis.crypto?.randomUUID?.()||`local-${Date.now()}-${Math.random()}`}={}) {
  let best=0,dirty=false,flushTimer=null,runId=null,sequence=0,ended=true,active=false;
  let lastNow=0,activeMs=0,waveMs=0,wave=1,total=0,kills=0,headshots=0,completedWaves=0;
  let breakdown={kills:0,headshots:0,waves:0,survival:0},defeated=new Set(),completed=new Set(),lastResult=null;
  try{const saved=JSON.parse(getStorage().getItem(STORAGE_KEY)||'null');
    if(saved?.rulesVersion===SCORE_RULES.version&&validScore(saved.best))best=saved.best;
  }catch(_){}
  const roundedMs=n=>Math.floor(n+1e-6);
  function info(){return {runId,rulesVersion:SCORE_RULES.version,verification:'local_unverified',
    score:total,best,kills,headshotKills:headshots,completedWaves,wave,
    activeMs:roundedMs(activeMs),waveActiveMs:roundedMs(waveMs),active,ended,
    breakdown:{...breakdown},lastResult:lastResult?{...lastResult,breakdown:{...lastResult.breakdown}}:null};}
  function notify(){try{onChange(info());}catch(_){/* UI cannot interrupt gameplay. */}}
  function emit(type,payload={}){
    const event={protocolVersion:1,gameId:'monster-apocalypse',runId,rulesVersion:SCORE_RULES.version,
      verification:'local_unverified',sequence:++sequence,type,activeMs:roundedMs(activeMs),payload};
    try{onEvent(event);}catch(_){/* Future adapters cannot interrupt gameplay. */}
  }
  function advance(now){
    if(!Number.isFinite(now)||now<lastNow)return;
    if(!ended&&active){const delta=now-lastNow;activeMs+=delta;waveMs+=delta;}
    lastNow=now;
  }
  function flush(){
    if(flushTimer!==null){clearTimeout(flushTimer);flushTimer=null;}
    if(!dirty)return;
    try{const storage=getStorage();let saved;
      try{saved=JSON.parse(storage.getItem(STORAGE_KEY)||'null');}catch(_){}
      if(saved?.rulesVersion===SCORE_RULES.version&&validScore(saved.best))best=Math.max(best,saved.best);
      storage.setItem(STORAGE_KEY,JSON.stringify({rulesVersion:SCORE_RULES.version,
        verification:'local_unverified',best}));dirty=false;
    }catch(_){/* The in-memory record still works when storage is unavailable. */}
  }
  function award(part,points){
    breakdown[part]+=points;total+=points;
    if(total>best){best=total;dirty=true;if(flushTimer===null)flushTimer=setTimeout(flush,300);}
  }
  function finish(reason,now){
    if(ended||!['death','abandoned'].includes(reason))return null;
    advance(now);active=false;ended=true;
    lastResult={runId,rulesVersion:SCORE_RULES.version,verification:'local_unverified',reason,
      score:total,kills,headshotKills:headshots,completedWaves,activeMs:roundedMs(activeMs),breakdown:{...breakdown}};
    flush();emit('run_finished',{...lastResult,breakdown:{...breakdown}});notify();
    return info().lastResult;
  }
  const api={info,flush,finish,
    start(now){
      if(!Number.isFinite(now)||now<0)return;
      if(!ended)finish('abandoned',now);
      runId=newRunId();sequence=0;ended=false;active=false;lastNow=now;
      activeMs=0;waveMs=0;wave=1;total=0;kills=0;headshots=0;completedWaves=0;
      breakdown={kills:0,headshots:0,waves:0,survival:0};defeated=new Set();completed=new Set();
      emit('run_started',{wave});notify();
    },
    setActive(value,now){
      advance(now);const next=!ended&&value===true;
      if(active!==next){active=next;emit(active?'run_resumed':'run_paused',{wave});}
    },
    setWave(number,now){
      if(ended||number===wave)return;
      if(number!==wave+1||!completed.has(wave))return;
      advance(now);wave=number;waveMs=0;emit('wave_started',{wave});
    },
    defeat({enemyId,headshotFinal=false,waveNumber=wave,enemyType},now){
      if(ended||!active||waveNumber!==wave||completed.has(wave)||
        typeof enemyId!=='string'||!enemyId||defeated.has(enemyId))return false;
      const swarm=enemyType==='ground-swarm';
      advance(now);defeated.add(enemyId);kills++;award('kills',swarm?SCORE_RULES.swarmKill:SCORE_RULES.kill);
      if(headshotFinal===true){headshots++;if(!swarm)award('headshots',SCORE_RULES.headshotKill);}
      emit('enemy_defeated',{enemyId,wave,headshotFinal:headshotFinal===true,...(swarm?{enemyType:'ground-swarm'}:{})});notify();return true;
    },
    completeWave(number,now){
      if(ended||number!==wave||completed.has(number))return false;
      advance(now);active=false;completed.add(number);completedWaves++;
      const survivalSeconds=Math.min(SCORE_RULES.survivalCap,Math.floor((waveMs+1e-6)/1000));
      award('waves',SCORE_RULES.completedWave);award('survival',survivalSeconds*SCORE_RULES.survivalPerSecond);
      emit('wave_completed',{wave,survivalSeconds,waveActiveMs:roundedMs(waveMs)});flush();notify();return true;
    },
  };
  notify();return api;
}
