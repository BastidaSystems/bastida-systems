import * as THREE from 'three';

// Authored atlases run left-to-right, top-to-bottom; blank tail cells are excluded.
export function createCombatVFX(scene,{bloodEnabled=true,muzzleOnly=false,fineTracers=false}={}) {
  const loader = new THREE.TextureLoader(), atlases = [], active = [], surfacePool = [];
  const state = { ready: false, errors: [], bloodBursts: 0, surfaceBursts: 0, traces:0,peakTraces:0 };
  const ready = Promise.all((bloodEnabled?['04','05','07']:[]).map(async (id, index) => {
    try {
      const texture = await loader.loadAsync(`assets/vfx/blood-hit-${id}.png`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      atlases[index] = { texture, frames: id === '07' ? 15 : 14 };
    } catch (error) { state.errors.push(`blood-hit-${id}: ${error.message}`); }
  })).then(() => { state.ready = true; });
  const geo = new THREE.SphereGeometry(1, 8, 6);
  const spark = new THREE.MeshBasicMaterial({color:0xffdc91,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const grit = new THREE.MeshBasicMaterial({color:0xafa18c,transparent:true,depthWrite:false,opacity:.32});
  const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
  const traceDuration=fineTracers?.09:.14,maxTraces=fineTracers?4:8;
  const traces=[],tracePool=[],traceGeometry=new THREE.CylinderGeometry(fineTracers?.002:.004,fineTracers?.004:.012,1,8);
  const traceCore=new THREE.MeshBasicMaterial({color:0xffedbe,transparent:true,depthWrite:false,opacity:.95,fog:false,toneMapped:false});
  const traceHalo=new THREE.MeshBasicMaterial({color:0xffb954,transparent:true,depthWrite:false,opacity:.23,fog:false,toneMapped:false,blending:THREE.AdditiveBlending});
  const muzzleMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,
    uniforms:{uStrength:{value:0}},
    vertexShader:'varying vec2 vUV;void main(){vUV=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);vec2 s=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));p.xy+=position.xy*s;gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform float uStrength;varying vec2 vUV;void main(){vec2 p=(vUV-.5)*2.;float r=dot(p,p);float a=exp(-r*5.)*(1.-smoothstep(.15,1.,r))*uStrength;gl_FragColor=vec4(mix(vec3(1.,.40,.08),vec3(1.,.91,.65),exp(-r*14.)),a);#include <colorspace_fragment>}'.replace('#include','\n#include')});
  const muzzleStrength=muzzleOnly?.5:.85,muzzleDuration=muzzleOnly?.055:.11;
  const muzzle=new THREE.Sprite(muzzleMaterial);muzzle.name='rifle-muzzle-glow';muzzle.scale.setScalar(muzzleOnly?.095:.28);muzzle.visible=false;scene.add(muzzle);
  let muzzleAge=1,muzzleFresh=false;
  function flashMuzzle(point){muzzle.position.copy(point);muzzleAge=0;muzzleFresh=true;muzzle.visible=true;muzzleMaterial.uniforms.uStrength.value=muzzleStrength;}
  function releaseTrace(i){const t=traces[i];scene.remove(t.object);tracePool.push(t);traces.splice(i,1);}
  function positionTrace(t,camera,pixelScale){
    // Visual streak travels along the already-resolved hitscan segment, never beyond its hit.
    const progress=Math.min(1,t.age/.085),head=Math.min(t.length,fineTracers?.45+t.age*180:1.2+t.length*progress);
    const tail=Math.max(0,head-Math.min(fineTracers?1.6:7,t.length*(fineTracers?.55:.7))),length=Math.max(.015,head-tail);
    t.object.position.copy(t.from).addScaledVector(t.direction,(head+tail)/2);
    // Keep a small readable width at distance; depth testing still occludes walls.
    const width=camera&&pixelScale>0?Math.max(1,Math.min(fineTracers?8:6,t.object.position.distanceTo(camera.position)*(fineTracers?1.8:.9)/(pixelScale*(fineTracers?.006:.012)))):1;
    t.object.scale.set(width,length,width);t.object.quaternion.setFromUnitVectors(up,t.direction);
    const fade=Math.max(0,1-Math.max(0,t.age-(fineTracers?.02:.035))/(fineTracers?.07:.105));t.core.material.opacity=(fineTracers?.82:.95)*fade;t.halo.material.opacity=(fineTracers?.10:.23)*fade;
  }
  let warmObjects;
  function remove(index) {
    const effect = active[index]; scene.remove(effect.object);
    if (effect.atlas) { effect.object.material.map.dispose(); effect.object.material.dispose(); }
    else if(surfacePool.length<96)surfacePool.push(effect);
    active.splice(index, 1);
  }
  function add(effect) {
    if (active.length >= 96) remove(0);
    active.push(effect); scene.add(effect.object);
  }
  function frame(effect, index) {
    const texture = effect.object.material.map;
    texture.repeat.set(.25, .25);
    texture.offset.set((index % 4) / 4, 1 - (Math.floor(index / 4) + 1) / 4);
  }
  return {
    state, ready,
    get muzzleVisible(){return muzzle.visible;},
    warmObjects(){
      if(!warmObjects){const flash=muzzle.clone();flash.visible=true;
        warmObjects=[...(muzzleOnly?[]:[new THREE.Mesh(geo,spark),new THREE.Mesh(geo,grit)]),...(!muzzleOnly||fineTracers?[new THREE.Mesh(traceGeometry,traceCore),new THREE.Mesh(traceGeometry,traceHalo)]:[]),flash,...atlases.filter(Boolean).map(a=>new THREE.Sprite(new THREE.SpriteMaterial({map:a.texture,transparent:true,depthWrite:false})))];}
      return warmObjects;
    },
    trace(from,to){
      if(muzzleOnly&&!fineTracers){flashMuzzle(from);return;}
      const length=from.distanceTo(to);if(!Number.isFinite(length)||length<.02)return;
      if(traces.length>=maxTraces)releaseTrace(0);
      let t=tracePool.pop();
      if(!t){const object=new THREE.Group(),core=new THREE.Mesh(traceGeometry,traceCore.clone()),halo=new THREE.Mesh(traceGeometry,traceHalo.clone());
        object.name='rifle-tracer';halo.scale.setScalar(fineTracers?1.8:2.6);halo.scale.y=1;object.add(halo,core);
        t={object,core,halo,from:new THREE.Vector3(),direction:new THREE.Vector3(),length:0,age:0};}
      t.from.copy(from);t.direction.copy(to).sub(from).normalize();t.length=length;t.age=0;t.fresh=true;
      positionTrace(t);scene.add(t.object);traces.push(t);state.traces++;state.peakTraces=Math.max(state.peakTraces,traces.length);
      flashMuzzle(from);
    },
    setMuzzlePosition(point){if(muzzle.visible)muzzle.position.copy(point);},
    blood(point) {
      const available = atlases.filter(Boolean);
      if (!available.length) return;
      const atlas = available[Math.floor(Math.random() * available.length)];
      const material = new THREE.SpriteMaterial({map:atlas.texture.clone(), transparent:true,
        depthWrite:false, rotation:(Math.random()-.5)*.7});
      const object = new THREE.Sprite(material);
      object.position.copy(point); object.scale.setScalar(1.15 + Math.random()*.3);
      const effect = { object, atlas, age:0, duration:atlas.frames/30 };
      frame(effect, 0); add(effect); state.bloodBursts++;
    },
    surface(point, normal) {
      if(muzzleOnly)return;
      const n = normal.clone().normalize();
      for (let i = 0; i < 12; i++) {
        const isSpark = i < 5;
        const effect=surfacePool.pop()||{object:new THREE.Mesh(geo,spark),velocity:new THREE.Vector3(),materials:{spark:spark.clone(),grit:grit.clone()}};
        const object=effect.object;object.material=isSpark?effect.materials.spark:effect.materials.grit;effect.spark=isSpark;effect.fresh=true;
        object.name=isSpark?'rifle-impact-spark':'rifle-impact-grit';
        const radius=isSpark?.018:.025+Math.random()*.025;
        effect.radius=radius;object.scale.set(isSpark?.009:radius,isSpark?.11:radius,isSpark?.009:radius);
        object.material.opacity=isSpark?.9:.32;
        object.position.copy(point).addScaledVector(n,.025);
        const velocity = effect.velocity.set(Math.random()-.5,Math.random()-.5,Math.random()-.5);
        velocity.addScaledVector(n,1.8).normalize().multiplyScalar(isSpark ? 2+Math.random()*2 : .6+Math.random());
        object.quaternion.setFromUnitVectors(up,direction.copy(velocity).normalize());
        effect.age=0;effect.duration=isSpark ? .12+Math.random()*.1 : .3+Math.random()*.15;add(effect);
      }
      state.surfaceBursts++;
    },
    update(dt,{camera,pixelScale}={}) {
      dt=Math.max(0,Number.isFinite(dt)?dt:0);
      for(let i=traces.length-1;i>=0;i--){const t=traces[i];if(t.fresh)t.fresh=false;else t.age+=dt;if(t.age>=traceDuration)releaseTrace(i);else positionTrace(t,camera,pixelScale);}
      if(muzzleFresh)muzzleFresh=false;else muzzleAge+=dt;muzzle.visible=muzzleAge<muzzleDuration;
      muzzleMaterial.uniforms.uStrength.value=muzzleStrength*Math.max(0,1-Math.max(0,muzzleAge-(muzzleOnly?0:.025))/(muzzleOnly?muzzleDuration:.085));
      for (let i = active.length-1; i >= 0; i--) {
        const effect = active[i];if(effect.fresh){effect.fresh=false;continue;}effect.age += dt;
        if (effect.age >= effect.duration) { remove(i); continue; }
        if (effect.atlas) {
          frame(effect, Math.min(effect.atlas.frames-1,Math.floor(effect.age*30)));
          effect.object.material.opacity = Math.min(1,(effect.duration-effect.age)/.12);
        } else {
          effect.object.position.addScaledVector(effect.velocity,dt);
          effect.velocity.y -= 5*dt;
          const fade=Math.max(0,1-effect.age/effect.duration);
          effect.object.material.opacity=(effect.spark?.9:.32)*fade*fade;
          if(effect.spark){effect.object.quaternion.setFromUnitVectors(up,direction.copy(effect.velocity).normalize());effect.object.scale.set(.009*fade,.11*(.35+.65*fade),.009*fade);}
          else effect.object.scale.setScalar(effect.radius*(.65+.35*fade));
        }
      }
    },
    reset() { while (active.length) remove(active.length-1);while(traces.length)releaseTrace(traces.length-1);muzzleAge=1;muzzleFresh=false;muzzle.visible=false;muzzleMaterial.uniforms.uStrength.value=0; },
    info() { return {...state, active:active.length, pooled:surfacePool.length, atlases:atlases.filter(Boolean).length,
      activeTraces:traces.length,pooledTraces:tracePool.length,maxTraces,traceDuration,fineTracers,muzzleVisible:muzzle.visible,muzzleOnly}; },
  };
}
