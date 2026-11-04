import './vendor/NOTICE.js';
import {GLTFLoader as BaseGLTFLoader} from './vendor/three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from './vendor/three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js';
import {DRACOLoader} from './vendor/three/addons/loaders/DRACOLoader.js';
let renderer,ready=false;
const draco=new DRACOLoader().setDecoderPath('vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(1);
const textures=new KTX2Loader().setTranscoderPath('assets/mobile/basis/').setWorkerLimit(1);
export function setAssetRenderer(value){renderer=value;}
export class GLTFLoader extends BaseGLTFLoader{
 parse(data,path,onLoad,onError){
  this.setMeshoptDecoder(MeshoptDecoder);this.setDRACOLoader(draco);
  if(!this.ktx2Loader&&renderer){if(!ready){textures.detectSupport(renderer);ready=true;}this.setKTX2Loader(textures);}
  return super.parse(data,path,onLoad,onError);
 }
}
