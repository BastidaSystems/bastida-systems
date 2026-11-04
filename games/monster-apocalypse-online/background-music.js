export const MUSIC_TRACKS=Object.freeze([
 {title:'Thrash Metal — Alex Morgan',url:'assets/audio/music/alex-morgan-thrash-metal-591343.mp3'},
 {title:'This Heavy Metal — MrClaps',url:'assets/audio/music/mrclaps-this-heavy-metal-492569.mp3'},
 {title:'Intense Black Metal — Nick Panek',url:'assets/audio/music/nickpanek-intense-black-metal-instrumental-304729.mp3'},
 {title:'Heavy Force — Strawberry Candy',url:'assets/audio/music/strawberry_candy-powerful-heavy-metal-heavy-force-572627.mp3'},
 {title:'Jazz Restaurant Music — Alex Morgan',url:'assets/audio/music/alex-morgan-jazz-restaurant-music-563578.mp3'},
 {title:'Holiday Christmas Music — VJGalaxy',url:'assets/audio/music/vjgalaxy-holiday-christmas-music-03-436293.mp3'},
]);

// One streamed media element, routed through the game's existing music bus.
// No playlist decoding, extra AudioContext, scene writes or gameplay timers.
export function createBackgroundMusic({getOutput,tracks=MUSIC_TRACKS,createAudio=()=>new Audio()}){
 let media,source,gain,index=0,selected=false,primed=false,wanted=false,pending=null,blocked=false,generation=0,disposed=false;
 const failures=new Set();
 function ensure(){
  if(disposed||!tracks.length)return false;
  const output=getOutput();if(!output)return false;
  if(!media){
   media=createAudio();media.preload='none';media.loop=false;
   media.addEventListener('ended',next);
   media.addEventListener('error',failed);
   gain=output.context.createGain();gain.gain.value=0;gain.connect(output);
   source=output.context.createMediaElementSource(media);source.connect(gain);
  }
  return true;
 }
 function select(){generation++;media.src=tracks[index].url;selected=true;media.load();}
 function silence(){if(gain)gain.gain.setValueAtTime(0,gain.context.currentTime);media?.pause();}
 function play(primer=false){
  if(pending)return pending;
  const token=generation;
  if(gain)gain.gain.setValueAtTime(primer?0:.5,gain.context.currentTime);
  let request;
  try{request=media.play();}catch(error){request=Promise.reject(error);}
  const task=Promise.resolve(request).then(()=>{
   if(token!==generation||disposed)return false;
   blocked=false;
   if(primer){primed=true;if(!wanted){media.pause();media.currentTime=0;}}
   if(!wanted)silence();else gain.gain.setValueAtTime(.5,gain.context.currentTime);
   return true;
  }).catch(error=>{
   if(token===generation&&error.name==='NotAllowedError')blocked=true;
   return false; // Pause/source changes may abort play; the game remains usable.
  }).finally(()=>{if(pending===task)pending=null;});
  pending=task;return task;
 }
 function next(){
  if(disposed||failures.size>=tracks.length){silence();return;}
  do{index=(index+1)%tracks.length;}while(failures.has(index));
  pending=null;select();if(wanted||!primed)void play(!primed);
 }
 function failed(){
  if(!selected||disposed||media.error?.code===1)return;
  failures.add(index);next();
 }
 return {
  // Called inside the level/continue gesture, before asynchronous loading.
  // The first brief play is gated silent, unlocking the same element on iOS.
  prime(){
   if(!ensure())return Promise.resolve(false);
   if(!selected)select();
   if(primed&&!blocked){if(wanted&&media.paused)return play();return Promise.resolve(true);}
   return play(true);
  },
  update(active){
   const nextWanted=!!active;if(nextWanted===wanted)return;
   wanted=nextWanted;
   if(!wanted){silence();return;}
   if(primed&&!blocked&&media?.paused)void play();
  },
  info(){return {trackCount:tracks.length,index,title:tracks[index]?.title||'',primed,blocked,
   playing:!!media&&!media.paused&&wanted&&primed,currentTime:media?.currentTime||0,
   duration:Number.isFinite(media?.duration)?media.duration:0,failedTracks:[...failures]};},
  dispose(){disposed=true;wanted=false;generation++;silence();if(media){media.removeEventListener('ended',next);media.removeEventListener('error',failed);media.removeAttribute('src');media.load();}source?.disconnect();gain?.disconnect();},
 };
}
