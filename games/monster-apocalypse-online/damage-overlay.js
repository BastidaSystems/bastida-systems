// Only the supplied second texture (veins). Spider bites build it by 1% per
// accepted hit; normal damage retains its original full-strength feedback.
const SPIDER_OPACITY_LIMIT=100;
export function createDamageOverlay(element,{enabled=true}={}) {
 const path='assets/vfx/damage-sequence/2.webp';
 const image=enabled?new Image():null;if(image)image.src=path;
 let visible=false,opacity=0,spiderHits=0,spiderSinceHit=Infinity,normalSinceHit=Infinity;
 function paint(){
  const next=normalSinceHit<3?1:(spiderSinceHit<3?spiderHits/100:0);
  if(next===opacity)return;
  opacity=next;
  visible=opacity>0;
  if(visible)element.style.backgroundImage=`url("${path}")`;
  element.style.setProperty('--damage-opacity',String(opacity));
  element.classList.toggle('show',visible);
 }
 return {
  hit({source='normal'}={}){
   if(!enabled)return;
   if(source==='spider'){
    spiderHits=Math.min(SPIDER_OPACITY_LIMIT,spiderHits+1);spiderSinceHit=0;
   }else normalSinceHit=0;
   paint();
  },
  update(dt){
   dt=Number.isFinite(dt)?Math.max(0,dt):0;
   spiderSinceHit+=dt;normalSinceHit+=dt;
   if(spiderSinceHit>=3)spiderHits=0;
   paint();
  },
  reset(){
   visible=false;opacity=0;spiderHits=0;spiderSinceHit=normalSinceHit=Infinity;
   element.classList.remove('show');element.style.backgroundImage='';element.style.removeProperty('--damage-opacity');
  },
  info(){
   const loaded=image?.complete&&image.naturalWidth>0?1:0;
   return {level:visible?2:0,stages:1,selectedStage:2,loaded,expected:enabled?1:0,
    ready:!enabled||loaded===1,opacity,spiderHits,spiderOpacity:spiderHits/100,maxOpacity:SPIDER_OPACITY_LIMIT/100,
    errors:image?.complete&&!image.naturalWidth?[path]:[]};
  },
 };
}
