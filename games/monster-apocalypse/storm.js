import {Color} from 'three';

const FLASH=[[0,0],[.025,1],[.15,.58],[.22,.38],[.27,.88],[.42,.54],[.75,.25],[1.25,0]];
function flashAt(time){
  for(let i=1;i<FLASH.length;i++)if(time<FLASH[i][0]){
    const [a,x]=FLASH[i-1],[b,y]=FLASH[i];return x+(y-x)*(time-a)/(b-a);
  }
  return 0;
}
function stormRandom(){
  // Weather has its own random stream, independent of combat and AI.
  let seed=Date.now()>>>0;
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}

export function createStorm({keyLight,fillLight,fog,random=stormRandom()}){
  const cool=new Color(0xc4ddff),cloud=new Color(0x697b92);
  const baseKey=keyLight.color.clone(),baseFill=fillLight.color.clone(),baseFog=fog.color.clone();
  let keyIntensity=keyLight.intensity,fillIntensity=fillLight.intensity,density=fog.density;
  let next=.6,age=-1,pending=-1,strength=0,applied=false,context,buffer,voice,output;
  const state={flashes:0,thunders:0};
  function restore(){
    if(!applied)return;
    keyLight.intensity=keyIntensity;keyLight.color.copy(baseKey);
    fillLight.intensity=fillIntensity;fillLight.color.copy(baseFill);
    fog.density=density;fog.color.copy(baseFog);applied=false;strength=0;
  }
  function stopVoice(){
    if(!voice)return;
    const v=voice;voice=null;
    try{v.gain.gain.cancelScheduledValues(context.currentTime);v.gain.gain.setTargetAtTime(0,context.currentTime,.015);v.source.stop(context.currentTime+.06);}catch{/* Already ended. */}
  }
  function primeAudio(ac,destination){
    if(!ac||buffer)return;
    try{
      context=ac;output=destination||ac.destination;buffer=ac.createBuffer(1,72000,24000);
      const samples=buffer.getChannelData(0);let low=0;
      for(let i=0;i<samples.length;i++){
        const noise=random()*2-1;low=low*.98+noise*.02;
        samples[i]=Math.max(-.9,Math.min(.9,low*4+noise*.035));
      }
    }catch{buffer=null;}
  }
  function thunder(){
    if(!buffer||context.state!=='running')return;
    stopVoice();
    const source=context.createBufferSource(),gain=context.createGain();
    const high=context.createBiquadFilter(),low=context.createBiquadFilter();
    high.type='highpass';high.frequency.value=35;low.type='lowpass';low.frequency.value=850;
    source.buffer=buffer;source.playbackRate.value=.88+random()*.2;
    const start=context.currentTime,duration=buffer.duration/source.playbackRate.value;
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.5,start+.055);
    gain.gain.exponentialRampToValueAtTime(.18,start+.45);
    gain.gain.exponentialRampToValueAtTime(.001,start+duration-.08);
    gain.gain.linearRampToValueAtTime(0,start+duration);
    source.connect(high).connect(low).connect(gain).connect(output);
    const current={source,gain};voice=current;
    source.onended=()=>{source.disconnect();high.disconnect();low.disconnect();gain.disconnect();if(voice===current)voice=null;};
    source.start();source.stop(start+duration);state.thunders++;
  }
  function suspend(){restore();age=pending=-1;stopVoice();}
  function update(dt,mode){
    if(mode!=='playing'){suspend();return;}
    if(pending>=0){pending-=dt;if(pending<=0){pending=-1;thunder();}}
    if(age<0){
      next-=dt;if(next>0)return;
      keyIntensity=keyLight.intensity;fillIntensity=fillLight.intensity;density=fog.density;
      baseKey.copy(keyLight.color);baseFill.copy(fillLight.color);baseFog.copy(fog.color);
      age=0;pending=.55+random()*.7;next=8+random()*6;state.flashes++;
    }else age+=dt;
    if(age>=1.25){restore();age=-1;return;}
    strength=flashAt(age);applied=true;
    keyLight.intensity=keyIntensity+strength*5.9;keyLight.color.lerpColors(baseKey,cool,strength*.85);
    fillLight.intensity=fillIntensity+strength*1.4;fillLight.color.lerpColors(baseFill,cool,strength*.75);
    // The city becomes visible through the storm, rather than washing the screen white.
    fog.density=density+(Math.min(density,.023)-density)*strength;
    fog.color.lerpColors(baseFog,cloud,strength*.4);
  }
  return {update,primeAudio,suspend,get strength(){return strength;},reset(){suspend();next=.6;},
    info:()=>({...state,active:age>=0,strength,nextIn:next,pendingThunder:pending>=0,audioReady:!!buffer,activeVoices:voice?1:0})};
}
