import * as THREE from 'three';
import {createGraphicsPolicy,initialGraphics} from './graphics-policy.js';

// Only render assets are adapted. Simulation/blocker geometry is never replaced.
export function createGraphicsV3({renderer,scene,mobile,onApply=()=>{}}){
 const storageKey='ma_graphics_v3';let selection='auto';try{selection=localStorage.getItem(storageKey)||'auto';}catch(_){}
 const limits={maxTextureSize:renderer.capabilities.maxTextureSize,cores:navigator.hardwareConcurrency||4,memoryGB:navigator.deviceMemory??null,mobile};
 const policy=createGraphicsPolicy({initial:initialGraphics(limits),selection,onChange:apply});
 const bindings=[],materials=[],lightRecords=[],seen=new WeakSet(),variants=new Map(),errors=[];
 const textureKeys=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','bumpMap'];
 let materialsWarmed=false;
 let ready=false,lastTextureLimit=null,textureSkipped=0,lastLightUpdate=-Infinity,revision=0,pending=0,textureWork=Promise.resolve();
 function collect(){
  scene.traverse(o=>{
   if(seen.has(o))return;seen.add(o);
   if(o.isPointLight&&o.name!=='world-muzzle-flash')lightRecords.push({light:o,distance:o.distance,visible:o.visible});
   if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||!o.material||o.userData.buildingCollisionProxy)return;
   const list=[o.material].flat();if(list.some(m=>!m||m.transparent||m.isShaderMaterial||m.isSpriteMaterial))return;
   let parent=o,dynamic=false;while(parent){if(parent.name==='JulianPlayer'||parent.userData?.monster||parent.userData?.combatEntity)dynamic=true;parent=parent.parent;}
   if(dynamic)return;
   for(const material of list)if(!materials.includes(material)){
    materials.push(material);
    for(const key of textureKeys)if(material[key])bindings.push({material,key,source:material[key]});
   }
  });
 }
 const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 function disposeVariant(entry){if(entry){entry.texture.dispose();entry.bitmap?.close();}}
 function assign(source,texture){
  const simple=policy.info().profile.simple;
  for(const b of bindings)if(b.source===source){
   const value=simple&&['normalMap','bumpMap'].includes(b.key)?null:texture;
   if(b.material[b.key]!==value){b.material[b.key]=value;b.material.needsUpdate=true;}
  }
 }
 async function makeVariant(source,limit){
  const image=source.image,w=image.width,h=image.height,scale=limit/Math.max(w,h),width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  let bitmap=null,output;
  if(typeof createImageBitmap==='function'){
   // Decode/resize off the render loop; preserve upload orientation and colour semantics.
   bitmap=await createImageBitmap(image,{resizeWidth:width,resizeHeight:height,resizeQuality:'medium',imageOrientation:source.flipY?'flipY':'none',premultiplyAlpha:source.premultiplyAlpha?'premultiply':'none',colorSpaceConversion:'none'});
   if(bitmap.width!==width||bitmap.height!==height){bitmap.close();throw Error('Resize dimensions unavailable');}output=bitmap;
  }else{
   // One small conversion per event-loop turn on older engines; no GPU readPixels/getImageData.
   await tick();output=document.createElement('canvas');output.width=width;output.height=height;
   output.getContext('2d',{willReadFrequently:true}).drawImage(image,0,0,width,height);
  }
  const texture=source.clone();texture.source=new THREE.Source(output);texture.needsUpdate=true;
  return {texture,bitmap,limit};
 }
 async function adaptTextures(limit,ticket){
  const sources=[...new Set(bindings.map(b=>b.source))];
  for(const source of sources){
   if(ticket!==revision)return;
   const old=variants.get(source),image=source.image;
   const eligible=image&&!source.isCompressedTexture&&!source.isDataTexture&&!source.isVideoTexture&&!source.isRenderTargetTexture&&image.width&&image.height;
   if(!eligible||Math.max(image.width,image.height)<=limit){
    assign(source,source);variants.delete(source);disposeVariant(old);continue;
   }
   if(old?.limit===limit){assign(source,old.texture);continue;}
   try{
    const entry=await makeVariant(source,limit);
    if(ticket!==revision){disposeVariant(entry);return;}
    // Swap only this asset after it is ready. One GPU variant per source, not all profiles.
    assign(source,entry.texture);variants.set(source,entry);disposeVariant(old);source.dispose();
   }catch(_){textureSkipped++;assign(source,old?.texture||source);}
   await tick();
  }
 }
 function apply(){
  lastLightUpdate=-Infinity;
  const {profile}=policy.info();profile.texture=Math.min(profile.texture,renderer.capabilities.maxTextureSize);
  const ratio=Math.min(devicePixelRatio||1,profile.dpr)*profile.scale;
  if(Math.abs(renderer.getPixelRatio()-ratio)>.001)renderer.setPixelRatio(ratio);
  if(ready){
   for(const b of bindings)assign(b.source,variants.get(b.source)?.texture||b.source);
   if(lastTextureLimit!==profile.texture){
    lastTextureLimit=profile.texture;const ticket=++revision;pending++;
    textureWork=textureWork.catch(()=>{}).then(()=>adaptTextures(profile.texture,ticket)).catch(()=>{errors.push('Texture adaptation failed; previous render assets retained.');}).finally(()=>pending--);
   }
  }
  onApply(profile);
 }
 function updateLights(player){
  if(!ready||performance.now()-lastLightUpdate<200)return;lastLightUpdate=performance.now();
  const limit=policy.info().profile.secondaryLights,position=new THREE.Vector3(),distances=new Map();
  const local=lightRecords.filter(r=>r.visible&&r.light.parent&&r.distance>0);
  for(const record of local)distances.set(record,record.light.getWorldPosition(position).distanceToSquared(player));
  local.sort((a,b)=>distances.get(a)-distances.get(b));
  // Keep authored visibility and the shader light count stable. The existing r160
  // local-light guard skips zero attenuation, without recompiling programs in combat.
  local.forEach((r,i)=>{r.light.distance=i<limit?r.distance:.0001;});
 }
 const metrics={frames:0,frameMs:[],calls:0,triangles:0,points:0};
 return {
  policy,
  async prepare(){if(!ready){collect();ready=true;apply();}await textureWork;},
  apply,
  warmMaterials(camera){
   if(materialsWarmed)return;
   const normalBindings=bindings.filter(b=>['normalMap','bumpMap'].includes(b.key));
   const saved=normalBindings.map(b=>({b,value:b.material[b.key]}));
   try{
    // Called only by the existing one-pixel city warmup, behind loading artwork.
    for(const useNormals of [true,false]){
     for(const b of normalBindings){b.material[b.key]=useNormals?(variants.get(b.source)?.texture||b.source):null;b.material.needsUpdate=true;}
     renderer.compile(scene,camera);renderer.render(scene,camera);
    }
    materialsWarmed=true;
   }finally{
    for(const {b,value}of saved){b.material[b.key]=value;b.material.needsUpdate=true;}
    renderer.render(scene,camera);
   }
  },
  select(value){const ok=policy.select(value);if(ok)try{localStorage.setItem(storageKey,value);}catch(_){}return ok;},
  updateLights,
  sample(ms,active){policy.sample(ms,active);if(active&&Number.isFinite(ms)&&ms>=1&&ms<=1000){metrics.frames++;metrics.frameMs.push(ms);if(metrics.frameMs.length>600)metrics.frameMs.shift();Object.assign(metrics,{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points});}},
  resetSampling(){policy.resetSampling();},
  info(){const sorted=[...metrics.frameMs].sort((a,b)=>a-b),mean=sorted.reduce((a,b)=>a+b,0)/(sorted.length||1),p=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]??null;
   return {...policy.info(),capabilities:limits,ready,materialsWarmed,internal:[renderer.domElement.width,renderer.domElement.height],pixelRatio:renderer.getPixelRatio(),antialias:renderer.getContext().getContextAttributes()?.antialias??false,antialiasRuntime:false,shadows:renderer.shadowMap.enabled,textureVariants:variants.size,maxVariantSize:Math.max(0,...[...variants.values()].map(e=>Math.max(e.texture.image.width,e.texture.image.height))),texturePending:pending,textureSkipped,errors:[...errors],metrics:{...metrics,frameMs:undefined,meanFPS:mean?1000/mean:null,p50:p(.5),p95:p(.95),p99:p(.99),gpuMilliseconds:null,jsHeapEstimate:performance.memory?.usedJSHeapSize??null,webglObjects:{...renderer.info.memory},memoryNote:'JS heap is an estimate when present; WebGL counts are not bytes or process RAM.'}};
  },
 };
}
