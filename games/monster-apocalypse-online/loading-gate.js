export function createLoadingGate({checks,onProgress,getError=()=>null,minMs=5000,timeoutMs=120000}) {
  const state={active:false,elapsed:0,ready:0,total:checks.length};
  return {state,
    async wait(){
      if(state.active)throw new Error('Carga en curso');
      const started=performance.now();state.active=true;
      try{
        while(true){
          const error=getError();if(error)throw new Error(error);
          state.elapsed=performance.now()-started;
          state.ready=checks.filter(check=>check()).length;
          onProgress(Math.min(state.ready/state.total,state.elapsed/minMs));
          if(state.ready===state.total&&state.elapsed>=minMs)return;
          if(state.elapsed>timeoutMs)throw new Error('La carga no terminó');
          await new Promise(resolve=>setTimeout(resolve,100));
        }
      }finally{state.active=false;}
    },
    info(){return {...state};},
  };
}
