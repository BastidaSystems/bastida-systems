import {sampleQuakeShake} from './invasion-sequence.js';
import {createQuakeBraces} from './quake-braces.js?v=20261017-stagger15';

// Reuse decoded recordings, existing buses and limiter. This clock never feeds combat RNG/Score.
export function createCityChaos({audio,firstQuake=12,seed=0x51ac7,groundEnemy=()=>{}}={}){
 const braces=createQuakeBraces(),voices=new Map();
 let clock=0,nextQuake=firstQuake,quakeStart=null,nextGun=0,nextCry=3,serial=0,rng=seed>>>0,active=false,reduced=false;
 let nextSiren=1.5,sirenPass=null;
 const stats={quakes:0,gunfire:0,cries:0,sirenPasses:0,maxVoices:0};
 const anchors=[{x:-42,y:3,z:-48},{x:40,y:2,z:-26},{x:-38,y:2,z:24},{x:38,y:2,z:36}];
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 function stop(){for(const {voice}of voices.values())audio.stopVoice(voice);voices.clear();}
 function play(key,id,{volume,channel='ambience',loop=false,anchor,listener,offset=0}={}){
  if(voices.has(key)||voices.size>=7)return;
  const clip=audio.info().buffers.find(b=>b.id===id);if(!clip)return;
  anchor=anchor||anchors[serial++%4];
  const voice=audio.playClip(id,{kind:'city-chaos-'+key,channel,volume,loop,anchor,listener,range:260,refDistance:35,offset:loop?offset%clip.duration:offset});
  if(voice)voices.set(key,{voice,end:loop?Infinity:clock+clip.duration-offset});
  stats.maxVoices=Math.max(stats.maxVoices,voices.size);
  return voice;
 }
 function updateSiren(listener){
  if(!sirenPass&&clock>=nextSiren){
   const clip=audio.info().buffers.find(b=>b.id==='env-intro-sirens');
   if(!clip||!listener){nextSiren=clock+4;return;}
   const direction=stats.sirenPasses%2?-1:1;
   sirenPass={start:clock,duration:clip.duration,direction,origin:{x:listener.x,z:listener.z},position:{x:0,y:2,z:0},volume:0};
   nextSiren=clock+clip.duration+22+random()*16;stats.sirenPasses++;
  }
  if(!sirenPass)return;
  const age=clock-sirenPass.start,t=age/sirenPass.duration;
  if(t>=1){const v=voices.get('vehicle-siren');if(v)audio.stopVoice(v.voice);voices.delete('vehicle-siren');sirenPass=null;return;}
  // Capture the road pass once: moving the player cannot drag the siren along.
  sirenPass.position.x=sirenPass.origin.x+sirenPass.direction*(30+155*t);
  sirenPass.position.z=sirenPass.origin.z-24-50*t;
  const fade=Math.max(0,Math.min(1,(t-.1)/.9)),smooth=fade*fade*(3-2*fade);
  sirenPass.volume=.14*Math.min(1,age/.3)*(1-smooth);
  const v=voices.get('vehicle-siren')?.voice||play('vehicle-siren','env-intro-sirens',{volume:sirenPass.volume,anchor:sirenPass.position,listener,offset:age});
  if(v)audio.setVoiceVolume(v,sirenPass.volume,.08);
 }
 const quake=()=>active&&quakeStart!==null&&clock-quakeStart<2.8?{active:true,id:stats.quakes,age:clock-quakeStart,reduced}:null;
 return {
  update(dt,{mode='menu',hidden=false,intro=false,listener,prefs={},systemReducedMotion=false}={}){
   braces.restore();active=mode==='playing'&&!hidden&&!intro;
   reduced=!!(prefs.reduced||systemReducedMotion);
   if(!active){stop();return;}
   if(Number.isFinite(dt)&&dt>0)clock+=Math.min(dt,.1);
   for(const [key,v]of voices)if(v.voice.stopped||clock>=v.end){audio.stopVoice(v.voice);voices.delete(key);}
   // Two staggered crowds leave room for the rifle, breathing and enemy audio.
   play('crowd-a','env-intro-crowd',{volume:.20,loop:true,anchor:anchors[0],listener,offset:clock});
   play('crowd-b','env-intro-crowd-people',{volume:.17,loop:true,anchor:anchors[1],listener,offset:clock+2.1});
   updateSiren(listener);
   if(clock>=nextGun){nextGun=clock+4.8+random()*2.6;play('gunfire','env-intro-gunfire',{volume:.20,listener});stats.gunfire++;}
   if(clock>=nextCry){nextCry=clock+8+random()*5;play('cry',serial%2?'env-intro-crowd-human':'env-intro-crowd-man',{volume:.19,listener});stats.cries++;}
   if(clock>=nextQuake){
    quakeStart=clock;nextQuake=clock+18+random()*10;stats.quakes++;
    play('rumble','env-intro-rumble',{volume:.22,channel:'effects',listener,anchor:anchors[0]});
    play('structure','env-intro-debris',{volume:.12,channel:'effects',listener,anchor:anchors[0]});
    if(prefs.haptics&&!reduced&&typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')try{navigator.vibrate([35,30,45]);}catch{}
   }
  },
  shake(){const q=quake();return q&&!q.reduced?sampleQuakeShake(q.age,2.8,.65):[0,0,0];},
  reaction:quake,
  setEnemyReaction:gltf=>braces.setAnimation(gltf),
  bracePlayer(bones){const q=quake();if(q)braces.apply(bones,q.age,{player:true,reduced:q.reduced});},
  reactEnemies(enemies){const q=quake();if(q)for(const e of braces.enemies(enemies,q.age,q.reduced)){if(e.alien){braces.preservePosition(e.alien.visual);groundEnemy(e);}}},
  restoreReactions:braces.restore,
  stop(){active=false;stop();braces.restore();},
  reset(){this.stop();clock=0;nextQuake=firstQuake;quakeStart=null;nextGun=0;nextCry=3;nextSiren=1.5;sirenPass=null;serial=0;rng=seed>>>0;for(const key of Object.keys(stats))stats[key]=0;},
  info:()=>({clock,nextQuake,quake:quake(),...stats,activeVoices:voices.size,braces:braces.info(),siren:sirenPass?{age:clock-sirenPass.start,duration:sirenPass.duration,position:{...sirenPass.position},volume:sirenPass.volume}:null,nextSiren,vehicleAudio:'Passing ambulance siren, no loop; engine/horn recordings not supplied'}),
 };
}
