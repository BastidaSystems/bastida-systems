// Light only the original golden lettering, not the purple backing, cables or
// arch. Preserve the model, UVs, textures, collision and existing PBR shading.
// Slow irregular electrical dips; no flashing timer or gameplay RNG. Reduced
// motion leaves the original warm light steady, and pause freezes the clock.
export function vegasLetterIntensity(time,reduced=false){
 if(reduced)return 3.8;
 const cycle=((time%11.7)+11.7)%11.7;
 const dip=(center,width)=>Math.max(0,1-Math.abs(cycle-center)/width);
 return 3.8*(.96+.04*Math.sin(time*1.7)-.78*dip(3.1,.32)-.9*dip(8.4,.44));
}
export function addVegasSignLighting(record){
 let body;
 record.root.traverse(o=>{if(o.isMesh&&!o.userData.buildingCollisionProxy)body=o;});
 if(!body?.material?.map||Array.isArray(body.material))throw Error('Letrero Las Vegas sin material original');
 const original=body.material,material=original.clone(),glow={value:3.8},previousKey=original.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  original.onBeforeCompile.call(original,shader,renderer);
  shader.uniforms.vegasLetterGlow=glow;
  shader.vertexShader='varying vec3 vVegasSignPosition;\nvarying float vVegasSignFacing;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvVegasSignFacing=objectNormal.z;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvVegasSignPosition=transformed;');
  shader.fragmentShader='varying vec3 vVegasSignPosition;\nvarying float vVegasSignFacing;\nuniform float vegasLetterGlow;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float vegasPanel=smoothstep(9.2,9.5,vVegasSignPosition.y)*(1.0-smoothstep(14.3,14.6,vVegasSignPosition.y));
   vegasPanel*=1.0-smoothstep(5.8,6.2,abs(vVegasSignPosition.x));
   vegasPanel*=1.0-smoothstep(.018,.06,abs(vVegasSignPosition.z+17.347));
   vegasPanel*=smoothstep(.35,.75,vVegasSignFacing);
   vegasPanel*=1.0-(1.0-smoothstep(-2.1,-1.9,vVegasSignPosition.x))*smoothstep(13.15,13.28,vVegasSignPosition.y);
   totalEmissiveRadiance+=vec3(1.0,.52,.18)*vegasLetterGlow*vegasPanel;
  `);
 };
 material.customProgramCacheKey=()=>previousKey+'|vegas-letter-glow107';material.needsUpdate=true;body.material=material;
 let time=0;
 record.vegasLighting={body,glow,update(dt,{active=true,reduced=false}={}){
  if(active&&Number.isFinite(dt))time+=Math.max(0,Math.min(.1,dt));
  glow.value=vegasLetterIntensity(time,reduced);
 },info:()=>({time,intensity:glow.value})};
 return {style:'warm-emissive-original-letters',intensity:glow.value,lights:0,shadowLights:0,extraDrawCalls:0,extraTextures:0};
}
