import {createInvasionSequence,INVASION_TIMING} from './invasion-sequence.js';

// Presentation adapter reuses the game's one AudioContext, buses and V2 environment.
export function installInvasionIntro({audio,getEnvironment,getListener,unlockAudio,onComplete=()=>{}}){
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),prefs={subtitles:true,captionSize:18,reduced:false,haptics:false,ambience:.55,music:.32,effects:1};
 try{const saved=JSON.parse(localStorage.getItem('ma_invasion_v1')||'{}');for(const k of ['subtitles','reduced','haptics'])if(typeof saved[k]==='boolean')prefs[k]=saved[k];for(const k of ['ambience','music','effects'])if(Number.isFinite(saved[k]))prefs[k]=Math.max(0,Math.min(1,saved[k]));if([16,18,22].includes(saved.captionSize))prefs.captionSize=saved.captionSize;}catch{}
 const hapticAvailable=typeof navigator.vibrate==='function';let systemReduced=motion.matches;
 motion.addEventListener('change',e=>{systemReduced=e.matches;present();});
 const overlay=document.createElement('section');overlay.id='invasion-intro';overlay.hidden=true;overlay.setAttribute('aria-label','Introducción de Las Vegas');
 overlay.innerHTML='<div class="invasion-count"><span>LAS VEGAS · INVASIÓN</span><strong role="timer" aria-live="off">10</strong><small>PREPÁRATE</small></div><p class="invasion-caption" aria-live="polite"></p><button type="button" class="invasion-audio" hidden>ACTIVAR SONIDO</button>';
 document.body.append(overlay);
 const count=overlay.querySelector('strong'),countBox=overlay.querySelector('.invasion-count'),caption=overlay.querySelector('.invasion-caption'),audioButton=overlay.querySelector('button');
 const settings=document.createElement('fieldset');settings.className='invasion-settings';settings.id='invasion-settings';settings.innerHTML='<legend>CINE Y SONIDO</legend>';
 const pauseHost=document.createElement('details');pauseHost.className='graphics-disclosure';pauseHost.innerHTML='<summary>CONFIGURACIÓN · CINE Y SONIDO</summary>';
 document.querySelector('#pause-screen .pause-shell').insertBefore(pauseHost,document.querySelector('#pause-menu'));
 const menuHost=document.querySelector('#panel-settings .settings-card');menuHost.append(settings);
 const save=()=>{try{localStorage.setItem('ma_invasion_v1',JSON.stringify(prefs));}catch{}audio.setVolumes(prefs);};
 function checkbox(label,key,disabled=false){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=prefs[key];input.disabled=disabled;input.dataset.cinematicSetting=key;row.append(document.createTextNode(label),input);settings.append(row);input.addEventListener('change',()=>{prefs[key]=input.checked;save();});}
 checkbox('Subtítulos de la introducción','subtitles');checkbox('Reducir temblor (respeta también iOS)','reduced');checkbox(hapticAvailable?'Vibración al impacto':'Vibración no disponible en este navegador','haptics',!hapticAvailable);
 const label=document.createElement('label'),size=document.createElement('select');size.dataset.cinematicSetting='captionSize';for(const value of [16,18,22]){const option=document.createElement('option');option.value=value;option.textContent=value===16?'Estándar':value===18?'Grande':'Muy grande';size.append(option);}size.value=String(prefs.captionSize);label.append(document.createTextNode('Tamaño de subtítulos'),size);settings.append(label);size.addEventListener('change',()=>{prefs.captionSize=Number(size.value);save();});
 for(const [key,name]of [['ambience','Ambiente'],['music','Música'],['effects','Efectos']]){const row=document.createElement('label'),slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=100;slider.value=prefs[key]*100;slider.dataset.cinematicSetting=key;row.append(document.createTextNode(name),slider);settings.append(row);slider.addEventListener('input',()=>{prefs[key]=Number(slider.value)/100;save();});}
 const tracks=[
  {id:'sirens',start:0,end:4,channel:'ambience',volume:.16,loop:true},
  // Two real crowd recordings plus staggered human cries, never more than four
  // crowd sources. Separate positions create a city in panic without new mixers.
  {id:'crowd',start:0,end:7.7,channel:'ambience',volume:.40,loop:true,crowd:0},
  {id:'crowd-people',start:.35,end:7.7,channel:'ambience',volume:.34,loop:true,crowd:1},
  {id:'crowd-human',start:1.1,end:5.1,channel:'ambience',volume:.29,crowd:2},
  {id:'crowd-man',start:2.6,end:6.6,channel:'ambience',volume:.27,crowd:3},
  {id:'helicopter',start:2,end:4,channel:'ambience',volume:.18,loop:true},
  {id:'gunfire',start:3,end:5,channel:'effects',volume:.18},
  {id:'explosion',start:INVASION_TIMING.explosion,end:8,channel:'effects',volume:.65},
  {id:'rumble',afterBlast:3,end:10,channel:'effects',volume:.20},
  {id:'glass',afterBlast:3,end:9.8,channel:'effects',volume:.16},
  {id:'debris',afterBlast:3,end:10,channel:'effects',volume:.12},
 ];
 let mode='menu',prepared=null,voices=new Map(),finished=new Set(),lastSound='locked',haptics=0,lastClock=null;
 const helicopter={x:0,y:28,z:0},siren={x:0,y:1,z:0};
 const crowdPositions=[{x:-22,y:1,z:-28},{x:26,y:1,z:-14},{x:-12,y:1,z:18},{x:18,y:1,z:25}];
 const crowdAnchors=crowdPositions.map(()=>({x:0,y:1,z:0}));
 function stop(){for(const v of voices.values())audio.stopVoice(v);voices.clear();}
 const sequence=createInvasionSequence({
  event(cue,late){const env=getEnvironment();if(cue.id==='explosion'){env?.flashStratIntro?.(late<2);if(late<.3&&prefs.haptics&&hapticAvailable&&!document.hidden){try{if(navigator.vibrate([55,30,70]))haptics++;}catch{/* Sensor/permissions policy rejection never interrupts arrival. */}}}if(cue.id==='fire')env?.activateStratIntro?.();},
  number(value){count.textContent=String(value);count.setAttribute('aria-label',value+' segundos');},
  pauseAudio:stop,reducedMotion:()=>prefs.reduced||systemReduced,
  complete(){stop();document.body.classList.remove('invasion-active');onComplete();},
 });
 function present(){const s=sequence.info(),show=mode==='playing'&&!document.hidden&&s.phase!=='idle'&&(sequence.active||s.ageAfter<2.6);
  document.getElementById('wave-display').dataset.openingMessage=String(show&&sequence.active&&s.elapsed<4);
  overlay.hidden=!show;if(!show)return;countBox.hidden=!sequence.active&&s.ageAfter>.6;
  const captionPixels={16:13,18:14,22:18}[prefs.captionSize]||14;
  caption.style.fontSize=`clamp(${captionPixels}px,1.6vw,${captionPixels+2}px)`;
  caption.textContent=!prefs.subtitles?'':s.blastElapsed!==null&&s.elapsed+s.ageAfter>=s.blastElapsed+4.4?'JULIÁN: «¡Eso sonó cerca de la Strat!»':s.elapsed>=INVASION_TIMING.explosion?'[EXPLOSIÓN ENSORDECEDORA A LO LEJOS]':'';
  caption.hidden=!caption.textContent;audioButton.hidden=!show||!sequence.active||audio.info().context==='running';
 }
 function updateSound(){if(!sequence.active||mode!=='playing'||document.hidden){stop();return;}const s=sequence.info(),elapsed=s.elapsed,listener=getListener(),env=getEnvironment(),anchor=env?.stratIntroAnchor?.position||{x:-25,y:1,z:-32},audioInfo=audio.info();
  lastSound=audioInfo.context;if(lastSound!=='running'){stop();return;}
  helicopter.x=listener.x-65+(elapsed-2)*28;helicopter.z=listener.z-18;siren.x=listener.x+25;siren.z=listener.z-35;
  crowdAnchors.forEach((a,i)=>{a.x=listener.x+crowdPositions[i].x;a.z=listener.z+crowdPositions[i].z;});
  for(const track of tracks){const key='env-intro-'+track.id,start=track.afterBlast===undefined?track.start:s.blastElapsed===null?Infinity:s.blastElapsed+track.afterBlast,age=elapsed-start,v=voices.get(key);
   if(age<0||elapsed>=track.end){if(v)audio.stopVoice(v);voices.delete(key);continue;}
   if(v?.stopped){voices.delete(key);finished.add(key);continue;}
   // Fade the crowd under the explosion, then clear it before Julian's subtitle.
   const crowdDuck=track.crowd===undefined?1:1-.8*Math.min(1,Math.max(0,(elapsed-(INVASION_TIMING.explosion-.3))/.3));
   const fadeIn=track.crowd===undefined?1:Math.min(1,age/.18);
   const volume=track.volume*crowdDuck*fadeIn*(track.id==='helicopter'?.45+Math.max(0,age)/4:1)*Math.min(1,Math.max(0,(track.end-elapsed)/.5));
   if(v){audio.setVoiceVolume(v,volume,.08);continue;}
   if(finished.has(key))continue;
   const buffer=audioInfo.buffers.find(b=>b.id===key);if(!buffer)continue;
   if(!track.loop&&age>=buffer.duration){finished.add(key);continue;}
   const voice=audio.playClip(key,{kind:'invasion-'+track.id,volume,channel:track.channel,loop:!!track.loop,offset:track.loop?age%buffer.duration:age,anchor:track.crowd!==undefined?crowdAnchors[track.crowd]:track.id==='helicopter'?helicopter:track.id==='sirens'?siren:anchor,range:260,refDistance:35,listener});
   if(voice)voices.set(key,voice);
  }
 }
 const onUI=e=>{mode=e.detail;const host=mode==='paused'?pauseHost:menuHost;host.append(settings);if(mode!=='playing'){sequence.pause();lastClock=null;}present();};document.addEventListener('ma:ui-state',onUI);
 const visibility=()=>{if(document.hidden)sequence.pause();present();};document.addEventListener('visibilitychange',visibility);
 audioButton.addEventListener('click',()=>{unlockAudio();});
 return {
  get active(){return sequence.active;},
  async prepare(){if(!prepared)prepared=(async()=>{try{const url=new URL('./assets/audio/countdown-v1/manifest.json',location.href),r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)return;const manifest=await r.json();await audio.loadClips(manifest.assets,new URL('./',url));}catch{/* Recorded audio is optional; the sequence never blocks on it. */}})();await prepared;audio.setVolumes(prefs);},
  begin(key){const started=sequence.begin(key);if(started){lastClock=performance.now();finished.clear();getEnvironment()?.resetStratIntro?.();document.body.classList.add('invasion-active');present();}return started;},
  resume(){mode='playing';lastClock=performance.now();sequence.resume();present();},
  pause(){sequence.pause();lastClock=null;present();},
  cancel(){sequence.cancel();document.body.classList.remove('invasion-active');present();},
  update(dt,frame){mode=frame.mode;const now=performance.now(),activeDelta=lastClock===null?0:Math.min(dt,Math.max(0,(now-lastClock)/1000));lastClock=now;sequence.update(activeDelta,{playing:mode==='playing',visible:!document.hidden});updateSound();present();},
  shake:sequence.shake,
  blastLight:sequence.blastLight,
  fogDensity:base=>base+(Math.max((prefs.reduced||systemReduced) ? .12 : .16,base*((prefs.reduced||systemReduced) ? 1.25 : 1.7))-base)*sequence.dust(),
  info:()=>({...sequence.info(),dust:sequence.dust(),blastLight:sequence.blastLight(),preferences:{...prefs},systemReducedMotion:systemReduced,audioContext:lastSound,activeVoices:voices.size,hapticAvailable,haptics}),
 };
}
