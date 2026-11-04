import * as THREE from 'three';

// One full panorama around the perimeter. No tiling, mirrored copies or new city models.
export function createCitySkyline({scene,fog}){
  const radius=184,repeats=1,height=2*Math.PI*radius/(3*repeats);
  const state={ready:false,error:null},strength={value:0},haze={value:fog.color.clone()};
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:.78,depthWrite:false,side:THREE.BackSide,fog:false,toneMapped:false});
  material.onBeforeCompile=shader=>{
    shader.uniforms.skylineStrength=strength;shader.uniforms.skylineHaze=haze;
    shader.fragmentShader='uniform float skylineStrength;\nuniform vec3 skylineHaze;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float seam=fract(vMapUv.x);
      float feather=smoothstep(0.0,.004,seam)*(1.0-smoothstep(.996,1.0,seam));
      float baseFade=smoothstep(.13,.175,vMapUv.y);
      vec3 tint=mix(vec3(.20,.25,.33),vec3(.68,.80,1.0),skylineStrength);
      diffuseColor.rgb=mix(skylineHaze,diffuseColor.rgb*tint,.08+.75*skylineStrength);
      diffuseColor.a*=feather*baseFade;
    `);
  };
  material.customProgramCacheKey=()=> 'city-panorama-single-v2';
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,96,1,true),material);
  mesh.name='Ciudad panorámica exterior';mesh.position.y=height*(.5-.13);mesh.rotation.y=-2.55;
  mesh.renderOrder=-10;mesh.visible=false;mesh.userData.minimapDecoration=true;scene.add(mesh);
  let loading;
  function load(){
    if(loading)return loading;
    loading=(async()=>{try{
      const texture=await new THREE.TextureLoader().loadAsync('assets/environment/city-panorama.png?v=20261015-panorama1');
      texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.ClampToEdgeWrapping;texture.repeat.x=repeats;
      material.map=texture;material.needsUpdate=true;mesh.visible=true;state.ready=true;
    }catch(error){state.error=error.message;console.warn('No cargó la panorámica exterior',error);}})();
    return loading;
  }
  return {state,mesh,load,
    warmObjects(){if(!state.ready)return [];material.visible=true;return [mesh];},
    update(flash){
      strength.value=flash;haze.value.copy(fog.color);material.opacity=.78*flash;
      // Material visibility is independent of the static scene visibility culler.
      material.visible=flash>0;
    },
    info:()=>({...state,radius,repeats,height,triangles:mesh.geometry.index.count/3,draws:state.ready&&material.visible?1:0,opacity:material.opacity,strength:strength.value,
      repeatX:material.map?.repeat.x??null,wrapS:material.map?.wrapS??null,texture:material.map?[material.map.image.width,material.map.image.height]:null})};
}
