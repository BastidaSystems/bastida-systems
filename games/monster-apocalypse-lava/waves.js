export const waveSettings = number => ({number,total:10+5*(number-1),
  healthMultiplier:1+.12*(number-1),maxAlive:Math.min(14,7+Math.floor((number-1)/2)),
  interval:Math.max(.8,1.8-(number-1)*.1),
  floating:number<2?0:Math.min(3,1+Math.floor((number-2)/3))});

// Spiders are auxiliary encounters: never consume principal slots or block completion.
export function swarmWaveSettings(number){return {...waveSettings(number),swarm:Math.min(10,5+number),maxExtraAlive:6};}
// Level 1: walkers first; spiders and flyers from wave 2.
// Add 1/2/3/... explosives on waves 5/7/10/12/15/17/....
// Special encounters occupy principal slots and must be defeated to finish the wave.
export function levelOneWaveSettings(number,swarmReady=true){
  const special=number>=5&&(number%5===0||number%5===2);
  return {...waveSettings(number),swarm:number>=2&&swarmReady?Math.min(10,5+number):0,maxExtraAlive:number>=2&&swarmReady?6:0,
    explosive:special?Math.floor(number/5)*2-(number%5===0?1:0):0};
}
export function createWaveSystem({spawn,getAlive,getExtraAlive=()=>0,onComplete,onChange,swarm=false,levelOne=false,singleEnemy=false,singleEnemyKind='explosive',initialWave=1}) {
  const firstWave=Number.isInteger(initialWave)&&initialWave>0?initialWave:1;
  const swarmActive=()=>typeof swarm==='function'?swarm():swarm;
  const settingsFor=number=>singleEnemy?{...waveSettings(number),total:1,maxAlive:1,floating:0,swarm:0,explosive:0,maxExtraAlive:0}:
    levelOne?levelOneWaveSettings(number,swarmActive()):swarmActive()?swarmWaveSettings(number):waveSettings(number);
  const state={number:1,phase:'active',spawned:0,timer:1,queue:[],extraPending:0,extraSpawned:0,extraTimer:1};
  function begin(number,notify=true) {
    const settings=settingsFor(number);
    Object.assign(state,{number,phase:'active',spawned:0,timer:1,extraPending:settings.swarm||0,extraSpawned:0,extraTimer:1});
    state.queue=Array.from({length:settings.total},()=>singleEnemy?singleEnemyKind:'ground');
    for(let i=1;i<=settings.floating;i++)state.queue[Math.floor(i*settings.total/(settings.floating+1))]='floating';
    for(let i=1;i<=(settings.explosive||0);i++){
      const preferred=Math.floor(i*settings.total/(settings.explosive+1));
      // Keep every flyer when a special's preferred slot is already occupied.
      let slot=preferred;
      while(state.queue[slot]!=='ground')slot=(slot+1)%settings.total;
      state.queue[slot]='explosive';
    }
    if(notify)onChange?.();
  }
  begin(firstWave,false);
  return {state,
    reset(){begin(firstWave);},
    update(dt) {
      if(state.phase==='complete')return;
      if(state.phase==='intermission') {
        state.timer-=dt;if(state.timer<=0)begin(state.number+1);return;
      }
      const settings=settingsFor(state.number),alive=getAlive();
      state.timer-=dt;
      if(state.queue.length&&state.timer<=0&&alive<settings.maxAlive) {
        const entity=spawn(state.queue[0],settings);
        if(entity){state.queue.shift();state.spawned++;state.timer=settings.interval;onChange?.();}
        else state.timer=.35; // No safe nearby slot: bounded retry, without consuming the queue.
      }
      if(!state.queue.length&&getAlive()===0) {
        state.phase=singleEnemy?'complete':'intermission';state.timer=singleEnemy?0:8;state.extraPending=0;
        onComplete?.(state.number);onChange?.();return;
      }
      state.extraTimer-=dt;
      if(state.extraPending&&state.extraTimer<=0&&getExtraAlive()<(settings.maxExtraAlive||0)){
        if(spawn('swarm',settings)){state.extraPending--;state.extraSpawned++;state.extraTimer=2.8;onChange?.();}
        else state.extraTimer=.35;
      }
    },
    info(){const settings=settingsFor(state.number);return {...settings,phase:state.phase,
      spawned:state.spawned,pending:state.queue.length,alive:getAlive(),
      remaining:state.queue.length+getAlive(),nextIn:state.phase==='intermission'?Math.max(0,state.timer):0,
      extras:{spawned:state.extraSpawned,pending:state.extraPending,alive:getExtraAlive(),maxAlive:settings.maxExtraAlive||0}};},
  };
}
