import * as THREE from 'three';
const short=n=>n.replace(/^mixamorig[:_]?/,'');
// Shared immutable sampling data, applied on each enemy's existing skeleton.
// Only upper-body deltas: crawling hips/legs and height remain on the crawl pose.
export function prepareLowHitTracks(clip){
 const tracks=clip.tracks.filter(t=>t.ValueTypeName==='quaternion'&&/Spine|Neck|Head|Shoulder|Arm|Hand/.test(t.name)).map(t=>t.clone());
 const additive=THREE.AnimationUtils.makeClipAdditive(new THREE.AnimationClip('lowHit',clip.duration,tracks));
 return {duration:clip.duration,tracks:additive.tracks.map(t=>({name:short(THREE.PropertyBinding.parseTrackName(t.name).nodeName),sample:t.createInterpolant(new Float32Array(4))}))};
}
const rotation=new THREE.Quaternion(),identity=new THREE.Quaternion();
export function restoreLowHit(actor){
 if(!actor.lowHitApplied)return;for(const [bone,q]of actor.lowHitBase)bone.quaternion.copy(q);actor.lowHitApplied=false;
}
export function applyLowHit(actor,data,progress,strength=.4){
 const bones=actor.bones;actor.lowHitBase??=new Map();
 if(!data)return;const t=THREE.MathUtils.clamp(progress,0,1),weight=strength*Math.sin(Math.PI*t);
 for(const {name,sample}of data.tracks){const bone=bones[name];if(!bone)continue;let base=actor.lowHitBase.get(bone);if(!base){base=new THREE.Quaternion();actor.lowHitBase.set(bone,base);}base.copy(bone.quaternion);rotation.fromArray(sample.evaluate(t*data.duration)).normalize().slerp(identity,1-weight);bone.quaternion.multiply(rotation);}
 actor.lowHitApplied=true;
}
export function nextHitClip(mon,mirrorAvailable){
 mon.hurtCount=(mon.hurtCount||0)+1;
 return mon.hurtCount%2===0&&mirrorAvailable?'hitMirror':'hit';
}
