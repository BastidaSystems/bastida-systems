import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// A separate lightweight scene, rendered into a small target by the existing context.
export function createIsometricMinimap({renderer,canvas,getObjects,getStreets,getSidewalks,getEnemies,getShops,getGas,getLights=()=>[],isKnown,getDiscoveryVersion=()=>null}) {
 const state={ready:false,error:null,frames:0,triangles:0,calls:0,instances:0,uniqueTriangles:0,assets:0};
 const scene=new THREE.Scene();scene.background=new THREE.Color('#111b24');
 scene.add(new THREE.HemisphereLight(0xaecbe4,0x403129,2.2));
 const sun=new THREE.DirectionalLight(0xffddb6,2.1);sun.position.set(-35,70,25);scene.add(sun);
 const fill=new THREE.DirectionalLight(0x647fa5,.65);fill.position.set(30,35,-40);scene.add(fill);
 const camera=new THREE.OrthographicCamera(-46,46,46,-46,.1,250),target=new THREE.WebGLRenderTarget(256,256,{depthBuffer:true});
 target.texture.colorSpace=THREE.SRGBColorSpace;target.samples=renderer.capabilities.isWebGL2?2:0;
 const ctx=canvas.getContext('2d'),projected=new THREE.Vector3();
 const overlayScene=new THREE.Scene(),overlayCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);overlayCamera.position.z=.5;
 const overlayMaterial=new THREE.MeshBasicMaterial({map:target.texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 overlayMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.a *= 1.0-smoothstep(.485,.5,length(vMapUv-vec2(.5)));');};
 overlayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),overlayMaterial));
 let hudRect=null,fogPath=null,fogKey=null,projectedFog=null,projectedFogKey=null,vignette=null,vignetteWidth=0;
 const entries=[],batches=[],materials=[],geometries=[];let last=-Infinity,lastPaint=-Infinity,loading,batchVersion;
 const mapPose={x:NaN,z:NaN,yaw:NaN,version:null};
 const box=new THREE.BoxGeometry(1,1,1);geometries.push(box);
 function rectangles(list,color,height,y){const material=new THREE.MeshLambertMaterial({color});materials.push(material);const batch=new THREE.InstancedMesh(box,material,list.length),dummy=new THREE.Object3D();list.forEach((r,i)=>{dummy.position.set((r.minX+r.maxX)/2,y,(r.minZ+r.maxZ)/2);dummy.scale.set(r.maxX-r.minX,height,r.maxZ-r.minZ);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});batch.computeBoundingSphere();scene.add(batch);return batch;}
 function known(bounds){return isKnown(bounds);}
 function render(now,player,yaw,version){
  if(version===null||version!==batchVersion)for(const group of batches){let count=0;for(const entry of group.entries)if(known(entry.bounds)){group.mesh.setMatrixAt(count++,entry.matrix);}group.mesh.count=count;group.mesh.visible=count>0;group.mesh.instanceMatrix.needsUpdate=true;}
  batchVersion=version;
  const distance=65;camera.position.set(player.x+Math.sin(yaw)*distance,distance/Math.SQRT2,player.z+Math.cos(yaw)*distance);camera.lookAt(player.x,0,player.z);camera.updateMatrixWorld(true);
  const saved={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),autoClear:renderer.autoClear,shadow:renderer.shadowMap.autoUpdate,clear:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha()};
  try{renderer.autoClear=true;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.render(scene,camera);state.triangles=renderer.info.render.triangles;state.calls=renderer.info.render.calls;state.frames++;last=now;Object.assign(mapPose,{x:player.x,z:player.z,yaw,version});
  }finally{renderer.setRenderTarget(saved.target);renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);renderer.autoClear=saved.autoClear;renderer.shadowMap.autoUpdate=saved.shadow;renderer.setClearColor(saved.clear,saved.alpha);}
 }
 function screen(x,z){projected.set(x,.1,z).project(camera);return {x:(projected.x*.5+.5)*canvas.width,y:(-.5*projected.y+.5)*canvas.height};}
 function circle(p,r,color){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=1.5;ctx.strokeStyle='#101820';ctx.stroke();}
 function marker(x,z,player){return Math.hypot(x-player.x,z-player.z)<=42&&known({minX:x-1,maxX:x+1,minZ:z-1,maxZ:z+1});}
 return {state,scene,camera,target,
  load(environment){if(loading)return loading;loading=(async()=>{try{
   const ids=['bastida','gas','planet13','bola13','casino','bus','ambulance','trailer','car1','car2','strat','vegas','strattip','carbarrier','busstopslime','busstop','comparafa'];state.assets=ids.length;
   const files=await Promise.all(ids.map(id=>new GLTFLoader().loadAsync('assets/minimap/'+id+'.glb?v=20261014-iso1')));await environment;
   const objects=getObjects();state.instances=objects.length;
   for(let i=0;i<ids.length;i++){let template;files[i].scene.traverse(o=>{if(o.isMesh)template=o;});const source=template.material;
    const material=new THREE.MeshLambertMaterial({map:source.map,color:0xc8cdd2,emissive:0x162536,emissiveIntensity:.13});materials.push(material);source.dispose();geometries.push(template.geometry);state.uniqueTriangles+=template.geometry.index.count/3;
    const selected=objects.filter(e=>e.kind===ids[i]);if(!selected.length)continue;
    const mesh=new THREE.InstancedMesh(template.geometry,material,selected.length);mesh.name='Minimap LOD '+ids[i];mesh.frustumCulled=false;
    const group={mesh,entries:selected.map(e=>({matrix:e.mesh.matrixWorld.clone().premultiply(new THREE.Matrix4().makeScale(1,['bastida','gas','planet13','bola13','casino','strat','strattip'].includes(ids[i])?.68:.85,1)),bounds:{...e.bounds},id:e.id}))};batches.push(group);entries.push(...group.entries);scene.add(mesh);
   }
   rectangles([{minX:-75,maxX:75,minZ:-85,maxZ:85}],0x22272b,.15,-.18);
   rectangles(getStreets(),0x303b47,.08,-.04);
   rectangles(getSidewalks(),0x525b61,.12,.03);
   const lanes=[];for(const r of getStreets()){const vertical=r.maxZ-r.minZ>r.maxX-r.minX;if(vertical){for(let z=r.minZ;z<r.maxZ-2;z+=5)lanes.push({minX:(r.minX+r.maxX)/2-.08,maxX:(r.minX+r.maxX)/2+.08,minZ:z,maxZ:z+2});}else{for(let x=r.minX;x<r.maxX-2;x+=5)lanes.push({minX:x,maxX:x+2,minZ:(r.minZ+r.maxZ)/2-.08,maxZ:(r.minZ+r.maxZ)/2+.08});}}
   rectangles(lanes,0x9a9279,.02,.015);
   const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sg=shadowCanvas.getContext('2d'),gradient=sg.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.6)');gradient.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=gradient;sg.fillRect(0,0,64,64);
   const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.5});materials.push(shadowMaterial);const shadowGeometry=new THREE.PlaneGeometry(1,1);geometries.push(shadowGeometry);const shadows=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,objects.length),dummy=new THREE.Object3D();objects.forEach((e,i)=>{const b=e.bounds;dummy.position.set((b.minX+b.maxX)/2,.13,(b.minZ+b.maxZ)/2);dummy.rotation.x=-Math.PI/2;dummy.scale.set((b.maxX-b.minX)*1.2,(b.maxZ-b.minZ)*1.2,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);});shadows.computeBoundingSphere();scene.add(shadows);
   const lightCanvas=document.createElement('canvas');lightCanvas.width=lightCanvas.height=64;const lg=lightCanvas.getContext('2d'),pool=lg.createRadialGradient(32,32,0,32,32,32);pool.addColorStop(0,'rgba(255,196,120,.6)');pool.addColorStop(1,'rgba(255,196,120,0)');lg.fillStyle=pool;lg.fillRect(0,0,64,64);
   const glowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(lightCanvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.22});materials.push(glowMaterial);const lights=getLights(),pools=new THREE.InstancedMesh(shadowGeometry,glowMaterial,lights.length);lights.forEach((p,i)=>{dummy.position.set(p.x,.145,p.z);dummy.rotation.x=-Math.PI/2;dummy.scale.set(10,10,1);dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix);});pools.computeBoundingSphere();scene.add(pools);
   canvas.style.background='transparent';state.ready=true;
  }catch(error){state.error=error.message;console.warn('Minimapa 3D no disponible; se conserva la vista 2D',error);}})();return loading;},
  draw(now,player,yaw){if(!state.ready)return false;
   if(now-lastPaint<1/20)return true;lastPaint=now;
   const version=getDiscoveryVersion();
   // Reuse the same 3D image while stationary; enemy markers still repaint at 20 Hz.
   if(now-last>=1/10&&(version===null||player.x!==mapPose.x||player.z!==mapPose.z||yaw!==mapPose.yaw||version!==mapPose.version))render(now,player,yaw,version);
   const W=canvas.width,C=W/2;ctx.save();ctx.clearRect(0,0,W,W);ctx.beginPath();ctx.arc(C,C,C-2,0,Math.PI*2);ctx.clip();hudRect=canvas.getBoundingClientRect();
   // Exploration remains authoritative; unvisited ground is darkened in projection.
   const range=84,cell=4;ctx.fillStyle='#0b151e';ctx.strokeStyle='#0b151e';ctx.lineWidth=1;
   const startX=Math.floor((player.x-range)/cell)*cell,startZ=Math.floor((player.z-range)/cell)*cell;
   const endX=Math.ceil((player.x+range)/cell)*cell,endZ=Math.ceil((player.z+range)/cell)*cell;
   const key=[startX,startZ,endX,endZ,version].join(',');
   if(!fogPath||version===null||key!==fogKey){
    fogPath=new Path2D();fogKey=key;projectedFog=null;
    for(let z=startZ;z<endZ;z+=cell)for(let x=startX;x<endX;x+=cell){
     if(!known({minX:x+.1,maxX:x+3.9,minZ:z+.1,maxZ:z+3.9}))fogPath.rect(x,z,cell,cell);
    }
   }
   // Reproject one cached vector path. Moving/turning changes the transform,
   // while exploration changes the mask; neither needs thousands of JS projections.
   const projectionKey=[state.frames,W].join(',');
   if(!projectedFog||projectionKey!==projectedFogKey){
    const origin=screen(0,0),stepX=screen(cell,0),stepZ=screen(0,cell);
    projectedFog=new Path2D();projectedFogKey=projectionKey;
    projectedFog.addPath(fogPath,new DOMMatrix([(stepX.x-origin.x)/cell,(stepX.y-origin.y)/cell,(stepZ.x-origin.x)/cell,(stepZ.y-origin.y)/cell,origin.x,origin.y]));
   }
   ctx.fill(projectedFog);ctx.stroke(projectedFog);
   if(!vignette||vignetteWidth!==W){vignetteWidth=W;vignette=ctx.createRadialGradient(C,C,C*.5,C,C,C);vignette.addColorStop(0,'rgba(7,15,23,0)');vignette.addColorStop(1,'rgba(7,15,23,.6)');}ctx.fillStyle=vignette;ctx.fillRect(0,0,W,W);
   const playerScreen=screen(player.x,player.z);const beam=ctx.createLinearGradient(0,playerScreen.y-40,0,playerScreen.y);beam.addColorStop(0,'rgba(136,201,242,0)');beam.addColorStop(1,'rgba(136,201,242,.35)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(playerScreen.x,playerScreen.y);ctx.lineTo(playerScreen.x-15,playerScreen.y-40);ctx.lineTo(playerScreen.x+15,playerScreen.y-40);ctx.fill();
   for(const e of getEnemies()){if(['dead','death'].includes(e.state.toLowerCase()))continue;const p=e.g.position;if(marker(p.x,p.z,player))circle(screen(p.x,p.z),4.5,e.type==='ground-swarm'?'#459bff':'#ff5554');}
   for(const shop of getShops())if(marker(shop.x,shop.z,player)){const p=screen(shop.x,shop.z);circle(p,8,'#68da77');ctx.strokeStyle='#133520';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(p.x-5,p.y-3);ctx.lineTo(p.x-3,p.y-3);ctx.lineTo(p.x-1,p.y+2);ctx.lineTo(p.x+3,p.y+2);ctx.lineTo(p.x+4,p.y-1);ctx.lineTo(p.x-2,p.y-1);ctx.stroke();ctx.fillStyle='#133520';for(const dx of [-.5,3]){ctx.beginPath();ctx.arc(p.x+dx,p.y+4,.8,0,Math.PI*2);ctx.fill();}}
   for(const gas of getGas())if(marker(gas.x,gas.z,player)){const p=screen(gas.x,gas.z);circle(p,8,'#ca83e6');ctx.strokeStyle='#301a3b';ctx.lineWidth=1.3;ctx.strokeRect(p.x-3,p.y-4,5,7);ctx.strokeRect(p.x-2,p.y-3,3,2);ctx.beginPath();ctx.moveTo(p.x+2,p.y-2);ctx.lineTo(p.x+4,p.y);ctx.lineTo(p.x+4,p.y+3);ctx.moveTo(p.x-4,p.y+4);ctx.lineTo(p.x+3,p.y+4);ctx.stroke();}
   ctx.beginPath();ctx.moveTo(playerScreen.x,playerScreen.y-10);ctx.lineTo(playerScreen.x+7,playerScreen.y+7);ctx.lineTo(playerScreen.x,playerScreen.y+3);ctx.lineTo(playerScreen.x-7,playerScreen.y+7);ctx.closePath();ctx.fillStyle='#e2f5ff';ctx.fill();ctx.strokeStyle='#0d1c28';ctx.lineWidth=2;ctx.stroke();ctx.restore();
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 14px Arial';ctx.fillStyle='#d1e9fa';ctx.strokeStyle='#11202d';ctx.lineWidth=3;
   for(const [name,dx,dz]of [['N',0,-1],['E',1,0],['S',0,1],['W',-1,0]]){const origin=screen(player.x,player.z),end=screen(player.x+dx*10,player.z+dz*10),angle=Math.atan2(end.y-origin.y,end.x-origin.x);const x=C+Math.cos(angle)*(C-13),y=C+Math.sin(angle)*(C-13);ctx.strokeText(name,x,y);ctx.fillText(name,x,y);}ctx.textBaseline='alphabetic';return true;
  },
  composite(){
   if(!state.ready||!hudRect||canvas.getBoundingClientRect().width===0)return;
   const root=renderer.domElement.getBoundingClientRect(),border=(hudRect.width-canvas.clientWidth)/2;
   const x=hudRect.left-root.left+border,y=root.bottom-hudRect.bottom+border,w=canvas.clientWidth,h=canvas.clientHeight;
   const saved={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),test:renderer.getScissorTest(),auto:renderer.autoClear,stats:{...renderer.info.render}};
   try{renderer.setRenderTarget(null);renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);renderer.setScissorTest(true);renderer.autoClear=false;renderer.render(overlayScene,overlayCamera);}
   finally{renderer.setRenderTarget(saved.target);renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.test);renderer.autoClear=saved.auto;for(const key of ['calls','triangles','lines','points'])renderer.info.render[key]=saved.stats[key];}
  },
  // One-shot QA export only; gameplay uses the GPU texture directly, without readbacks.
  capture(){
   const bytes=new Uint8Array(256*256*4),image=new ImageData(256,256);renderer.readRenderTargetPixels(target,0,0,256,256,bytes);
   for(let y=0;y<256;y++)image.data.set(bytes.subarray((255-y)*1024,(256-y)*1024),y*1024);
   const raw=document.createElement('canvas');raw.width=raw.height=256;raw.getContext('2d').putImageData(image,0,0);
   const output=document.createElement('canvas');output.width=output.height=canvas.width;const g=output.getContext('2d'),C=output.width/2;g.beginPath();g.arc(C,C,C-2,0,Math.PI*2);g.clip();g.drawImage(raw,0,0,output.width,output.height);g.drawImage(canvas,0,0);return output.toDataURL('image/png');
  },
  info(){return {...state,resolution:256,hz:10,contexts:1,lodOnly:true,gpuCached:true,runtimeReadbacks:0};},
 };
}
