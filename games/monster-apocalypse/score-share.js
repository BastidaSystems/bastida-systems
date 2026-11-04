export const SCORE_SHARE_URL='https://monster-apocalypse.vercel.app/';
const number=value=>Number.isSafeInteger(value)&&value>=0?value:0;
export function scoreShareData({score=0,kills=0,completedWaves=0,activeMs=0}={},record=false){
  const points=number(score).toLocaleString('es-MX'),seconds=Math.floor(number(activeMs)/1000);
  const time=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  const waves=number(completedWaves),defeated=number(kills);
  const text=record?`Mi récord local en Monster Apocalypse es de ${points} puntos.\n¿Puedes superarlo?`:
    `Conseguí ${points} puntos en Monster Apocalypse.\n${defeated} ${defeated===1?'baja':'bajas'} · ${waves} ${waves===1?'oleada completada':'oleadas completadas'} · ${time} de supervivencia.\nScore local. ¿Puedes superarlo?`;
  return {title:'Monster Apocalypse · Mi score',text,url:SCORE_SHARE_URL};
}

export function createScoreSharing(){
  const key=Symbol.for('monster-apocalypse.score-sharing');
  if(document[key])return document[key];
  const groups=[...document.querySelectorAll('[data-score-sharing]')];
  let best=0;
  try{const saved=JSON.parse(localStorage.getItem('ma_score_record_v1')||'null');if(saved?.rulesVersion==='ma-score-v1')best=number(saved.best);}catch{}
  let snapshot={best,lastResult:null};
  for(const group of groups){
    const button=group.querySelector('button'),status=group.querySelector('[role="status"]');
    const record=group.dataset.scoreSharing==='record';
    const dialog=document.createElement('dialog');dialog.className='score-share-dialog';
    const titleId='score-share-title-'+(record?'record':'result');dialog.setAttribute('aria-labelledby',titleId);
    dialog.innerHTML=`<button type="button" class="score-share-close" aria-label="Cerrar">×</button><h2 id="${titleId}">${record?'Mi récord':'Mi score'}</h2><textarea readonly aria-label="Score para compartir"></textarea><div class="score-share-actions"><button type="button" data-share-native>Compartir</button><button type="button" data-share-copy>Copiar</button></div><p role="status" aria-live="polite"></p>`;
    document.body.append(dialog);
    const field=dialog.querySelector('textarea'),native=dialog.querySelector('[data-share-native]'),copy=dialog.querySelector('[data-share-copy]'),feedback=dialog.querySelector('[role="status"]');
    let data=null,busy=false;
    const close=()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');};
    dialog.querySelector('.score-share-close').addEventListener('click',close);
    button.disabled=false;
    button.addEventListener('click',()=>{
      if(!record&&!snapshot.lastResult){status.textContent='Termina una partida para compartir tu score.';return;}
      data=scoreShareData(record?{score:snapshot.best}:snapshot.lastResult,record);
      field.value=`${data.text}\n${data.url}`;feedback.textContent='';
      native.hidden=typeof navigator.share!=='function';
      if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
    });
    native.addEventListener('click',async()=>{
      if(!data||busy)return;
      busy=true;native.disabled=true;native.setAttribute('aria-busy','true');feedback.textContent='Abriendo opciones para compartir…';
      try{
        // Call directly from this fresh tap, before any asynchronous work.
        const request=navigator.share(data);
        if(!request||typeof request.then!=='function')throw Error('Share did not open');
        await request;feedback.textContent='Score compartido.';
      }catch(error){
        feedback.textContent=error?.name==='AbortError'?'Compartir cancelado.':'No se pudo abrir el menú del celular. Puedes copiar tu score aquí.';
      }finally{busy=false;native.disabled=false;native.removeAttribute('aria-busy');}
    });
    copy.addEventListener('click',async()=>{
      if(!data)return;
      try{
        if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(field.value);feedback.textContent='Score copiado. Pégalo donde quieras compartirlo.';
      }catch{field.focus();field.select();feedback.textContent='Mantén pulsado el texto y elige Copiar.';}
    });
  }
  const controller={update(next){snapshot={best:number(next.best),lastResult:next.lastResult?{...next.lastResult}:null};}};
  Object.defineProperty(document,key,{value:controller});return controller;
}

// Sharing is usable before the 3D engine, models or game initialization finish.
if(typeof document!=='undefined'&&document.querySelector('[data-score-sharing]'))createScoreSharing();
