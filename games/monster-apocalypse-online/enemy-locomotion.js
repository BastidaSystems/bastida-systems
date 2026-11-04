// Stable per-spawn mix: upright walking and crawling, never a slowed running clip.
const PATTERN=Object.freeze(['crawl','crawl','walk','crawl','crawl']);
export function enemyLocomotion(sequence,{variant='normal',frenetic=false,walkAvailable=true,jitter=Math.random()}={}){
 const clip=walkAvailable?PATTERN[Math.abs(sequence)%PATTERN.length]:'crawl';
 const variantPace=variant==='bruto'?.85:variant==='veloz'||frenetic?1.1:1;
 const speed=(clip==='walk'?1.50:1.0)*variantPace*(.94+Math.max(0,Math.min(1,jitter))*.12);
 return {clip,speed,healthMultiplier:clip==='walk'?1.6:1};
}
