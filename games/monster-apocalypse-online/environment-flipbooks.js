import * as THREE from 'three';

export function validateFlipbook(a){
  for(const k of ['width','height','columns','rows','frames','cellWidth','cellHeight','gutter'])if(!Number.isInteger(a[k])||a[k]<(k==='gutter'?0:1))throw Error('Invalid flipbook '+k);
  if(a.frames>a.columns*a.rows||a.width!==a.columns*(a.cellWidth+2*a.gutter)||a.height!==a.rows*(a.cellHeight+2*a.gutter))throw Error('Flipbook grid mismatch');
  if(!Number.isFinite(a.fps)||a.fps<=0||a.fps>60)throw Error('Invalid flipbook FPS');
  if(!['normal','additive'].includes(a.blend))throw Error('Unsupported blend');
  return a;
}

// Same Sprite/Texture animation approach as combat-vfx, with independently validated rectangular grids.
export function createEnvironmentFlipbooks(scene,{maxEffects=12,maxDistance=55}={}){
  const assets=new Map(),pending=new Map(),effects=new Set(),loader=new THREE.TextureLoader();
  let disposed=false,enabled=true,explosionWarmup=null;const state={errors:[],peakEffects:0};
  async function load(a,baseURL){
    if(disposed)throw Error('Disposed flipbook system');validateFlipbook(a);
    if(pending.has(a.id))return pending.get(a.id);
    const task=(async()=>{
      const texture=await loader.loadAsync(new URL(a.path,baseURL).href);
      if(disposed){texture.dispose();throw Error('Disposed flipbook system');}
      if(texture.image.width!==a.width||texture.image.height!==a.height){texture.dispose();throw Error('Image dimensions differ from validated grid');}
      texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;
      texture.minFilter=texture.magFilter=THREE.LinearFilter;
      texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
      const entry={...a,texture};assets.set(a.id,entry);return entry;
    })().catch(error=>{state.errors.push(a.id+': '+error.message);pending.delete(a.id);throw error;});
    pending.set(a.id,task);return task;
  }
  function setFrame(e,index){
    const a=e.asset,t=e.object.material.map;index=Math.min(a.frames-1,Math.max(0,index));
    // Half-texel inset + duplicated gutters prevent sampling adjacent cells on mobile GPUs.
    t.repeat.set((a.cellWidth-1)/a.width,(a.cellHeight-1)/a.height);
    t.offset.set(((index%a.columns)*(a.cellWidth+2*a.gutter)+a.gutter+.5)/a.width,
      1-(Math.floor(index/a.columns)*(a.cellHeight+2*a.gutter)+a.gutter+a.cellHeight-.5)/a.height);
    const blur=e.object.material.userData.blastBlur;
    if(blur){blur.min.value.copy(t.offset);blur.max.value.copy(t.offset).add(t.repeat);}
    e.frame=index;
  }
  function remove(e){if(!effects.has(e))return;effects.delete(e);scene.remove(e.object);e.object.material.map?.dispose();e.object.material.dispose();}
  function addGlow(anchor,{offset=[0,4,0],size=[52,52],maxDistance=160}={}){
    if(disposed||effects.size>=maxEffects||!anchor)return null;
    // One world-space billboard scatters warm light through local fog. Its soft
    // circular mask and depth test keep foreground objects and the sky untouched.
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,
      uniforms:{uStrength:{value:0},uFogDensity:{value:scene.fog?.density||0},uTint:{value:new THREE.Color(0xffb96c)}},
      vertexShader:`varying vec2 vGlowUV;varying float vGlowDepth;
        void main(){vGlowUV=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);
          vec2 s=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
          p.xy+=position.xy*s;vGlowDepth=max(0.,-p.z);gl_Position=projectionMatrix*p;}`,
      fragmentShader:`uniform float uStrength;uniform float uFogDensity;uniform vec3 uTint;
        varying vec2 vGlowUV;varying float vGlowDepth;
        void main(){float r=length(vGlowUV-.5)*2.;float mask=pow(max(0.,1.-r*r),3.);
          float haze=exp(-max(0.,uFogDensity)*vGlowDepth*.075);
          float a=mask*clamp(uStrength,0.,1.)*haze*.8;if(a<.002)discard;
          gl_FragColor=vec4(uTint,a);
          #include <colorspace_fragment>
        }`,
    });
    const object=new THREE.Sprite(material);object.name='environment-blast-glow';object.scale.set(size[0],size[1],1);object.visible=false;scene.add(object);
    const e={object,glow:true,enabled:false,cinematic:true,maxDistance,asset:{id:'blast-glow'},anchor,offset:new THREE.Vector3(...offset),age:0,frame:0};
    effects.add(e);state.peakEffects=Math.max(state.peakEffects,effects.size);return e;
  }
  function add({asset,anchor,offset=[0,0,0],size=[1,1],opacity=1,loop,phase=0,enabled:effectEnabled=true,maxDistance:effectDistance=maxDistance,cinematic=false,emissiveFogScale=1,softness=0}){
    if(disposed||!assets.has(asset))return null;
    if(!anchor||typeof anchor.getWorldPosition!=='function'||![...offset,...size,opacity,phase].every(Number.isFinite)||size.some(n=>n<=0))throw Error('Invalid effect anchor');
    if(effects.size>=maxEffects)return null;
    const a=assets.get(asset),material=new THREE.SpriteMaterial({map:a.texture.clone(),transparent:true,depthWrite:false,
      depthTest:true,fog:true,alphaTest:.01,opacity:Math.max(0,Math.min(1,opacity)),toneMapped:false,
      blending:a.blend==='additive'?THREE.AdditiveBlending:THREE.NormalBlending});
    const softBlast=asset==='explosion'&&cinematic&&Number.isFinite(softness)&&softness>0;
    const veiledBlast=asset==='explosion'&&cinematic&&Number.isFinite(emissiveFogScale)&&emissiveFogScale<1;
    if(softBlast||veiledBlast){
      // Hot fire remains veiled, but its emitted radiance travels through more
      // haze than an unlit surface. Only this sprite gets the attenuation model.
      const scale=veiledBlast?Math.max(.05,emissiveFogScale):1;
      material.userData.emissiveFogScale=scale;
      if(softBlast){
        const radius=Math.min(5,Math.max(0,softness));
        material.userData.blastBlur={radius,min:{value:new THREE.Vector2()},max:{value:new THREE.Vector2()},
          step:{value:new THREE.Vector2(radius/3.230769/a.width,radius/3.230769/a.height)}};
      }
      material.onBeforeCompile=shader=>{
        shader.uniforms.uBlastFogScale={value:scale};
        shader.fragmentShader='uniform float uBlastFogScale;\n'+shader.fragmentShader.replace('#include <fog_fragment>',THREE.ShaderChunk.fog_fragment.replace('fogDensity * fogDensity','fogDensity * fogDensity * uBlastFogScale * uBlastFogScale'));
        const blur=material.userData.blastBlur;if(!blur)return;
        Object.assign(shader.uniforms,{uBlastFrameMin:blur.min,uBlastFrameMax:blur.max,uBlastBlurStep:blur.step});
        // Bilinear Gaussian taps soften this fireball only. Clamp every tap to
        // the active cell so neither neighbouring frames nor dark RGB edges bleed in.
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>',`#include <map_pars_fragment>
          uniform vec2 uBlastFrameMin;uniform vec2 uBlastFrameMax;uniform vec2 uBlastBlurStep;
          vec4 maBlastTap(vec2 uv){vec4 c=texture2D(map,clamp(uv,uBlastFrameMin,uBlastFrameMax));return vec4(c.rgb*c.a,c.a);}
          float maBlastWeight(int i){return i==0?.227027:(i==1||i==-1?.316216:.0702705);}
          float maBlastOffset(int i){return i==0?0.:(i==1?1.384615:(i==-1?-1.384615:(i==2?3.230769:-3.230769)));}
          vec4 maSoftBlast(vec2 uv){vec4 c=vec4(0.);
            for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){
              c+=maBlastTap(uv+vec2(maBlastOffset(x),maBlastOffset(y))*uBlastBlurStep)*maBlastWeight(x)*maBlastWeight(y);
            }
            return vec4(c.rgb/max(c.a,.00001),c.a);}
        `).replace('#include <map_fragment>',`#ifdef USE_MAP
          diffuseColor*=maSoftBlast(vMapUv);
        #endif`);
      };
      material.customProgramCacheKey=()=>'environment-emissive-blast-fog-soft-v2-'+softBlast;
    }
    const object=new THREE.Sprite(material);object.scale.set(size[0],size[1],1);object.name='environment-'+asset;
    object.visible=enabled&&effectEnabled;
    const e={object,enabled:effectEnabled,cinematic,maxDistance:Math.max(1,Math.min(160,effectDistance)),asset:a,anchor,offset:new THREE.Vector3(...offset),age:phase/a.fps,loop:loop??a.loop,frame:0};
    effects.add(e);scene.add(object);setFrame(e,Math.floor(phase)%a.frames);state.peakEffects=Math.max(state.peakEffects,effects.size);return e;
  }
  function update(dt,{listener,playing=true}={}){
    if(disposed||!enabled)return;dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));
    for(const e of effects){
      if(e.glow&&!e.enabled){e.object.visible=false;continue;}
      if(playing)e.age+=dt;
      if(e.glow){
        if(e.age>=1.6){e.enabled=false;e.object.visible=false;e.object.material.uniforms.uStrength.value=0;continue;}
        e.anchor.localToWorld(e.object.position.copy(e.offset));e.object.material.uniforms.uFogDensity.value=scene.fog?.density||0;
        e.object.visible=e.enabled&&e.object.material.uniforms.uStrength.value>0&&(!listener||e.object.position.distanceTo(listener)<=e.maxDistance);continue;
      }
      const index=Math.floor(e.age*e.asset.fps);
      if(!e.loop&&index>=e.asset.frames){remove(e);continue;}
      setFrame(e,e.loop?index%e.asset.frames:Math.min(index,e.asset.frames-1));
      e.anchor.localToWorld(e.object.position.copy(e.offset));
      e.object.visible=e.enabled&&(!listener||e.object.position.distanceTo(listener)<=Math.min(e.cinematic?160:maxDistance,e.maxDistance));
    }
  }
  return {load,add,addGlow,remove,update,
    prepareExplosion(anchor,options={}){
      if(explosionWarmup)return explosionWarmup.object;
      const e=add({...options,asset:'explosion',anchor,loop:false,enabled:false});if(!e)return null;
      // Retain one hidden material for the existing one-pixel loading warmup.
      // It is not an emitter and never advances or appears during gameplay.
      effects.delete(e);e.object.name='environment-blast-shader-warmup';explosionWarmup=e;return e.object;
    },
    resetGlow(e,anchor,active=false){if(effects.has(e)&&e.glow){if(anchor)e.anchor=anchor;e.age=0;e.enabled=!!active;e.object.visible=false;e.object.material.uniforms.uStrength.value=0;}},
    setGlowStrength(e,value){if(effects.has(e)&&e.glow)e.object.material.uniforms.uStrength.value=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;},
    setDistance(value){if(Number.isFinite(value))maxDistance=Math.max(10,Math.min(55,value));},
    setEffectEnabled(e,value){if(!effects.has(e))return;e.enabled=!!value;e.object.visible=enabled&&e.enabled;},
    setEnabled(value){enabled=!!value;for(const e of effects)e.object.visible=enabled&&e.enabled;},
    dispose(){if(disposed)return;disposed=true;for(const e of effects)remove(e);if(explosionWarmup){explosionWarmup.object.removeFromParent();explosionWarmup.object.material.map.dispose();explosionWarmup.object.material.dispose();explosionWarmup=null;}for(const a of assets.values())a.texture.dispose();assets.clear();pending.clear();},
    visibleCount(){let count=0;for(const e of effects)if(e.object.visible)count++;return count;},
    info(){return {...state,visible:[...effects].filter(e=>e.object.visible).length,capacity:maxEffects,errors:[...state.errors],active:effects.size,atlases:assets.size,
      textureBytes:[...assets.values()].reduce((n,a)=>n+a.width*a.height*4,0),
      effects:[...effects].map(e=>({asset:e.asset.id,frame:e.frame,maxDistance:e.maxDistance,visible:e.object.visible,position:e.object.position.toArray()}))};},
  };
}
