import {createThirdPersonPlayer} from './third-person-player.js?v=20261021-arms2';

export const PLAYER_CHARACTERS=Object.freeze({
  julian:{name:'Julián',model:'assets/player/julian.glb?v=20261015-julian-pbr1'},
});
export const validCharacter=id=>Object.hasOwn(PLAYER_CHARACTERS,id)?id:'julian';
export function savedCharacter(){try{return validCharacter(localStorage.getItem('ma_character'));}catch{return 'julian';}}

// One live actor: changing character releases the previous skin, textures and mixer.
// All gameplay callers keep the same controller interface and shared rifle.
export function createPlayablePlayer(options){
  let actor,character,loading,weapon,anchors;
  const selectCharacter=id=>{
    id=validCharacter(id);
    if(loading)return loading.then(()=>selectCharacter(id));
    if(character===id&&actor?.state.ready)return Promise.resolve();
    actor?.dispose();character=id;
    const selected=PLAYER_CHARACTERS[id];
    actor=createThirdPersonPlayer({...options,characterId:id,characterName:selected.name,modelUrl:selected.model});
    if(weapon)actor.mountWeapon(weapon,anchors);
    loading=actor.load().then(()=>{if(!actor.state.ready)throw Error(actor.state.error||'No se pudo cargar '+selected.name);}).finally(()=>{loading=null;});
    return loading;
  };
  // Construct synchronously so callers can mount the weapon before loading finishes.
  character=savedCharacter();const selected=PLAYER_CHARACTERS[character];
  actor=createThirdPersonPlayer({...options,characterId:character,characterName:selected.name,modelUrl:selected.model});
  const api={
    load(){if(!loading)loading=actor.load().finally(()=>{loading=null;});return loading;},
    selectCharacter,
    mountWeapon(group,grips){weapon=group;anchors=grips;actor.mountWeapon(group,grips);},
    info(){return actor.state.ready?actor.info():{...actor.state};},
  };
  return new Proxy(api,{get(target,key){if(key in target)return target[key];const value=actor[key];return typeof value==='function'?value.bind(actor):value;}});
}
