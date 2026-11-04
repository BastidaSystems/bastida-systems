(() => {
  const screen=document.getElementById('intro-screen');
  if(!screen)return;
  const video=document.getElementById('intro-video'),skip=document.getElementById('intro-skip');
  const menu=document.getElementById('start-screen'),play=document.getElementById('level-play-btn');
  let phase='pending',ready=false,failed=false,attempt=0,resolveFinished;
  let finished;
  function resetCompletion(){finished=new Promise(resolve=>{resolveFinished=resolve;});}
  resetCompletion();

  function finish(){
    if(phase!=='playing')return;
    phase='finished';attempt++;
    screen.classList.add('hidden');document.body.classList.remove('intro-playing');
    document.removeEventListener('keydown',onKey,true);document.removeEventListener('keyup',onKey,true);
    video.pause();video.removeAttribute('src');video.load();resolveFinished();
  }
  function setProgress(value){
    if(!ready)skip.textContent='CARGANDO '+Math.max(0,Math.min(99,Math.round(value)))+'%';
  }
  function setReady(){
    ready=true;skip.disabled=false;skip.textContent='SALTAR ›';skip.removeAttribute('aria-busy');
  }
  async function tryPlay(){
    if(phase!=='playing')return;
    const current=++attempt;video.muted=false;
    try{await video.play();}
    catch(error){
      if(phase!=='playing'||current!==attempt)return;
      // Selecting Level 1 is a trusted gesture. A later tap/key can recover unusual browser restrictions.
      if(error.name==='NotAllowedError')return;
      failed=true;finish();
    }
  }
  function start(event){
    if(phase==='playing'||menu.dataset.menuView!=='menu'||menu.classList.contains('hidden')||play.dataset.levelId!=='1'||document.getElementById('tab-levels').getAttribute('aria-selected')!=='true')return;
    event.preventDefault();event.stopImmediatePropagation();
    resetCompletion();ready=false;failed=false;
    skip.disabled=true;skip.setAttribute('aria-busy','true');skip.textContent='CARGANDO 0%';
    phase='playing';
    document.body.classList.add('intro-playing');screen.classList.remove('hidden');
    document.addEventListener('keydown',onKey,true);document.addEventListener('keyup',onKey,true);
    // No media source is attached until the player chooses Level 1.
    video.src=video.dataset.src;
    // Starting the level is a trusted click, so the intro keeps audible playback.
    if(!failed)void tryPlay();
    document.dispatchEvent(new Event('ma:intro-started'));
    if(failed)finish();
  }
  function onKey(event){
    if(phase!=='playing')return;
    event.stopPropagation();
    if(event.type!=='keydown')return;
    if(event.code==='Escape'){event.preventDefault();if(ready)finish();}
    else if(!event.repeat&&(video.paused||video.muted))void tryPlay();
  }
  window.__maIntro={get phase(){return phase;},get ready(){return ready;},setReady,setProgress,waitForFinish:()=>finished,abort:finish};
  play.addEventListener('click',start,true);
  skip.addEventListener('click',()=>{if(ready)finish();});
  screen.addEventListener('click',event=>{if(!event.target.closest?.('#intro-skip')&&(video.paused||video.muted))void tryPlay();});
  video.addEventListener('ended',finish);
  video.addEventListener('error',()=>{if(phase==='playing'){failed=true;finish();}});
})();
