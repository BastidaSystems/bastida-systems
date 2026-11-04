import * as THREE from 'three';

const short=name=>name.replace(/^mixamorig[:_]?/,'');
export function captureQuakeRest(root){
 const rest={};root.traverse(b=>{if(b.isBone)rest[short(b.name)]=b.quaternion.clone();});return rest;
}

// Temporary torso/head poses only. No root motion, FSM, damage or animation actions.
export function createQuakeBraces(){
 const saved=new Map(),positions=new Map(),cache=new WeakMap(),turn=new THREE.Quaternion(),euler=new THREE.Euler(),pose=new THREE.Quaternion();
 let animation=null,channels=[],animated=0;
 let count=0;
 function apply(bones,age,{player=false,phase=0,reduced=false}={}){
  if(!bones||age<=0||age>=2.8)return;
  const attack=Math.min(1,age/.18),release=Math.min(1,(2.8-age)/.5);
  const amount=attack*release*(reduced?.3:1)*(player?.6:1);
  for(const [name,scale]of [['Spine',.45],['Spine1',.7],['Spine2',1],['Neck',.65],['Head',.5]]){
   const bone=bones[name];if(!bone||saved.has(bone))continue;
   saved.set(bone,bone.quaternion.clone());
   euler.set((.055+.025*Math.sin(age*13+phase))*amount*scale,0,Math.sin(age*17+phase)*.035*amount*scale);
   turn.setFromEuler(euler);bone.quaternion.multiply(turn);count++;
  }
 }
 return {apply,
  setAnimation(gltf){
   const clip=gltf.animations.find(c=>c.name==='chaosReaction');
   if(!clip)throw Error('Edge Slip animation unavailable');
   const rest={};gltf.scene.traverse(o=>{rest[short(o.name)]=o.quaternion.clone();});
   const next=clip.tracks.filter(t=>t.name.endsWith('.quaternion')).map(t=>{
    const name=short(THREE.PropertyBinding.parseTrackName(t.name).nodeName);
    return {name,sample:t.createInterpolant(new Float32Array(4)),inverseRest:rest[name]?.clone().invert()};
   }).filter(t=>t.inverseRest);
   if(next.length<15)throw Error('Incomplete Edge Slip skeleton');
   animation=clip;channels=next;
  },
  preservePosition(object){if(!positions.has(object))positions.set(object,object.position.clone());},
  enemies(enemies,age,reduced){
   const posed=[];
   for(const [i,e]of enemies.entries()){
    if(['dead','death'].includes(String(e.state).toLowerCase())||!e.g.visible)continue;
    let bones=e.alien?.bones||cache.get(e.g);
    if(!bones){bones={};e.g.traverse(b=>{if(b.isBone)bones[b.name.replace(/^mixamorig[:_]?/,'')]=b;});cache.set(e.g,bones);}
    const rest=e.alien?.quakeRest||e.quakeRest;
    if(animation&&rest&&age>0&&age<2.8){
     const localAge=Math.max(0,age-(i%3)*.035),t=Math.min(animation.duration,localAge/2.8*animation.duration);
     const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
     const weight=smooth(localAge/.18)*smooth((2.8-age)/.3)*(reduced?.45:1)*(['attack','hurt'].includes(String(e.state).toLowerCase())?.55:1);
     let matched=0;
     for(const channel of channels){const bone=bones[channel.name],bind=rest[channel.name];if(!bone||!bind||saved.has(bone))continue;
      saved.set(bone,bone.quaternion.clone());pose.fromArray(channel.sample.evaluate(t));
      turn.copy(bind).multiply(channel.inverseRest).multiply(pose).normalize();bone.quaternion.slerp(turn,weight);matched++;count++;
     }
     if(matched){animated++;posed.push(e);}
    }else apply(bones,age,{phase:i*1.7,reduced});
   }
   return posed;
  },
  restore(){for(const [bone,q]of saved){bone.quaternion.copy(q);bone.updateMatrixWorld(true);}saved.clear();for(const [object,p]of positions){object.position.copy(p);object.updateMatrixWorld(true);}positions.clear();},
  info:()=>({posedBones:saved.size,applications:count,animation:animation?'Edge Slip':null,animatedSamples:animated}),
 };
}
