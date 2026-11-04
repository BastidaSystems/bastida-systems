// Temporary alpha on the existing instance. Restore every material/shadow flag
// before gameplay, death or pool recycling; never replace its textures or mesh.
export function createEnemyArrivalFade(root){
 const materials=new Map(),shadows=[];let restored=false;
 root.traverse(o=>{if(!o.isMesh)return;shadows.push([o,o.castShadow]);o.castShadow=false;
  for(const m of [o.material].flat())if(m&&!materials.has(m)){
   materials.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,forceSinglePass:m.forceSinglePass});
   if(!m.transparent)m.needsUpdate=true;m.transparent=true;m.depthWrite=false;m.forceSinglePass=true;m.opacity=0;
  }
 });
 return {set(value){if(restored)return;const t=Math.max(0,Math.min(1,value));for(const [m,s]of materials)m.opacity=s.opacity*t;},
  restore(){if(restored)return;restored=true;for(const [m,s]of materials){if(m.transparent!==s.transparent)m.needsUpdate=true;Object.assign(m,s);}for(const [o,cast]of shadows)o.castShadow=cast;},
 };
}
