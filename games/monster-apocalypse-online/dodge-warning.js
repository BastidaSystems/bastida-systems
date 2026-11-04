import {explosiveDodgeCue} from './explosive-attack.js?v=125';
export function createDodgeWarning(host){
 const element=document.createElement('p');element.id='dodge-warning';element.hidden=true;element.setAttribute('aria-label','Esquivar con Q');host.append(element);
 let last='';
 return {update(monsters,{active=false}={}){
  const cues=active?monsters.filter(m=>m.explosiveLab&&m.state!=='dead'&&!m.spawning).map(explosiveDodgeCue).filter(Boolean):[];
  const cue=cues.sort((a,b)=>a.remaining-b.remaining)[0];element.hidden=!cue;
  if(!cue){last='';return null;}
  const text='Q';
  if(text!==last){element.textContent=text;last=text;}element.dataset.ready=String(cue.now);return cue;
 },element};
}
