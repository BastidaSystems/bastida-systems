(() => {
  const root=document.getElementById('start-screen');if(!root)return;
  const tabs=[...root.querySelectorAll('[data-menu-tab]')];
  let view='menu',selected='levels';
  // The menu works while the game module is still loading. The scene reads these
  // same preferences when it initializes and keeps its existing live handlers.
  const sensitivity=document.getElementById('sens-slider'),sensitivityValue=document.getElementById('sens-value');
  const fogButtons=[...root.querySelectorAll('.fog-btn')];
  let savedFog='densa';
  try{
    const saved=Number(localStorage.getItem('ma_sens'));
    if(saved>=.5&&saved<=2)sensitivity.value=String(saved);
    const fog=localStorage.getItem('ma_fog');if(['normal','densa','extrema'].includes(fog))savedFog=fog;
  }catch(_){}
  sensitivityValue.textContent=Number(sensitivity.value).toFixed(1)+'×';
  sensitivity.addEventListener('input',()=>{
    sensitivityValue.textContent=Number(sensitivity.value).toFixed(1)+'×';
    try{localStorage.setItem('ma_sens',sensitivity.value);}catch(_){}
  });
  for(const button of fogButtons){
    button.classList.toggle('active',button.dataset.level===savedFog);
    button.addEventListener('click',()=>{
      for(const other of fogButtons)other.classList.toggle('active',other===button);
      try{localStorage.setItem('ma_fog',button.dataset.level);}catch(_){}
    });
  }
  function select(name,focus=false){
    if(!tabs.some(tab=>tab.dataset.menuTab===name))return;
    selected=name;
    for(const tab of tabs){
      const active=tab.dataset.menuTab===name;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      document.getElementById(tab.getAttribute('aria-controls')).classList.toggle('hidden',!active);
      if(active&&focus)tab.focus();
    }
  }

  // One owner for visibility, hit testing and focus of every game UI state.
  const screens={menu:root,paused:document.getElementById('pause-screen'),loading:document.getElementById('loading-screen'),dead:document.getElementById('death-screen')};
  const hud=document.getElementById('hud');
  function present(next){
    view=next;document.body.dataset.uiState=next;
    for(const [name,node] of Object.entries(screens)){
      const active=name===next;node.classList.toggle('hidden',!active);node.inert=!active;node.setAttribute('aria-hidden',String(!active));
    }
    hud.classList.toggle('hidden',next!=='playing');hud.inert=next!=='playing';hud.setAttribute('aria-hidden',String(next!=='playing'));
    if(next==='menu'){select('levels');root.dataset.menuView='menu';root.scrollTop=0;}
    if(next==='paused')document.getElementById('pause-continue').focus();
    document.dispatchEvent(new CustomEvent('ma:ui-state',{detail:next}));
  }
  for(const tab of tabs)tab.addEventListener('click',()=>select(tab.dataset.menuTab));
  root.querySelector('.menu-nav').addEventListener('keydown',event=>{
    const index=tabs.findIndex(tab=>tab.dataset.menuTab===selected);let next;
    if(['ArrowDown','ArrowRight'].includes(event.key))next=(index+1)%tabs.length;
    if(['ArrowUp','ArrowLeft'].includes(event.key))next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();select(tabs[next].dataset.menuTab,true);}
  });
  const dispatch=name=>document.dispatchEvent(new Event(name));
  document.getElementById('level-play-btn').addEventListener('click',()=>{
    if(window.__maIntro?.phase==='finished')dispatch('ma:level-started');
  });
  document.getElementById('pause-continue').addEventListener('click',()=>dispatch('ma:resume-requested'));
  document.getElementById('pause-restart').addEventListener('click',()=>dispatch('ma:level-started'));
  document.getElementById('pause-menu').addEventListener('click',()=>dispatch('ma:main-menu-requested'));
  document.getElementById('death-menu-btn').addEventListener('click',()=>dispatch('ma:main-menu-requested'));
  document.getElementById('death-settings-btn').addEventListener('click',()=>{
    document.dispatchEvent(new CustomEvent('ma:main-menu-requested',{detail:{panel:'settings'}}));
  });
  const characterButtons=[...root.querySelectorAll('[data-character]')];
  let character='julian';
  try{const saved=localStorage.getItem('ma_character');if(characterButtons.some(b=>b.dataset.character===saved))character=saved;}catch(_){}
  function chooseCharacter(id,announce=false){
    const chosen=characterButtons.find(button=>button.dataset.character===id);if(!chosen)return;
    character=id;document.getElementById('level-character-name').textContent=chosen.dataset.name;
    for(const button of characterButtons){const active=button===chosen;button.setAttribute('aria-pressed',String(active));button.textContent=active?'✓ SELECCIONADO':'ELEGIR A '+button.dataset.name.toLocaleUpperCase('es');}
    document.getElementById('character-status').textContent=chosen.dataset.name+(announce?' seleccionado. Elige un nivel para jugar.':' es tu personaje para esta partida.');
    try{localStorage.setItem('ma_character',character);}catch(_){}
  }
  for(const button of characterButtons)button.addEventListener('click',()=>chooseCharacter(button.dataset.character,true));
  chooseCharacter(character);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(!document.getElementById('map-overlay').classList.contains('hidden'))return;
    if(view==='paused'){event.preventDefault();event.stopImmediatePropagation();document.getElementById('pause-continue').click();}
    else if(view==='menu'&&selected!=='levels'){event.preventDefault();event.stopImmediatePropagation();select('levels',true);}
  },true);
  window.__maMenu={showMain:(panel='levels')=>{present('menu');select(panel,true);},showPaused:()=>present('paused'),showGameplay:()=>present('playing'),showLoading:()=>present('loading'),showDeath:()=>present('dead'),selectLevels:()=>select('levels',true),info:()=>({view,selected,character,availableLevels:1,silent:true})};
  present('menu');
})();
