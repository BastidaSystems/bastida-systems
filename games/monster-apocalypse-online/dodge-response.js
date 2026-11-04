// Add only artist-approved pairings here: {enemyType: {attackClip: 'Left'|'Right'}}.
// Existing enemies retain their animations and damage. Q requests the response;
// this module does not auto-dodge, grant immunity or trigger enemy attacks.
export const DODGE_ATTACK_RESPONSES=Object.freeze({explosive:Object.freeze({attack2:'Right',attack2Mirror:'Left'})});
export function chooseDodgeResponse({position,yaw=0,threats=[],previous='Right',clearance=()=>1,rules=DODGE_ATTACK_RESPONSES}){
 const opposite=s=>s==='Left'?'Right':'Left',fallback=opposite(previous);
 const nearby=threats.filter(t=>t.position&&Number.isFinite(t.eta)&&t.eta>=0&&Math.hypot(t.position.x-position.x,t.position.z-position.z)<=7)
  .sort((a,b)=>a.eta-b.eta||Math.hypot(a.position.x-position.x,a.position.z-position.z)-Math.hypot(b.position.x-position.x,b.position.z-position.z));
 const threat=nearby[0];let side=fallback,reason='alternating',responseHeading=yaw;
 if(threat){
  const rule=rules[threat.type]?.[threat.animation];
  if(rule==='Left'||rule==='Right'){side=rule;reason='animation';if(Number.isFinite(threat.responseHeading))responseHeading=threat.responseHeading;}
  else{
   const origin=threat.trajectoryOrigin||threat.position;
   const lateral=(origin.x-position.x)*Math.cos(yaw)-(origin.z-position.z)*Math.sin(yaw);
   if(Math.abs(lateral)>.15){side=lateral>0?'Left':'Right';reason='attack-direction';}
   else reason='frontal-attack';
  }
 }
 const other=opposite(side),room=clearance(side,responseHeading),otherRoom=clearance(other,responseHeading);
 // Do not replace a future authored side-specific response by the wrong clip.
 if(room<.2){
  if(reason==='animation'||otherRoom<.2)return {side:null,reason:'blocked',threat:threat?.animation??null};
  side=other;reason='clear-side';
 }
 return {side,reason,threat:threat?.animation??null,...(reason==='animation'?{heading:responseHeading}:{})};
}
