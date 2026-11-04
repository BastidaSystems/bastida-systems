import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {createSkinnedShotIndex} from './skinned-shot-index.js?v=20261014-shot1';

// The supplied ground creature only uses its authored crawl and jump attack.
// Shared geometry/texture, bounded recycled skeletons; no extra spawner or score system.
export const SWARM=Object.freeze({diameter:.90,speed:4.6,hp:17,damage:2,
 attackRange:.88,hitRange:1.12,cycle:1.2,contact:.48,jumpChance:.3,jumpCycle:2.8,jumpCooldown:5,maxJumpers:1,corpse:.45,pool:24});
export function createGroundSwarm({scene,move,canSee,onAttack,random=Math.random}){
 let template=null,error=null,task=null,created=0;const pool=[],active=new Set();
 const size=new THREE.Vector3(),bounds=new THREE.Box3();
 function load(){
  if(task)return task;
  task=new GLTFLoader().loadAsync('assets/enemies/ground-swarm/ground-swarm.glb?v=20261017-swarm34')
   .then(gltf=>{
    const clips=Object.fromEntries(gltf.animations.map(c=>[c.name,c]));
    if(!clips.crawl||!clips.attack)throw Error('Missing ground crawl/attack');
    const probe=new THREE.AnimationMixer(gltf.scene);probe.clipAction(clips.crawl).play();probe.update(0);
    gltf.scene.updateMatrixWorld(true);bounds.setFromObject(gltf.scene,true).getSize(size);
    const scale=SWARM.diameter/Math.max(size.x,size.y,size.z);
    if(!Number.isFinite(scale)||scale<=0)throw Error('Invalid ground creature bounds');
    probe.stopAllAction();probe.uncacheRoot(gltf.scene);
    template={root:gltf.scene,clips,scale};return true;
   }).catch(()=>{error='No se pudo cargar la criatura terrestre';return false;});
  return task;
 }
 function build(){
  if(pool.length)return pool.pop();
  const visual=cloneSkinned(template.root),meshes=[],mats=[];
  visual.traverse(o=>{if(o.isMesh){o.material=o.material.clone();
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;meshes.push(o);mats.push(o.material);}});
  const mixer=new THREE.AnimationMixer(visual),actions={};
  for(const [name,clip]of Object.entries(template.clips))actions[name]=mixer.clipAction(clip);
  created++;return {visual,meshes,mats,mixer,actions,shotIndexes:meshes.map(m=>m.isSkinnedMesh?createSkinnedShotIndex(m):null)};
 }
 function create(position,sequence=0){
  if(!template)return null;
  const body=build(),g=new THREE.Group(),scale=template.scale*(.94+random()*.12);
  body.mixer.stopAllAction();body.visual.position.set(0,0,0);body.visual.quaternion.identity();
  for(const a of Object.values(body.actions)){a.reset().stopFading().setEffectiveWeight(1);a.paused=false;}
  body.actions.crawl.setLoop(THREE.LoopRepeat,Infinity).play();body.actions.crawl.time=random()*template.clips.crawl.duration;
  for(const m of body.mats)m.emissive.setRGB(0,0,0);
  g.add(body.visual);g.scale.setScalar(scale);g.position.set(position.x,0,position.z);scene.add(g);
  const mon={g,swarm:body,alien:null,type:'ground-swarm',variant:'spider',hp:SWARM.hp,
   jumpCapable:random()<SWARM.jumpChance,jumpCooldown:random()*2,jumpAttack:false,
   speed:SWARM.speed*(.94+random()*.12),state:'chase',stateT:0,struck:false,flash:0,
   steerT:0,steerSign:sequence%2?1:-1,stuckT:0,stuckX:position.x,stuckZ:position.z,
   radius:SWARM.diameter*.5,senseHeight:SWARM.diameter*(.12/.26),
   shotHeight:SWARM.diameter*(.15/.26),shotRadius:SWARM.diameter*(.5/.26),partColor:0x9b7562,hurtMul:1};
  g.userData.monster=mon;body.current='crawl';body.mixer.update(0);active.add(mon);return mon;
 }
 function pose(mon,name,time){
  const b=mon.swarm,action=b.actions[name];
  if(b.current!==name){for(const a of Object.values(b.actions))a.stop();action.reset().play();b.current=name;}
  action.paused=true;action.time=time;b.mixer.update(0);
 }
 function update(mon,dt,player){
  mon.stateT+=dt;mon.jumpCooldown=Math.max(0,mon.jumpCooldown-dt);
  const p=mon.g.position,body=mon.swarm;
  if(mon.flash>0){mon.flash=Math.max(0,mon.flash-dt*6);for(const m of body.mats)m.emissive.setRGB(mon.flash*.6,mon.flash*.08,mon.flash*.04);}
  if(mon.state==='dead'){
   const t=Math.min(1,mon.stateT/SWARM.corpse);gScale(mon,1-t*.92);mon.g.rotation.z=t*.7;
   return t===1;
  }
  if(mon.state==='hurt'){
   if(mon.stateT<.14)return false;
   mon.state='chase';mon.stateT=0;
  }
  const distance=Math.hypot(player.x-p.x,player.z-p.z);
  if(mon.state!=='attack'&&distance<=SWARM.attackRange&&canSee(mon,distance)){
   let jumpers=0;for(const other of active)if(other!==mon&&other.state==='attack'&&other.jumpAttack)jumpers++;
   mon.jumpAttack=mon.jumpCapable&&mon.jumpCooldown===0&&jumpers<SWARM.maxJumpers;
   if(mon.jumpAttack)mon.jumpCooldown=SWARM.jumpCooldown;
   mon.state='attack';mon.stateT=0;mon.struck=false;
  }
  if(mon.state==='attack'){
   const cycle=mon.jumpAttack?SWARM.jumpCycle:SWARM.cycle;
   if(mon.jumpAttack)pose(mon,'attack',Math.min(1,mon.stateT/cycle)*template.clips.attack.duration);
   else{
    // Most creatures keep their grounded crawl; do not play the jump clip for every hit.
    body.crawlTime=((body.crawlTime||0)+dt*.65)%template.clips.crawl.duration;
    pose(mon,'crawl',body.crawlTime);
   }
   const contact=mon.jumpAttack?SWARM.contact/SWARM.cycle*cycle:SWARM.contact;
   if(!mon.struck&&mon.stateT>=contact){mon.struck=true;if(distance<=SWARM.hitRange&&canSee(mon,distance))onAttack(mon,SWARM.damage);}
   if(mon.stateT>=cycle){mon.state='chase';mon.stateT=0;mon.jumpAttack=false;}
  }else{
   const x=p.x,z=p.z;move(mon,dt,mon.speed,player.x,player.z);
   const travelled=Math.hypot(p.x-x,p.z-z);
   body.crawlTime=((body.crawlTime||0)+Math.min(travelled/.28*template.clips.crawl.duration,dt*3))%template.clips.crawl.duration;
   pose(mon,'crawl',body.crawlTime);
  }
  const target=mon.crowdFacing||mon.routeSteering||player;mon.g.lookAt(target.x,0,target.z);
  return false;
 }
 function gScale(mon,fraction){if(!mon.baseScale)mon.baseScale=mon.g.scale.x;mon.g.scale.setScalar(mon.baseScale*fraction);}
 function release(mon){
  mon.g.removeFromParent();active.delete(mon);const body=mon.swarm;
  body.visual.removeFromParent();body.mixer.stopAllAction();body.crawlTime=0;
  if(pool.length<SWARM.pool)pool.push(body);
  else {body.mixer.uncacheRoot(body.visual);for(const m of body.mats)m.dispose();for(const mesh of body.meshes)mesh.skeleton?.dispose();}
 }
 return {load,create,update,release,info:()=>({ready:!!template,error,active:active.size,pooled:pool.length,created,
  clips:template?Object.keys(template.clips):[],diameter:SWARM.diameter,speed:SWARM.speed,sharedGeometry:true,sharedTexture:true})};
}
