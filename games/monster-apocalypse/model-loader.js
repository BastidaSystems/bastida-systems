import {setAssetRenderer} from './asset-loader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MOBILE_MODELS} from './mobile-models.js?v=20261015-mobile-enemies1';

export const MOBILE_DEVICE=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const state={mobile:MOBILE_DEVICE,active:0,peak:0,completed:0,compressed:0,decoderReleased:false,errors:[]},pending=[];
let renderer,ktx;
function decoder(){
  if(!ktx){if(!renderer)throw Error('Falta configurar los recursos móviles');ktx=new KTX2Loader().setTranscoderPath('assets/mobile/basis/').setWorkerLimit(1).detectSupport(renderer);state.decoderReleased=false;}
  return ktx;
}
export function configureModelAssets(value){renderer=value;setAssetRenderer(value);}
function pump(){while(state.active<2&&pending.length)pending.shift()();}
export function createModelLoader(){
  const loader=new GLTFLoader();if(!MOBILE_DEVICE)return loader;
  const load=loader.load.bind(loader);
  loader.load=(url,onLoad,onProgress,onError)=>{
    pending.push(()=>{
      state.active++;state.peak=Math.max(state.peak,state.active);let finished=false;
      const finish=()=>{if(finished)return;finished=true;state.active--;state.completed++;pump();};
      const path=url.split('?')[0],mobile=MOBILE_MODELS[path];
      try{
        if(mobile){loader.setKTX2Loader(decoder());state.compressed++;}
        load(mobile?mobile+'?v=20261015-mobile-memory1':url,gltf=>{
          // The game uses the scene/clips; parser caches retain source GLB bytes unnecessarily.
          delete gltf.parser;finish();onLoad?.(gltf);
        },onProgress,error=>{state.errors.push(path);finish();onError?.(error);});
      }catch(error){state.errors.push(path);finish();onError?.(error);}
    });pump();
  };
  return loader;
}
export function releaseMobileDecoder(){
  if(MOBILE_DEVICE&&ktx&&state.active===0&&pending.length===0){ktx.dispose();ktx.transcoderBinary=null;ktx.transcoderPending=null;ktx=null;state.decoderReleased=true;}
}
export const modelAssetsInfo=()=>({...state,errors:[...state.errors],pending:pending.length});
