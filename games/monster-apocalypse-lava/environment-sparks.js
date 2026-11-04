import * as THREE from 'three';

export const SPARK_LIMITS=Object.freeze({capacity:96,maxEmitters:4,maxDistance:45});
const PRESETS=Object.freeze({
  embers:{cap:48,interval:[.08,.15],burst:[1,1],life:[1.3,2.8],size:[.045,.11],gravity:-.08},
  electric:{cap:24,interval:[.9,2.6],burst:[3,6],life:[.08,.22],size:[.32,.65],gravity:.2},
  electricLarge:{cap:24,interval:[.15,.4],burst:[3,5],life:[.15,.32],size:[1,2.2],gravity:.15},
  metal:{cap:24,interval:[2.2,4.5],burst:[4,8],life:[.35,.85],size:[.14,.26],gravity:7.5},
});

// Fixed pool and private random stream: never consumes combat/AI randomness.
export function createSparkSimulation(config,{seed=0x53475032,capacity=SPARK_LIMITS.capacity}={}){
  if(config.length>SPARK_LIMITS.maxEmitters)throw Error('Too many spark emitters');
  const kinds=new Set(),electricCount=config.filter(c=>c.kind==='electric'||c.kind==='electricLarge').length;
  const emitters=config.map(c=>{
    if(!PRESETS[c.kind]||kinds.has(c.kind)||typeof c.anchor?.getWorldPosition!=='function')throw Error('Invalid spark anchor');
    const preset={...PRESETS[c.kind]};if(c.kind==='electric'||c.kind==='electricLarge')preset.cap=Math.floor(24/electricCount);
    kinds.add(c.kind);return {...c,preset,enabled:true,additionalAnchors:[],anchorIndex:0,position:new THREE.Vector3(),distancePosition:new THREE.Vector3(),active:0,timer:c.kind==='embers'?0:.15,far:false};
  });
  if(!Number.isInteger(capacity)||capacity<1||capacity>SPARK_LIMITS.capacity)throw Error('Invalid particle capacity');
  const pool=Array.from({length:capacity},()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,size:0,phase:0,brightness:1,tile:0,emitter:null}));
  let count=0,enabled=true,peak=0,total=0,budget=pool.length,lastListener=null;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const range=(a,b)=>a+(b-a)*random();
  function remove(i){const dead=pool[i];dead.emitter.active--;pool[i]=pool[--count];pool[count]=dead;}
  function clear(){while(count)remove(count-1);}
  function spawn(e,n){
    const targets=[e.anchor,...e.additionalAnchors].filter(a=>!lastListener||a.getWorldPosition(e.distancePosition).distanceToSquared(lastListener)<=(e.maxDistance||SPARK_LIMITS.maxDistance)**2);
    if(!targets.length)return 0;
    const first=e.anchorIndex++%targets.length;
    targets[first].getWorldPosition(e.position);const p=e.position,pr=e.preset;
    if(![p.x,p.y,p.z].every(Number.isFinite))return 0;
    let made=0;
    for(let i=0;i<n&&count<budget&&e.active<pr.cap;i++){
      // Share a single burst across nearby large faults, so the adjacent pair reads together.
      if(e.kind==='electricLarge')targets[(first+i)%targets.length].getWorldPosition(p);
      const s=pool[count++];s.emitter=e;s.age=0;s.life=range(...pr.life);s.size=range(...pr.size);s.phase=range(0,Math.PI*2);s.brightness=range(.65,1);
      const ember=e.kind==='embers',electric=e.kind==='electric'||e.kind==='electricLarge',large=e.kind==='electricLarge';
      s.x=p.x+range(ember?-.65:-.08,ember?.65:.08);s.y=p.y+range(-.08,.12);s.z=p.z+range(ember?-.9:-.08,ember?.9:.08);
      if(large){s.x=p.x+range(-2.2,2.2);s.y=p.y+range(-1.8,1.8);s.z=p.z+range(-1.7,1.7);}
      s.vx=range(ember?-.22:electric?-.35:-2.8,ember?.22:electric?.35:2.8);
      s.vy=range(ember?.8:electric?-.3:1.2,ember?1.65:electric?.3:3);
      s.vz=range(ember?-.22:electric?-.35:-2,ember?.22:electric?.35:2);
      s.tile=ember?0:electric?(random()<.5?1:3):2;e.active++;made++;total++;
    }
    peak=Math.max(peak,count);return made;
  }
  return {
    get count(){return count;},get pool(){return pool;},
    setEnabled(value){enabled=!!value;if(!enabled)clear();else for(const e of emitters)e.timer=e.kind==='embers'?0:.15;},
    burst(kind,n){if(!enabled)return 0;const e=emitters.find(e=>e.kind===kind);return e&&e.enabled&&!e.far?spawn(e,Math.min(SPARK_LIMITS.capacity,Math.max(0,Math.floor(n??e.preset.burst[1])))):0;},
    burstAt(position,{radius=.6,height=1.8,count:amount=8,weakPoint=false,anchor:followAnchor=null}={}){
      if(!enabled||![position?.x,position?.y,position?.z,radius,height,amount].every(Number.isFinite))return 0;
      if(weakPoint&&(!followAnchor?.isEffectActive?.()||typeof followAnchor?.getWorldPosition!=='function'||pool.slice(0,count).filter(p=>p.emitter.weakPoint).length>=10))return 0;
      // A gameplay cue may replace one ambient spark, never increase the
      // selected quality budget or displace an enemy-arrival effect.
      if(weakPoint&&count>=budget){const i=pool.findIndex((p,i)=>i<count&&!p.emitter.transient);if(i>=0)remove(i);}
      const origin=new THREE.Vector3(position.x,position.y,position.z),anchor={getWorldPosition:target=>target.copy(origin)};
      const e={kind:'electric',transient:true,weakPoint,followAnchor,anchor,additionalAnchors:[],anchorIndex:0,position:new THREE.Vector3(),distancePosition:new THREE.Vector3(),active:0,preset:{...PRESETS.electric,cap:weakPoint?1:10,life:weakPoint?[.14,.26]:[.35,.75],size:weakPoint?[.18,.35]:[.3,.7]}};
      const start=count,made=spawn(e,Math.min(weakPoint?1:10,Math.max(0,Math.floor(amount))));
      for(let i=start;i<count;i++){const p=pool[i],a=random()*Math.PI*2,r=range(.4,1)*Math.max(.1,radius);p.x=origin.x+Math.cos(a)*r;p.z=origin.z+Math.sin(a)*r;p.y=origin.y+range(.05,Math.max(.1,height));p.vy=range(.1,.5);}
      return made;
    },
    clearTransient(){for(let i=count-1;i>=0;i--)if(pool[i].emitter.transient)remove(i);},
    setKindEnabled(kind,value){const e=emitters.find(e=>e.kind===kind);if(!e)return;e.enabled=!!value;
      if(!e.enabled)for(let i=count-1;i>=0;i--)if(pool[i].emitter===e)remove(i);},
    setAdditionalAnchors(kind,anchors){const e=emitters.find(e=>e.kind===kind);if(!e)return;
      if(anchors.length>3||anchors.some(a=>typeof a?.getWorldPosition!=='function'))throw Error('Invalid additional anchor');
      e.additionalAnchors=[...anchors];e.anchorIndex=0;},
    setBudget(value){budget=Math.max(4,Math.min(pool.length,Math.floor(value)));while(count>budget)remove(count-1);},
    clear,
    update(dt,{playing=true,listener}={}){
      if(!enabled||!playing)return;dt=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));
      lastListener=listener||null;
      for(const e of emitters){
        if(!e.enabled)continue;
        e.anchor.getWorldPosition(e.position);e.far=!!listener&&[e.anchor,...e.additionalAnchors].every(a=>a.getWorldPosition(e.distancePosition).distanceToSquared(listener)>(e.maxDistance||SPARK_LIMITS.maxDistance)**2);
        if(e.far){e.timer=.15;continue;}
        e.timer-=dt;if(e.timer<=0){spawn(e,Math.floor(range(e.preset.burst[0],e.preset.burst[1]+1)));e.timer=range(...e.preset.interval);}
      }
      for(let i=count-1;i>=0;i--){const p=pool[i],e=p.emitter;p.age+=dt;
        if(e.weakPoint){
          if(!e.followAnchor.isEffectActive()){remove(i);continue;}
          e.followAnchor.getWorldPosition(e.distancePosition);
          p.x+=e.distancePosition.x-e.position.x;p.y+=e.distancePosition.y-e.position.y;p.z+=e.distancePosition.z-e.position.z;
          e.position.copy(e.distancePosition);
        }
        if(p.age>=p.life||e.far){remove(i);continue;}
        p.vy-=e.preset.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
        if(e.kind==='embers'){p.x+=Math.sin(p.age*2+p.phase)*.14*dt;p.z+=Math.cos(p.age*1.6+p.phase)*.1*dt;}
        const floor=Number.isFinite(e.groundY)?e.groundY:.03;
        if(e.kind==='metal'&&p.y<floor){p.y=floor;p.vy=Math.abs(p.vy)*.22;p.vx*=.65;p.vz*=.65;}
      }
    },
    info:()=>({enabled,active:count,weakPoints:pool.slice(0,count).filter(p=>p.emitter.weakPoint).length,capacity:pool.length,budget,peak,total,emitters:emitters.map(e=>({kind:e.kind,enabled:e.enabled,targets:1+e.additionalAnchors.length,active:e.active,cap:e.preset.cap,far:e.far,position:e.position.toArray()}))}),
  };
}

// One bounded Points draw, one small shared atlas, no lights/shadows/render passes.
export async function createEnvironmentSparks(scene,{anchors,enabled=true,capacity=SPARK_LIMITS.capacity,manifestURL='assets/atmosphere/sparks-v1/manifest.json'}={}){
  const config=Object.entries(anchors||{}).filter(([,anchor])=>anchor).map(([kind,anchor])=>({kind,anchor,groundY:anchor.userData?.environmentGroundY,maxDistance:anchor.userData?.environmentMaxDistance}));
  const simulation=createSparkSimulation(config,{capacity});simulation.setEnabled(enabled);
  const url=new URL(manifestURL,location.href),r=await fetch(url,{signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Spark manifest unavailable');const asset=await r.json();
  if(asset.width!==128||asset.height!==128||asset.columns!==2||asset.rows!==2)throw Error('Invalid spark atlas');
  const texture=await new THREE.TextureLoader().loadAsync(new URL(asset.path,url).href);
  if(texture.image.width!==128||texture.image.height!==128){texture.dispose();throw Error('Spark texture dimensions mismatch');}
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;
  const geometry=new THREE.BufferGeometry(),attributes={};
  for(const [name,size]of [['position',3],['aSize',1],['aTint',3],['aOpacity',1],['aAngle',1],['aTile',1]]){
    attributes[name]=new THREE.BufferAttribute(new Float32Array(capacity*size),size).setUsage(THREE.DynamicDrawUsage);geometry.setAttribute(name,attributes[name]);
  }
  const attributeList=Object.values(attributes);
  const fallbackForward=new THREE.Vector3(0,0,-1);
  const material=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{uAtlas:{value:texture},uPixelScale:{value:800},uPointLimit:{value:64},uFogDensity:{value:scene.fog?.isFogExp2?scene.fog.density:0}},
    vertexShader:`attribute float aSize;attribute vec3 aTint;attribute float aOpacity;attribute float aAngle;attribute float aTile;
      uniform float uPixelScale;uniform float uPointLimit;uniform float uFogDensity;varying vec3 vTint;varying float vOpacity;varying float vAngle;varying float vTile;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uPixelScale/max(.01,-mv.z),1.,uPointLimit);vTint=aTint;
        vOpacity=aOpacity*exp(-uFogDensity*uFogDensity*mv.z*mv.z);vAngle=aAngle;vTile=aTile;}`,
    fragmentShader:`uniform sampler2D uAtlas;varying vec3 vTint;varying float vOpacity;varying float vAngle;varying float vTile;
      void main(){float c=cos(vAngle),s=sin(vAngle);vec2 p=mat2(c,-s,s,c)*(vec2(gl_PointCoord.x,1.-gl_PointCoord.y)-.5)+.5;
        if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)discard;
        vec2 uv=vec2((mod(vTile,2.)*64.+4.5+p.x*55.)/128.,1.-(floor(vTile/2.)*64.+4.5+(1.-p.y)*55.)/128.);
        vec4 sampleColor=texture2D(uAtlas,uv);float a=sampleColor.a*vOpacity;if(a<.012)discard;
        gl_FragColor=vec4(sampleColor.rgb*vTint,a);
        #include <colorspace_fragment>
      }`,
  });
  const object=new THREE.Points(geometry,material);object.name='local-environment-sparks';object.frustumCulled=false;object.visible=false;scene.add(object);
  const right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);let disposed=false,lastPlaying=false;
  function upload(frame){
    up.copy(frame.up||{x:0,y:1,z:0});right.crossVectors(frame.forward||fallbackForward,up).normalize();
    for(let i=0;i<simulation.count;i++){
      const p=simulation.pool[i],t=p.age/p.life,kind=p.emitter.kind,fade=Math.sin(Math.PI*t)**.65;
      attributes.position.setXYZ(i,p.x,p.y,p.z);attributes.aSize.setX(i,p.size*(kind==='embers'?1-t*.3:1));
      const electric=kind==='electric'||kind==='electricLarge';
      const flicker=electric?.5+.5*Math.abs(Math.sin(p.age*95+p.phase)):.85+.15*Math.sin(p.age*12+p.phase);
      attributes.aOpacity.setX(i,fade*p.brightness*flicker);
      if(kind==='embers')attributes.aTint.setXYZ(i,1,.16+(1-t)*.22,.012);
      else if(p.emitter.weakPoint)attributes.aTint.setXYZ(i,1,.82,.3);
      else if(electric)attributes.aTint.setXYZ(i,.62,.82,1);
      else attributes.aTint.setXYZ(i,1,.78,.45);
      const vx=p.vx*right.x+p.vy*right.y+p.vz*right.z,vy=p.vx*up.x+p.vy*up.y+p.vz*up.z;
      attributes.aAngle.setX(i,electric?p.phase:Math.atan2(vy,vx)-Math.PI/2);attributes.aTile.setX(i,p.tile);
    }
    for(const a of attributeList)a.needsUpdate=true;
    geometry.setDrawRange(0,simulation.count);object.visible=simulation.count>0;
  }
  return {
    setKindEnabled:simulation.setKindEnabled,setAdditionalAnchors:simulation.setAdditionalAnchors,
    burstKind:(kind,n)=>simulation.burst(kind,n),
    burstAt:simulation.burstAt,clearTransient:simulation.clearTransient,
    setBudget(value){simulation.setBudget(value);geometry.setDrawRange(0,simulation.count);},
    setEnabled(value){simulation.setEnabled(value);if(!value){object.visible=false;geometry.setDrawRange(0,0);}},
    burst(){if(disposed||!lastPlaying)return 0;return simulation.burst('embers',12)+simulation.burst('electric',8)+simulation.burst('electricLarge',6)+simulation.burst('metal',10);},
    clear(){simulation.clear();object.visible=false;geometry.setDrawRange(0,0);},
    update(dt,frame){if(disposed)return;lastPlaying=frame.mode==='playing';simulation.update(dt,{playing:lastPlaying,listener:frame.listener});
      material.uniforms.uFogDensity.value=scene.fog?.isFogExp2?scene.fog.density:0;
      if(Number.isFinite(frame.pixelScale))material.uniforms.uPixelScale.value=frame.pixelScale;
      if(lastPlaying)upload(frame);
    },
    dispose(){if(disposed)return;disposed=true;simulation.clear();scene.remove(object);texture.dispose();material.dispose();geometry.dispose();},
    info:()=>({...simulation.info(),disposed,textureBytes:disposed?0:128*128*4,attributeBytes:disposed?0:Object.values(attributes).reduce((n,a)=>n+a.array.byteLength,0),drawCalls:object.visible&&!disposed?1:0}),
  };
}
