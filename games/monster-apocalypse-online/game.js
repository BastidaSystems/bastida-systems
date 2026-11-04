import {installInvasionIntro} from './invasion-intro.js?v=20261103-survival2';
import {createCityChaos} from './city-chaos.js?v=20261017-stagger15';
import {captureQuakeRest} from './quake-braces.js?v=20261017-stagger15';
let cityChaos=null;
import {createStratExplosionCamera} from './strat-explosion-camera.js?v=20261017-veil17';
let invasionIntro=null;
const invasionEnabled=true;
import {createTacticalView} from './tactical-view.js?v=height114';
import {createTacticalAim,TACTICAL_AIM} from './tactical-aim.js?v=free116';
import {createTacticalPointer} from './tactical-pointer.js?v=116';
import {createGraphicsV3} from './graphics-v3.js';
import {createAerialMap} from './aerial-map.js';
const nativeGamepadHost=location.protocol==='sgp-tv:'&&location.hostname==='monster';
import {createCitySkyline} from './city-skyline.js?v=20261015-panorama-flash3';
import {createWaveAtmosphere} from './wave-atmosphere.js?v=20261017-clear51';
import {createStorm} from './storm.js?v=20261015-thunder-often4';
import {installLocalLightWork} from './local-light-work.js?v=20261015-sustained1';
import { createBestRecords } from './best-records.js?v=20261015-start-records1';
import { createScoreSystem } from './score.js?v=20261017-spider41';
import {createScoreSharing} from './score-share.js?v=20261020-share-fix3';
import { createFullscreenControls } from './fullscreen.js?v=20261014-full1';
import { createSkinnedShotIndex } from './skinned-shot-index.js?v=20261014-shot1';
import { createViewOptimization } from './view-optimization.js?v=smoke62';
// ============================================================
// MONSTER APOCALYPSE — Acción 3D para web con Julián en tercera persona
// Alcance: 1 calle destruida, WASD + mouse (pointer lock) en escritorio,
// clic disparar, R recargar, 1 rifle, enemigos caminando y arrastrándose,
// vida, munición, feedback de impacto, muerte y reinicio.
// Etapa A (sensación y daño): inercia al moverse, sprint (Shift /
// joystick a fondo), salto (Space / botón SALTAR), sensibilidad
// ajustable y persistente, dispersión ligera, recarga animada del
// rifle e invulnerabilidad breve (0.5 s) tras recibir daño.
// Etapa B (IA de enemigos): máquina de estados IDLE/CHASE/ATTACK/
// HURT/DEAD/SEARCH con percepción y memoria (última posición
// conocida), separación, evitación por atasco y variantes.
// En celular (táctil): joystick para moverse, arrastrar para apuntar,
// botón DISPARAR / recargar / pausa, intento de horizontal al jugar.
// Motor: Three.js 0.160 desde CDN, también en local.
// ============================================================
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MOBILE_DEVICE,configureModelAssets,modelAssetsInfo,releaseMobileDecoder,createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { createPropSystem } from './props.js?v=20261103-level11-ground110';
import { createBuildingSystem } from './buildings.js?v=20261013-wide1';
import { HOSPITAL_SETTINGS } from './building-catalog.js?v=20261015-turn-warm1';
import { createCasinoSystem } from './casinos.js?v=20261015-mobile-memory1';
import { createPlacedBuildingSystem } from './placed-buildings.js?v=vegas108';
import { createIsometricMinimap } from './isometric-minimap.js?v=20261017-map40';
import { createHealthRegeneration } from './health-regeneration.js?v=20261014-regen1';
import {PLAYER_MOTION} from './player-step-timing.js?v=20261017-pace20';
import {createGroundSwarm,SWARM} from './ground-swarm.js?v=jump60';
import {steerCrowd,separateCrowd} from './enemy-crowd.js?v=arrival61';
import {createEnemyArrivalFade} from './enemy-arrival-fade.js?v=smoke62';
import {prepareLowHitTracks,applyLowHit,restoreLowHit,nextHitClip} from './enemy-hit-posture.js?v=flow66';
import {createEnemyAlert} from './enemy-alert.js?v=flow66';
import {createCrawlerLeap,CRAWLER_LEAP} from './crawler-leap.js?v=flow66';
import {enemyLocomotion} from './enemy-locomotion.js?v=flow66';
import {createEnemyShadows} from './enemy-shadows.js?v=20261017-shadow21';
import {createPlayerStamina} from './player-stamina.js?v=20261103-unlimited1';
import {createPlayerDodge,DODGE} from './player-dodge.js?v=lateral115';
import {chooseDodgeResponse} from './dodge-response.js?v=125';
import {createExplosiveAttack} from './explosive-attack.js?v=125';
import {createDodgeWarning} from './dodge-warning.js?v=125';
import {FLOATING_DIVE} from './floating-dive.js?v=dive67';
const playerStamina=createPlayerStamina({unlimited:true});
const playerDodge=createPlayerDodge();
import {createPlayablePlayer} from './player-characters.js?v=20261103-julian-only1';
import {createPlayerImpact} from './player-impact.js?v=125';
import {createAimSway} from './aim-sway.js?v=breathing100';
import {createRifleFeedback} from './rifle-feedback.js?v=recoil101';
import {createQuakeAim} from './quake-aim.js?v=105';
import {createWeakPointAssist} from './weak-point-assist.js?v=116';
const aimSway=createAimSway();
const quakeAim=createQuakeAim();
const GAMEPLAY_QUAKE_CAMERA_SCALE=.45;
import {createSceneGpuWarmup} from './scene-gpu-warmup.js?v=20261103-warmfix1';
import {createEnemyCollisionBroadphase} from './enemy-collision-broadphase.js?v=20261015-mobile-enemies1';
import {createGroundNavigation} from './ground-navigation.js?v=near57';
import { createLoadingGate } from './loading-gate.js?v=20261015-mobile-load3';
import { createWaveSystem } from './waves.js?v=20261021-mixed-aliens';
import {createAlien1Lab,alien1LabEnabled} from './alien1-lab.js?v=125';
import {createExplosiveLab,explosiveLabEnabled} from './explosive-lab.js?v=20261020-production';
import {movePlayerWithEnemyContacts} from './player-enemy-contact.js?v=contact89';
import {applyCarFootprint} from './car-footprints.js?v=clearance77';
const ALIEN1_LAB=alien1LabEnabled(location);
const EXPLOSIVE_LAB=!ALIEN1_LAB&&explosiveLabEnabled(location);
const LOCAL_ENEMY_LAB=EXPLOSIVE_LAB||ALIEN1_LAB;
const EXPLOSIVE_PREVIEW_WAVE=EXPLOSIVE_LAB&&new URLSearchParams(location.search).get('explosiveRound')==='15'?15:1;
import { isHeadshot, HEADSHOT_MULTIPLIER } from './headshots.js?v=20261014-fly1';
import { createDamageOverlay } from './damage-overlay.js?v=20261017-opacity43';
import { createEnemyPoints } from './enemy-points.js?v=20261017-spider41';
import { createCombatVFX } from './combat-vfx.js?v=fine117';
import { createPlacedVehicleSystem } from './placed-vehicles.js?v=20261015-mobile-memory1';
import { createLampPostSystem } from './lamp-posts.js?v=20261015-mobile-load3';
import { createGameAudioSystem } from './game-audio.js?v=arrival94';
import {createBackgroundMusic} from './background-music.js?v=20261103-music1';
import {createPalmSystem} from './palms.js?v=20261015-mobile-memory1';
import { createVegetationSystem } from './vegetation.js';
import { createRoadSystem } from './roads.js?v=20261103-expanded15';
import { createSidewalkSystem } from './sidewalks.js?v=20261015-mobile-memory1';
import { createAlienBarricadeSystem } from './barricade.js?v=20261015-mobile-memory1';
import { createFloatingAlienSystem, FLOATING_ALIEN_SETTINGS } from './floating-alien.js?v=dive67';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
// Etapa C1 (exploración): registro estructurado del mapa (MAPREG),
// minimapa circular y mapa expandido (tecla M / botón MAPA) con
// descubrimiento progresivo por línea de vista 2D — no atraviesa
// paredes — persistente entre partidas (modo 'explore').
// Etapa C2 (expansión): retícula de 3 calles (~2× superficie), tres
// edificios explorables de una planta (Hospital, Comisaría, Fábrica)
// con interiores navegables y puertas abiertas transitables, y
// puntos de aparición perimetrales por datos (SPAWN_POINTS).
// Ambiente: lluvia visual (LineSegments que siguen al jugador) y
// sonido de lluvia procedural (ruido filtrado, sin archivos).
// Visual alienígena (prueba): monstruo y zombie usan el modelo
// alien1.glb con AnimationMixer (idle/crawl/run/attack/hit/death);
// la IA de la Etapa B no cambia — solo cambia el visual y el HURT
// del alien gana el retroceso de 1.41 m de su clip de daño.

// ---------- Constantes ----------
const MAG_SIZE = 30;
const RELOAD_MS = 1500;
const STARTING_RESERVE = 120;
const MAX_RESERVE = 120; // Four spare magazines; buying cannot expand the backpack.
const AMMO_PRICE = 100, AMMO_PACK = 30, AMMO_BUY_RANGE = 2.6;
const BODY_POINTS=10, HEAD_POINTS=25, KILL_POINTS=100;
const ENEMIES_ENABLED=true;
const EXPLOSIVES_ENABLED=ENEMIES_ENABLED&&!ALIEN1_LAB;
const LOAD_ENEMY_ASSETS=ENEMIES_ENABLED||!MOBILE_DEVICE;
const ENEMY_HEALTH_MULTIPLIER=2;
const FIRE_INTERVAL = 0.115;      // s entre disparos (automático)
const RIFLE_DAMAGE = 34;          // daño al cuerpo; cabeza ×3
const MONSTER_HP = 100;
const MONSTER_DAMAGE = 10;
const MONSTER_ATTACK_RANGE = 1.5;
const MONSTER_ATTACK_CD = 0.75;   // s: duración del ciclo de ataque
// ---------- Etapa B: IA de enemigos ----------
const ENEMY_AGGRO_RANGE = 38;     // m: distancia máxima de visión del enemigo
const PERCEPTION_INTERVAL = 0.2;  // s entre comprobaciones de visión por enemigo
const MEMORY_TIME = 4;            // s sin ver al jugador en CHASE → SEARCH
const SEARCH_TIME = 2.5;          // s escaneando la última posición conocida
const ENEMY_IDLE_SPEED = 0.35;    // fracción de velocidad al patrullar (IDLE)
const ATTACK_WINDUP = 0.35;       // s de preparación del golpe (brazos arriba)
const ATTACK_HIT_RANGE = 1.9;     // m: el golpe conecta si el jugador sigue aquí
const ATTACK_EXIT_RANGE = 2.2;    // m: si el jugador se aleja más, vuelve a CHASE
const HURT_TIME = 0.18;           // s de reacción superpuesta a la marcha
const DEAD_TIME = 0.35;           // s de caída del cadáver antes de retirarlo
const SEPARATION_DIST = 1.1;      // m: distancia mínima entre enemigos vivos
const STUCK_CHECK_TIME = 0.5;     // s: ventana para detectar atasco
const STUCK_MIN_RATIO = 0.3;      // desplazamiento real < 30% del esperado = atasco
const STUCK_STEER_TIME = 0.6;     // s de rodeo lateral al detectar atasco
const ZOMBIE_HP = 68;             // muere con 2 impactos del rifle
const ZOMBIE_CHANCE = 0.65;       // 65% de los enemigos terrestres, desde la primera oleada
const PLAYER_SPEED = PLAYER_MOTION.walkSpeed;         // velocidad máxima caminando (m/s)
const SPRINT_SPEED = PLAYER_MOTION.runSpeed;         // velocidad máxima esprintando (m/s)
const MOVE_ACCEL = 9, MOVE_BRAKE = 14;
const JUMP_VEL = 5.6;             // velocidad inicial del salto (apex ≈ 1 m)
const GRAVITY = -16;              // gravedad del salto
const SPREAD = 0.012;             // rad: base angular antes del enfoque y la ráfaga
const INVULN_TIME = 0.5;          // s de invulnerabilidad tras recibir daño
const MOUSE_SENS = 0.0021;        // sensibilidad base del mouse (× ajuste del jugador)
const PLAYER_RADIUS = 0.55;
// Temporary scenery switches: retain the assets for later restoration.
const ENVIRONMENT_DECOR = Object.freeze({ rocks:false, vegetation:false });
const MAP = { halfW: 52, halfL: 58 }; // límites jugables (x, z) tras la expansión C2
const MAIN_HALF_W = 13;               // semiancho de la calle principal original
const TRANSVERSALS = [-20, 24];       // centros z de las calles transversales (C2)
// Puntos de aparición perimetrales (C2): extremos de las tres calles,
// con jitter (jx/jz) alrededor del punto base.
const SPAWN_POINTS = [
  { x: 0, z: -55, jx: 10, jz: 0 }, { x: 0, z: 55, jx: 10, jz: 0 },
  { x: -50, z: -20, jx: 0, jz: 4 }, { x: 50, z: -20, jx: 0, jz: 4 },
  { x: -50, z: 24, jx: 0, jz: 4 }, { x: 50, z: 24, jx: 0, jz: 4 },
];

// ---------- Visual alienígena (GLB) ----------
// Sustituye SOLO el visual de monstruo y zombie por el alien de
// alien1.glb (Meshy + rig/animaciones Mixamo): la IA, los stats por
// variante se conservan; la colisión sigue la postura del rig. La carga es
// asíncrona: mientras el modelo no esté listo, los enemigos usan el
// visual procedural de siempre como respaldo temporal.
const ALIEN_FILE = 'alien1.glb';
const ALIEN_SIZE_MULTIPLIER = 1.5;   // aumento uniforme; conserva tamaños relativos y origen en el suelo
const ALIEN_HIT_DUR = 1.03 / 1.45;   // s: el clip hit (1.03 s) acelerado ×1.45
const ALIEN_DEAD_TIME = 2.35;        // s: cadáver alien en pantalla (clip death 2.30 s)
let alienLabError=null;
let alienTemplate = null;            // { root, clips } tras cargar el GLB

// Quita root motion horizontal en espacio del modelo, no en ejes locales.
// Armature rota +90° X: Y local es avance y Z local es altura.
function stripRootXZ(clip, hips, origin) {
  const parent = hips.parent.matrixWorld;
  const inverse = parent.clone().invert();
  const point = new THREE.Vector3();
  let stride = 0;
  for (const track of clip.tracks) {
    if (!track.name.endsWith('.position') || !track.name.includes('Hips')) continue;
    const v = track.values;
    const first = point.fromArray(v, 0).applyMatrix4(parent).clone();
    const last = point.fromArray(v, v.length - 3).applyMatrix4(parent).clone();
    stride = Math.hypot(last.x - first.x, last.z - first.z);
    for (let i = 0; i < v.length; i += 3) {
      point.fromArray(v, i).applyMatrix4(parent);
      point.x = origin.x; point.z = origin.z;
      point.applyMatrix4(inverse).toArray(v, i);
    }
  }
  return stride;
}
async function alienOnLoad(gltf) {
  // Load before publishing the template/pool so every instance gets the same actions.
  try {
    const response=await fetch('assets/enemies/ground/walk.json?v=20261017-clear44');
    if(!response.ok)throw Error('Walking animation unavailable');
    const data=await response.json(),walk=THREE.AnimationClip.parse(data.clip);
    if(walk.name!=='walk'||walk.duration<=0||walk.tracks.length<20)throw Error('Invalid walking animation');
    gltf.animations.push(walk);
  } catch(error) { console.warn('Walking animation unavailable; keeping crawling fallback'); }
  try{
    const response=await fetch('assets/enemies/ground/alert.json?v=20261017-alert54');
    if(!response.ok)throw Error('Alert animation unavailable');
    const data=await response.json(),clip=THREE.AnimationClip.parse(data.clip);
    if(clip.name!=='alert'||clip.duration<=0||clip.tracks.length<20)throw Error('Invalid alert animation');
    gltf.animations.push(clip);
  }catch{console.warn('Alert animation unavailable; preserving existing enemy behavior');}
  try{
    const response=await fetch('assets/enemies/ground/leap.json?v=jump63');if(!response.ok)throw Error();
    const clip=THREE.AnimationClip.parse((await response.json()).clip);
    if(clip.name!=='leap'||clip.duration<=0||clip.tracks.some(t=>!gltf.scene.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error();
    gltf.animations.push(clip);
  }catch{console.warn('Salto de ataque no disponible; se conserva el respaldo existente');}
  try{
    const r=await fetch('assets/enemies/ground/hit-mirror.json?v=posture64');if(!r.ok)throw Error();
    const clip=THREE.AnimationClip.parse((await r.json()).clip);
    if(clip.name!=='hitMirror'||clip.duration<=0||clip.tracks.some(t=>!gltf.scene.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)))throw Error();
    gltf.animations.push(clip);
  }catch{console.warn('Reacción alterna no disponible; se conserva la reacción original');}
  if(!gltf.animations.some(c=>c.name==='walk')){
    alienLabError='No se pudo cargar la animación original de caminar de Alien 1. Reintenta la carga.';return;
  }
  gltf.scene.updateMatrixWorld(true);
  let hips;
  gltf.scene.traverse(o => { if (o.isBone && o.name.endsWith('Hips')) hips = o; });
  if (!hips) { alienOnError(new Error('El GLB no tiene Hips')); return; }
  const idleRoot = gltf.animations.find(c => c.name === 'idle').tracks
    .find(t => t.name.includes('Hips') && t.name.endsWith('.position'));
  const origin = new THREE.Vector3().fromArray(idleRoot.values).applyMatrix4(hips.parent.matrixWorld);
  const clips = {}, strides = {};
  for (const c of gltf.animations) {
    const clip = c.clone();
    strides[c.name] = stripRootXZ(clip, hips, origin);
    clips[c.name] = clip;
  }
  gltf.scene.traverse(mesh=>{if(mesh.isSkinnedMesh)createSkinnedShotIndex(mesh);});
  alienTemplate = { root: gltf.scene, clips, strides,quakeRest:captureQuakeRest(gltf.scene) };
  const support=sampleAlienFootSupport(gltf.scene, clips);
  alienTemplate.footSupport=support.feet;alienTemplate.leapSupport=support.leap;
  alienTemplate.lowHits={hit:prepareLowHitTracks(clips.hit),hitMirror:prepareLowHitTracks(clips.hitMirror||clips.hit)};
}
// Guarda solo los vértices de apoyo de las plantas, muestreados una vez.
// Evita recorrer miles de vértices por enemigo en cada frame.
function sampleAlienFootSupport(root, clips) {
  const probe = cloneSkinned(root), meshes = [];
  probe.traverse(o => { if (o.isMesh) meshes.push(o); });
  const candidates = meshes.map(mesh => {
    const indices = [], skin = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight;
    if (!skin) return indices;
    for (let i = 0; i < skin.count; i++) {
      let footWeight = 0;
      for (let k = 0; k < 4; k++) {
        if (/Foot|Toe/.test(mesh.skeleton.bones[skin.getComponent(i, k)].name)) footWeight += weights.getComponent(i, k);
      }
      if (footWeight >= .5) indices.push(i);
    }
    return indices;
  });
  const support = meshes.map(() => new Set()), leapSupport=meshes.map(()=>new Set()), mixer = new THREE.AnimationMixer(probe), point = new THREE.Vector3();
  for (const clip of Object.values(clips)) {
    mixer.stopAllAction();
    const action = mixer.clipAction(clip).reset().play();
    for (let frame = 0; frame <= 60; frame++) {
      action.time = clip.duration * frame / 60;
      mixer.update(0); probe.updateMatrixWorld(true);
      meshes.forEach((mesh, n) => {
        let min = Infinity, index = -1;
        for (const i of candidates[n]) {
          mesh.getVertexPosition(i, point); mesh.localToWorld(point);
          if (point.y < min) { min = point.y; index = i; }
        }
        if (index >= 0) support[n].add(index);
      });
    }
  }
  // The low jump blend can place a hand below the soles. Sample its contact
  // vertices once, keeping per-frame grounding limited to these few indices.
  if(clips.leap&&clips.crawl){
    mixer.stopAllAction();
    const crawl=mixer.clipAction(clips.crawl).reset().setEffectiveWeight(.35).play(),jump=mixer.clipAction(clips.leap).reset().setEffectiveWeight(.65).play();
    for(const phase of [.0,.25,.5,.75])for(let frame=0;frame<=20;frame++){
      crawl.time=clips.crawl.duration*phase;jump.time=clips.leap.duration*frame/20;mixer.update(0);probe.updateMatrixWorld(true);
      meshes.forEach((mesh,n)=>{let min=Infinity,index=-1;for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,point);mesh.localToWorld(point);if(point.y<min){min=point.y;index=i;}}if(index>=0)leapSupport[n].add(index);});
    }
  }
  mixer.stopAllAction(); mixer.uncacheRoot(probe);
  return {feet:support.map(indices=>[...indices]),leap:leapSupport.map((indices,n)=>[...new Set([...support[n],...indices])])};
}
function alienOnError(err) { if(ALIEN1_LAB)alienLabError='No se pudo cargar Alien 1.';console.warn('alien1.glb no cargó; se mantiene el visual procedural', err); }
// CLI deployments include the original GLB; load it directly without a legacy parts probe.
if(LOAD_ENEMY_ASSETS&&!MOBILE_DEVICE)new GLTFLoader().load(ALIEN_FILE,alienOnLoad,undefined,alienOnError);

// Piezas ficticias para el visual alienígena: la lógica procedural de
// poses (walkAnim, golpe, búsqueda) escribe rotaciones en mon.parts;
// con el GLB esas escrituras deben ser inofensivas, porque la pose
// real la lleva el AnimationMixer del modelo.
function dummyParts() {
  const r = () => ({ rotation: { x: 0 } });
  return { armL: r(), armR: r(), legL: r(), legR: r() };
}

// Construye el visual alienígena de un enemigo: clona el modelo con
// skin (SkeletonUtils), clona los materiales (para que el destello de
// impacto sea individual por enemigo) y prepara su AnimationMixer.
// Devuelve null si el modelo aún no terminó de cargar.
function buildAlienVisual() {
  if (!alienTemplate) return null;
  if(groundVisualPool.length){
    const alien=groundVisualPool.pop();restoreLowHit(alien);
    for(const action of Object.values(alien.actions)){
      action.reset().stopFading().setEffectiveWeight(1).setEffectiveTimeScale(1).setLoop(THREE.LoopRepeat,Infinity);
      action.clampWhenFinished=false;
    }
    alien.current='idle';alien.deathPlayed=false;alien.actualSpeed=0;
    for(const material of alien.mats)material.emissive.setRGB(0,0,0);
    alien.actions.idle.play();alien.mixer.update(0);groundAlienFeet(alien);
    return alien;
  }
  const visual = cloneSkinned(alienTemplate.root);
  const mats = [], meshes = [], bones = {};
  visual.traverse(o => {
    if (o.isBone) bones[o.name.replace('mixamorig', '').replace(':', '')] = o;
    if (o.isMesh) {
      meshes.push(o);
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = o.material.clone();
      o.frustumCulled = false;   // con skin, la caja base engaña al culling al animar
      mats.push(o.material);
    }
  });
  const mixer = new THREE.AnimationMixer(visual);
  const actions = {};
  for (const name in alienTemplate.clips) {
    const a = mixer.clipAction(alienTemplate.clips[name]);
    a.enabled = true;
    actions[name] = a;
  }
  actions.idle.play();
  mixer.update(0); // pose válida desde el spawn, incluso antes del primer frame
  const alien = { visual, mats, meshes, shotIndexes:meshes.map(mesh=>mesh.isSkinnedMesh?createSkinnedShotIndex(mesh):null), bones, mixer, actions,quakeRest:alienTemplate.quakeRest, baseY: visual.position.y, current: 'idle', deathPlayed: false, actualSpeed: 0 };
  groundAlienFeet(alien);
  return alien;
}

const _footPoint = new THREE.Vector3();
const groundVisualPool=[],GROUND_VISUAL_POOL_LIMIT=20;
const _supportInverse=new THREE.Matrix4(),_supportMatrix=new THREE.Matrix4();
function releaseGroundVisual(mon){
  if(mon.explosiveLab){explosiveLab.release(mon);return;}
  if(mon.swarm){groundSwarm.release(mon);return;}
  scene.remove(mon.g);
  const alien=mon.alien;if(!alien)return;restoreLowHit(alien);
  alien.visual.removeFromParent();alien.mixer.stopAllAction();
  if(groundVisualPool.length<GROUND_VISUAL_POOL_LIMIT)groundVisualPool.push(alien);
  else{
    alien.mixer.uncacheRoot(alien.visual);
    for(const material of alien.mats)material.dispose();
    for(const skeleton of new Set(alien.meshes.map(mesh=>mesh.skeleton)))skeleton?.dispose();
  }
}
function primeAlienSpawn(mon){
  const A=mon.alien;if(!A)return;
  restoreLowHit(A);const name=mon.chaseClip==='crawl'?'crawl':'idle';A.mixer.stopAllAction();
  const action=A.actions[name];action.reset().stopFading().setEffectiveWeight(1).setEffectiveTimeScale(name==='crawl'?0:1).setLoop(THREE.LoopRepeat,Infinity).play();
  if(name==='crawl')action.time=action.getClip().duration*.18;
  A.current=name;A.actualSpeed=0;A.mixer.update(0);groundAlienFeet(A,true);mon.g.updateMatrixWorld(true);
}
function groundAlienFeet(alien,force=false) {
  const { visual, meshes } = alien;
  visual.position.y = alien.baseY;
  visual.updateMatrixWorld(true);
  _supportInverse.copy(visual.matrixWorld).invert();
  let minY = Infinity;
  meshes.forEach((mesh, n) => {
    _supportMatrix.multiplyMatrices(_supportInverse,mesh.matrixWorld);
    for (const i of (alien.current==='leap'?alienTemplate.leapSupport:alienTemplate.footSupport)[n]) {
      mesh.getVertexPosition(i, _footPoint).applyMatrix4(_supportMatrix);
      minY = Math.min(minY, _footPoint.y);
    }
  });
  // Solo corrige penetración; conserva los saltos y la altura de los clips.
  if (Number.isFinite(minY)&&(minY < 0||force)) visual.position.y -= minY - .001;
}

// Activa un clip con crossfade corto; si ya es el actual no hace nada
// (salvo ajustar timeScale o reiniciarlo si restart = true).
function alienPlay(mon, name, { loop = true, timeScale = 1, fade = 0.15, restart = false } = {}) {
  const A = mon.alien;
  if (!A) return;
  const act = A.actions[name];
  if (!act) return;
  if (A.current === name && !restart) { act.timeScale = timeScale; return; }
  if(A.current==='leap'&&name==='crawl'){
    for(const other of Object.values(A.actions))if(other!==act)other.stop();
    act.stopFading().setEffectiveWeight(1).setEffectiveTimeScale(timeScale).setLoop(THREE.LoopRepeat,Infinity).play();A.current=name;return;
  }
  const prev = A.current ? A.actions[A.current] : null;
  act.reset();
  act.stopFading();
  act.setEffectiveWeight(1);
  act.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  act.clampWhenFinished = !loop;
  act.timeScale = timeScale;
  act.enabled = true;
  act.play();
  // Interrumpir un fade no debe dejar terceras acciones mezcladas indefinidamente.
  for (const other of Object.values(A.actions)) if (other !== act && other !== prev) other.stop();
  if (prev && prev !== act) { prev.stopFading(); prev.fadeOut(fade); act.fadeIn(fade); }
  A.current = name;
}

// Mapeo estado → clip del alien (mixer por enemigo). Se llama cada
// frame: garantiza que SIEMPRE haya un clip activo — la pose bind del
// GLB sin clip queda hundida y no es una pose válida en juego.
function updateAlienAnim(mon, dt) {
  const A = mon.alien;
  if (!A) return;
  restoreLowHit(A);
  const locomotion = () => {
    if (A.actualSpeed < 0.02) { alienPlay(mon,mon.chaseClip==='crawl'?'crawl':'idle',{timeScale:mon.chaseClip==='crawl'?0:1});return; }
    const desired=mon.alertPursuit&&['chase','hurt'].includes(mon.state)?'run':mon.chaseClip;
    const name = A.actions[desired] ? desired : 'crawl';
    // Zancada escalada al tamaño final; conserva la velocidad real de movimiento.
    const stride = alienTemplate.strides[name] * mon.g.scale.x;
    alienPlay(mon, name, { timeScale: A.actualSpeed * A.actions[name].getClip().duration / Math.max(.01,stride), fade: 0.12 });
  };
  switch (mon.state) {
    case 'idle': case 'chase': case 'search': locomotion(); break;
    case 'alert':
      alienPlay(mon,'alert',{loop:false,timeScale:0,fade:.12});
      A.actions.alert.time=Math.min(mon.stateT,A.actions.alert.getClip().duration);
      break;
    case 'leap': {
      const jump=mon.leap;
      if(A.actions.leap&&jump){
        alienPlay(mon,'leap',{timeScale:0,fade:.16});
        const total=CRAWLER_LEAP.windup+CRAWLER_LEAP.flight+CRAWLER_LEAP.recovery;
        A.actions.leap.time=Math.min(1,jump.time/total)*A.actions.leap.getClip().duration;
        // Retain the low crawl silhouette rather than standing upright in midair.
        const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);},weight=.65*ease(jump.time/.18)*ease((total-jump.time)/.16);
        A.actions.leap.setEffectiveWeight(weight);A.actions.crawl.play().setEffectiveTimeScale(0).setEffectiveWeight(1-weight);
      }else if(!jump||jump.time<CRAWLER_LEAP.windup){alienPlay(mon,'crawl',{timeScale:0,fade:.08});}
      else{
        alienPlay(mon,'attack2',{timeScale:0,fade:.1});
        A.actions.attack2.time=Math.min(1,(jump.time-CRAWLER_LEAP.windup)/(CRAWLER_LEAP.flight+CRAWLER_LEAP.recovery))*A.actions.attack2.getClip().duration;
      }
      break;
    }
    case 'attack': {
      const action = A.actions.attack;
      const cycle = MONSTER_ATTACK_CD * mon.attackCdMul;
      alienPlay(mon, 'attack', { timeScale: 0, fade: 0.07 });
      // Fase gobernada por el mismo reloj que el daño, sin alterar la IA.
      const t = mon.stateT % cycle, contact = 1.50; // descenso de manos del clip
      action.time = t <= ATTACK_WINDUP
        ? t / ATTACK_WINDUP * contact
        : contact + (t - ATTACK_WINDUP) / (cycle - ATTACK_WINDUP) * (action.getClip().duration - contact);
      break;
    }
    case 'hurt': {
      mon.hurtRestart=false;locomotion();break;
    }
    case 'dead':
      if (!A.deathPlayed) {
        A.deathPlayed = true;
        // death2 ends upright. Always finish the authored fall before recycling.
        alienPlay(mon, 'death', { loop: false, timeScale: A.actions.death.getClip().duration / 2.30, fade: 0.1 });
      }
      break;
  }
  A.mixer.update(dt);
  if(mon.state==='hurt')applyLowHit(A,alienTemplate.lowHits[mon.hurtClip||'hit'],mon.stateT/mon.hurtDurNow,mon.chaseClip==='crawl'?.4:.6);
  groundAlienFeet(A,mon.state==='leap'&&!!A.actions.leap);
}

// ---------- Estado ----------
const S = {
  mode: 'menu',            // menu | loading | playing | paused | dead
  health: 100,
  infiniteAmmo: LOCAL_ENEMY_LAB, // Local single-enemy encounters only; normal play keeps finite ammo.
  mag: MAG_SIZE,
  reserve: STARTING_RESERVE,
  credits: 0,
  reloading: false,
  reloadEnd: 0,
  reloadPausedAt: null,
  lastShot: 0,
  mouseDown: false,
  aimHeld: false,
  touchFire: false,
  kills: 0,
  startTime: 0,
  elapsed: 0,
  spawnTimer: 0,
  invulnUntil: 0,
  keys: {},
};
window.__ma = { version: 'etapa1', state: S, monstersAlive: () => monsters.length, list: () => monsters, alienReady: () => !LOAD_ENEMY_ASSETS||!!alienTemplate };

const scoreSharing=createScoreSharing();
function renderScore(snapshot){
  scoreSharing.update(snapshot);
  document.getElementById('score-value').textContent=snapshot.score.toLocaleString('es-MX');
  document.getElementById('best-score').textContent=snapshot.best.toLocaleString('es-MX');
  const result=snapshot.lastResult;
  if(result){
    document.getElementById('death-score').textContent=result.score.toLocaleString('es-MX');
    document.getElementById('death-score-breakdown').textContent=
      `Bajas ${result.breakdown.kills} · Cabeza ${result.breakdown.headshots} · Oleadas ${result.breakdown.waves} · Supervivencia ${result.breakdown.survival}`;
    const summary=document.getElementById('last-score-summary');
    summary.textContent=`Última partida${result.reason==='abandoned'?' · Abandonada':''}: ${result.score.toLocaleString('es-MX')} puntos · Local, no verificado`;
    summary.classList.remove('hidden');
  }
}
const scoreSystem=createScoreSystem({onChange:renderScore,onEvent:event=>{
  // Local versioned events only. A future SGP adapter must treat them as untrusted.
  window.dispatchEvent(new CustomEvent('ma:score',{detail:event}));
}});
let scoreEnemyIds=new WeakMap(),scoreEnemySequence=0;
window.__ma.scoreInfo=()=>scoreSystem.info();
function syncScoreClock(now=performance.now()){
  scoreSystem.setActive(S.mode==='playing'&&!invasionIntro?.active&&!document.hidden&&ENEMIES_ENABLED&&waveSystem.state.phase==='active',now);
  S.elapsed=scoreSystem.info().activeMs/1000;
}
function registerScoreKill(enemy,headshotFinal){
  const now=performance.now();syncScoreClock(now);
  if(!scoreEnemyIds.has(enemy))scoreEnemyIds.set(enemy,`enemy-${++scoreEnemySequence}`);
  scoreSystem.defeat({enemyId:scoreEnemyIds.get(enemy),headshotFinal,enemyType:enemy.type,
    waveNumber:enemy.wave??waveSystem.state.number},now);
}

const bestRecords=createBestRecords({onChange(best){
  document.getElementById('best-waves').textContent=best.waves.toLocaleString('es-MX');
  document.getElementById('best-kills').textContent=best.kills.toLocaleString('es-MX');
}});
function recordSession(){
  bestRecords.update({waves:ENEMIES_ENABLED&&['playing','paused','dead'].includes(S.mode)?waveSystem.state.number:0,kills:S.kills});
}
window.addEventListener('pagehide',()=>{
  if(S.mode==='playing')pauseGame();
  scoreSystem.finish('abandoned',performance.now());scoreSystem.flush();
  recordSession();bestRecords.flush();
});
window.__ma.bestRecords=()=>bestRecords.info();

// Sensibilidad de apuntado: multiplicador 0.5–2.0 ajustable en la
// pantalla inicial y persistente entre sesiones (localStorage ma_sens).
let sens = 1;
try { const v = parseFloat(localStorage.getItem('ma_sens')); if (v >= .5 && v <= 2) sens = v; } catch (e) { /* almacenamiento no disponible */ }

// Niebla apocalíptica: FogExp2 gris oscura ligeramente azulada con tres
// niveles de densidad, ajustables en la pantalla inicial y persistentes
// entre sesiones (localStorage ma_fog). Predeterminado: Densa.
// Original apocalyptic haze, with an additional dust wave after the blast delay.
const FOG_LEVELS = { normal: 0.050, densa: 0.085, extrema: 0.145 };
let fogLevel = 'densa';
try { const v = localStorage.getItem('ma_fog'); if (v in FOG_LEVELS) fogLevel = v; } catch (e) { /* almacenamiento no disponible */ }

// ---------- Renderer / escena ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
configureModelAssets(renderer);
// Mobile uses the same skin/clips with GPU-compressed textures and the shared load queue.
if(LOAD_ENEMY_ASSETS&&MOBILE_DEVICE)createModelLoader().load(ALIEN_FILE,alienOnLoad,undefined,alienOnError);
installLocalLightWork();
window.__ma.modelAssetsInfo=modelAssetsInfo;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x30363c, FOG_LEVELS[fogLevel]);
scene.background = scene.fog.color; // misma instancia de Color: las siluetas se funden con el fondo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
const cinematicPosition=new THREE.Vector3(),cinematicRotation=new THREE.Quaternion();
const stratExplosionCamera=createStratExplosionCamera();
window.__ma.blastShotInfo=()=>stratExplosionCamera.info();
camera.rotation.order = 'YXZ';
scene.add(camera);
let savedView='third';try{savedView=localStorage.getItem('ma_view_v3')||'third';if(savedView==='first'){savedView='third';localStorage.setItem('ma_view_v3',savedView);}}catch(_){}
const tacticalView=createTacticalView(camera,{initial:savedView});
const tacticalVisibility=new WeakMap();
const graphics=createGraphicsV3({renderer,scene,mobile:MOBILE_DEVICE,onApply:profile=>{
  environmentDemo?.setQuality?.(profile);
  if(typeof rainGeo!=='undefined')rainGeo.setDrawRange(0,Math.floor(RAIN_COUNT*profile.rain)*2);
}});
window.__ma.graphicsInfo=()=>graphics.info();
window.__ma.tacticalInfo=()=>tacticalView.info();

const viewOptimization=createViewOptimization({scene,camera});
const sceneGpuWarmup=createSceneGpuWarmup({renderer,scene,camera});
window.__ma.gpuWarmupInfo=()=>sceneGpuWarmup.info();
window.__ma.viewOptimizationInfo=()=>viewOptimization.info();

const skyLight=new THREE.HemisphereLight(0xffd9b0, 0x201409, 0.85);
scene.add(skyLight);
const moon = new THREE.DirectionalLight(0xffb37a, 1.1);
moon.position.set(-20, 40, -15);
scene.add(moon);
const enemyShadows=createEnemyShadows({renderer,scene,light:moon});
window.__ma.enemyShadowsInfo=()=>enemyShadows.info();

// ---------- Texturas procedurales (canvas, sin assets externos) ----------
function makeTexture(draw, w = 256, h = 256, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const drawAsphalt = (g, w, h) => {
  g.fillStyle = '#33302e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${20 + Math.random() * 60 | 0},${18 + Math.random() * 50 | 0},${16 + Math.random() * 40 | 0},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(214,178,60,.75)'; g.fillRect(w / 2 - 3, 0, 6, 26); g.fillRect(w / 2 - 3, 58, 6, 26); g.fillRect(w / 2 - 3, 116, 6, 26);
};
const asphaltTex = makeTexture(drawAsphalt, 256, 256, 3, 16);   // calle principal (a lo largo de z)
const asphaltTexX = makeTexture(drawAsphalt, 256, 256, 12, 2); // transversales C2 (a lo largo de x)
function facadeTex(base, brokenRatio) {
  return makeTexture((g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 14; y < h - 20; y += 34) for (let x = 14; x < w - 24; x += 32) {
      const broken = Math.random() < brokenRatio;
      g.fillStyle = broken ? '#060505' : (Math.random() < .18 ? '#c98f3d' : '#14161c');
      g.fillRect(x, y, 20, 24);
      if (broken) { g.strokeStyle = 'rgba(200,200,200,.35)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y + 24); g.moveTo(x + 20, y); g.lineTo(x, y + 24); g.stroke(); }
    }
    g.fillStyle = 'rgba(0,0,0,.4)';
    for (let i = 0; i < 26; i++) g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 30, 4 + Math.random() * 14);
  }, 256, 256, 1, 2);
}

// ---------- Mapa: calle destruida ----------
const colliders = [];       // {minX,maxX,minZ,maxZ}
const shootBlockers = [];   // meshes que bloquean disparos
function addCollider(cx, cz, w, d) { const c = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 }; colliders.push(c); return c; }
const cars = [];
window.__ma.carsReady = () => cars.length > 0 && cars.every(c => c.loaded);

// ---------- Registro estructurado del mapa (Etapa C1) ----------
// buildMap() anota aquí la geometría que construye, sin cambiarla:
// calles y huellas de edificios como rectángulos {minX,maxX,minZ,maxZ}
// y landmarks con nombre (Hospital/Comisaría/Fábrica llegarán en C2).
// El minimapa y el mapa expandido se alimentan SOLO de este registro.
const MAPREG = { streets: [], buildings: [], landmarks: [] };

// ---------- Reservas y edificios explorables (Etapa C2) ----------
// Solape de rectángulos con desigualdades estrictas: tocarse en un
// borde NO cuenta como invasión (las filas de manzanas se apoyan en
// los bordes de los corredores y de las huellas reservadas).
function rectsOverlap(a, b) { return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ; }
function rectHitsAny(r, list, pad) {
  for (const o of list) {
    if (r.minX - pad < o.maxX && r.maxX + pad > o.minX && r.minZ - pad < o.maxZ && r.maxZ + pad > o.minZ) return true;
  }
  return false;
}
// Huellas reservadas de los tres landmarks; los IDs históricos mantienen el progreso.
// - Hospital: al norte de la transversal z=-20, frente al sur.
// - Comisaría: al este de la calle principal, frente al oeste; su
//   pared norte queda sobre el borde sur de la transversal z=+24.
// - Fábrica: al sur de la transversal z=+24 en su extremo este,
//   frente al norte; comparte solo el borde x=34 con la Comisaría
//   y su pared este coincide con el límite del mapa (x=52).
const LANDMARK_DEFS = [
  { id: 'hospital', name: 'HOSPITAL', cx: -28, cz: -41, w: 26, d: 16 },
  { id: 'comisaria', name: 'CASINO 1', cx: 26, cz: 40, w: 20, d: 16 },
  { id: 'fabrica', name: 'CASINO 2', cx: 43, cz: 47, w: 18, d: 20 },
];
// Rectángulos donde la ciudad decorativa NO puede construir: el
// corredor de la calle principal (calle + aceras), los corredores
// de las transversales (calle + aceras) y las huellas explorables.
const LANDMARK_RECTS = LANDMARK_DEFS.map(L => ({ minX: L.cx - L.w / 2, maxX: L.cx + L.w / 2, minZ: L.cz - L.d / 2, maxZ: L.cz + L.d / 2 }));
const RESERVED_RECTS = [
  { minX: -20, maxX: 20, minZ: -60, maxZ: 60 },
  { minX: -54, maxX: 54, minZ: -33, maxZ: -7 },
  { minX: -54, maxX: 54, minZ: 11, maxZ: 37 },
  ...LANDMARK_RECTS,
];
// Para el bucle histórico de la calle principal la reserva es más
// fina: solo la banda de calle de cada transversal (±1 m). Así los
// edificios de esquina pueden dar al frente principal hasta el
// borde de la intersección, como en la ciudad original, sin
// bloquear jamás el paso de las transversales.
const MAIN_SKIP_RECTS = [
  { minX: -20, maxX: 20, minZ: -60, maxZ: 60 },
  { minX: -54, maxX: 54, minZ: -29, maxZ: -11 },
  { minX: -54, maxX: 54, minZ: 15, maxZ: 33 },
  ...LANDMARK_RECTS,
];
// Recursos compartidos de los interiores C2: UNA geometría unidad
// que se escala por pieza y un puñado de materiales para todas las
// paredes y el mobiliario de los tres edificios (disciplina de
// rendimiento: nada de geometrías ni materiales por pieza).
const HOSPITAL_RIGHT = -15, HOSPITAL_FRONT = -33;
const hospital = { ready: false, removed:false, fallback: [], colliders: [], blockers: [], root: null, bounds: null };
const propSystem = createPropSystem({ scene, colliders, shootBlockers, MAPREG, MAP,
  resolvePosition: resolveCollisions, getAudioContext: () => AC,
  getAudioOutput: () => gameAudio.output('ambience'),getGroundSurfaces:()=>[...roadSystem.state.batches,sidewalkSystem.state.batch].filter(Boolean), rocksEnabled:ENVIRONMENT_DECOR.rocks,pebblesEnabled:false });
const buildingSystem = createBuildingSystem({ scene, colliders, shootBlockers, MAPREG });
const casinoSystem = createCasinoSystem({ scene, colliders, shootBlockers, MAPREG,
  getTextureAnisotropy:()=>renderer.capabilities.getMaxAnisotropy(),
  getSidewalks:()=>sidewalkSystem.state.originals.map(({mesh})=>({
    minX:mesh.position.x-mesh.geometry.parameters.width/2,maxX:mesh.position.x+mesh.geometry.parameters.width/2,
    minZ:mesh.position.z-mesh.geometry.parameters.depth/2,maxZ:mesh.position.z+mesh.geometry.parameters.depth/2,
  })),terrainReady:()=>roadSystem.load(),onPlacementChanged:()=>{if(staticLayer)buildStaticLayer();},
});
const roadSystem = createRoadSystem({ scene,MAPREG });
window.__ma.roadsReady=()=>roadSystem.state.ready;
window.__ma.roadsInfo=()=>roadSystem.info();
const sidewalkSystem = createSidewalkSystem({ scene });
const lampPostSystem = createLampPostSystem({scene,colliders,shootBlockers,
  getSidewalks:()=>sidewalkSystem.state.originals,getStreets:()=>MAPREG.streets,
  getSidewalkSurface:()=>sidewalkSystem.state.batch,
  terrainReady:()=>Promise.all([roadSystem.load(),sidewalkSystem.load()]),
});
window.__ma.lampPostsReady=()=>lampPostSystem.state.ready;
window.__ma.lampPostsInfo=()=>lampPostSystem.info();
const placedBuildingSystem = createPlacedBuildingSystem({scene,colliders,shootBlockers,MAPREG,
  getTextureAnisotropy:()=>renderer.capabilities.getMaxAnisotropy(),
  getSidewalkSurface:()=>sidewalkSystem.state.batch,
  terrainReady:()=>Promise.all([roadSystem.load(),sidewalkSystem.load()]),getSidewalks:()=>sidewalkSystem.state.originals.map(({mesh})=>({
    minX:mesh.position.x-mesh.geometry.parameters.width/2,maxX:mesh.position.x+mesh.geometry.parameters.width/2,
    minZ:mesh.position.z-mesh.geometry.parameters.depth/2,maxZ:mesh.position.z+mesh.geometry.parameters.depth/2,
  })),onPlacementChanged:()=>{if(staticLayer)buildStaticLayer();},
});
window.__ma.placedBuildingsReady=()=>placedBuildingSystem.state.ready;
window.__ma.placedBuildingsInfo=()=>placedBuildingSystem.info();
const placedVehicleSystem=createPlacedVehicleSystem({scene,colliders,shootBlockers,MAP,MAPREG,
  getExistingVehicles:()=>cars,groundSurfaces:()=>roadSystem.state.batches,
  getTextureAnisotropy:()=>renderer.capabilities.getMaxAnisotropy(),
  onPlacementChanged:()=>{if(staticLayer)buildStaticLayer();},
});
window.__ma.placedVehiclesReady=()=>placedVehicleSystem.state.ready;
window.__ma.placedVehiclesInfo=()=>placedVehicleSystem.info();
const barricadeSystem = createAlienBarricadeSystem({scene,colliders,shootBlockers,
  terrainReady:()=>Promise.all([roadSystem.load(),propsReadyTask]),groundSurfaces:()=>roadSystem.state.batches,mapLimits:MAP,
  getBuildings:()=>[...MAPREG.buildings,...[hospital.bounds,...casinoSystem.state.records.map(r=>r.bounds)].filter(Boolean).map(b=>({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z}))],
});
window.__ma.barricadeReady=()=>barricadeSystem.state.ready;
window.__ma.barricadeInfo=()=>barricadeSystem.info();
window.__ma.sidewalksReady=()=>sidewalkSystem.state.ready;
window.__ma.sidewalksInfo=()=>sidewalkSystem.info();
const vegetationSystem = createVegetationSystem({ scene, MAP, MAPREG, propSystem, resolvePosition:resolveCollisions, spawnPoints:SPAWN_POINTS, enabled:ENVIRONMENT_DECOR.vegetation });
const palmSystem=createPalmSystem({scene,colliders,shootBlockers,
  getSidewalks:()=>sidewalkSystem.state.originals.map(({mesh})=>({minX:mesh.position.x-mesh.geometry.parameters.width/2,maxX:mesh.position.x+mesh.geometry.parameters.width/2,minZ:mesh.position.z-mesh.geometry.parameters.depth/2,maxZ:mesh.position.z+mesh.geometry.parameters.depth/2})),
  getSidewalkSurface:()=>sidewalkSystem.state.batch,getBuildings:()=>MAPREG.buildings,
  getAnisotropy:()=>renderer.capabilities.getMaxAnisotropy(),
});
window.__ma.palmsInfo=()=>palmSystem.info();
window.__ma.vegetationReady = () => vegetationSystem.state.ready;
window.__ma.vegetationInfo = () => vegetationSystem.info();
window.__ma.casinosReady = () => casinoSystem.state.ready;
window.__ma.casinosInfo = () => casinoSystem.info();
window.__ma.buildingsReady = () => buildingSystem.state.ready;
window.__ma.buildingsInfo = () => buildingSystem.info();
window.__ma.propsReady = () => propSystem.state.ready;
window.__ma.propsInfo = () => propSystem.info();
window.__ma.hospitalReady = () => hospital.ready;
window.__ma.hospitalInfo = () => ({ready:hospital.ready,enabled:HOSPITAL_SETTINGS.enabled,removed:hospital.removed,loaded:!!hospital.root});
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const extWallMat = new THREE.MeshStandardMaterial({ map: facadeTex('#4a4038', .3), roughness: .95 });
const intWallMat = new THREE.MeshStandardMaterial({ color: 0x6f6a5e, roughness: .95 });
const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0x4c4238, roughness: .8 });
const furnMats = {
  counter: new THREE.MeshStandardMaterial({ color: 0x707a80, roughness: .6, metalness: .3 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0x7a8a99, roughness: .9 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: .85 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x51606a, roughness: .5, metalness: .5 }),
};

function buildMap() {
  // Etapa C2: suelo general bajo todo el mapa ampliado (queda por
  // debajo de calles, aceras e interiores; sin él, las manzanas
  // nuevas y los huecos entre calles se verían sobre el vacío).
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 176), new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(-8, -0.02, -10); scene.add(ground); roadSystem.register('ground',ground);

  // Suelo: calle principal + aceras (segmentadas en las dos
  // intersecciones para no cruzar las transversales como franjas).
  const street = new THREE.Mesh(new THREE.PlaneGeometry(MAIN_HALF_W * 2, MAP.halfL * 2), new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: .95 }));
  street.rotation.x = -Math.PI / 2; scene.add(street); roadSystem.register('main',street);
  MAPREG.streets.push({ minX: -MAIN_HALF_W, maxX: MAIN_HALF_W, minZ: -MAP.halfL, maxZ: MAP.halfL });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x554c42, roughness: 1 });
  const swSegs = [[-MAP.halfL, -28], [-12, 16], [32, MAP.halfL]];
  [-1, 1].forEach(s => {
    for (const [z1, z2] of swSegs) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(7, 0.24, z2 - z1), sidewalkMat);
      sw.position.set(s * (MAIN_HALF_W + 3.5), 0.12, (z1 + z2) / 2); scene.add(sw); sidewalkSystem.register(sw,-s*Math.PI/2);
    }
  });

  // Etapa C2: calles transversales este–oeste (16 m de ancho, de
  // x=-52 a +52), con aceras segmentadas en la intersección con la
  // principal y barricadas de cierre en ambos extremos. El plano va
  // a y=0.01 para no pelear (z-fighting) con el de la calle principal.
  const crossMat = new THREE.MeshStandardMaterial({ map: asphaltTexX, roughness: .95 });
  const barricadeMat = new THREE.MeshStandardMaterial({ color: 0x3a332b, roughness: 1 });
  for (const cz of TRANSVERSALS) {
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(104, 16), crossMat);
    cs.rotation.x = -Math.PI / 2; cs.position.set(0, 0.01, cz); scene.add(cs); roadSystem.register('cross',cs);
    MAPREG.streets.push({ minX: -52, maxX: 52, minZ: cz - 8, maxZ: cz + 8 });
    [-1, 1].forEach(sd => {
      [-1, 1].forEach(sx => {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(39, 0.24, 5), sidewalkMat);
        sw.position.set(sx * 32.5, 0.12, cz + sd * 10.5); scene.add(sw); sidewalkSystem.register(sw,sd<0?0:Math.PI);
      });
    });
    [-1, 1].forEach(sx => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 30), barricadeMat);
      wall.position.set(sx * 52.8, 2, cz); scene.add(wall); shootBlockers.push(wall);
      barricadeSystem.register(wall);
    });
  }

  // Edificios en ruinas (ambos lados)
  const facades = [facadeTex('#4a3d33', .45), facadeTex('#3b3630', .6), facadeTex('#54453a', .35)];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  [-1, 1].forEach(side => {
    let z = -MAP.halfL + 4;
    while (z < MAP.halfL - 6) {
      const bw = 10 + rnd() * 5, bh = 9 + rnd() * 16, bd = 9 + rnd() * 4;
      const x = side * (MAIN_HALF_W + 7 + bd / 2);
      const ruined = rnd() < 0.4;
      // Etapa C2: el candidato no puede invadir los corredores de
      // las calles ni las huellas de los edificios explorables.
      const cand = { minX: x - bd / 2, maxX: x + bd / 2, minZ: z, maxZ: z + bw };
      if (!rectHitsAny(cand, MAIN_SKIP_RECTS, 0)) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(bd, bh, bw), new THREE.MeshStandardMaterial({ map: facades[(rnd() * 3) | 0], roughness: .9 }));
        b.position.set(x, bh / 2, z + bw / 2);
        if (ruined) b.rotation.z = side * 0.03;
        scene.add(b); shootBlockers.push(b);
        const collider = addCollider(x, z + bw / 2, bd, bw);
        MAPREG.buildings.push(cand);
        buildingSystem.register({ mesh: b, collider, rect: cand, height: bh });
        if (ruined) { // escombro frente al edificio derruido
          for (let i = 0; i < 5; i++) addRubble(side * (MAIN_HALF_W + 1.5 + rnd() * 3), z + rnd() * bw, 0.5 + rnd() * 1.1, true);
        }
      }
      z += bw + 2 + rnd() * 5;
    }
  });

  // Autos abandonados: ambos modelos OBJ alternan en los mismos puntos.
  const carColors = [0x6e3b1f, 0x44586b, 0x5c5546, 0x71302a, 0x3f4a3a, 0x77603a];
  const carSpots = [[-6, -26, .2], [5.5, -13, -.15], [-4.5, 2, 1.45], [6.5, 14, .1], [-7, 27, -.3], [3, 38, 1.5], [-2.5, -40, .05]];
  carSpots.forEach(([x, z, rot], i) => addCar(x, z, rot, carColors[i % carColors.length], i === 2));

  // Escombros en la calle
  for (let i = 0; i < 26; i++) addRubble((Math.random() - .5) * (MAIN_HALF_W * 2 - 4), (Math.random() - .5) * (MAP.halfL * 2 - 8), 0.3 + Math.random() * 0.9, false);

  // Faroles inclinados con luz tenue
  [[-11, -30], [11, -5], [-11, 20], [11, 42]].forEach(([x, z], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 5.4, 6), new THREE.MeshStandardMaterial({ color: 0x2c2c30 }));
    pole.position.set(x, 2.7, z); pole.rotation.z = (i % 2 ? -1 : 1) * 0.1; scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 8), new THREE.MeshStandardMaterial({ emissive: 0xffa845, emissiveIntensity: 2, color: 0x221100 }));
    lamp.position.set(x + (i % 2 ? -0.5 : 0.5), 5.4, z); scene.add(lamp);
    const pl = new THREE.PointLight(0xff9a40, 12, 15); pl.position.copy(lamp.position); scene.add(pl);
    lampPostSystem.register({pole,lamp,light:pl,x,z,main:true});
  });

  // Hogueras (luz parpadeante) en barriles
  window.__fires = [];
  [[-8, -18], [8.5, 24], [-5, 46]].forEach(([x, z]) => addFireBarrel(x, z));

  // Barricadas al final de la calle (límites)
  [-1, 1].forEach(s => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(MAIN_HALF_W * 2 + 14, 4, 1.5), new THREE.MeshStandardMaterial({ color: 0x3a332b, roughness: 1 }));
    wall.position.set(0, 2, s * (MAP.halfL + 0.8)); scene.add(wall); shootBlockers.push(wall);
    barricadeSystem.register(wall);
  });

  // Etapa C2: los tres edificios explorables, el relleno de
  // manzanas decorativas de los cuadrantes y el ambiente extra de
  // las transversales (con los constructores existentes).
  buildHospital();
  buildComisaria();
  // El casino del león queda retirado; se conserva el solar reservado.
  fillQuadrants(facades, rnd);
  const crossCars = [[-30, -22, 1.5], [28, -17, 1.62], [-18, 27, 1.45], [44, 21, 1.55], [-44, 26, 1.5]];
  crossCars.forEach(([x, z, rot], i) => addCar(x, z, rot, carColors[i % carColors.length], false));
  for (let i = 0; i < 12; i++) {
    const cz = TRANSVERSALS[i % 2];
    addRubble((Math.random() - .5) * 96, cz + (Math.random() - .5) * 12, 0.3 + Math.random() * 0.9, false);
  }
  addLampPost(-24, -30.5, 0);
  addLampPost(30, 34.5, 1);
  addFireBarrel(36, 18);
}
const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x59504a, roughness: 1 });
const rubbleGeo = new THREE.DodecahedronGeometry(1, 0);
function addRubble(x, z, s, collide) {
  if(!ENVIRONMENT_DECOR.rocks)return;
  const r = new THREE.Mesh(rubbleGeo, rubbleMat);
  r.position.set(x, s * 0.4, z); r.scale.setScalar(s);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  scene.add(r); shootBlockers.push(r);
  const collider = collide ? addCollider(x, z, s * 1.4, s * 1.4) : null;
  propSystem.registerRock({ mesh: r, collider, x, z, size: s });
}
function addCar(x, z, rot, color, flipped) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, .62, 4.4), mat); body.position.y = .55; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, .55, 2.1), new THREE.MeshStandardMaterial({ color: 0x151a20, roughness: .3, metalness: .4 })); cab.position.set(0, 1.1, -.2); g.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(.36, .36, .25, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c });
  [[-.95, 1.45], [.95, 1.45], [-.95, -1.45], [.95, -1.45]].forEach(([wx, wz]) => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.z = Math.PI / 2; w.position.set(wx, .36, wz); g.add(w); });
  g.position.set(x, flipped ? .75 : 0, z); g.rotation.y = rot;
  if (flipped) g.rotation.z = Math.PI * .94;
  scene.add(g);
  const blockers = [];
  g.traverse(m => { if (m.isMesh) { shootBlockers.push(m); blockers.push(m); } });
  const collider = addCollider(x, z, Math.abs(Math.sin(rot)) > .7 ? 4.4 : 2.2, Math.abs(Math.sin(rot)) > .7 ? 2.2 : 4.4);
  cars.push({ g, x, z, rot, flipped, kind: cars.length % 2, collider, blockers, loaded: false });
}
// Recursos compartidos: doce instancias, solo dos geometrías y texturas.
const carProxyGeo = new THREE.BoxGeometry(1, 1, 1);
const carProxyMat = new THREE.MeshBasicMaterial();
function replaceCar(car, template) {
  const geometry = new Set(), materials = new Set();
  car.g.traverse(o => { if (o.isMesh) { geometry.add(o.geometry); materials.add(o.material); } });
  for (const blocker of car.blockers) {
    const index = shootBlockers.indexOf(blocker);
    if (index >= 0) shootBlockers.splice(index, 1);
  }
  car.g.clear(); geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  const visual = template.root.clone(true);
  car.g.add(visual); car.g.position.set(car.x, 0, car.z);
  car.g.rotation.set(0, 0, car.flipped ? Math.PI * .94 : 0);
  let box = new THREE.Box3().setFromObject(car.g, true);
  car.g.position.y -= box.min.y; // ruedas, o techo del volcado, sobre el suelo
  box = new THREE.Box3().setFromObject(car.g, true);
  const localCX = (box.min.x + box.max.x) / 2 - car.x;
  const localCZ = (box.min.z + box.max.z) / 2 - car.z;
  const halfX = (box.max.x - box.min.x) / 2, halfZ = (box.max.z - box.min.z) / 2;
  const cos = Math.cos(car.rot), sin = Math.sin(car.rot);
  const cx = car.x + localCX * cos + localCZ * sin;
  const cz = car.z - localCX * sin + localCZ * cos;
  const ex = Math.abs(cos) * halfX + Math.abs(sin) * halfZ;
  const ez = Math.abs(sin) * halfX + Math.abs(cos) * halfZ;
  Object.assign(car.collider, { cx, cz, halfX, halfZ, cos, sin,
    minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez });
  car.g.rotation.y = car.rot;
  // Proxies de carrocería/cabina: bloquean tiro y visión sin raycast de 100k tris por auto.
  car.blockers = [];
  for (const [w, h, d, y] of [
    [template.width * .97, template.height * .55, template.length * .97, template.height * .275],
    [template.width * .80, template.height * .45, template.length * .55, template.height * .775]
  ]) {
    const proxy = new THREE.Mesh(carProxyGeo, carProxyMat);
    proxy.scale.set(w, h, d); proxy.position.y = y; proxy.visible = false;
    car.g.add(proxy); shootBlockers.push(proxy); car.blockers.push(proxy);
  }
  applyCarFootprint(car,template.collisionFootprints);
  car.visual = visual; car.loaded = true;
  car.g.updateMatrixWorld(true);
}
async function loadCars() {
  try {
    // A missing optional descriptor retains the original conservative collider.
    const collisionFootprints=await fetch('assets/cars/collision-footprints-v1.json?v=clearance77')
      .then(r=>r.ok?r.json():null).catch(()=>null);
    const templates = await Promise.all([1, 2].map(async type => {
      const base = 'assets/cars/car' + type + '/';
      const materialTask = (async () => {
        const materials = await new MTLLoader().loadAsync(base + 'materials.mtl');
        await new Promise((resolve, reject) => {
          materials.setManager(new THREE.LoadingManager(resolve, undefined, url => reject(new Error(url))));
          materials.preload();
        });
        return materials;
      })();
      const [gltf, materials] = await Promise.all([new GLTFLoader().loadAsync(base + 'model.glb'), materialTask]);
      const material = materials.create('Material');
      // Blender exporta UV con V invertido para glTF; no invertir otra vez el PNG del MTL.
      material.map.flipY = false; material.map.needsUpdate = true;
      gltf.scene.traverse(o => { if (o.isMesh) { o.material.dispose(); o.material = material; } });
      const root = new THREE.Group();
      gltf.scene.rotation.y = -Math.PI / 2; root.add(gltf.scene);
      let box = new THREE.Box3().setFromObject(root, true);
      const length = (type === 1 ? 4.4 : 4.6) * 1.3; // ambos carros 30% más grandes, escala uniforme
      const scale = length / (box.max.z - box.min.z);
      gltf.scene.scale.setScalar(scale);
      box = new THREE.Box3().setFromObject(root, true);
      gltf.scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      root.updateMatrixWorld(true);
      return { root, length, width: box.max.x - box.min.x, height: box.max.y - box.min.y, collisionFootprints };
    }));
    cars.forEach(car => replaceCar(car, templates[car.kind]));
  } catch (err) { console.warn('No cargaron los modelos de carros', err); }
}
async function loadHospital() {
  if(!HOSPITAL_SETTINGS.enabled){hospital.ready=true;hospital.removed=true;return;}
  try {
    const base = 'assets/hospital/';
    const materialTask = (async () => {
      const materials = await new MTLLoader().loadAsync(base + 'materials.mtl');
      await new Promise((resolve, reject) => {
        materials.setManager(new THREE.LoadingManager(resolve, undefined, url => reject(new Error(url))));
        materials.preload();
      });
      return materials;
    })();
    const footprintTask = fetch(base + 'footprint.json').then(response => {
      if (!response.ok) throw new Error('Hospital footprint: ' + response.status);
      return response.json();
    });
    const [gltf, materials, footprint] = await Promise.all([
      new GLTFLoader().loadAsync(base + 'model.glb'), materialTask, footprintTask]);
    const material = materials.create('Material');
    material.map.flipY = false; material.map.needsUpdate = true;
    const blockers = [];
    gltf.scene.traverse(o => {
      if (o.isMesh) { o.material.dispose(); o.material = material; blockers.push(o); }
    });
    const root = new THREE.Group(); root.name = 'Hospital OBJ'; root.add(gltf.scene);
    let box = new THREE.Box3().setFromObject(root, true);
    // Escala uniforme doble: 52 m de ancho y ~38 m de alto; huella regenerada a esta escala.
    gltf.scene.scale.setScalar(footprint.width / (box.max.x - box.min.x));
    box = new THREE.Box3().setFromObject(root, true);
    gltf.scene.position.set(HOSPITAL_RIGHT - box.max.x, -box.min.y, HOSPITAL_FRONT - box.max.z);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root, true);
    const rect = { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
    // Solo se retira el hospital anterior; los otros edificios conservan sus recursos.
    for (const obj of hospital.fallback) {
      scene.remove(obj);
      obj.traverse(o => { if (o.isMesh && o.geometry === unitBox &&
        ![extWallMat, intWallMat, doorLeafMat, ...Object.values(furnMats)].includes(o.material)) o.material.dispose(); });
    }
    for (const c of hospital.colliders) { const i = colliders.indexOf(c); if (i >= 0) colliders.splice(i, 1); }
    for (const b of hospital.blockers) { const i = shootBlockers.indexOf(b); if (i >= 0) shootBlockers.splice(i, 1); }
    hospital.fallback = [];
    scene.add(root); shootBlockers.push(...blockers);
    // Huella del piso/escombros, precalculada en celdas de 0.5 m y fusionada en cajas.
    // Deja libres las concavidades exteriores; los interiores cerrados permanecen sólidos.
    const cx = HOSPITAL_RIGHT - footprint.width / 2;
    const rectangles = footprint.rectangles.map(([x1, x2, z1, z2]) =>
      ({ minX: cx + x1, maxX: cx + x2, minZ: HOSPITAL_FRONT + z1, maxZ: HOSPITAL_FRONT + z2 }));
    const boundaries = footprint.boundaries.map(([ax, az, bx, bz, nx, nz]) =>
      ({ ax: cx + ax, az: HOSPITAL_FRONT + az, bx: cx + bx, bz: HOSPITAL_FRONT + bz, nx, nz }));
    // La colisión resuelve contra el contorno exterior de la unión, sin costuras internas.
    const collider = { ...rect, rectangles, boundaries }; colliders.push(collider);
    hospital.colliders = [collider]; hospital.footprint = rectangles;
    // El fondo del hospital es escenografía fuera del límite jugable. El mapa conserva
    // su retícula y progreso; registra la parte del edificio dentro del área explorable.
    const mapRect = { minX: Math.max(-MAP.halfW, rect.minX), maxX: Math.min(MAP.halfW, rect.maxX),
      minZ: Math.max(-MAP.halfL, rect.minZ), maxZ: Math.min(MAP.halfL, rect.maxZ) };
    Object.assign(hospital.rect, mapRect);
    Object.assign(MAPREG.landmarks.find(l => l.id === 'hospital'), mapRect);
    if (staticLayer) buildStaticLayer(); // también actualiza las celdas descubiertas guardadas
    Object.assign(hospital, { root, bounds: box, blockers, ready: true });
  } catch (err) { console.warn('No cargó el hospital OBJ', err); }
}
buildMap();
roadSystem.load();

// Lava: las piezas molten-heart queman al pisarlas. Sin partículas (decisión de David).
let lavaHazard=null;
roadSystem.load().then(()=>import('./lava-hazard.js?v=20261103-lava2')).then(hazardModule=>{
    const zones=hazardModule.lavaZonesFromRecords(roadSystem.state.records);
    if(!zones.length)return;
    lavaHazard=hazardModule.createLavaHazard({zones,onDamage(damage){
      const now=performance.now()/1000;
      if(S.mode!=='playing'||invasionIntro?.active||now<S.invulnUntil||!Number.isFinite(damage)||damage<=0)return false;
      S.invulnUntil=now+INVULN_TIME;S.health=Math.max(0,S.health-damage);
      flashDamage();sfx.hurt();updateHUD();if(S.health<=0)die();return true;
    }});
    window.__ma.lavaInfo=()=>lavaHazard?.info();
  }).catch(error=>console.warn('Lava no disponible',error));
sidewalkSystem.load();
barricadeSystem.load();
buildingSystem.load();
const carsReadyTask = loadCars(), hospitalReadyTask = loadHospital();
const casinosReadyTask = casinoSystem.load();
const placedBuildingsReadyTask = placedBuildingSystem.load();
const lampPostsReadyTask = Promise.all([casinosReadyTask,placedBuildingsReadyTask]).then(()=>lampPostSystem.load());
const placedVehiclesReadyTask=placedVehicleSystem.load(Promise.all([carsReadyTask,casinosReadyTask,placedBuildingsReadyTask,lampPostsReadyTask]));
const propsReadyTask = propSystem.load(Promise.all([carsReadyTask, hospitalReadyTask, casinosReadyTask, placedBuildingsReadyTask, lampPostsReadyTask,placedVehiclesReadyTask]));
vegetationSystem.load(propsReadyTask);
palmSystem.load(propsReadyTask);

// ---------- Etapa C2: constructores de interiores y manzanas ----------
// Pared maciza: bloquea movimiento (colliders), disparos y visión
// (shootBlockers) — y por tanto también el descubrimiento de C1.
function addWallSeg(cx, cz, w, d, h, mat) {
  const m = new THREE.Mesh(unitBox, mat);
  m.scale.set(w, h, d); m.position.set(cx, h / 2, cz);
  scene.add(m); shootBlockers.push(m); addCollider(cx, cz, w, d);
  return m;
}
// Dintel sobre un hueco de puerta: bloquea disparos pero no el paso
// (nadie salta 2.4 m: ni el jugador ni los enemigos).
function addLintel(cx, cz, w, d, y0, h, mat) {
  const m = new THREE.Mesh(unitBox, mat);
  m.scale.set(w, h, d); m.position.set(cx, y0 + h / 2, cz);
  scene.add(m); shootBlockers.push(m);
  return m;
}
// Pared a lo largo de X (z fija) con huecos de puerta de 2.2 m:
// gaps = centros x de los huecos. Emite segmentos + dinteles.
function wallRunX(z, x1, x2, h, mat, gaps = []) {
  const T = 0.3, TOP = 2.4;
  let cur = x1;
  for (const gc of [...gaps].sort((a, b) => a - b)) {
    const g1 = gc - 1.1, g2 = gc + 1.1;
    propSystem.reservePath({ minX: g1, maxX: g2, minZ: z - 3, maxZ: z + 3 });
    if (g1 > cur) addWallSeg((cur + g1) / 2, z, g1 - cur, T, h, mat);
    addLintel(gc, z, 2.2, T, TOP, h - TOP, mat);
    cur = g2;
  }
  if (cur < x2) addWallSeg((cur + x2) / 2, z, x2 - cur, T, h, mat);
}
// Pared a lo largo de Z (x fija) con huecos de puerta de 2.2 m:
// gaps = centros z de los huecos.
function wallRunZ(x, z1, z2, h, mat, gaps = []) {
  const T = 0.3, TOP = 2.4;
  let cur = z1;
  for (const gc of [...gaps].sort((a, b) => a - b)) {
    const g1 = gc - 1.1, g2 = gc + 1.1;
    propSystem.reservePath({ minX: x - 3, maxX: x + 3, minZ: g1, maxZ: g2 });
    if (g1 > cur) addWallSeg(x, (cur + g1) / 2, T, g1 - cur, h, mat);
    addLintel(x, gc, T, 2.2, TOP, h - TOP, mat);
    cur = g2;
  }
  if (cur < z2) addWallSeg(x, (cur + z2) / 2, T, z2 - cur, h, mat);
}
// Hoja de puerta decorativa, abierta y fija (la interacción llega
// en C3): sin colisionador, sí bloquea disparos (es lo que se ve).
function addDoorLeaf(hx, hz, rotY) {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(unitBox, doorLeafMat);
  leaf.scale.set(1.05, 2.2, .06); leaf.position.set(.55, 1.1, 0);
  g.add(leaf); g.position.set(hx, 0, hz); g.rotation.y = rotY;
  scene.add(g); shootBlockers.push(leaf);
}
// Mueble: caja con colisionador y bloqueo de disparos.
function addFurniture(cx, cz, w, h, d, mat) {
  const m = new THREE.Mesh(unitBox, mat);
  m.scale.set(w, h, d); m.position.set(cx, h / 2, cz);
  scene.add(m); shootBlockers.push(m); addCollider(cx, cz, w, d);
  return m;
}
// Suelo interior: lámina fina sin colisión, sobre el suelo general.
function addFloor(cx, cz, w, d, color) {
  const m = new THREE.Mesh(unitBox, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.scale.set(w, .04, d); m.position.set(cx, .02, cz);
  scene.add(m);
  return m;
}
// Registra la huella del edificio explorable: como building (el
// minimapa la pinta y el descubrimiento la trata como manzana) y
// como landmark con nombre (el mapa expandido lo etiqueta).
function registerLandmark(def) {
  const r = { minX: def.cx - def.w / 2, maxX: def.cx + def.w / 2, minZ: def.cz - def.d / 2, maxZ: def.cz + def.d / 2 };
  MAPREG.buildings.push(r);
  MAPREG.landmarks.push({ id: def.id, name: def.name, ...r });
  return r;
}

// Respaldo procedural del hospital mientras carga OBJ/MTL/PNG y su huella.
// loadHospital() retira todas estas piezas y solo sus colliders/bloqueadores.
function buildHospital() {
  if(!HOSPITAL_SETTINGS.enabled){hospital.ready=true;hospital.removed=true;return;}
  const before = new Set(scene.children), colliderStart = colliders.length, blockerStart = shootBlockers.length;
  const def = LANDMARK_DEFS[0], cx = def.cx, cz = def.cz;
  const x1 = cx - 13, x2 = cx + 13, z1 = cz - 8, z2 = cz + 8, H = 6;
  hospital.rect = registerLandmark(def);
  addFloor(cx, cz, def.w, def.d, 0x4d4a42);
  wallRunX(z2, x1, x2, H, extWallMat, [cx]);              // frente: entrada
  wallRunX(z1, x1, x2, H, extWallMat);                   // fondo
  wallRunZ(x1, z1, z2, H, extWallMat);                   // oeste
  wallRunZ(x2, z1, z2, H, extWallMat);                   // este
  wallRunX(cz, x1, x2, 3.2, intWallMat, [cx - 8.6, cx, cx + 8.6]); // tabique de habitaciones
  wallRunZ(cx - 4.3, z1, cz, 3.2, intWallMat);           // división hab. 1–2
  wallRunZ(cx + 4.3, z1, cz, 3.2, intWallMat);           // división hab. 2–3
  wallRunZ(cx + 9, cz, cz + 4.5, 3.2, intWallMat, [cz + 2.2]);     // mantenimiento: pared oeste con puerta
  wallRunX(cz + 4.5, cx + 9, x2, 3.2, intWallMat);       // mantenimiento: pared norte
  addDoorLeaf(cx - 1.1, z2, 1.15);
  addFurniture(cx - 4, cz + 6, 4, 1.1, .9, furnMats.counter);      // mostrador de recepción
  addFurniture(cx - 8.6, cz - 4, 2, .9, .9, furnMats.cloth);       // camillas ×3
  addFurniture(cx, cz - 4, 2, .9, .9, furnMats.cloth);
  addFurniture(cx + 8.6, cz - 4, 2, .9, .9, furnMats.cloth);
  addFurniture(x1 + .45, cz - 3, .5, 2, 2, furnMats.wood);          // estanterías ×2
  addFurniture(x2 - .45, cz - 3, .5, 2, 2, furnMats.wood);
  hospital.fallback = scene.children.filter(o => !before.has(o));
  hospital.colliders = colliders.slice(colliderStart);
  hospital.blockers = shootBlockers.slice(blockerStart);
}

// Respaldo del CASINO 1 (antigua comisaría), retirado al cargar el modelo.
// Centro (26,40), huella 20×16: x[16,36], z[32,48].
// Frente al oeste (pared x=16) con la entrada a la calle principal.
// Entrada y pasillo longitudinal al oeste; dos oficinas al este del
// pasillo y la sala de seguridad al fondo este.
function buildComisaria() {
  const before = new Set(scene.children), colliderStart = colliders.length, blockerStart = shootBlockers.length;
  const def = LANDMARK_DEFS[1], cx = def.cx, cz = def.cz;
  const x1 = cx - 10, x2 = cx + 10, z1 = cz - 8, z2 = cz + 8, H = 6;
  const rect = registerLandmark(def);
  const floor = addFloor(cx, cz, def.w, def.d, 0x44484c);
  wallRunZ(x1, z1, z2, H, extWallMat, [cz]);             // frente: entrada
  wallRunZ(x2, z1, z2, H, extWallMat);                   // fondo este
  wallRunX(z1, x1, x2, H, extWallMat);                   // norte
  wallRunX(z2, x1, x2, H, extWallMat);                   // sur
  wallRunZ(cx - 3.4, z1, z2, 3.2, intWallMat, [cz - 4, cz + 4]);   // pared del pasillo: puertas a oficinas
  wallRunX(cz, cx - 3.4, cx + 5, 3.2, intWallMat);       // división entre oficinas
  wallRunZ(cx + 5, z1, z2, 3.2, intWallMat, [cz]);       // sala de seguridad: pared con puerta
  addDoorLeaf(x1, cz - 1.1, -0.9);
  addFurniture(cx - 8, cz - 5, 1.6, .78, .9, furnMats.wood);       // escritorio de entrada
  addFurniture(cx + 1, cz - 4, 1.8, .78, .9, furnMats.wood);       // escritorios de oficinas ×2
  addFurniture(cx + 1, cz + 4, 1.8, .78, .9, furnMats.wood);
  addFurniture(cx + 7.5, cz, 1, .85, 2.2, furnMats.metal);         // mesa de seguridad
  addFurniture(x2 - .45, cz - 6, .5, 2, 2, furnMats.wood);         // estanterías ×2
  addFurniture(x2 - .45, cz + 6, .5, 2, 2, furnMats.wood);
  casinoSystem.register({ def, rect, floor, fallback:scene.children.filter(o => !before.has(o)),
    oldColliders:colliders.slice(colliderStart), oldBlockers:shootBlockers.slice(blockerStart) });
}

// Respaldo del CASINO 2 (antigua fábrica), retirado al cargar el modelo.
// Centro (43,47), huella 18×20: x[34,52], z[37,57].
// Frente al norte (pared z=37) con dos entradas a la transversal.
// Entrada industrial abierta, área de maquinaria central, pasillo
// este y sala de control en la esquina suroeste.
function buildFabrica() {
  const before = new Set(scene.children), colliderStart = colliders.length, blockerStart = shootBlockers.length;
  const def = LANDMARK_DEFS[2], cx = def.cx, cz = def.cz;
  const x1 = cx - 9, x2 = cx + 9, z1 = cz - 10, z2 = cz + 10, H = 6;
  const rect = registerLandmark(def);
  const floor = addFloor(cx, cz, def.w, def.d, 0x3f3b36);
  wallRunX(z1, x1, x2, H, extWallMat, [cx - 4, cx + 4]); // frente: dos entradas
  wallRunX(z2, x1, x2, H, extWallMat);                   // fondo sur
  wallRunZ(x1, z1, z2, H, extWallMat);                   // oeste
  wallRunZ(x2, z1, z2, H, extWallMat);                   // este (límite del mapa)
  wallRunZ(cx + 5.6, cz - 4, z2, 3.2, intWallMat, [cz + 3]);       // pasillo este: pared con puerta
  wallRunX(cz + 5, x1, cx - 2, 3.2, intWallMat, [cx - 5.5]);       // sala de control: pared con puerta
  addDoorLeaf(cx - 5.1, z1, 1.15);
  addDoorLeaf(cx + 2.9, z1, 1.15);
  addFurniture(cx - 5, cz, 2.6, 2, 2, furnMats.metal);             // máquinas ×3
  addFurniture(cx + 1, cz + 3, 2.6, 2, 2, furnMats.metal);
  addFurniture(cx - 2, cz - 2.7, 2.2, 1.8, 1.8, furnMats.metal);
  addFurniture(cx - 5.5, cz + 8.3, 2.2, 1, .8, furnMats.counter);  // consola de control
  addFurniture(cx + 3, cz + 8, 1.2, 1.2, 1.2, furnMats.wood);       // cajas de carga ×3
  addFurniture(cx + 4.6, cz + 8.9, 1.2, 1.2, 1.2, furnMats.wood);
  addFurniture(cx + 2.2, cz + 6.6, 1.2, 1.2, 1.2, furnMats.wood);
  casinoSystem.register({ def, rect, floor, fallback:scene.children.filter(o => !before.has(o)),
    oldColliders:colliders.slice(colliderStart), oldBlockers:shootBlockers.slice(blockerStart) });
}

// Relleno de manzanas decorativas de los cuadrantes entre calles:
// filas de edificios con la misma semilla y el mismo patrón de la
// ciudad original. Cada candidato se contrasta con lo ya registrado
// (edificios y landmarks) y con las reservas (calles y huellas):
// nada se solapa y los huecos con la calle quedan como aceras.
function fillQuadrants(facades, rnd) {
  const tryPlace = (cx, cz, w, d) => {
    const r = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
    if (rectHitsAny(r, MAPREG.buildings, 1.2)) return;
    if (rectHitsAny(r, RESERVED_RECTS, 0)) return;
    const bh = 9 + rnd() * 16;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, bh, d), new THREE.MeshStandardMaterial({ map: facades[(rnd() * 3) | 0], roughness: .9 }));
    b.position.set(cx, bh / 2, cz);
    scene.add(b); shootBlockers.push(b);
    const collider = addCollider(cx, cz, w, d);
    MAPREG.buildings.push(r);
    buildingSystem.register({ mesh: b, collider, rect: r, height: bh });
  };
  // Fila a lo largo de X: fachadas sobre faceZ, creciendo hacia
  // dirZ con profundidad dMin–dMax. UNA sola fila profunda por
  // cuadrante: llena casi todo el fondo de la manzana y deja el
  // resto como callejón trasero (dos filas competirían por la
  // misma franja de ~25 m y se rechazarían entre sí).
  const rowX = (x1, x2, faceZ, dirZ, dMin, dMax) => {
    let x = x1;
    while (x < x2 - 8) {
      const w = 10 + rnd() * 5, d = dMin + rnd() * (dMax - dMin);
      tryPlace(x + w / 2, faceZ + dirZ * (d / 2), w, d);
      x += w + 2 + rnd() * 5;
    }
  };
  rowX(-50, -16, -33, -1, 14, 20); rowX(16, 50, -33, -1, 14, 20);   // cuadrantes norte (a la transversal z=-20)
  rowX(-50, -16, -7, 1, 12, 16); rowX(16, 50, -7, 1, 12, 16);       // cuadrantes medios (entre transversales)
  rowX(-50, -16, 37, 1, 13, 19); rowX(16, 50, 37, 1, 13, 19);       // cuadrantes sur (a la transversal z=+24)
  // Segunda pasada: bloques pequeños en los huecos que dejó la
  // primera (esquinas ocupadas por la calle principal, landmarks…).
  const rowXs = (x1, x2, faceZ, dirZ) => {
    let x = x1;
    while (x < x2 - 6) {
      const w = 7 + rnd() * 4, d = 8 + rnd() * 4;
      tryPlace(x + w / 2, faceZ + dirZ * (d / 2), w, d);
      x += w + 1.5 + rnd() * 3;
    }
  };
  rowXs(-50, -16, -33, -1); rowXs(16, 50, -33, -1);
  rowXs(-50, -16, -7, 1); rowXs(16, 50, -7, 1);
  rowXs(-50, -16, 37, 1); rowXs(16, 50, 37, 1);
}

// Farol adicional (mismo patrón que los de la calle principal).
function addLampPost(x, z, i) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 5.4, 6), new THREE.MeshStandardMaterial({ color: 0x2c2c30 }));
  pole.position.set(x, 2.7, z); pole.rotation.z = (i % 2 ? -1 : 1) * 0.1; scene.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 8), new THREE.MeshStandardMaterial({ emissive: 0xffa845, emissiveIntensity: 2, color: 0x221100 }));
  lamp.position.set(x + (i % 2 ? -0.5 : 0.5), 5.4, z); scene.add(lamp);
  const pl = new THREE.PointLight(0xff9a40, 12, 15); pl.position.copy(lamp.position); scene.add(pl);
  lampPostSystem.register({pole,lamp,light:pl,x,z,main:false});
}
// Hoguera adicional (mismo patrón que las existentes).
function addFireBarrel(x, z) {
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0x59331c, roughness: .85 }));
  barrel.position.set(x, .55, z); scene.add(barrel); shootBlockers.push(barrel);
  const collider = addCollider(x, z, 1.1, 1.1);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.1, 8), new THREE.MeshStandardMaterial({ emissive: 0xff6a1a, emissiveIntensity: 3, color: 0x381a00, transparent: true, opacity: .9 }));
  fire.position.set(x, 1.5, z); scene.add(fire);
  const l = new THREE.PointLight(0xff7a26, 20, 17); l.position.set(x, 1.8, z); scene.add(l);
  // Oculta las llamas y conserva la luz naranja parpadeante de los botes.
  fire.visible = false;
  window.__fires.push({ fire, light: l, base: 20, phase: Math.random() * 9 });
  propSystem.registerTrash({ mesh: barrel, collider, fire, light: l, x, z });
}

// ---------- Colisiones (círculo vs AABB) ----------
// Segmentos desplazados por el radio, recortados donde otra parte del hospital
// deja un hueco demasiado estrecho. Se calculan una vez por radio corporal.
function footprintExitSegments(c, radius) {
  c.exitsByRadius ||= new Map();
  if (c.exitsByRadius.has(radius)) return c.exitsByRadius.get(radius);
  const segments = [], toleranceRadius = Math.max(0, radius - 1e-6);
  for (const b of c.boundaries) {
    const horizontal = b.az === b.bz;
    const fixed = horizontal ? b.az + b.nz * radius : b.ax + b.nx * radius;
    // Las salidas deben caber también dentro del mapa: el hospital puede extenderse fuera.
    if (Math.abs(fixed) > (horizontal ? MAP.halfL : MAP.halfW) - radius) continue;
    const limit = (horizontal ? MAP.halfW : MAP.halfL) - radius;
    const start = Math.max(-limit, horizontal ? b.ax : b.az), end = Math.min(limit, horizontal ? b.bx : b.bz);
    if (start > end) continue;
    let spans = [[start, end]];
    for (const r of c.rectangles) {
      const min = horizontal ? r.minZ : r.minX, max = horizontal ? r.maxZ : r.maxX;
      const d = Math.abs(fixed - THREE.MathUtils.clamp(fixed, min, max));
      if (d >= toleranceRadius) continue;
      const reach = Math.sqrt(toleranceRadius ** 2 - d ** 2);
      const lo = (horizontal ? r.minX : r.minZ) - reach;
      const hi = (horizontal ? r.maxX : r.maxZ) + reach;
      const next = [];
      for (const [a, z] of spans) {
        if (hi <= a || lo >= z) next.push([a, z]);
        else { if (lo > a) next.push([a, lo]); if (hi < z) next.push([hi, z]); }
      }
      spans = next;
    }
    for (const [a, z] of spans) segments.push(horizontal ? { ax: a, az: fixed, bx: z, bz: fixed } :
      { ax: fixed, az: a, bx: fixed, bz: z });
  }
  c.exitsByRadius.set(radius, segments); return segments;
}
// Volumen compuesto del hospital. Solo las aristas exteriores corrigen la posición.
function resolveFootprintCollision(p, radius, c) {
  if (p.x < c.minX - radius || p.x > c.maxX + radius ||
      p.z < c.minZ - radius || p.z > c.maxZ + radius) return;
  const originX = p.x, originZ = p.z;
  for (let pass = 0; pass < 4; pass++) {
    const inside = c.rectangles.some(r => p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ);
    let best = Infinity, nearX = 0, nearZ = 0, edge;
    for (const b of c.boundaries) {
      const x = THREE.MathUtils.clamp(p.x, b.ax, b.bx), z = THREE.MathUtils.clamp(p.z, b.az, b.bz);
      const d2 = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d2 < best) { best = d2; nearX = x; nearZ = z; edge = b; }
    }
    if (!inside && best >= radius * radius - 1e-9) break;
    if (inside || best < 1e-10) { p.x = nearX + edge.nx * radius; p.z = nearZ + edge.nz * radius; }
    else { const d = Math.sqrt(best); p.x = nearX + (p.x - nearX) / d * radius; p.z = nearZ + (p.z - nearZ) / d * radius; }
  }
  // Concavidades con espacio menor que el diámetro: evitar alternar entre dos paredes.
  const overlap = c.rectangles.some(r => {
    const x = THREE.MathUtils.clamp(p.x, r.minX, r.maxX), z = THREE.MathUtils.clamp(p.z, r.minZ, r.maxZ);
    return (p.x - x) ** 2 + (p.z - z) ** 2 < (radius - 1e-5) ** 2;
  });
  const outsideMap = Math.abs(p.x) > MAP.halfW - radius || Math.abs(p.z) > MAP.halfL - radius;
  if (overlap || outsideMap) {
    let best = Infinity;
    for (const b of footprintExitSegments(c, radius)) {
      const x = THREE.MathUtils.clamp(originX, b.ax, b.bx), z = THREE.MathUtils.clamp(originZ, b.az, b.bz);
      const d2 = (originX - x) ** 2 + (originZ - z) ** 2;
      if (d2 < best) { best = d2; p.x = x; p.z = z; }
    }
  }
}
function resolveCollisions(p, radius, nearestFace = false) {
  p.x = THREE.MathUtils.clamp(p.x, -MAP.halfW + radius, MAP.halfW - radius);
  p.z = THREE.MathUtils.clamp(p.z, -MAP.halfL + radius, MAP.halfL - radius);
  for (const c of colliders) {
    if (c.boundaries) { resolveFootprintCollision(p, radius, c); continue; }
    if (c.halfX !== undefined) {
      const dx = p.x - c.cx, dz = p.z - c.cz;
      const x = dx * c.cos - dz * c.sin, z = dx * c.sin + dz * c.cos;
      const nx = THREE.MathUtils.clamp(x, -c.halfX, c.halfX);
      const nz = THREE.MathUtils.clamp(z, -c.halfZ, c.halfZ);
      const ox = x - nx, oz = z - nz, d2 = ox * ox + oz * oz;
      if (d2 < radius * radius) {
        let rx = x, rz = z;
        if (d2 > 1e-8) { const d = Math.sqrt(d2); rx = nx + ox / d * radius; rz = nz + oz / d * radius; }
        else {
          const exits = [x + c.halfX, c.halfX - x, z + c.halfZ, c.halfZ - z];
          const side = exits.indexOf(Math.min(...exits));
          if (side === 0) rx = -c.halfX - radius;
          else if (side === 1) rx = c.halfX + radius;
          else if (side === 2) rz = -c.halfZ - radius;
          else rz = c.halfZ + radius;
        }
        p.x = c.cx + rx * c.cos + rz * c.sin;
        p.z = c.cz - rx * c.sin + rz * c.cos;
      }
      continue;
    }
    const nx = THREE.MathUtils.clamp(p.x, c.minX, c.maxX);
    const nz = THREE.MathUtils.clamp(p.z, c.minZ, c.maxZ);
    const dx = p.x - nx, dz = p.z - nz, d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = nx + dx / d * radius; p.z = nz + dz / d * radius; }
      else if (nearestFace) {
        const exits = [p.x - c.minX, c.maxX - p.x, p.z - c.minZ, c.maxZ - p.z];
        const side = exits.indexOf(Math.min(...exits));
        if (side === 0) p.x = c.minX - radius;
        else if (side === 1) p.x = c.maxX + radius;
        else if (side === 2) p.z = c.minZ - radius;
        else p.z = c.maxZ + radius;
      } else p.z = c.maxZ + radius;
    }
  }
}

// Huella corporal por postura: discos sobre el eje cadera/pecho/cabeza
// y pies. No incluye los aros ornamentales ni el alcance del puñetazo.
const _bodyPoint = new THREE.Vector3();
function setBodyDisc(points,index,x,z,r){
  const point=points[index]||(points[index]={x:0,z:0,r:0});
  point.x=x;point.z=z;point.r=r;
}
const bodyBones=[['Hips',.27],['Spine2',.30],['Head',.23],['LeftFoot',.14],['RightFoot',.14]];
const enemyCollisionBroadphase=createEnemyCollisionBroadphase(colliders,MAP.halfW,MAP.halfL);
const groundNavigation=createGroundNavigation({halfW:MAP.halfW,halfL:MAP.halfL,resolve:resolveCollisions});
window.__ma.navigationInfo=()=>groundNavigation.info();
window.__ma.enemyCollisionInfo=()=>enemyCollisionBroadphase.info();
function enemyFootprint(mon,points=[]) {
  if(mon.swarm){setBodyDisc(points,0,0,0,mon.radius);points.length=1;return points;}
  if (!mon.alien) {setBodyDisc(points,0,0,0,.5);points.length=1;return points;}
  mon.g.updateMatrixWorld(true);
  const scale = mon.g.scale.x, p = mon.g.position;
  let count=0;
  for (const [name, radius] of bodyBones) {
    const bone = mon.alien.bones[name];
    _bodyPoint.setFromMatrixPosition(bone.matrixWorld);
    setBodyDisc(points,count++,_bodyPoint.x-p.x,_bodyPoint.z-p.z,radius*scale);
  }
  // Discos intermedios cubren el torso horizontal durante crawl.
  for (let i = 0; i < 2; i++) {
    const a = points[i], b = points[i + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (.20 * scale));
    for (let j = 1; j < steps; j++) {
      const t = j / steps;
      setBodyDisc(points,count++,THREE.MathUtils.lerp(a.x,b.x,t),THREE.MathUtils.lerp(a.z,b.z,t),THREE.MathUtils.lerp(a.r,b.r,t));
    }
  }
  points.length=count;return points;
}
function resolveEnemyCollisions(mon) {
  const p = mon.g.position, points = enemyFootprint(mon,mon.collisionFootprint||(mon.collisionFootprint=[]));
  if(enemyCollisionBroadphase.clear(p,points))return;
  // Varias pasadas: corregir la cabeza no debe dejar la cadera dentro de la pared.
  for (let pass = 0; pass < 4; pass++) {
    for (const c of points) {
      _bodyPoint.set(p.x + c.x, 0, p.z + c.z);
      const x = _bodyPoint.x, z = _bodyPoint.z;
      resolveCollisions(_bodyPoint, c.r, true);
      p.x += _bodyPoint.x - x; p.z += _bodyPoint.z - z;
    }
  }
}
window.__ma.climbingInfo=()=>({enabled:false,ready:true,error:null,meshes:0,cells:0,starts:0});
const enemyAlert=createEnemyAlert({canSee:canSeePlayer,onFinish:mon=>toChase(mon,false)});
const crawlerLeap=createCrawlerLeap({resolve:resolveEnemyCollisions,canSee:canSeePlayer,onFinish:mon=>toChase(mon,false),
  onContact(mon){
    const now=performance.now()/1000;
    if(S.mode!=='playing'||invasionIntro?.active||now<S.invulnUntil||Math.abs(mon.g.position.y-jumpY)>1.9)return;
    S.invulnUntil=now+INVULN_TIME;S.health-=MONSTER_DAMAGE;
    flashDamage({source:'crawler-leap'});sfx.hurt({strong:true});updateHUD();if(S.health<=0)die();
  }});


const thirdPerson=createPlayablePlayer({scene,camera,blockers:shootBlockers,moveCinematic:moveIntroCharacter,moveReaction:moveHitCharacter,brace:bones=>cityChaos?.bracePlayer(bones)});
thirdPerson.load();
window.__ma.playerInfo=()=>thirdPerson.info();
// ---------- Rifle ----------
// La malla original OBJ se empaqueta sin simplificar en weapon.glb;
// el aspecto se carga del MTL y PNG originales (Phong, Ns=250, Ks=.5).
// Encuadre cercano: culata, empuñadura y receptor salen por abajo/derecha.
const WEAPON_BASE = new THREE.Vector3(.23, -.25, -.27);
const WEAPON_AIM = new THREE.Vector3(0, -.113, -.29);
const SCOPE_AXIS = new THREE.Vector3(.30, .2355, .0165);
const ADS_FOV = 55, ADS_MOUSE_SCALE = .45, ADS_MOVE_SCALE = .5;
let aimBlend = 0, scopeView=false;
const weaponScene = new THREE.Scene();
const weaponCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .03, 20);
const rifle = new THREE.Group();
rifle.position.copy(WEAPON_BASE);
weaponScene.add(rifle);
weaponScene.add(new THREE.HemisphereLight(0xffe5c8, 0x30333a, 1.35));
const weaponKey = new THREE.DirectionalLight(0xfff3df, 1.1);
weaponKey.position.set(-1, 3, 2); weaponScene.add(weaponKey);

// Respaldo durante la descarga; se retira completamente al cargar el OBJ.
const weaponFallback = new THREE.Group();
{
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: .45, metalness: .55 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: .8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.09, .13, .62), dark); weaponFallback.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .42, 8), dark); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .035, -.5); weaponFallback.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .11), dark); mag.position.set(0, -.14, -.02); weaponFallback.add(mag);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(.07, .11, .24), grip); stock.position.set(0, -.015, .36); weaponFallback.add(stock);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(.02, .07, .02), dark); sight.position.set(0, .1, -.12); weaponFallback.add(sight);
  rifle.add(weaponFallback);
}
const muzzleAnchor = new THREE.Object3D();
muzzleAnchor.position.set(0, .035, -.71); rifle.add(muzzleAnchor);
const opticAnchor=new THREE.Object3D();opticAnchor.position.set(0,.1,-.12);rifle.add(opticAnchor);
const opticLocal=new THREE.Vector3(),opticRendered=new THREE.Vector3(),opticTarget=new THREE.Vector3();
const scopeBaseQuaternion=new THREE.Quaternion(),scopeQuakeQuaternion=new THREE.Quaternion();
const muzzleFlash = new THREE.PointLight(0xffc36b, 0, 2);
muzzleAnchor.add(muzzleFlash);
const worldMuzzleFlash = new THREE.PointLight(0xffc36b, 0, 2);
worldMuzzleFlash.name='world-muzzle-flash';scene.add(worldMuzzleFlash);
function getMuzzleWorld(target) {
  if(!scopeView&&thirdPerson.state.ready)return muzzleAnchor.getWorldPosition(target);
  weaponScene.updateMatrixWorld(true);
  muzzleAnchor.getWorldPosition(target);
  camera.updateMatrixWorld(true);
  return camera.localToWorld(target);
}
let recoil = 0, weaponReady = false;
const rifleFeedback=createRifleFeedback({baseSpread:SPREAD});
const weakPointAssist=createWeakPointAssist(),assistRay=new THREE.Raycaster(),assistDirection=new THREE.Vector3(),assistOrigin=new THREE.Vector3(),assistMuzzle=new THREE.Vector3();
const tacticalAim=createTacticalAim(),tacticalAimRay=new THREE.Raycaster(),tacticalAimOrigin=new THREE.Vector3(),tacticalBodyBox=new THREE.Box3(),tacticalMeshBox=new THREE.Box3(),tacticalAimBones=new WeakMap();
const tacticalPointer=createTacticalPointer();
const tacticalPointerOrigin=new THREE.Vector3(),tacticalPointerWorld=new THREE.Vector3(),tacticalShotMuzzle=new THREE.Vector3();
function tacticalPointerAnchor(){return tacticalPointerOrigin.set(playerPos.x,playerPos.y+jumpY-.25,playerPos.z);}
function tacticalShotYaw(){
  if(!tacticalPointer.worldPoint(tacticalPointerWorld))return yaw;
  getMuzzleWorld(tacticalShotMuzzle);
  return Math.atan2(-(tacticalPointerWorld.x-tacticalShotMuzzle.x),-(tacticalPointerWorld.z-tacticalShotMuzzle.z))+tacticalPointer.info().offset;
}
const shotRight=new THREE.Vector3(),shotUp=new THREE.Vector3(),reticleDirection=new THREE.Vector3(),reticleCenter=new THREE.Vector3(),reticleEdge=new THREE.Vector3(),reticleProjected=new THREE.Vector3();
const reticleRight=new THREE.Vector3(),reticleUp=new THREE.Vector3(),reticleOrigin=new THREE.Vector3();
const quakeAimRotation=new THREE.Euler(0,0,0,'YXZ');
let cameraFeedbackSnapshot=null;
window.__ma.rifleFeedbackInfo=()=>rifleFeedback.info();
window.__ma.cameraFeedbackInfo=()=>cameraFeedbackSnapshot;
window.__ma.quakeAimInfo=()=>quakeAim.info();
window.__ma.aimAssistInfo=()=>weakPointAssist.info();
window.__ma.tacticalAimInfo=()=>tacticalAim.info();
window.__ma.tacticalPointerInfo=()=>tacticalPointer.info();
function rifleAimDirection(out){
  const disturbance=quakeAim.info();
  if(tacticalView.elevated)return tacticalView.shotDirection(tacticalShotYaw()+disturbance.yaw,THREE.MathUtils.clamp(tacticalAim.info().pitch+disturbance.pitch,-1.35,1.35),out);
  // ADS uses the actual optical centre of the moving rifle, not a separate
  // screen-centre ray. Hip fire keeps its existing camera-relative direction.
  if(scopeView){rifle.updateMatrixWorld(true);opticAnchor.getWorldPosition(out).normalize();}
  else out.set(0,0,-1);
  return out.applyEuler(quakeAimRotation.set(disturbance.pitch,disturbance.yaw,0,'YXZ')).applyQuaternion(camera.quaternion).normalize();
}
function rifleFeedbackOptions(){return {aim:aimBlend,speed:Math.hypot(visualVelocity.x,visualVelocity.z),fatigue:playerStamina.info().fatigue,blocked:tacticalView.elevated||mapOpen,reduced:!!(invasionIntro?.info().preferences.reduced||invasionIntro?.info().systemReducedMotion)};}
function spreadBasis(direction){
  shotRight.set(0,1,0);if(Math.abs(direction.y)>.98)shotRight.set(1,0,0);
  shotRight.crossVectors(direction,shotRight).normalize();shotUp.crossVectors(shotRight,direction).normalize();
}
function captureRifleReticle(){
  // Capture the real, unscattered aiming ray before temporary render-space shake.
  rifleAimDirection(reticleDirection);
  spreadBasis(reticleDirection);reticleRight.copy(shotRight);reticleUp.copy(shotUp);
  reticleOrigin.copy(tacticalView.elevated?getMuzzleWorld(reticleEdge):camera.position);
  reticleCenter.copy(reticleDirection).multiplyScalar(tacticalView.elevated?tacticalAim.info().distance:10).add(reticleOrigin);
}
function updateRifleReticle(){
  const cone=rifleFeedback.info().spread,rect=renderer.domElement.getBoundingClientRect(),distance=(tacticalView.elevated?tacticalAim.info().distance:10)*Math.tan(cone);
  const center=reticleProjected.copy(reticleCenter).project(camera);let radius=0;
  for(const axis of [reticleRight,reticleUp])for(const sign of [-1,1]){
    reticleEdge.copy(reticleCenter).addScaledVector(axis,distance*sign).project(camera);
    radius=Math.max(radius,Math.hypot((reticleEdge.x-center.x)*rect.width*.5,(reticleEdge.y-center.y)*rect.height*.5));
  }
  const x=(center.x*.5+.5)*100,y=(.5-center.y*.5)*100;
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius))return;
  // These offsets project the shot into the rendered view, rather than animating a fake target.
  for(const id of ['crosshair','hitmarker']){
    const node=el(id);node.style.left=Math.abs(x-50)<.0001?'':x.toFixed(4)+'%';node.style.top=Math.abs(y-50)<.0001?'':y.toFixed(4)+'%';
  }
  const diameter=2*(Math.max(4,radius+2)+7);
  el('crosshair').style.setProperty('--reticle-size',diameter.toFixed(2)+'px');
}
window.__ma.weaponReady = () => weaponReady;
function setScopeView(active){
  if(scopeView===active)return;
  scopeView=active;thirdPerson.setScopeView(active);
  (active?weaponScene:scene).add(rifle);
  if(active)rifle.scale.setScalar(1);
  rifle.traverse(o=>{if(o.isMesh){o.material.fog=!active;o.material.needsUpdate=true;}});
  muzzleFlash.visible=active;
}
function updateScopeWeapon(){
  rifle.position.copy(WEAPON_BASE).lerp(WEAPON_AIM,aimBlend);
  // The same recoil state lifts the visible optic and its real shot ray.
  const feedback=rifleFeedback.info();
  rifle.position.y+=feedback.pitch*.65;rifle.position.x-=feedback.yaw*.65;rifle.position.z+=recoil*.025;
  const hit=thirdPerson.hitWeight();
  rifle.position.y-=hit*.015;rifle.position.z+=hit*.018;
  rifle.rotation.set(feedback.pitch*.6+hit*.035,feedback.yaw*.6,0);rifle.updateMatrixWorld(true);
}

async function loadWeapon() {
  try {
    const materialTask = (async () => {
      const materials = await new MTLLoader().loadAsync('assets/weapon/materials.mtl');
      // MTLLoader.preload inicia la textura: esperar también al PNG, no solo al MTL.
      await new Promise((resolve, reject) => {
        materials.setManager(new THREE.LoadingManager(resolve, undefined, url => reject(new Error('Textura de arma: ' + url))));
        materials.preload();
      });
      return materials;
    })();
    const [gltf, materials] = await Promise.all([
      new GLTFLoader().loadAsync('assets/weapon/weapon.glb'), materialTask
    ]);
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    // El OBJ mira a -X: girar -90° Y lo alinea con -Z de la cámara.
    const mount = new THREE.Group();
    mount.rotation.y = -Math.PI / 2;
    mount.scale.setScalar(.92 / (bounds.max.x - bounds.min.x));
    model.position.sub(center); mount.add(model);
    const scopeOffset = SCOPE_AXIS.clone().sub(center).multiplyScalar(mount.scale.x)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), mount.rotation.y);
    opticAnchor.position.copy(scopeOffset);
    WEAPON_AIM.x = -scopeOffset.x; WEAPON_AIM.y = -scopeOffset.y;
    // El OBJ comparte material opaco para metal y lentes: abrir solo
    // el canal óptico central, manteniendo el tubo, los aros y la textura.
    const scopeMaterial = materials.create('Material');
    scopeMaterial.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWeaponPosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWeaponPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWeaponPosition;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (vWeaponPosition.x > .14 && vWeaponPosition.x < .43 &&
              distance(vWeaponPosition.yz, vec2(.2355, .0165)) < .033) discard;`);
    };
    scopeMaterial.customProgramCacheKey = () => 'weapon-optic-channel-v1';
    model.traverse(o => {
      if (!o.isMesh) return;
      o.material.dispose();
      o.material = materials.create('Material');
      o.material.fog = true;
    });
    rifle.remove(muzzleAnchor);
    muzzleAnchor.position.set(bounds.min.x - .004, .086, .004);
    model.add(muzzleAnchor); // boca del cañón: sigue escala, retroceso y recarga
    rifle.add(mount); rifle.remove(weaponFallback);
    const obsolete = new Set();
    weaponFallback.traverse(o => { if (o.isMesh) { o.geometry.dispose(); obsolete.add(o.material); } });
    obsolete.forEach(m => m.dispose());
    weaponReady = true;
    const gripPoint=(x,y,z)=>new THREE.Vector3(x,y,z).sub(center).multiplyScalar(mount.scale.x).applyAxisAngle(new THREE.Vector3(0,1,0),mount.rotation.y);
    thirdPerson.mountWeapon(rifle,{stock:gripPoint(.95,-.07,.003),right:gripPoint(.43,-.17,-.035),left:gripPoint(-.19,-.12,.145)});
    muzzleFlash.visible=false; // the world flash is the single light at the muzzle
  } catch (err) {
    console.warn('No cargó el arma OBJ y sus materiales', err);
  }
}
loadWeapon();



// ---------- Recorded effects, with procedural feedback/fallback ----------
let AC = null;
const gameAudio=createGameAudioSystem({getMode:()=>S.mode,enemyAudio:LOAD_ENEMY_ASSETS});
gameAudio.preload();
const backgroundMusic=createBackgroundMusic({getOutput:()=>gameAudio.output('music')});
const syncBackgroundMusic=()=>backgroundMusic.update(S.mode==='playing'&&!document.hidden&&!invasionIntro?.active);
window.__ma.musicInfo=()=>backgroundMusic.info();
document.addEventListener('ma:ui-state',syncBackgroundMusic);
document.addEventListener('visibilitychange',syncBackgroundMusic);
document.addEventListener('pointerdown',()=>{if(backgroundMusic.info().blocked)void backgroundMusic.prime();},{passive:true});
window.__ma.audioInfo=()=>gameAudio.info();
// The authored environment, effects and spatial audio also run on hosted builds.
let environmentDemo=null,worldImpactAudio=null,playerMovementAudio=null,environmentReady=Promise.resolve(null);
const environmentDemoState={enabled:false,error:null},environmentForward=new THREE.Vector3(),environmentUp=new THREE.Vector3();
if(new URLSearchParams(location.search).get('ambientWorld')!=='0'){
  environmentDemoState.enabled=true;
  environmentReady=import('./environment-world-integration.js?v=spotlight82').then(m=>m.installWorldEnvironment({scene,audio:gameAudio,props:propSystem,posts:lampPostSystem,buildings:placedBuildingSystem,cars,vehicles:placedVehicleSystem.state.records,ready:propsReadyTask,invasion:invasionEnabled,
    onElectricalContact(damage){
      const now=performance.now()/1000;
      if(S.mode!=='playing'||invasionIntro?.active||now<S.invulnUntil||!Number.isFinite(damage)||damage<=0)return false;
      S.invulnUntil=now+INVULN_TIME;S.health=Math.max(0,S.health-damage);
      flashDamage();sfx.hurt();updateHUD();if(S.health<=0)die();return true;
    },
  }))
    .then(async system=>{environmentDemo=system;system.setQuality?.(graphics.policy.info().profile);
      try{const {installWorldImpactAudio}=await import('./world-impact-audio.js');
        worldImpactAudio=await installWorldImpactAudio({audio:gameAudio,cars,vehicles:placedVehicleSystem,props:propSystem,
          posts:lampPostSystem,buildings:placedBuildingSystem,casinos:casinoSystem,
          getMode:()=>document.hidden?'hidden':S.mode,getBlocked:()=>!!invasionIntro?.active,getListener:()=>playerPos});
      }catch{environmentDemoState.impactError='No se pudieron cargar los sonidos de objetos.';}
      try{const {createPlayerMovementAudio}=await import('./player-movement-audio.js?v=20261017-breath50');
        playerMovementAudio=createPlayerMovementAudio(gameAudio);await playerMovementAudio.prepare();
      }catch{environmentDemoState.playerAudioError='No se pudieron cargar los pasos y la respiración.';}
    }).catch(()=>{environmentDemoState.error='No se pudo cargar la ambientación.';});
  window.__ma.environmentInfo=()=>({...environmentDemoState,...environmentDemo?.info()});
  window.__ma.worldImpactsInfo=()=>worldImpactAudio?.info()||null;
  window.__ma.staminaInfo=()=>playerStamina.info();
  window.__ma.playerAudioInfo=()=>playerMovementAudio?.info()||null;
  document.addEventListener('visibilitychange',()=>{if(document.hidden){environmentDemo?.pause();worldImpactAudio?.stop();playerMovementAudio?.stop();}});
  window.addEventListener('pagehide',event=>{if(event.persisted){environmentDemo?.pause();worldImpactAudio?.stop();playerMovementAudio?.stop();}else{environmentDemo?.dispose();worldImpactAudio?.dispose();playerMovementAudio?.dispose();}});
}
if(invasionEnabled){
  invasionIntro=installInvasionIntro({audio:gameAudio,getEnvironment:()=>environmentDemo,getListener:()=>playerPos,unlockAudio:()=>gameAudio.unlock(audio()),onComplete(){releaseWeaponInput();resetTouchInput();setRainLevel(1);syncScoreClock();}});
  window.__ma.countdownInfo=()=>invasionIntro.info();
  cityChaos=createCityChaos({audio:gameAudio,firstQuake:new URLSearchParams(location.search).has('cityChaosDemo')?6:12,groundEnemy:e=>groundAlienFeet(e.alien,true)});
  window.__ma.cityChaosInfo=()=>cityChaos.info();
  document.addEventListener('ma:ui-state',e=>{if(e.detail!=='playing')cityChaos.stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cityChaos.stop();});
  window.addEventListener('pagehide',()=>cityChaos.stop());
}
function audio() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function beep(freq, dur, type = 'square', vol = .12, slide = 0) {
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur);
    o.connect(g).connect(gameAudio.output('effects')||ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio no disponible */ }
}
const sfx = {
  shoot() { if(S.mode==='playing'&&!gameAudio.shot())beep(160, .09, 'sawtooth', .16, -110); },
  hit() { beep(320, .05, 'square', .07, -80); },
  kill() { beep(90, .35, 'sawtooth', .14, -55); },
  hurt(options) { if(!gameAudio.playerHurt(options))beep(70, .2, 'triangle', .18, -25); },
  reload() { if(S.mode!=='playing'||gameAudio.reload(RELOAD_MS/1000))return;
    beep(220, .06, 'square', .08);setTimeout(()=>{if(S.mode==='playing'&&S.reloading)beep(180,.06,'square',.08);},700); },
  empty() { beep(900, .04, 'square', .06); },
  purchase() { beep(440, .07, 'sine', .08); setTimeout(() => beep(660, .09, 'sine', .08), 70); },
};

// ---------- Ambiente: lluvia visual ----------
// 1200 segmentos (LineSegments, 2400 vértices) en una caja de
// 44×22×44 m que sigue al jugador. Cada gota es un trazo de
// 0.35–0.55 m inclinado por viento constante; la actualización
// trabaja sobre el Float32Array de posiciones, sin asignaciones
// por frame: al tocar el suelo la gota se recicla arriba y en x/z
// se envuelve (wrap) en relación al jugador.
const RAIN_COUNT = 1200;
const RAIN_W = 44, RAIN_H = 22, RAIN_D = 44;   // caja de lluvia (m)
const RAIN_FALL = 20;                          // velocidad de caída (m/s)
const RAIN_WIND_X = 1.5, RAIN_WIND_Z = 0.5;    // viento constante (m/s)
const RAIN_SLOPE_X = RAIN_WIND_X / RAIN_FALL;  // inclinación del trazo
const RAIN_SLOPE_Z = RAIN_WIND_Z / RAIN_FALL;
const rainLen = new Float32Array(RAIN_COUNT);
const rainPos = new Float32Array(RAIN_COUNT * 6);
for (let i = 0; i < RAIN_COUNT; i++) {
  rainLen[i] = .35 + Math.random() * .2;       // trazo de 0.35–0.55 m
  const j = i * 6;
  const x = (Math.random() - .5) * RAIN_W, y = Math.random() * RAIN_H, z = (Math.random() - .5) * RAIN_D;
  rainPos[j] = x; rainPos[j + 1] = y; rainPos[j + 2] = z;
  rainPos[j + 3] = x - rainLen[i] * RAIN_SLOPE_X; rainPos[j + 4] = y + rainLen[i]; rainPos[j + 5] = z - rainLen[i] * RAIN_SLOPE_Z;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0x9db4c6, transparent: true, opacity: .33 });
const rain = new THREE.LineSegments(rainGeo, rainMat);   // fog por defecto: la lluvia lejana se funde con la niebla
rain.frustumCulled = false;
rain.visible = false;   // solo durante la partida (mismo criterio que el HUD)
scene.add(rain);

function updateRain(dt) {
  const cx = playerPos.x, cz = playerPos.z;
  const fall = RAIN_FALL * dt, wx = RAIN_WIND_X * dt, wz = RAIN_WIND_Z * dt;
  for (let i = 0; i < RAIN_COUNT; i++) {
    const j = i * 6;
    let x = rainPos[j] + wx, y = rainPos[j + 1] - fall, z = rainPos[j + 2] + wz;
    // Wrap relativo al jugador: la caja lo sigue sin crear objetos
    let rx = (x - cx) % RAIN_W; if (rx > RAIN_W / 2) rx -= RAIN_W; else if (rx < -RAIN_W / 2) rx += RAIN_W; x = cx + rx;
    let rz = (z - cz) % RAIN_D; if (rz > RAIN_D / 2) rz -= RAIN_D; else if (rz < -RAIN_D / 2) rz += RAIN_D; z = cz + rz;
    // Al tocar el suelo (y=0) se recicla arriba, en una x/z nuevas
    if (y < 0) { y += RAIN_H; x = cx + (Math.random() - .5) * RAIN_W; z = cz + (Math.random() - .5) * RAIN_D; }
    rainPos[j] = x; rainPos[j + 1] = y; rainPos[j + 2] = z;
    rainPos[j + 3] = x - rainLen[i] * RAIN_SLOPE_X; rainPos[j + 4] = y + rainLen[i]; rainPos[j + 5] = z - rainLen[i] * RAIN_SLOPE_Z;
  }
  rainGeo.attributes.position.needsUpdate = true;
}

// ---------- Ambiente: sonido de lluvia (ruido procedural) ----------
// Buffer de 2 s de ruido blanco en bucle → pasa-altos 350 Hz →
// pasa-bajos 1100 Hz → rainGain. La lluvia sigue siendo procedural;
// arranca una sola vez tras el gesto de JUGAR
// (antes de eso ni siquiera existe el AudioContext).
const RAIN_VOL = 0.055;      // volumen base sobrio
let rainGain = null, rainGate=null, rainStarted = false, rainLevelRequested=0;
function startRainSound() {
  if (rainStarted) return;   // guardia: la fuente en bucle nace una sola vez
  try {
    const ac = audio();
    if (ac.state === 'suspended') ac.resume();
    const len = 2 * ac.sampleRate;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    rainGain = ac.createGain(); rainGain.gain.value = RAIN_VOL;
    // Ráfagas: LFO lento (0.07 Hz) que suma ±0.015 al volumen base
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(rainGain.gain);
    rainGate=ac.createGain();rainGate.gain.value=0;
    src.connect(hp).connect(lp).connect(rainGain).connect(rainGate).connect(gameAudio.output('ambience')||ac.destination);
    src.start(); lfo.start();
    rainStarted = true;setRainLevel(rainLevelRequested);
  } catch (e) { /* audio no disponible */ }
}
// Nivel de lluvia según el estado: 1 jugando, 0.4 en pausa o con el
// mapa grande abierto, 0.6 en la pantalla de muerte (ambiente).
// Rampa suave con setTargetAtTime (τ = 0.4 s), sin estados nuevos.
function setRainLevel(x) {
  rainLevelRequested=x;
  if (!rainGain) return;
  try {
    rainGate.gain.setTargetAtTime(x>0?waveAtmosphere.rainAmount:0,audio().currentTime,.12);
    rainGain.gain.setTargetAtTime(RAIN_VOL * x, audio().currentTime, 0.4);
  } catch (e) { /* sin audio */ }
}

// Reuse existing lights and fog: no new light slots, shadows or render passes.
const storm=createStorm({keyLight:moon,fillLight:skyLight,fog:scene.fog});
window.__ma.stormInfo=()=>storm.info();
const citySkyline=createCitySkyline({scene,fog:scene.fog});
citySkyline.load();
window.__ma.skylineInfo=()=>citySkyline.info();
document.addEventListener('visibilitychange',()=>{if(document.hidden){storm.suspend();waveAtmosphere.suspend();}});
const waveAtmosphere=createWaveAtmosphere({scene,keyLight:moon,fillLight:skyLight,storm,audio:gameAudio,
  onWeatherChange(){rain.visible=waveAtmosphere.rainAmount>0&&['playing','paused','dead'].includes(S.mode);rainMat.opacity=.33*waveAtmosphere.rainAmount;setRainLevel(rainLevelRequested);}});
const waveAtmosphereReady=waveAtmosphere.prepare();
const flashlightDirection=new THREE.Vector3(),flashlightPosition=new THREE.Vector3();
window.__ma.waveAtmosphereInfo=()=>waveAtmosphere.info();

// ---------- Monstruos ----------
const monsters = [];
const monsterMats = [];
let enemySeq = 0;   // secuencia de creación: define el signo de rodeo al atascarse
let swarmEntrance=0;
const dodgeWarning=createDodgeWarning(document.getElementById('hud'));
const explosiveAttack=createExplosiveAttack({canSee:canSeePlayer,onContact(mon){
  const now=performance.now()/1000;
  if(S.mode!=='playing'||invasionIntro?.active||S.health<=0||now<S.invulnUntil||Math.abs(mon.g.position.y-jumpY)>1.9)return;
  S.invulnUntil=now+INVULN_TIME;S.health=Math.max(0,S.health-MONSTER_DAMAGE);
  playerDodge.cancel();
  flashDamage({source:'explosive-hit',attack:mon.attack?.clip,heading:mon.attack?.heading});sfx.hurt({strong:true});updateHUD();if(S.health<=0)die();
}});
const explosiveLab=createExplosiveLab({loader:createModelLoader(),enabled:EXPLOSIVES_ENABLED,clone:cloneSkinned,createShotIndex:createSkinnedShotIndex,sampleFootSupport:sampleAlienFootSupport,move:moveEnemy,attacks:explosiveAttack,emitWeakPoint:anchor=>environmentDemo?.emitWeakPoint(anchor)||0,getViewPosition:()=>camera.position,getShotOrigin:()=>tacticalView.elevated?getMuzzleWorld(new THREE.Vector3()):camera.position,targetEffectsEnabled:()=>!!environmentDemo?.info().sparks?.enabled,onTargetCount:count=>environmentDemo?.setWeakTargetCount(count)});
const explosiveLabReady=explosiveLab.load();
window.__ma.explosiveLabInfo=()=>explosiveLab.info();
window.__ma.explosiveAttackInfo=()=>monsters.filter(m=>m.explosiveLab).map(m=>explosiveAttack.info(m));
function spawnExplosiveLab(wave){
  // Choose connected, obstacle-free ground in front of the initial player view.
  const point=EXPLOSIVE_LAB?groundNavigation.spawn({x:playerPos.x-Math.sin(yaw)*8,z:playerPos.z-Math.cos(yaw)*8}):pickSpawnPoint();
  const mon=explosiveLab.create(point,enemySeq++,{wave});if(!mon)return null;
  scene.add(mon.g);mon.g.lookAt(playerPos.x,0,playerPos.z);explosiveLab.beginArrival(mon);monsters.push(mon);return mon;
}
const alien1Lab=createAlien1Lab();
window.__ma.alien1LabInfo=()=>({enabled:ALIEN1_LAB,behavior:'original',error:alienLabError,entities:monsters.filter(m=>m.alien1Lab).map(m=>({state:m.state,clip:m.alien.current,walk:m.chaseClip,speed:m.speed,alerted:!!m.alertEpisode}))});
function spawnAlien1Lab(){
 if(!alienTemplate?.clips.walk)return null;
 const point=groundNavigation.spawn({x:playerPos.x-Math.sin(yaw)*8,z:playerPos.z-Math.cos(yaw)*8});
 if(!point)return null;const mon=createMonster(false,{forceWalker:true,point});
 return mon?.alien?alien1Lab.bind(mon):null;
}
const groundSwarm=createGroundSwarm({scene,move:moveEnemy,canSee:canSeePlayer,
 onAttack(mon,damage){
  const now=performance.now()/1000;
  if(S.mode!=='playing'||invasionIntro?.active||now<S.invulnUntil)return;
  S.invulnUntil=now+INVULN_TIME;S.health-=damage;
  flashDamage({source:'spider'});sfx.hurt();updateHUD();if(S.health<=0)die();
 }});
const groundSwarmReady=groundSwarm.load();
window.__ma.swarmInfo=()=>groundSwarm.info();
function spawnGroundSwarm(){
 const p=pickSpawnPoint();if(!p)return null;swarmEntrance++;
 const mon=groundSwarm.create(p,enemySeq++);if(mon)monsters.push(mon);return mon;
}

function createMonster(crawlOnly=false,{forceWalker=false,point=null}={}) {
  const sp=point||pickSpawnPoint();if(!sp)return null;
  const g = new THREE.Group();
  // Variante (Etapa B): 20% bruto, 20% veloz, 60% normal
  const roll = Math.random();
  const variant = forceWalker?'normal':roll < 0.20 ? 'bruto' : (roll < 0.40 ? 'veloz' : 'normal');
  // Visual: alien GLB si ya cargó; si no, el procedural de siempre.
  const alienVis = buildAlienVisual();
  let parts, mats;
  if (alienVis) {
    g.add(alienVis.visual);
    parts = dummyParts(); mats = alienVis.mats;
  } else {
  const skin = new THREE.MeshStandardMaterial({ color: variant === 'bruto' ? 0x46543a : 0x5d7345, roughness: .85 });
  const darkSkin = new THREE.MeshStandardMaterial({ color: variant === 'bruto' ? 0x35412a : 0x445433, roughness: .9 });
  monsterMats.push(skin);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.78, 1.05, .44), skin); torso.position.y = 1.15; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), skin); head.position.y = 1.95; head.userData.enemyHead=true; g.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .42), darkSkin); jaw.position.set(0, 1.68, .03); g.add(jaw);
  const eyeGeo = new THREE.SphereGeometry(.055, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ emissive: 0xff2211, emissiveIntensity: 4, color: 0x220000 });
  [-.13, .13].forEach(x => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(x, 2.0, .26); g.add(e); });
  const hornGeo = new THREE.ConeGeometry(.07, .3, 6);
  [-.18, .18].forEach(x => { const h = new THREE.Mesh(hornGeo, darkSkin); h.position.set(x, 2.3, 0); h.rotation.z = x > 0 ? -.3 : .3; g.add(h); });
  const armGeo = new THREE.BoxGeometry(.2, .95, .2);
  const armL = new THREE.Mesh(armGeo, skin); armL.position.set(-.52, 1.25, .3); armL.rotation.x = -1.25; g.add(armL);
  const armR = new THREE.Mesh(armGeo, skin); armR.position.set(.52, 1.25, .3); armR.rotation.x = -1.25; g.add(armR);
  const legGeo = new THREE.BoxGeometry(.24, .68, .24);
  const legL = new THREE.Mesh(legGeo, darkSkin); legL.position.set(-.2, .34, 0); g.add(legL);
  const legR = new THREE.Mesh(legGeo, darkSkin); legR.position.set(.2, .34, 0); g.add(legR);
  g.traverse(m => { if (m.isMesh) {m.userData.isMonsterPart = true;m.castShadow=true;m.receiveShadow=true;} });
  parts = { armL, armR, legL, legR }; mats = [skin, darkSkin];
  }

  // Local connected ground, chosen before allocating an enemy visual.
  g.position.set(sp.x, 0, sp.z);
  scene.add(g);
  // Conserva resistencia y escala por variante; el paso cinematográfico se asigna aparte.
  let hp = MONSTER_HP;
  if (variant === 'bruto') { hp = 150; g.scale.setScalar(1.18); }
  else if (variant === 'veloz') hp = 70;
  if (alienVis) g.scale.multiplyScalar(ALIEN_SIZE_MULTIPLIER);
  const locomotion=enemyLocomotion(forceWalker?2:enemySeq,{variant,walkAvailable:!crawlOnly&&!!alienVis?.actions.walk,...(forceWalker?{jitter:.5}:{})});
  hp=Math.ceil(hp*locomotion.healthMultiplier);
  const speed=locomotion.speed;
  // Variación individual (Etapa B, ajustes): nada se mueve sincronizado —
  // reacción al aggro 0.25–0.45 s, ciclo de ataque ×0.9–1.1, duración
  // HURT ×0.85–1.2, ritmo de animación ±10% y percepción desfasada.
  const mon = { g, type: 'monster', variant, hp, speed, state: 'idle', stateT: 0, struck: false, steerT: 0, steerSign: (enemySeq++ % 2 === 0) ? 1 : -1, stuckT: 0, stuckX: g.position.x, stuckZ: g.position.z, flash: 0, walkPhase: Math.random() * 6, animRate: 0.9 + Math.random() * .2, swing: .6, armBase: -1.25, armSwing: .12, bobAmp: .05, partColor: 0x9db86a, parts, mats, alien: alienVis, chaseClip: locomotion.clip, hurtDurNow: ALIEN_HIT_DUR, hurtRestart: false, lastKnown: null, lastSeenAgo: 999, seesPlayer: false, percepT: Math.random() * PERCEPTION_INTERVAL, reactT: 0.25 + Math.random() * .2, reactLeft: 0, attackCdMul: 0.9 + Math.random() * .2, hurtMul: 0.85 + Math.random() * .35, patrolX: (Math.random() - .5) * 16, patrolZ: g.position.z > 0 ? -30 : 30, searchArrived: false, scanT: 0, scanYaw: 0 };
  g.userData.monster = mon;
  primeAlienSpawn(mon);
  setPatrolTarget(mon,mon.patrolX,mon.patrolZ);
  monsters.push(mon);
  return mon;
}
function createZombie(crawlOnly=false) {
  const sp=pickSpawnPoint();if(!sp)return null;
  const g = new THREE.Group();
  // Visual: alien GLB si ya cargó; si no, el procedural de siempre.
  const alienVis = buildAlienVisual();
  let parts, mats;
  if (alienVis) {
    g.add(alienVis.visual);
    parts = dummyParts(); mats = alienVis.mats;
  } else {
  const bodyG = new THREE.Group();       // cuerpo inclinado hacia adelante al correr
  bodyG.rotation.x = 0.3;
  g.add(bodyG);
  const skin = new THREE.MeshStandardMaterial({ color: 0x9aa584, roughness: .95 });      // piel gris verdosa pálida
  const skinDark = new THREE.MeshStandardMaterial({ color: 0x7c8468, roughness: .95 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2e3436, roughness: .95 });      // camisa oscura
  const shirtPatch = new THREE.MeshStandardMaterial({ color: 0x503a28, roughness: 1 });   // parche marrón: la camisa está rota
  const pants = new THREE.MeshStandardMaterial({ color: 0x3a3f3d, roughness: 1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x23211c, roughness: 1 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.72, 1.0, .4), shirt); torso.position.y = 1.12; bodyG.add(torso);
  const patch = new THREE.Mesh(new THREE.BoxGeometry(.3, .34, .03), shirtPatch); patch.position.set(.14, 1.24, .21); bodyG.add(patch);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.46, .48, .46), skin); head.position.y = 1.88; head.userData.enemyHead=true; bodyG.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(.36, .13, .38), skinDark); jaw.position.set(0, 1.6, .03); bodyG.add(jaw);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(.48, .1, .48), hairMat); hair.position.y = 2.14; bodyG.add(hair);
  const eyeGeo = new THREE.SphereGeometry(.05, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ emissive: 0xff2211, emissiveIntensity: 4, color: 0x220000 });
  [-.12, .12].forEach(x => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(x, 1.93, .24); bodyG.add(e); });
  const armGeo = new THREE.BoxGeometry(.17, .9, .17);
  const armL = new THREE.Mesh(armGeo, skin); armL.position.set(-.46, 1.3, .42); armL.rotation.x = -1.55; bodyG.add(armL);
  const armR = new THREE.Mesh(armGeo, skin); armR.position.set(.46, 1.3, .42); armR.rotation.x = -1.55; bodyG.add(armR);
  const legGeo = new THREE.BoxGeometry(.21, .64, .21);
  const legL = new THREE.Mesh(legGeo, pants); legL.position.set(-.18, .32, 0); bodyG.add(legL);
  const legR = new THREE.Mesh(legGeo, pants); legR.position.set(.18, .32, 0); bodyG.add(legR);
  g.traverse(m => { if (m.isMesh) {m.userData.isMonsterPart = true;m.castShadow=true;m.receiveShadow=true;} });
  parts = { armL, armR, legL, legR }; mats = [skin, skinDark, shirt, pants, hairMat];
  }

  // Reuse the same safe local encounter positions.
  g.position.set(sp.x, 0, sp.z);
  scene.add(g);
  // Variante (Etapa B): 25% frenético — más rápido (×1.2) y frágil
  // (51 HP, sigue cayendo con 2 impactos); 75% normal. La velocidad
  // base lleva además variación individual de ±8%, y la reacción al
  // aggro es más corta que la del monstruo (0.10–0.25 s).
  const frenetic = Math.random() < 0.25;
  if (alienVis) g.scale.multiplyScalar(ALIEN_SIZE_MULTIPLIER);
  const locomotion=enemyLocomotion(enemySeq,{frenetic,walkAvailable:!crawlOnly&&!!alienVis?.actions.walk});
  const mon = { g, type: 'zombie', variant: frenetic ? 'frenetico' : 'normal', hp: Math.ceil((frenetic ? 51 : ZOMBIE_HP)*locomotion.healthMultiplier), speed: locomotion.speed, state: 'idle', stateT: 0, struck: false, steerT: 0, steerSign: (enemySeq++ % 2 === 0) ? 1 : -1, stuckT: 0, stuckX: g.position.x, stuckZ: g.position.z, flash: 0, walkPhase: Math.random() * 6, animRate: 2.1 * (0.9 + Math.random() * .2), swing: .95, armBase: -1.55, armSwing: .3, bobAmp: .1, partColor: 0xb9bfa4, parts, mats, alien: alienVis, chaseClip: locomotion.clip, hurtDurNow: ALIEN_HIT_DUR, hurtRestart: false, lastKnown: null, lastSeenAgo: 999, seesPlayer: false, percepT: Math.random() * PERCEPTION_INTERVAL, reactT: 0.10 + Math.random() * .15, reactLeft: 0, attackCdMul: 0.9 + Math.random() * .2, hurtMul: 0.85 + Math.random() * .35, patrolX: (Math.random() - .5) * 16, patrolZ: g.position.z > 0 ? -30 : 30, searchArrived: false, scanT: 0, scanYaw: 0 };
  g.userData.monster = mon;
  primeAlienSpawn(mon);
  setPatrolTarget(mon,mon.patrolX,mon.patrolZ);
  monsters.push(mon);
  return mon;
}
// Nearby connected streets follow the player's current position on every spawn.
function pickSpawnPoint(min=10,max=16) {
  return groundNavigation.spawnNear(playerPos,{min,max,occupied:[
    ...monsters.filter(m=>m.state!=='dead').map(m=>m.g.position),
    ...floatingSystem.state.entities.filter(e=>e.state!=='DEATH').map(e=>e.g.position)]});
}
// Level 1 keeps the original upright Alien 1 walking behavior.
function spawnEnemy(wave=1,allowWalk=true) {
  return createMonster(false,{forceWalker:true});
}
function damageMonster(mon, dmg, hitPoint, headshot=false, hit=null) {
  if (mon.state === 'dead' || dmg <= 0) return;   // un cadáver no recibe más daño ni da bajas
  if(mon.explosiveLab){
    const result=explosiveLab.hit(mon,dmg,hitPoint,hit);mon.flash=.35;
    if(result.accepted){
      spawnHitParticles(hitPoint,mon.partColor);showHitmarker(false);
      awardCombatPoints(mon,hitPoint,false,result.dead);
      if(result.dead){sfx.kill();S.kills++;registerScoreKill(mon,false);recordSession();updateHUD();}
      else sfx.hit();
    }else {if(result.bodyHit)showHitmarker(false);sfx.hit();}
    return;
  }
  if(mon.leap)crawlerLeap.cancel(mon);
  mon.hp -= dmg;
  mon.flash = 1;
  // Escuchó el disparo: recuerda dónde está el jugador en este
  // instante (sin seguimiento permanente: si lo pierde de vista,
  // perseguirá este punto, no al jugador).
  if (!mon.lastKnown) mon.lastKnown = { x: 0, z: 0 };
  mon.lastKnown.x = playerPos.x; mon.lastKnown.z = playerPos.z;
  mon.lastSeenAgo = 0; mon.seesPlayer = true;
  spawnHitParticles(hitPoint, mon.partColor);
  showHitmarker(headshot);
  awardCombatPoints(mon,hitPoint,headshot,mon.hp<=0);
  if (mon.hp <= 0) {
    sfx.kill();
    S.kills++; recordSession(); updateHUD();
    // Pasa a DEAD: la caída y la retirada las gobierna el bucle
    // principal con stateT (sin setTimeout: respeta pausa y reinicio).
    mon.state = 'dead'; mon.stateT = 0;
    registerScoreKill(mon,headshot);
  } else {
    sfx.hit();
    // React to the hit while continuing pursuit; receiving damage also wakes aggro.
    mon.state = 'hurt'; mon.stateT = 0;
    if (mon.alien) {
      // Hit presentation rides the current gait; it never pushes the root backwards.
      mon.hurtClip=nextHitClip(mon,!!mon.alien.actions.hitMirror);
      mon.hurtDurNow = ALIEN_HIT_DUR * mon.hurtMul;
      mon.hurtRestart = true;
    }
  }
}

// ---------- Percepción y transiciones de estado (Etapa B, ajustes) ----------
// Visión de un enemigo: distancia ≤ ENEMY_AGGRO_RANGE y línea de
// visión libre contra los mismos bloqueadores que paran los disparos.
// Raycast dedicado con vectores reutilizables; se evalúa ~cada
// PERCEPTION_INTERVAL segundos por enemigo (no por frame).
const visionRay = new THREE.Raycaster();
const _visFrom = new THREE.Vector3();
const _visDir = new THREE.Vector3();
function canSeePlayer(mon, dist) {
  if (dist > ENEMY_AGGRO_RANGE) return false;
  const p = mon.g.position;
  _visFrom.set(p.x, p.y+(mon.swarm ? mon.senseHeight : 1.8 * mon.g.scale.y), p.z);          // altura de su cabeza
  _visDir.set(playerPos.x - p.x, 1.4 - _visFrom.y, playerPos.z - p.z);
  const len = _visDir.length();
  if (len < 1e-4) return true;
  visionRay.set(_visFrom, _visDir.divideScalar(len));
  visionRay.far = len;
  const hits = visionRay.intersectObjects(shootBlockers,false);
  return hits.length === 0 || hits[0].distance >= len - 0.05;
}
// Entrar en CHASE: con reacción (react = true) el enemigo se orienta
// durante reactT antes de avanzar; sin reacción ya estaba en combate.
function toChase(mon, react) {
  mon.state = 'chase'; mon.stateT = 0;enemyAlert.resume(mon);
  mon.reactLeft = react ? mon.reactT : 0;
  mon.stuckT = 0; mon.stuckX = mon.g.position.x; mon.stuckZ = mon.g.position.z;
  groundNavigation.resetRoute(mon);
}
// Volver a IDLE: olvida al jugador y elige un waypoint de patrulla en
// el extremo opuesto de la calle (x aleatorio ±8).
function pickPatrol(mon) {
  setPatrolTarget(mon,(Math.random()-.5)*16,mon.g.position.z>0?-30:30);
}
function setPatrolTarget(mon,x,z){
  const point=groundNavigation.spawn({x,z});mon.patrolX=point.x;mon.patrolZ=point.z;
  groundNavigation.resetRoute(mon);
}
function toIdle(mon) {
  enemyAlert.reset(mon);
  mon.state = 'idle'; mon.stateT = 0;
  mon.lastKnown = null; mon.lastSeenAgo = 999; mon.seesPlayer = false;
  pickPatrol(mon);
}
// Entrar en SEARCH: irá a la última posición conocida y la escaneará.
function toSearch(mon) {
  mon.alertPursuit=false;
  mon.state = 'search'; mon.stateT = 0;
  mon.searchArrived = false; mon.scanT = 0;
  mon.stuckT = 0; mon.stuckX = mon.g.position.x; mon.stuckZ = mon.g.position.z;
  groundNavigation.resetRoute(mon);
}
// Animación de caminar/correr compartida por IDLE, CHASE y SEARCH.
function walkAnim(mon) {
  if (mon.alien) return;   // el GLB se anima con su mixer; nada de bob procedural (movería g.position.y)
  mon.parts.legL.rotation.x = Math.sin(mon.walkPhase) * mon.swing;
  mon.parts.legR.rotation.x = -Math.sin(mon.walkPhase) * mon.swing;
  mon.parts.armL.rotation.x = mon.armBase + Math.sin(mon.walkPhase) * mon.armSwing;
  mon.parts.armR.rotation.x = mon.armBase - Math.sin(mon.walkPhase) * mon.armSwing;
  mon.g.position.y = Math.abs(Math.sin(mon.walkPhase)) * mon.bobAmp;
}

// Patrol routes and recovery share the precomputed ground graph. Direct combat
// pursuit stays unchanged until blocked; body collisions always remain active.
function moveEnemy(mon, dt, speed, tx, tz) {
  const p = mon.g.position;
  const route=groundNavigation.waypoint(mon,dt,tx,tz);
  const dx = (route?route.x:tx) - p.x, dz = (route?route.z:tz) - p.z;
  mon.routeSteering=route;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-4) return;
  let mx = dx / dist, mz = dz / dist;
  if (mon.steerT > 0) {
    mon.steerT -= dt;
    if(!route){
      const px = -mz * mon.steerSign, pz = mx * mon.steerSign;
      mx += px * 0.9; mz += pz * 0.9;
      const l = Math.hypot(mx, mz); mx /= l; mz /= l;
    }
  }
  const direction=steerCrowd(mon,monsters,dt,mx,mz);
  mx=direction.x;mz=direction.z;
  const facing=mon.crowdFacing||(mon.crowdFacing={x:0,z:0});
  facing.x=p.x+mx;facing.z=p.z+mz;
  const fromX = p.x, fromZ = p.z;
  const step=route?Math.min(speed*dt,dist):speed*dt;
  p.x += mx * step;
  p.z += mz * step;
  resolveEnemyCollisions(mon);
  if (mon.alien) mon.alien.actualSpeed = Math.hypot(p.x - fromX, p.z - fromZ) / dt;
  if (mon.state === 'idle' || mon.state === 'chase' || mon.state === 'search' || (mon.explosiveLab && mon.state === 'guard')) {
    mon.stuckT += dt;
    if (mon.stuckT >= STUCK_CHECK_TIME) {
      const moved = Math.hypot(p.x - mon.stuckX, p.z - mon.stuckZ);
      if (moved < speed * STUCK_CHECK_TIME * STUCK_MIN_RATIO && mon.steerT <= 0) {
        mon.steerT = STUCK_STEER_TIME;groundNavigation.resetRoute(mon,true);
      }
      mon.stuckT = 0; mon.stuckX = p.x; mon.stuckZ = p.z;
    }
  }
}

// ---------- Sangre animada e impactos ----------
const combatVFX = createCombatVFX(scene,{bloodEnabled:LOAD_ENEMY_ASSETS,muzzleOnly:true,fineTracers:true});
const enemyPoints=createEnemyPoints(scene,camera);
window.__ma.enemyPointsInfo=()=>enemyPoints.info();
window.__ma.vfxInfo = () => combatVFX.info();
function spawnHitParticles(point) { combatVFX.blood(point); }

// ---------- Jugador ----------
const playerPos = new THREE.Vector3(0, 1.7, 46);
let yaw = 0, pitch = 0; // mirando hacia la ciudad y la Strat; el minimapa sigue la cámara real
const vel = { x: 0, z: 0 };              // velocidad horizontal actual (con inercia)
let vy = 0, jumpY = 0, grounded = true;  // salto: velocidad vertical, altura y apoyo en el suelo
let bobPhase = 0;                        // fase del balanceo: avanza según la velocidad real
// Additive Floating Alien: its own list/FSM/spawner; existing enemies keep their paths.
const floatingGroundRay = new THREE.Raycaster();
const floatingDown = new THREE.Vector3(0,-1,0);
const floatingSystem = createFloatingAlienSystem({ scene, resolvePosition:resolveCollisions,
  shootBlockers, spawnPoints:SPAWN_POINTS,pickNearbySpawn:()=>pickSpawnPoint(12,18),
  getGround(x,z) {
    floatingGroundRay.set(new THREE.Vector3(x,1,z),floatingDown); floatingGroundRay.far=2;
    const surfaces=scene.children.filter(o=>o.isMesh&&(o.geometry.type==='PlaneGeometry'||
      (o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height*o.scale.y<=.30)));
    return floatingGroundRay.intersectObjects(surfaces,false)[0]?.point.y??0;
  },
  getLandingGround(x,z) {
    floatingGroundRay.set(new THREE.Vector3(x,1,z),floatingDown);floatingGroundRay.far=2;
    const proxies=scene.children.filter(o=>o.isMesh&&(o.geometry.type==='PlaneGeometry'||
      (o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height*o.scale.y<=.30)));
    return floatingGroundRay.intersectObjects([...roadSystem.state.batches,...proxies],false)[0]?.point.y??0;
  },
  onAttack(enemy,damage) {
    const now=performance.now()/1000;
    if(S.mode!=='playing'||invasionIntro?.active||now<S.invulnUntil)return;
    S.invulnUntil=now+INVULN_TIME; S.health-=damage;
    flashDamage({source:'floating-dive'}); sfx.hurt({strong:true}); updateHUD(); if(S.health<=0)die();
  },
  onHit(enemy,point,dead,headshot=false) {
    spawnHitParticles(point,0x9b7562); showHitmarker(headshot);
    awardCombatPoints(enemy,point,headshot,dead);
    if(dead) { registerScoreKill(enemy,headshot);sfx.kill(); S.kills++; recordSession(); updateHUD(); }
    else sfx.hit();
  },
});
if(LOAD_ENEMY_ASSETS)floatingSystem.load();
window.__ma.floatingReady=()=>!LOAD_ENEMY_ASSETS||floatingSystem.state.ready;
window.__ma.floatingInfo=()=>floatingSystem.info();
function tryJump() {
  if (S.mode === 'playing' && !invasionIntro?.active && !playerDodge.info().active && !thirdPerson.recovering && !playerImpact.stunned && grounded) { grounded = false; vy = JUMP_VEL; }
}
function dodgeThreats(){
  const threats=[];
  for(const mon of monsters){
    if(mon.spawning||mon.state==='dead'||!mon.g.visible)continue;
    if(mon.explosiveLab){
      const a=mon.attack;
      if(a&&!a.struck)threats.push({type:'explosive',animation:a.clip,position:mon.g.position,eta:Math.max(0,a.contact-a.elapsed),responseHeading:a.heading});
      continue;
    }
    if(mon.state==='leap'&&mon.leap&&!mon.leap.struck){
      threats.push({type:'crawler',animation:'attack2',position:mon.g.position,trajectoryOrigin:{x:mon.leap.fromX,z:mon.leap.fromZ},eta:Math.max(0,CRAWLER_LEAP.windup+CRAWLER_LEAP.flight*.65-mon.leap.time)});
    }else if(mon.state==='attack'&&!mon.struck){
      const contact=mon.swarm?(mon.jumpAttack?SWARM.contact/SWARM.cycle*SWARM.jumpCycle:SWARM.contact):ATTACK_WINDUP;
      threats.push({type:mon.swarm?'spider':mon.chaseClip==='crawl'?'crawler':'walker',animation:mon.swarm?(mon.jumpAttack?'attack':'crawl'):'attack',position:mon.g.position,eta:Math.max(0,contact-mon.stateT)});
    }
  }
  for(const enemy of floatingSystem.state.entities){
    const d=enemy.dive;if(enemy.spawning||!enemy.g.visible||enemy.state==='DEATH'||!d||d.struck||d.cancelled||!['windup','out'].includes(d.phase))continue;
    threats.push({type:'flying',animation:'dive',position:enemy.g.position,trajectoryOrigin:d.origin,eta:Math.max(0,(d.phase==='windup'?FLOATING_ALIEN_SETTINGS.windup-d.time: -d.time)+FLOATING_DIVE.out*.75)});
  }
  return threats;
}
let lastDodgeResponse=null;
function dodgeClearance(kind,heading){
  const trial=playerPos.clone(),sign=kind==='Left'?-1:1,dx=Math.cos(heading)*sign*DODGE.distance,dz=-Math.sin(heading)*sign*DODGE.distance;
  for(let i=0;i<10;i++)movePlayerWithEnemyContacts(trial,dx/10,dz/10,PLAYER_RADIUS,monsters,resolveCollisions);
  return ((trial.x-playerPos.x)*dx+(trial.z-playerPos.z)*dz)/(DODGE.distance*DODGE.distance);
}
function tryDodge(kind){
  const allowed=S.mode==='playing'&&!invasionIntro?.active&&!document.hidden&&!mapOpen&&grounded&&!S.reloading
    &&!thirdPerson.recovering&&!playerImpact.stunned&&!quakeAim.info().active&&playerStamina.info().level>=DODGE.cost&&!playerStamina.info().exhausted;
  if(!allowed)return false;
  let heading=tacticalView.movementYaw(yaw);
  const response=kind==null?chooseDodgeResponse({position:playerPos,yaw:heading,threats:dodgeThreats(),previous:playerDodge.info().kind||'Right',clearance:(side,facing=heading)=>dodgeClearance(side,facing)}):{side:kind,reason:'explicit'};
  if(Number.isFinite(response.heading))heading=response.heading;
  kind=response.side;
  const seconds=thirdPerson.dodgeDuration(kind);
  if(!seconds||!playerDodge.start(kind,{seconds,yaw:heading,allowed}))return false;
  lastDodgeResponse=response;
  playerStamina.consume(DODGE.cost);aimBlend=0;setScopeView(false);updateStaminaHUD();return true;
}
window.__ma.dodgeInfo=()=>({...playerDodge.info(),response:lastDodgeResponse});
function resetPlayer() {
  cityChaos?.reset();
  invasionIntro?.cancel();
  scoreSystem.start(performance.now());scoreEnemyIds=new WeakMap();scoreEnemySequence=0;
  setScopeView(false);
  thirdPerson.reset();
  storm.reset();
  combatVFX.reset();
  worldImpactAudio?.reset();
  playerMovementAudio?.reset();
  playerStamina.reset();
  playerDodge.reset();
  lastDodgeResponse=null;
  damageOverlay.reset();
  playerImpact.reset();
  aimSway.reset();
  quakeAim.reset();
  rifleFeedback.reset();recoil=0;cameraFeedbackSnapshot=null;
  weakPointAssist.reset();
  tacticalAim.reset();
  tacticalPointer.reset();
  healthRegeneration.reset();
  waveSystem.reset();waveWalkers.number=0;waveWalkers.spawned=0;swarmEntrance=0;
  resetTouchInput();
  playerPos.set(0, 1.7, 46); yaw = 0; pitch = 0;
  vel.x = 0; vel.z = 0; visualVelocity.x=visualVelocity.z=0; vy = 0; jumpY = 0; grounded = true; bobPhase = 0;
  S.aimHeld = false; aimBlend = 0;
  S.infiniteAmmo = LOCAL_ENEMY_LAB;
  S.health = 100; S.mag = MAG_SIZE; S.reloading = false; S.kills = 0; S.elapsed = 0; S.spawnTimer = 1; S.invulnUntil = 0;
  S.reserve = STARTING_RESERVE; S.credits = 0; S.reloadEnd = 0; S.reloadPausedAt = null;
  enemyPoints.reset();
  el('reload-msg').classList.add('hidden'); ammoPurchaseUntil = 0;
}

// ---------- Disparo ----------
const raycaster = new THREE.Raycaster();
const dirVec = new THREE.Vector3();
let shotToken=0;
const shotSphere=new THREE.Sphere(),shotEntry=new THREE.Vector3(),fallbackShotTokens=new WeakMap();
function traceShot(raycaster,updateBounds=true) {
  if(updateBounds)shotToken++;
  // ¿Monstruo más cercano en la línea de tiro?
  let bestMon = null, bestDist = Infinity, bestPoint = null, bestHit = null;
  for (const mon of monsters) {
    if (mon.state === 'dead'||mon.spawning) continue;
    if (mon.alien||mon.swarm||mon.explosiveVisual) {
      const visual=mon.alien||mon.swarm||mon.explosiveVisual;
      const scale=Math.max(mon.g.scale.x,mon.g.scale.y,mon.g.scale.z);
      shotSphere.center.copy(mon.g.position);shotSphere.center.y+=mon.swarm ? mon.shotHeight : scale;shotSphere.radius=mon.swarm ? mon.shotRadius : 5*scale;
      if(!raycaster.ray.intersectSphere(shotSphere,shotEntry)||!shotSphere.containsPoint(raycaster.ray.origin)&&shotEntry.distanceTo(raycaster.ray.origin)>Math.min(raycaster.far,bestDist))continue;
      mon.g.updateMatrixWorld(true);
      const hits=[];
      for(let i=0;i<visual.meshes.length;i++){
        const mesh=visual.meshes[i],index=visual.shotIndexes[i];
        if(index){const hit=index.cast(raycaster,shotToken);if(hit)hits.push(hit);}
        else{
          if(mesh.isSkinnedMesh&&fallbackShotTokens.get(mesh)!==shotToken){mesh.skeleton.update();mesh.computeBoundingBox();if(!mesh.boundingSphere)mesh.boundingSphere=new THREE.Sphere();mesh.boundingBox.getBoundingSphere(mesh.boundingSphere);fallbackShotTokens.set(mesh,shotToken);}
          hits.push(...raycaster.intersectObject(mesh));
        }
      }
      hits.sort((a,b)=>a.distance-b.distance);
      if (hits.length && hits[0].distance < bestDist) {
        bestMon = mon; bestDist = hits[0].distance; bestPoint = hits[0].point; bestHit=hits[0];
      }
      continue;
    }
    const hits=raycaster.intersectObject(mon.g,true);
    if(hits.length&&hits[0].distance<bestDist){bestMon=mon;bestDist=hits[0].distance;bestPoint=hits[0].point;bestHit=hits[0];}
  }
  let bestFloating = null;
  const floatingHit = floatingSystem.raycast(raycaster);
  if(floatingHit && floatingHit.distance < bestDist) {
    bestFloating=floatingHit.enemy; bestMon=bestFloating;
    bestDist=floatingHit.distance; bestPoint=floatingHit.point; bestHit=floatingHit;
  }
  // ¿Un obstáculo bloquea antes?
  const wallHits = raycaster.intersectObjects(shootBlockers,false);
  const wallDist = wallHits.length ? wallHits[0].distance : Infinity;
  return {bestMon,bestDist,bestPoint,bestHit,bestFloating,wallHits,wallDist};
}
function updateTacticalAim(dt){
  if(!tacticalView.elevated){tacticalAim.reset();tacticalPointer.reset();return;}
  if(S.mode!=='playing'||document.hidden||invasionIntro?.active||mapOpen)return tacticalAim.update(dt);
  getMuzzleWorld(tacticalAimOrigin);
  const pointer=tacticalPointer.update(camera,tacticalPointerAnchor());if(pointer)yaw=pointer.yaw;
  const heading=tacticalShotYaw(),pointerDistance=pointer?tacticalPointerWorld.distanceTo(tacticalAimOrigin):null;
  const basePitch=pointer?Math.atan2(tacticalPointerWorld.y-tacticalAimOrigin.y,Math.hypot(tacticalPointerWorld.x-tacticalAimOrigin.x,tacticalPointerWorld.z-tacticalAimOrigin.z)):0;
  const enabled=!S.reloading&&!playerDodge.info().active&&!thirdPerson.recovering&&!quakeAim.info().active&&playerImpact.info().remaining<=0;
  if(!enabled)return tacticalAim.update(dt,{preferredDistance:pointerDistance});
  const targets=[];
  for(const enemy of [...monsters,...floatingSystem.state.entities]){
    if(['dead','DEATH'].includes(enemy.state)||enemy.spawning||!enemy.g.visible)continue;
    const p=enemy.g.position,dx=p.x-tacticalAimOrigin.x,dz=p.z-tacticalAimOrigin.z;
    if(Math.hypot(dx,dz)>TACTICAL_AIM.range+2)continue;
    const error=Math.atan2(-dx,-dz)-heading;
    if(Math.abs(Math.atan2(Math.sin(error),Math.cos(error)))>.3)continue;
    enemy.g.updateMatrixWorld(true);
    if(enemy.explosiveLab)for(const t of enemy.orbGlow.aimTargets({includeProtected:true}))targets.push({...t,enemy,sac:true,weak:t.exposed});
    // Follow the animated chest, including crawl poses and flying enemies.
    // No upright fixed-height capsule is used for a creature on the ground.
    let bone=tacticalAimBones.get(enemy);
    if(bone===undefined){
      const bones=[];enemy.g.traverse(o=>{if(o.isBone)bones.push(o);});
      bone=['Spine2','Spine1','Spine','Hips'].map(name=>bones.find(b=>b.name.replace(/^mixamorig[:_]?/,'')===name)).find(Boolean)||null;
      tacticalAimBones.set(enemy,bone);
    }
    const center=new THREE.Vector3();
    if(bone)bone.getWorldPosition(center);
    else{
      tacticalBodyBox.makeEmpty();
      const meshes=(enemy.alien||enemy.swarm||enemy.explosiveVisual)?.meshes||enemy.meshes;
      const add=mesh=>{
        if(!mesh.isMesh)return;
        if(mesh.isSkinnedMesh){mesh.skeleton.update();mesh.computeBoundingBox();tacticalMeshBox.copy(mesh.boundingBox);}
        else{if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();tacticalMeshBox.copy(mesh.geometry.boundingBox);}
        tacticalBodyBox.union(tacticalMeshBox.applyMatrix4(mesh.matrixWorld));
      };
      if(meshes)meshes.forEach(add);else enemy.g.traverse(add);
      if(tacticalBodyBox.isEmpty())continue;tacticalBodyBox.getCenter(center);
    }
    targets.push({center,enemy,weak:false});
  }
  return tacticalAim.update(dt,{enabled,origin:tacticalAimOrigin,yaw:heading,preferredDistance:pointerDistance,basePitch,targets,visible(t){
    // Both the overhead view and the physical rifle must see this exact enemy.
    // Sac guidance additionally requires the actual living sac surface.
    for(const origin of [camera.position,tacticalAimOrigin]){
      tacticalAimRay.set(origin,t.center.clone().sub(origin).normalize());tacticalAimRay.far=origin.distanceTo(t.center)+.15;
      const hit=traceShot(tacticalAimRay,origin===camera.position);
      if(hit.bestMon!==t.enemy||hit.bestDist>=hit.wallDist)return false;
      if(t.sac&&t.enemy.orbGlow.indexForHit(hit.bestHit)!==t.index)return false;
    }
    return true;
  }});
}
function applyWeakPointAimAssist(dt){
  const enabled=S.mode==='playing'&&!document.hidden&&!invasionIntro?.active&&!mapOpen&&!S.reloading&&!playerDodge.info().active&&!thirdPerson.recovering
    &&(S.aimHeld||S.mouseDown||S.touchFire)&&!quakeAim.info().active&&playerImpact.info().remaining<=0;
  if(!enabled)return weakPointAssist.update(dt);
  rifleAimDirection(assistDirection);
  assistOrigin.copy(tacticalView.elevated?getMuzzleWorld(assistMuzzle):camera.position);
  const targets=[];
  for(const enemy of monsters){
    if(!enemy.explosiveLab||enemy.state==='dead'||enemy.spawning||!enemy.g.visible)continue;
    for(const target of enemy.orbGlow.aimTargets({includeProtected:true}))targets.push({...target,enemy});
  }
  const correction=weakPointAssist.update(dt,{enabled,origin:assistOrigin,direction:assistDirection,targets,visible(target){
    // Require the actual visible sac surface and a clear physical muzzle path.
    // Walls, the torso and another enemy can all block this assistance.
    assistRay.set(assistOrigin,target.center.clone().sub(assistOrigin).normalize());assistRay.far=assistOrigin.distanceTo(target.center)+.1;
    const viewHit=traceShot(assistRay);
    if(viewHit.bestMon!==target.enemy||viewHit.bestDist>=viewHit.wallDist||target.enemy.orbGlow.indexForHit(viewHit.bestHit)!==target.index)return false;
    getMuzzleWorld(assistMuzzle);assistRay.set(assistMuzzle,viewHit.bestPoint.clone().sub(assistMuzzle).normalize());assistRay.far=assistMuzzle.distanceTo(viewHit.bestPoint)+.08;
    const physical=traceShot(assistRay,false);
    return physical.bestMon===target.enemy&&physical.bestDist<physical.wallDist&&target.enemy.orbGlow.indexForHit(physical.bestHit)===target.index;
  }});
  if(correction.active){
    const previous=pitch;yaw+=correction.yaw;if(!tacticalView.elevated)pitch=THREE.MathUtils.clamp(pitch+correction.pitch,-1.35,1.35);
    else tacticalPointer.assist(correction.yaw);
    if(!tacticalView.elevated){camera.rotation.y+=correction.yaw;camera.rotation.x+=pitch-previous;camera.updateMatrixWorld(true);}
  }
  return correction;
}
function shoot(now) {
  if(invasionIntro?.active||playerDodge.info().active||thirdPerson.recovering)return;
  if (S.reloading) return;
  if (S.infiniteAmmo) S.mag = MAG_SIZE;
  if (S.mag <= 0) { S.lastShot = now; sfx.empty(); startReload(now); return; }
  if (!S.infiniteAmmo) S.mag--;
  S.lastShot = now;
  recoil = 1; muzzleFlash.intensity = 4;
  const feedback=rifleFeedback.fire(rifleFeedbackOptions()),spread=rifleFeedback.sample();
  sfx.shoot();thirdPerson.shoot();
  rifleAimDirection(dirVec);
  spreadBasis(dirVec);dirVec.addScaledVector(shotRight,spread.x).addScaledVector(shotUp,spread.y);
  dirVec.normalize();
  // Elevated view must not select shots from above roofs. Use the same physical muzzle.
  const shotOrigin=tacticalView.elevated?getMuzzleWorld(new THREE.Vector3()):camera.position;
  raycaster.set(shotOrigin, dirVec);
  raycaster.far = 120;
  // The reticle selects a target; the physical muzzle must also have a clear shot.
  const selected=traceShot(raycaster);
  const target=selected.bestDist<selected.wallDist?selected.bestPoint:
    selected.wallHits[0]?.point||shotOrigin.clone().addScaledVector(dirVec,120);
  const muzzleWorld = new THREE.Vector3();
  getMuzzleWorld(muzzleWorld);
  dirVec.copy(target).sub(muzzleWorld);
  const range=dirVec.length();dirVec.normalize();
  raycaster.set(muzzleWorld,dirVec);raycaster.far=range+.08;
  const {bestMon,bestDist,bestPoint,bestHit,bestFloating,wallHits,wallDist}=traceShot(raycaster,false);
  if (bestMon && bestDist < wallDist) {
    const headshot=!bestMon.explosiveLab&&isHeadshot(bestMon,bestHit),damage=RIFLE_DAMAGE*(headshot?HEADSHOT_MULTIPLIER:1);
    if(bestFloating) floatingSystem.damage(bestFloating,damage,bestPoint,headshot);
    else {
      damageMonster(bestMon, damage, bestPoint, headshot,bestHit);
    }
    if(headshot)showHitmarker(true);
    addTracer(muzzleWorld, bestPoint);
  } else if (wallDist < Infinity) {
    const hit = wallHits[0];
    worldImpactAudio?.impact(hit,{raycaster,now});
    const normal = hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
    // Glass reactions are audio only; retain the normal metal/concrete impacts.
    if(!worldImpactAudio?.soundOnly(hit))combatVFX.surface(hit.point, normal);
    addTracer(muzzleWorld, wallHits[0].point);
  } else {
    addTracer(muzzleWorld, muzzleWorld.clone().addScaledVector(dirVec,60));
  }
  if (S.mag === 0) startReload(now);
  // The bullet leaves before this shot's kick. Subsequent shots use the
  // visibly recoiling camera, while the player's own heading stays intact.
  if(!tacticalView.elevated){
    camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x+feedback.deltaPitch,-1.35,1.35);
    camera.rotation.y+=feedback.deltaYaw;camera.updateMatrixWorld(true);
  }
  if(scopeView)updateScopeWeapon();
  captureRifleReticle();updateRifleReticle();
  updateHUD();
}
function addTracer(from, to) {
  combatVFX.trace(from,to);
}
function startReload(now) {
  if(invasionIntro?.active||playerDodge.info().active||thirdPerson.recovering||S.infiniteAmmo)return;
  if (S.reloading || S.mag === MAG_SIZE || S.reserve <= 0) return;
  S.reloading = true; S.reloadEnd = now + RELOAD_MS / 1000; S.reloadPausedAt = null;
  document.getElementById('reload-msg').classList.remove('hidden');
  sfx.reload();
}
function finishReload() {
  if (!S.reloading) return;
  const rounds = Math.min(MAG_SIZE - S.mag, S.reserve);
  S.mag += rounds; S.reserve -= rounds; S.reloading = false; S.reloadPausedAt = null;
  el('reload-msg').classList.add('hidden'); updateHUD();
}

// ---------- HUD ----------
const el = id => document.getElementById(id);
// Control de sensibilidad de la pantalla inicial: aplica al mouse y al
// arrastre táctil, muestra el valor y lo guarda en localStorage.
const sensSlider = el('sens-slider'), sensValue = el('sens-value');
if (sensSlider && sensValue) {
  sensSlider.value = sens;
  sensValue.textContent = sens.toFixed(1) + '×';
  sensSlider.addEventListener('input', () => {
    sens = parseFloat(sensSlider.value);
    sensValue.textContent = sens.toFixed(1) + '×';
    try { localStorage.setItem('ma_sens', String(sens)); } catch (e) { /* almacenamiento no disponible */ }
  });
}
// Selector de niebla de la pantalla inicial: tres niveles que aplican la
// densidad al instante (también en pausa, que muestra esta pantalla) y
// guardan la elección en localStorage.
const fogBtns = document.querySelectorAll('.fog-btn');
function paintFogBtns() { fogBtns.forEach(b => b.classList.toggle('active', b.dataset.level === fogLevel)); }
fogBtns.forEach(b => b.addEventListener('click', () => {
  if (!(b.dataset.level in FOG_LEVELS)) return;
  fogLevel = b.dataset.level;
  scene.fog.density = FOG_LEVELS[fogLevel];
  paintFogBtns();
  try { localStorage.setItem('ma_fog', fogLevel); } catch (e) { /* almacenamiento no disponible */ }
}));
paintFogBtns();
function updateStaminaHUD(){
  const {level,exhausted}=playerStamina.info(),percent=Math.round(level*100),meter=el('stamina-display');
  if(meter.getAttribute('aria-valuenow')===String(percent)&&meter.dataset.exhausted===String(exhausted))return;
  meter.setAttribute('aria-valuenow',String(percent));
  meter.setAttribute('aria-valuetext',`${percent}%${exhausted?' · Agotado':''}`);
  meter.title=`Resistencia para correr: ${percent}%${exhausted?' · Agotado':''}`;
  meter.dataset.exhausted=String(exhausted);meter.dataset.low=String(percent<=25);
  el('stamina-fill').setAttribute('stroke-dashoffset',String(100-percent));
}
function updateHUD() {
  updateStaminaHUD();
  el('health-bar').style.width = Math.max(0, S.health) + '%';
  el('health-text').textContent = Math.max(0, Math.ceil(S.health));
  el('ammo-mag').textContent = S.infiniteAmmo ? '∞' : S.mag;
  el('ammo-reserve').textContent = S.infiniteAmmo ? '∞' : S.reserve;
  el('ammo').classList.toggle('low', S.mag <= 6);
  el('ammo-empty').classList.toggle('hidden', S.infiniteAmmo || S.mag > 0 || S.reserve > 0);
  el('kills').textContent = S.kills;
  updateAmmoShop();
  updateWaveHUD();
}
// Same magazine/reserve used by shooting and R. The four existing trash records
// are the only purchase stations; no pickup inventory or automatic refill exists.
const ammoShop = el('ammo-shop'), buyAmmoButton = el('btn-buy-ammo');
let ammoShopAcc = 0, ammoShopMode = S.mode, ammoPurchaseUntil = 0;
function nearbyAmmoStation() {
  if (S.infiniteAmmo) return null;
  if (S.mode !== 'playing') return null;
  let nearest = null, distance2 = AMMO_BUY_RANGE * AMMO_BUY_RANGE;
  for (const station of propSystem.state.trash) {
    if (!station.loaded) continue;
    const d2 = (playerPos.x - station.x) ** 2 + (playerPos.z - station.z) ** 2;
    if (d2 <= distance2 && los2D(station.x, station.z)) { nearest = station; distance2 = d2; }
  }
  return nearest;
}
function updateAmmoShop() {
  const station = nearbyAmmoStation();
  const room=Math.max(0,MAX_RESERVE-S.reserve),full=room===0,noSpace=room<AMMO_PACK;
  ammoShop.classList.toggle('hidden', !station);
  buyAmmoButton.disabled = !station || S.credits < AMMO_PRICE || noSpace;
  if (!station) return;
  el('ammo-shop-label').textContent=full?'RESERVA LLENA':noSpace?'SIN ESPACIO':'BALAS · 100';
  buyAmmoButton.setAttribute('aria-label',full?`Reserva llena: ${MAX_RESERVE} balas`:noSpace?`No caben las ${AMMO_PACK} balas del paquete`:`Comprar ${AMMO_PACK} balas por ${AMMO_PRICE} puntos`);
  el('ammo-shop-status').textContent = performance.now() < ammoPurchaseUntil
    ? '+30 balas añadidas a la reserva'
    : full ? `Reserva llena · ${S.reserve}/${MAX_RESERVE}`
    : noSpace ? `Paquete de ${AMMO_PACK} · Espacio para ${room} balas`
    : S.credits < AMMO_PRICE ? `Te faltan ${AMMO_PRICE - S.credits} puntos` : 'Pulsa E o toca COMPRAR';
}
function buyAmmo() {
  // Recheck on every activation, including a stale button after moving/pausing.
  if (!nearbyAmmoStation() || S.credits < AMMO_PRICE || S.reserve + AMMO_PACK > MAX_RESERVE) return false;
  S.credits -= AMMO_PRICE; S.reserve += AMMO_PACK;
  ammoPurchaseUntil = performance.now() + 1800;
  sfx.purchase(); updateHUD();
  return true;
}
function awardCombatPoints(enemy,point,headshot,dead) {
  // A spider pays once, on defeat; no impact or headshot farming.
  if(enemy.type==='ground-swarm'){
    if(dead){S.credits+=1;enemyPoints.show(enemy,point,1);updateHUD();}
    return;
  }
  const impact=headshot?HEAD_POINTS:BODY_POINTS;
  S.credits+=impact+(dead?KILL_POINTS:0);
  enemyPoints.show(enemy,point,impact);
  if(dead)enemyPoints.show(enemy,point,KILL_POINTS,1);
  updateHUD();
}
buyAmmoButton.addEventListener('pointerdown', e => e.stopPropagation());
buyAmmoButton.addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation(); buyAmmo(); buyAmmoButton.blur();
});
let hitT = null;
function showHitmarker(headshot=false) {
  const h = el('hitmarker'); h.classList.toggle('headshot',headshot); h.classList.add('show');
  clearTimeout(hitT); hitT = setTimeout(() => h.classList.remove('show'), 70);
}
const damageOverlay = createDamageOverlay(el('damage-vignette'),{enabled:LOAD_ENEMY_ASSETS});
const healthRegeneration = createHealthRegeneration();
window.__ma.damageInfo = () => damageOverlay.info();
const playerImpact=createPlayerImpact({mode:()=>S.mode,hidden:()=>document.hidden,webEnabled:()=>!!invasionIntro?.info().preferences.haptics});
window.__ma.playerImpactInfo=()=>playerImpact.info();
window.__ma.aimSwayInfo=()=>aimSway.info();
function flashDamage(options) {
  healthRegeneration.hit();damageOverlay.hit(options);const strong=playerImpact.hit(options);
  if(S.mode==='playing'&&S.health>0){
    thirdPerson.hurt({...options,strong});
    if(thirdPerson.recovering){aimBlend=0;setScopeView(false);}
  }
}

// Telegraph wave arrivals using the single environmental VFX pool.
const enemyArrivals=new Map();
function beginEnemyArrival(entity){
  const height=entity.swarm?.9:entity.flight?3:2.6;
  const handle=environmentDemo?.beginEnemyArrival?.(entity.g.position,{height,radius:entity.swarm?.5:entity.radius||.9});
  if(!handle)return;
  entity.spawning=true;entity.spawnVisible=false;entity.g.visible=false;enemyArrivals.set(entity,{age:0,handle,fade:createEnemyArrivalFade(entity.g)});
}
function updateEnemyArrivals(dt){
  for(const [entity,a] of enemyArrivals){
    if(entity.state==='dead'||entity.state==='DEATH'||!entity.g.parent){environmentDemo?.cancelEnemyArrival?.(a.handle);a.fade.restore();entity.spawning=false;delete entity.spawnVisible;enemyArrivals.delete(entity);continue;}
    a.age+=dt;const t=THREE.MathUtils.clamp((a.age-.25)/.7,0,1);a.fade.set(t*t*(3-2*t));entity.spawnVisible=t>0;entity.g.visible=entity.spawnVisible;
    if(t===1){a.fade.restore();entity.spawning=false;delete entity.spawnVisible;entity.g.visible=true;environmentDemo?.revealEnemyArrival?.(a.handle);enemyArrivals.delete(entity);}
  }
}
function clearEnemyArrivals(){for(const [entity,a] of enemyArrivals){a.fade.restore();entity.spawning=false;delete entity.spawnVisible;entity.g.visible=true;}enemyArrivals.clear();environmentDemo?.clearEnemyArrivals?.();}
window.__ma.arrivalInfo=()=>({pending:enemyArrivals.size,delay:.25,fade:.7});

const waveWalkers={number:0,spawned:0};
const waveSystem=createWaveSystem({
  levelOne:true,
  singleEnemy:LOCAL_ENEMY_LAB,
  singleEnemyKind:ALIEN1_LAB?'alien1':'explosive',
  initialWave:EXPLOSIVE_PREVIEW_WAVE,
  swarm:()=>groundSwarm.info().ready,
  getExtraAlive:()=>monsters.filter(m=>m.swarm&&m.state!=='dead').length,
  getAlive:()=>monsters.filter(m=>!m.swarm&&m.state!=='dead').length+floatingSystem.state.entities.filter(e=>e.state!=='DEATH').length,
  spawn(kind,settings){
    if(!ENEMIES_ENABLED)return null;
    if(waveWalkers.number!==settings.number){waveWalkers.number=settings.number;waveWalkers.spawned=0;}
    const allowWalk=settings.number>1&&waveWalkers.spawned<Math.floor(settings.total*.2)&&monsters.filter(m=>m.chaseClip==='walk'&&m.state!=='dead').length<2;
    // Optional asset failure preserves playable waves without a stuck spawn queue.
    const entity=ALIEN1_LAB?(kind==='alien1'?spawnAlien1Lab():null):kind==='explosive'?spawnExplosiveLab(settings.number):EXPLOSIVE_LAB?null:kind==='floating'?floatingSystem.spawnNear(playerPos):kind==='swarm'&&groundSwarm.info().ready?spawnGroundSwarm():spawnEnemy(settings.number,allowWalk);
    if(entity){if(entity.chaseClip==='walk')waveWalkers.spawned++;if(!entity.explosiveLab)entity.hp=ENEMY_HEALTH_MULTIPLIER*Math.ceil(entity.hp*settings.healthMultiplier-1e-9);entity.maxHp=entity.hp;entity.wave=settings.number;beginEnemyArrival(entity);}
    return entity;
  },
  onComplete:number=>{
    // Leftover extras fade away without kills/rewards; each round starts fresh.
    for(const mon of monsters)if(mon.swarm&&mon.state!=='dead'){mon.state='dead';mon.stateT=0;}
    const now=performance.now();scoreSystem.setActive(false,now);scoreSystem.completeWave(number,now);
    S.elapsed=scoreSystem.info().activeMs/1000;gameAudio.waveComplete();
  },
  onChange:()=>{waveAtmosphere.setWave(waveSystem.state.number,waveSystem.state.phase);scoreSystem.setWave(waveSystem.state.number,performance.now());syncScoreClock();updateWaveHUD();recordSession();},
});
window.__ma.waveInfo=()=>({...waveSystem.info(),enabled:ENEMIES_ENABLED});
let waveHudClock=0;
function updateWaveHUD(){
  el('wave-display').classList.toggle('hidden',!ENEMIES_ENABLED);
  if(!ENEMIES_ENABLED)return;
  const info=waveSystem.info();el('wave-number').textContent=info.number;
  const status=info.phase==='complete'?'PRUEBA COMPLETADA':info.phase==='intermission'?'COMPLETADA · SIGUIENTE EN '+Math.ceil(info.nextIn)+' s':'';
  el('wave-phase').textContent=info.phase==='active'?'':status;
  el('wave-phase').hidden=info.phase==='active';
  el('wave-display').dataset.phase=info.phase;
  el('wave-display').setAttribute('aria-label','Oleada '+info.number+(status?', '+status.toLowerCase():''));
  el('wave-display').title='Oleada '+info.number+(status?' · '+status:'');
  el('wave-display').classList.toggle('complete',['intermission','complete'].includes(info.phase));
}

// ---------- Etapa C1: descubrimiento, minimapa y mapa expandido ----------
// Descubrimiento progresivo sobre una retícula de celdas de 4 m que
// cubre los límites del registro (MAPREG). El estado vive en un Set
// de claves "cx,cz" y se persiste entre partidas y sesiones en
// localStorage. La clave se deriva de DISCOVERY_MODE: el modo actual
// es 'explore'; un futuro modo supervivencia usará su propia clave y
// podrá partir de cero llamando a resetDiscovery() (gancho listo,
// hoy ninguna UI lo invoca).
const CELL = 4;                          // m por celda de la retícula
const DISCOVERY_MODE = 'explore';        // futuro: 'survival'
const DISCOVERY_KEY = 'ma_discovery_' + DISCOVERY_MODE;   // hoy: 'ma_discovery_explore'
const REVEAL_RADIUS = { extrema: 14, densa: 18, normal: 26 }; // m, según la niebla activa (ma_fog)
const MAP_SCALE = 2;                     // px por metro en la capa estática
const MAP_VIEW_M = 40;                   // m de radio visible en el minimapa
const discovered = new Set();
let discoveryEpoch=0;
let mapBounds = null, gridCols = 0, gridRows = 0;
let staticLayer = null, staticCtx = null;
let discoveryDirty = false, lastDiscoverySave = 0;
let mapOpen = false;
let discAcc = 0;                         // acumulador del revelado a 10 Hz

function computeMapBounds() {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const list of [MAPREG.streets, MAPREG.buildings]) for (const r of list) {
    if (r.minX < minX) minX = r.minX; if (r.maxX > maxX) maxX = r.maxX;
    if (r.minZ < minZ) minZ = r.minZ; if (r.maxZ > maxZ) maxZ = r.maxZ;
  }
  const pad = 2;
  mapBounds = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
  gridCols = Math.ceil((mapBounds.maxX - mapBounds.minX) / CELL);
  gridRows = Math.ceil((mapBounds.maxZ - mapBounds.minZ) / CELL);
}
function cellKey(cx, cz) { return cx + ',' + cz; }
function cellCenterX(cx) { return mapBounds.minX + (cx + 0.5) * CELL; }
function cellCenterZ(cz) { return mapBounds.minZ + (cz + 0.5) * CELL; }
function rectAt(x, z) {
  // Qué hay en un punto del registro: 'building' | 'street' | null
  for (const r of MAPREG.buildings) if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return 'building';
  for (const r of MAPREG.streets) if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return 'street';
  return null;
}

// Capa estática fuera de pantalla (a MAP_SCALE px/m, norte arriba):
// solo se repinta cuando se revelan celdas nuevas; minimapa y mapa
// expandido la reutilizan con drawImage, sin recalcular nada.
function paintCell(cx, cz) {
  const kind = rectAt(cellCenterX(cx), cellCenterZ(cz));
  const px = cx * CELL * MAP_SCALE;
  const py = cz * CELL * MAP_SCALE;
  const sz = CELL * MAP_SCALE;
  if (kind === 'building') {
    staticCtx.fillStyle = '#7a6248';
    staticCtx.fillRect(px, py, sz, sz);
    staticCtx.strokeStyle = '#2a2119';
    staticCtx.lineWidth = 1;
    staticCtx.strokeRect(px + .5, py + .5, sz - 1, sz - 1);
  } else {
    staticCtx.fillStyle = kind === 'street' ? '#39414a' : '#10141a';
    staticCtx.fillRect(px, py, sz, sz);
  }
}
function buildStaticLayer() {
  staticLayer = document.createElement('canvas');
  staticLayer.width = Math.ceil((mapBounds.maxX - mapBounds.minX) * MAP_SCALE);
  staticLayer.height = Math.ceil((mapBounds.maxZ - mapBounds.minZ) * MAP_SCALE);
  staticCtx = staticLayer.getContext('2d');
  staticCtx.fillStyle = '#07090b';   // no descubierto
  staticCtx.fillRect(0, 0, staticLayer.width, staticLayer.height);
  for (const key of discovered) {
    const [cx, cz] = key.split(',').map(Number);
    paintCell(cx, cz);
  }
}

// Línea de vista 2D para el descubrimiento: intersección segmento–
// AABB (método de slabs) contra la lista `colliders` — los mismos
// AABB que bloquean el movimiento. Así el descubrimiento NO atraviesa
// paredes: cuando C2 agregue paredes interiores a `colliders`, las
// habitaciones quedarán tras ellas y no se revelarán desde fuera; la
// exploración de interiores nacerá de entrar, no de mirar el mapa.
// El colisionador que CONTIENE el punto destino no lo bloquea: la
// huella de un edificio se descubre al ver el edificio desde fuera.
function segHitsRect(x1, z1, x2, z2, r) {
  if (r.rectangles) return r.rectangles.some(part => segHitsRect(x1, z1, x2, z2, part));
  if (r.halfX !== undefined) {
    const ax = x1 - r.cx, az = z1 - r.cz, bx = x2 - r.cx, bz = z2 - r.cz;
    return segHitsRect(ax * r.cos - az * r.sin, ax * r.sin + az * r.cos,
      bx * r.cos - bz * r.sin, bx * r.sin + bz * r.cos,
      { minX: -r.halfX, maxX: r.halfX, minZ: -r.halfZ, maxZ: r.halfZ });
  }
  let tmin = 0, tmax = 1;
  const dx = x2 - x1, dz = z2 - z1;
  if (Math.abs(dx) < 1e-9) { if (x1 < r.minX || x1 > r.maxX) return false; }
  else {
    let ta = (r.minX - x1) / dx, tb = (r.maxX - x1) / dx;
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    tmin = Math.max(tmin, ta); tmax = Math.min(tmax, tb);
    if (tmax < tmin) return false;
  }
  if (Math.abs(dz) < 1e-9) { if (z1 < r.minZ || z1 > r.maxZ) return false; }
  else {
    let ta = (r.minZ - z1) / dz, tb = (r.maxZ - z1) / dz;
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    tmin = Math.max(tmin, ta); tmax = Math.min(tmax, tb);
    if (tmax < tmin) return false;
  }
  return true;
}
function los2D(x, z) {
  for (const c of colliders) {
    if (c.rectangles) {
      if (c.rectangles.some(r => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ)) continue;
    } else if (c.halfX !== undefined) {
      const dx = x - c.cx, dz = z - c.cz;
      if (Math.abs(dx * c.cos - dz * c.sin) <= c.halfX && Math.abs(dx * c.sin + dz * c.cos) <= c.halfZ) continue;
    } else if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) continue;
    if (segHitsRect(playerPos.x, playerPos.z, x, z, c)) return false;
  }
  return true;
}

// Revelado (se llama a 10 Hz desde el bucle): solo celdas dentro del
// radio según la niebla activa; las de ≤3 m se revelan siempre
// (campo cercano) y el resto exige línea de vista 2D libre.
function updateDiscovery(now) {
  const radius = REVEAL_RADIUS[fogLevel] || 18;
  const minCx = Math.max(0, Math.floor((playerPos.x - radius - mapBounds.minX) / CELL));
  const maxCx = Math.min(gridCols - 1, Math.floor((playerPos.x + radius - mapBounds.minX) / CELL));
  const minCz = Math.max(0, Math.floor((playerPos.z - radius - mapBounds.minZ) / CELL));
  const maxCz = Math.min(gridRows - 1, Math.floor((playerPos.z + radius - mapBounds.minZ) / CELL));
  for (let cz = minCz; cz <= maxCz; cz++) for (let cx = minCx; cx <= maxCx; cx++) {
    const key = cellKey(cx, cz);
    if (discovered.has(key)) continue;
    const wx = cellCenterX(cx), wz = cellCenterZ(cz);
    const dx = wx - playerPos.x, dz = wz - playerPos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > radius * radius) continue;
    if (d2 > 9 && !los2D(wx, wz)) continue;
    discovered.add(key);
    paintCell(cx, cz);
    discoveryDirty = true;
  }
  if (discoveryDirty && now - lastDiscoverySave >= 1) {   // guardado con debounce ~1 s
    lastDiscoverySave = now; discoveryDirty = false;
    try { localStorage.setItem(DISCOVERY_KEY, JSON.stringify({ b: [mapBounds.minX, mapBounds.minZ, gridCols, gridRows], cells: [...discovered] })); } catch (e) { /* almacenamiento no disponible */ }
  }
}
function loadDiscovery() {
  try {
    const data = JSON.parse(localStorage.getItem(DISCOVERY_KEY) || 'null');
    // Etapa C2: el guardado lleva la firma de la retícula (origen y
    // tamaño en celdas). La expansión movió el origen, así que los
    // guardados de C1 (un arreglo simple, sin firma) ya no alinean
    // con las celdas nuevas y se descartan: el descubrimiento
    // arranca de cero una sola vez, con la firma ya vigente.
    if (data && Array.isArray(data.cells) && Array.isArray(data.b) &&
        data.b[0] === mapBounds.minX && data.b[1] === mapBounds.minZ &&
        data.b[2] === gridCols && data.b[3] === gridRows) {
      for (const k of data.cells) if (typeof k === 'string') discovered.add(k);
    }
  } catch (e) { /* datos corruptos o almacenamiento no disponible */ }
}
// Gancho para el futuro modo supervivencia (hoy ninguna UI lo
// invoca): limpia el descubrimiento del modo activo y repinta todo.
function resetDiscovery() {
  discoveryEpoch++;
  discovered.clear();
  discoveryDirty = false;
  try { localStorage.removeItem(DISCOVERY_KEY); } catch (e) { /* almacenamiento no disponible */ }
  buildStaticLayer();
  drawMinimap();
  if (mapOpen) drawBigMap();
}

// Minimapa circular centrado en el jugador: su dirección de mirada queda arriba.
// La capa gira con yaw; la flecha permanece fija y el norte real es -Z.
const minimapCv = el('minimap'), minimapCtx = minimapCv.getContext('2d');
let isoMinimap=null;
function drawPlayerArrow(g, x, y, size,angle=-yaw) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.beginPath();
  g.moveTo(0, -size);
  g.lineTo(size * 0.72, size * 0.8);
  g.lineTo(0, size * 0.35);
  g.lineTo(-size * 0.72, size * 0.8);
  g.closePath();
  g.fillStyle = '#ffffff';
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(0,0,0,.85)';
  g.stroke();
  g.restore();
}
function drawMinimap() {
  if(isoMinimap?.draw(performance.now()/1000,playerPos,yaw))return;
  if (!staticLayer) return;
  const W = minimapCv.width, C = W / 2;
  const g = minimapCtx;
  g.save();
  g.beginPath(); g.arc(C, C, C - 1, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#07090b';
  g.fillRect(0, 0, W, W);
  const k = (W / (2 * MAP_VIEW_M)) / MAP_SCALE;
  g.translate(C, C);
  g.rotate(yaw);
  g.scale(k, k);
  const lx = (playerPos.x - mapBounds.minX) * MAP_SCALE;
  const ly = (playerPos.z - mapBounds.minZ) * MAP_SCALE;
  g.drawImage(staticLayer, -lx, -ly);
  g.restore();
  drawPlayerArrow(g, C, C, 11,0);
}

// Mapa aéreo real con norte fijo y flecha georreferenciada.
// Sólo la ruta 2D de respaldo conserva el giro con la mirada.
const bigmapCv = el('bigmap'), bigmapCtx = bigmapCv.getContext('2d');
const aerialMap=createAerialMap({canvas:bigmapCv,drawArrow:drawPlayerArrow,onReady:()=>{if(mapOpen)drawBigMap();}});
window.__ma.aerialMapInfo=()=>aerialMap.info();
function drawBigMap(){
  const ready=aerialMap.draw(playerPos,yaw);
  el('map-hint').textContent=ready?'Norte arriba · Tú: flecha blanca · M / Esc para cerrar':'M / Esc para cerrar · Lo no explorado permanece oculto';
  if(!ready)drawFallbackBigMap();
}
// Retained fallback if the aerial asset is unavailable; discovery data is never rewritten.
function drawFallbackBigMap() {
  const s=7,worldW=(mapBounds.maxX-mapBounds.minX)*s,worldH=(mapBounds.maxZ-mapBounds.minZ)*s;
  const cos=Math.cos(yaw),sin=Math.sin(yaw);
  bigmapCv.width=Math.ceil(Math.abs(cos)*worldW+Math.abs(sin)*worldH);
  bigmapCv.height=Math.ceil(Math.abs(sin)*worldW+Math.abs(cos)*worldH);
  const g=bigmapCtx,CX=bigmapCv.width/2,CY=bigmapCv.height/2;
  const midX=(mapBounds.minX+mapBounds.maxX)/2,midZ=(mapBounds.minZ+mapBounds.maxZ)/2;
  const screen=(x,z)=>{const dx=(x-midX)*s,dz=(z-midZ)*s;return {x:CX+dx*cos-dz*sin,y:CY+dx*sin+dz*cos};};
  g.fillStyle='#07090b';g.fillRect(0,0,bigmapCv.width,bigmapCv.height);
  g.save();g.translate(CX,CY);g.rotate(yaw);
  g.drawImage(staticLayer,-worldW/2,-worldH/2,worldW,worldH);g.restore();
  g.textAlign='center';
  for(const lm of MAPREG.landmarks){
    const x=(lm.minX+lm.maxX)/2,z=(lm.minZ+lm.maxZ)/2;
    const key=cellKey(Math.floor((x-mapBounds.minX)/CELL),Math.floor((z-mapBounds.minZ)/CELL));
    if(!discovered.has(key))continue;
    const p=screen(x,z);g.font='700 13px "Segoe UI", Arial, sans-serif';g.fillStyle='#ffd9ae';
    const margin=g.measureText(lm.name).width/2+6;
    g.fillText(lm.name,THREE.MathUtils.clamp(p.x,margin,bigmapCv.width-margin),THREE.MathUtils.clamp(p.y,18,bigmapCv.height-6));
  }
  const north=screen(midX,mapBounds.minZ+4);
  g.font='800 20px "Segoe UI", Arial, sans-serif';g.fillStyle='#e8e0d0';g.fillText('N',north.x,north.y);
  const player=screen(playerPos.x,playerPos.z);drawPlayerArrow(g,player.x,player.y,10,0);
}

// Abrir/cerrar el mapa SIN estados de juego nuevos: abrir pausa con
// el flujo existente (en escritorio, salir del pointer lock ya
// dispara la pausa y el overlay queda encima; en táctil, la misma
// ruta que el botón ⏸) y cerrar vuelve a la pantalla de pausa, desde
// donde JUGAR reanuda como siempre.
function openMap() {
  if (mapOpen || (S.mode !== 'playing' && S.mode !== 'paused')) return;
  mapOpen = true;
  setRainLevel(0.4);   // con el mapa abierto suena como en pausa
  if (S.mode === 'playing') {
    pauseGame();
    if (document.pointerLockElement) document.exitPointerLock();
  }
  el('pause-screen').inert=true;el('pause-screen').setAttribute('aria-hidden','true');
  el('map-overlay').classList.remove('hidden');el('map-overlay').setAttribute('aria-hidden','false');
  drawBigMap();el('map-close').focus();
}
function closeMap() {
  if (!mapOpen) return;
  mapOpen = false;
  el('map-overlay').classList.add('hidden');el('map-overlay').setAttribute('aria-hidden','true');
  el('pause-screen').inert=S.mode!=='paused';el('pause-screen').setAttribute('aria-hidden',String(S.mode!=='paused'));
  if(S.mode==='paused')el('pause-continue').focus();
  // Al cerrar el mapa se restaura el nivel del estado actual
  if (S.mode === 'playing') setRainLevel(1);
  else if (S.mode === 'dead') setRainLevel(0.6);
}
el('map-close').addEventListener('click', closeMap);
onBrowserTouch(el('btn-map'),'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing' || S.mode === 'paused') openMap();
}, { passive: false });

// Inicialización del descubrimiento: límites del registro, estado
// persistido y capa estática inicial.
computeMapBounds();
loadDiscovery();
buildStaticLayer();
drawMinimap();
function minimapKnown(bounds){
  const minCx=Math.max(0,Math.floor((bounds.minX-mapBounds.minX)/CELL)),maxCx=Math.min(gridCols-1,Math.floor((bounds.maxX-mapBounds.minX)/CELL));
  const minCz=Math.max(0,Math.floor((bounds.minZ-mapBounds.minZ)/CELL)),maxCz=Math.min(gridRows-1,Math.floor((bounds.maxZ-mapBounds.minZ)/CELL));
  for(let z=minCz;z<=maxCz;z++)for(let x=minCx;x<=maxCx;x++)if(discovered.has(cellKey(x,z)))return true;
  return false;
}
function minimapObjects(){
  const objects=[],add=(kind,id,root,bounds)=>{root.updateMatrixWorld(true);root.traverse(mesh=>{if(mesh.isMesh&&!mesh.userData.casinoNeon&&!mesh.userData.minimapDecoration&&mesh.material.map&&mesh.geometry.attributes.uv)objects.push({kind,id,mesh,bounds:{minX:bounds.minX??bounds.min.x,maxX:bounds.maxX??bounds.max.x,minZ:bounds.minZ??bounds.min.z,maxZ:bounds.maxZ??bounds.max.z}});});};
  for(const r of placedBuildingSystem.state.records)add({'BS-D5':'bastida','GS-E5':'gas','P13-C4':'planet13','B13-C5-C6':'bola13','STRAT-A5':'strat','VEGAS-AC':'vegas','STRAT-TIP':'strattip','BARRIER-CE':'carbarrier','STOP-P13':'busstopslime','STOP-BS':'busstop','STOP-STRAT':'busstop','STOP-BS-SIDE':'busstop','STOP-GAS-WEST':'busstop','STOP-GAS-EAST':'busstop','RAFA-C8':'comparafa'}[r.entry.id],r.entry.id,r.root,r.bounds);
  for(const r of casinoSystem.state.records)if(r.root)add('casino',r.def.id,r.root,r.bounds);
  for(const r of placedVehicleSystem.state.records)add(r.entry.kind,r.entry.id,r.visual,r.bounds);
  cars.forEach((r,i)=>{if(r.visual)add('car'+(r.kind+1),'car-'+i,r.visual,r.collider);});return objects;
}
isoMinimap=createIsometricMinimap({renderer,canvas:minimapCv,getObjects:minimapObjects,
  getStreets:()=>MAPREG.streets,
  getSidewalks:()=>sidewalkSystem.state.originals.map(({mesh})=>{const p=mesh.geometry.parameters;return {minX:mesh.position.x-p.width*mesh.scale.x/2,maxX:mesh.position.x+p.width*mesh.scale.x/2,minZ:mesh.position.z-p.depth*mesh.scale.z/2,maxZ:mesh.position.z+p.depth*mesh.scale.z/2};}),
  getLights:()=>lampPostSystem.state.originals.map(r=>({x:r.light.position.x,z:r.light.position.z})),
  getEnemies:()=>[...monsters,...floatingSystem.state.entities],getShops:()=>propSystem.state.trash.filter(r=>r.loaded),
  getGas:()=>placedBuildingSystem.state.records.filter(r=>r.entry.id==='GS-E5').map(r=>({x:(r.bounds.min.x+r.bounds.max.x)/2,z:(r.bounds.min.z+r.bounds.max.z)/2})),isKnown:minimapKnown,getDiscoveryVersion:()=>discoveryEpoch+':'+discovered.size,
});
isoMinimap.load(Promise.all([carsReadyTask,casinosReadyTask,placedBuildingsReadyTask,placedVehiclesReadyTask,propsReadyTask]));
window.__ma.minimap3DInfo=()=>isoMinimap.info();
function setGameView(view){
  if(tacticalView.setView(view,yaw)){
    tacticalPointer.reset();
    try{localStorage.setItem('ma_view_v3',view);}catch(_){}
    graphics.resetSampling();syncGraphicsControls();
  }
}
function toggleNavigationView(){if(S.mode==='playing'&&!mapOpen)setGameView(tacticalView.active?'third':'tactical');}
minimapCv.setAttribute('role','button');minimapCv.tabIndex=0;
minimapCv.title='Cambiar vista: tercera persona / táctica 3D (N)';
minimapCv.addEventListener('click',toggleNavigationView);
minimapCv.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();toggleNavigationView();}});
function syncGraphicsControls(){
  el('game-view-v3').value=tacticalView.active?'tactical':'third';
  el('graphics-quality-v3').value=graphics.policy.info().selected;
  minimapCv.setAttribute('aria-pressed',String(tacticalView.active));
  minimapCv.setAttribute('aria-label',tacticalView.active?'Navegación: volver a tercera persona':'Navegación: cambiar a vista táctica 3D');
}
el('game-view-v3').addEventListener('change',e=>setGameView(e.target.value));
el('graphics-quality-v3').addEventListener('change',e=>{graphics.select(e.target.value);syncGraphicsControls();});
// Move one settings node between the existing menu and pause. No duplicate controls/events.
const graphicsPanel=el('graphics-v3-panel');
document.addEventListener('ma:ui-state',e=>{
  const host=e.detail==='paused'?el('pause-graphics-host'):el('menu-graphics-host');
  host.append(graphicsPanel);if(e.detail!=='paused')el('pause-graphics-host').open=false;
  syncGraphicsControls();graphics.resetSampling();
});
el('menu-graphics-host').append(graphicsPanel);syncGraphicsControls();
setInterval(()=>{
  if(!['paused','menu'].includes(S.mode))return;
  const info=graphics.info(),m=info.metrics;
  el('graphics-v3-metrics').textContent=m.meanFPS?`${m.meanFPS.toFixed(0)} FPS · p95 ${m.p95.toFixed(0)} ms · ${info.internal.join(' × ')} · ${info.effective.toUpperCase()}`:'Las métricas aparecen durante la partida.';
},1000);
document.addEventListener('ma:toggle-tactical',toggleNavigationView);
window.__ma.resetDiscovery = resetDiscovery;   // gancho de consola para pruebas
window.__ma.discoverySize = () => discovered.size;

function onBrowserTouch(target,type,listener,options){if(!nativeGamepadHost)target.addEventListener(type,listener,options);}

// ---------- Entrada ----------
let pointerFallback = false, pointerWasLocked = false;
let pointerRequestPending=false,pointerCaptureTried=false;
let fallbackMouseX = 0, fallbackMouseY = 0;
const pointerHint = document.createElement('p');
pointerHint.id = 'pointer-hint'; pointerHint.className = 'hidden';
pointerHint.textContent = 'Mantén clic derecho y arrastra para mirar · Clic izquierdo dispara · WASD mueve · Esc pausa';
el('hud').append(pointerHint);
window.__ma.pointerFallback = () => pointerFallback;
document.addEventListener('keydown', e => {
  const wasDown = S.keys[e.code];
  S.keys[e.code] = true;
  if (e.code === 'Space' && S.mode === 'playing') { e.preventDefault(); tryJump(); }
  if (e.code === 'KeyR' && S.mode === 'playing') startReload(performance.now() / 1000);
  if (e.code === 'KeyE' && S.mode === 'playing') {
    e.preventDefault(); if (!e.repeat && !wasDown) buyAmmo();
  }
  if(e.code==='KeyQ'&&!e.repeat&&!wasDown&&!(e.target instanceof Element&&e.target.closest('select,input,textarea,button'))){
    e.preventDefault();
    tryDodge();
  }
  // Etapa C1: M abre/cierra el mapa expandido; Esc solo lo cierra si
  // está abierto (no interfiere con la pausa normal por Esc).
  if(e.code==='KeyN'&&!e.repeat&&!(e.target instanceof Element&&e.target.closest('select,input,textarea'))){e.preventDefault();toggleNavigationView();}
  if (e.code === 'KeyM') { if (mapOpen) closeMap(); else openMap(); }
  if (e.code === 'Escape' && mapOpen) closeMap();
  else if (e.code === 'Escape' && pointerFallback && S.mode === 'playing') pauseGame();
});
document.addEventListener('keyup', e => { S.keys[e.code] = false; });
function tacticalPointerInput(x,y,absolute=false){
  if(S.mode!=='playing'||invasionIntro?.active||mapOpen||document.hidden)return;
  const rect=canvas.getBoundingClientRect(),origin=tacticalPointerAnchor();
  if(absolute)tacticalPointer.absolute(x-rect.left,y-rect.top,{width:rect.width,height:rect.height});
  else tacticalPointer.move(x,y,{camera,origin,yaw,width:rect.width,height:rect.height,sensitivity:sens});
  const aim=tacticalPointer.update(camera,origin);if(aim)yaw=aim.yaw;
}
document.addEventListener('mousemove', e => {
  if (S.mode !== 'playing') return;
  let dx = e.movementX, dy = e.movementY;
  if (document.pointerLockElement !== canvas) {
    if (e.target !== canvas || (!tacticalView.elevated&&(!pointerFallback||!(e.buttons & 2)))) return;
    dx = e.clientX - fallbackMouseX; dy = e.clientY - fallbackMouseY;
    fallbackMouseX = e.clientX; fallbackMouseY = e.clientY;
  }
  if(tacticalView.elevated){
    if(document.pointerLockElement!==canvas)tacticalPointerInput(e.clientX,e.clientY,true);
    else tacticalPointerInput(dx,dy);
    return;
  }
  const aimSensitivity = THREE.MathUtils.lerp(1, ADS_MOUSE_SCALE, aimBlend);
  yaw -= dx * MOUSE_SENS * sens * aimSensitivity;
  if(!tacticalView.elevated)pitch = THREE.MathUtils.clamp(pitch - dy * MOUSE_SENS * sens * aimSensitivity, -1.35, 1.35);
});
document.addEventListener('mousedown', e => {
  if (e.target instanceof Element && e.target.closest('#ammo-shop')) return;
  if (S.mode !== 'playing' || (document.pointerLockElement !== canvas && !(pointerFallback && e.target === canvas))) return;
  fallbackMouseX = e.clientX; fallbackMouseY = e.clientY;
  if (e.button === 0) S.mouseDown = true;
  if (e.button === 2) { S.aimHeld = true; e.preventDefault(); }
});
document.addEventListener('mouseup', e => {
  if (e.button === 0) S.mouseDown = false;
  if (e.button === 2) S.aimHeld = false;
});
document.addEventListener('contextmenu', e => { if (S.mode === 'playing') e.preventDefault(); });
function releaseWeaponInput() { S.mouseDown = false; S.aimHeld = false; }
canvas.addEventListener('mousedown', e => {
  if(nativeGamepadHost||touchMode||S.mode!=='playing'||mapOpen||document.hidden||e.button!==0||
    e.ctrlKey||e.metaKey||e.altKey||document.pointerLockElement===canvas||(pointerFallback&&pointerCaptureTried))return;
  // Capture from this real mouse gesture, not from the async video/loading completion.
  // The activating click does not also spend a round or trigger a menu behind the canvas.
  e.preventDefault();e.stopPropagation();releaseWeaponInput();pointerCaptureTried=true;lockPointer();
});
canvas.addEventListener('mouseleave', () => { if (pointerFallback) releaseWeaponInput(); });
window.addEventListener('blur', releaseWeaponInput);
window.addEventListener('focus',()=>{pointerCaptureTried=false;});
window.addEventListener('blur', () => { S.keys.KeyE = false; });

function lockPointer() {
  if(pointerRequestPending||S.mode!=='playing'||mapOpen||document.hidden||nativeGamepadHost||touchMode)return;
  if(typeof canvas.requestPointerLock!=='function'){usePointerFallback();return;}
  pointerRequestPending=true;
  pointerFallback = false; pointerHint.classList.add('hidden');
  try {
    const request = canvas.requestPointerLock();
    if (request && request.catch) request.catch(usePointerFallback);
  } catch (err) { usePointerFallback(); }
}
function usePointerFallback() {
  pointerRequestPending=false;
  if (S.mode !== 'playing' || touchMode || document.pointerLockElement === canvas) return;
  pointerHint.textContent=pointerCaptureTried
    ? 'Clic derecho y arrastra para mirar · Clic izquierdo dispara · Esc: pausa'
    : 'Haz clic en el juego para activar el mouse · Si no se captura: clic derecho y arrastra';
  pointerFallback = true; pointerHint.classList.remove('hidden');
}
document.addEventListener('pointerlockerror', usePointerFallback);
function startInput() {
  pointerCaptureTried=false;
  if (touchMode) { pointerFallback = false; pointerHint.classList.add('hidden'); tryMobileLandscape(); }
  else if(document.pointerLockElement!==canvas)lockPointer();
}
function showLoadingProgress(percent){
  window.__maIntro?.setProgress(percent);
  el('loading-bar').style.width=percent+'%';
  el('loading-status').textContent=percent===100?'LISTO':'Preparando la ciudad…';
}
const loadingGate=createLoadingGate({
  getError:()=>alienLabError||explosiveLab.state.error||[roadSystem,sidewalkSystem,lampPostSystem,propSystem,thirdPerson,barricadeSystem].find(system=>!system.state.ready&&system.state.error)?.state.error || damageOverlay.info().errors[0],
  checks:[()=>!EXPLOSIVES_ENABLED||explosiveLab.state.ready,()=>!LOAD_ENEMY_ASSETS||!!alienTemplate,()=>weaponReady,()=>thirdPerson.state.ready,()=>__ma.carsReady(),()=>__ma.hospitalReady(),
    ()=>__ma.buildingsReady(),()=>__ma.casinosReady(),()=>__ma.placedBuildingsReady(),
    ()=>__ma.placedVehiclesReady(),()=>__ma.propsReady(),()=>__ma.roadsReady(),
    ()=>__ma.sidewalksReady(),()=>__ma.lampPostsReady(),()=>__ma.barricadeReady(),
    ()=>__ma.vegetationReady(),()=>palmSystem.state.ready||!!palmSystem.state.error,()=>__ma.floatingReady(),()=>__ma.audioInfo().ready,
    ()=>isoMinimap.state.ready||!!isoMinimap.state.error,()=>citySkyline.state.ready||!!citySkyline.state.error,
    ()=>!LOAD_ENEMY_ASSETS||__ma.damageInfo().ready,()=>__ma.vfxInfo().ready&&__ma.vfxInfo().atlases===(LOAD_ENEMY_ASSETS?3:0)],
  onProgress(fraction){
    showLoadingProgress(Math.round(fraction*90));
  },
});
window.__ma.loadingInfo=()=>loadingGate.info();
let combatWarmed=false;
function warmCombat(){
  if(combatWarmed)return;
  const group=new THREE.Group();group.name='Combat GPU warmup';
  const ground=ENEMIES_ENABLED?Array.from({length:GROUND_VISUAL_POOL_LIMIT},()=>buildAlienVisual()):[];
  const swarmWarm=groundSwarm.create({x:0,z:0});
  const explosiveWarm=EXPLOSIVES_ENABLED?explosiveLab.create({x:0,z:0},0,{wave:5}):null;
  const objects=[...(explosiveWarm?[explosiveWarm.g]:[]),...(swarmWarm?[swarmWarm.g]:[]),...ground.map(a=>a.visual),...(ENEMIES_ENABLED?floatingSystem.warmObjects():[]),...combatVFX.warmObjects(),...enemyPoints.warmObjects()];
  const point=camera.position.clone().addScaledVector(camera.getWorldDirection(new THREE.Vector3()),1);
  for(const object of objects){object.position.copy(point);object.frustumCulled=false;group.add(object);}
  // Behind the loading screen, use the actual canvas, fog and lights so the first shot reuses the exact GPU variants.
  scene.add(group);
  try{renderer.render(scene,camera);}finally{
    scene.remove(group);if(swarmWarm)groundSwarm.release(swarmWarm);
    if(explosiveWarm)explosiveLab.release(explosiveWarm);
    for(const alien of ground){alien.visual.removeFromParent();alien.visual.position.copy(alienTemplate.root.position);groundVisualPool.push(alien);}
  }
  combatWarmed=true;
}
function enterGame(newRun=false){
  if(S.mode==='paused'&&S.reloading&&S.reloadPausedAt!==null)S.reloadEnd+=Math.max(0,performance.now()/1000-S.reloadPausedAt);
  S.reloadPausedAt=null;
  el('loading-screen').setAttribute('aria-busy','false');
  window.__maMenu.showGameplay();
  S.mode='playing';if(newRun)invasionIntro?.begin(scoreSystem.info().runId);invasionIntro?.resume();
  S.startTime=performance.now()/1000-S.elapsed;syncScoreClock();recordSession();
  setRainLevel(invasionIntro?.active ? .22 : 1);rain.visible=waveAtmosphere.rainAmount>0;updateHUD();startInput();
}
async function startSession(restart=false){
  if(window.__ma.loadingError){location.reload();return;}
  if(mapOpen||S.mode==='loading'||S.mode==='playing')return;
  const intro=window.__maIntro,introRunning=intro?.phase==='playing';
  audio();gameAudio.unlock(AC);void backgroundMusic.prime();startRainSound();storm.primeAudio(AC,gameAudio.output('ambience'));if(introRunning)setRainLevel(0);
  if(S.mode==='paused'&&!restart&&!scoreSystem.info().ended){enterGame();return;}
  recordSession();bestRecords.flush();
  resetPlayer();clearMonsters();releaseWeaponInput();resetTouchInput();
  S.mode='loading';el('load-error').classList.add('hidden');
  showLoadingProgress(0);
  el('loading-screen').setAttribute('aria-busy','true');window.__maMenu.showLoading();
  if(!introRunning)startInput(); // Avoid locking the pointer over the intro controls.
  try{
    await thirdPerson.selectCharacter(window.__maMenu.info().character);
    await loadingGate.wait();
    await Promise.all([environmentReady,invasionIntro?.prepare(),groundSwarmReady,waveAtmosphereReady,explosiveLabReady]);
    if(ENEMIES_ENABLED){groundNavigation.prepare();waveSystem.reset();}
    showLoadingProgress(92);
    camera.fov=60;camera.updateProjectionMatrix();
    thirdPerson.updateCamera(0,{position:playerPos,yaw,pitch,aim:0,jump:0});
    updateThirdPerson(0,performance.now()/1000,'playing');
    await graphics.prepare();
    enemyShadows.prepareWorld();
    enemyShadows.follow(playerPos);
    viewOptimization.prepare(new Set([camera,thirdPerson.root,rifle,rain,worldMuzzleFlash,...propSystem.state.eggs.map(e=>e.g),...(window.__fires||[]).map(f=>f.fire)]));
    renderer.compile(scene,camera);
    setScopeView(true);rifle.position.copy(WEAPON_AIM);rifle.rotation.set(0,0,0);
    renderer.compile(weaponScene,weaponCamera);
    setScopeView(false);updateThirdPerson(0,performance.now()/1000,'playing');
    showLoadingProgress(96);
    await sceneGpuWarmup.warm({extraObjects:[rain,...citySkyline.warmObjects(),...(environmentDemo?.warmObjects?.()||[])],extraWarmup:()=>{warmCombat();graphics.warmMaterials(camera);}});
    citySkyline.update(storm.strength);
    renderer.render(scene,camera);
    releaseMobileDecoder();
    showLoadingProgress(100);
    intro?.setReady();
    if(introRunning)await intro.waitForFinish();
    enterGame(true);
  }catch(error){
    window.__ma.loadingError=error.message;
    intro?.abort();S.mode='menu';if(document.pointerLockElement)document.exitPointerLock();window.__maMenu.showMain();
    el('load-error').classList.remove('hidden');setRainLevel(.4);
  }
}
document.addEventListener('ma:intro-started',()=>{void startSession();});
document.addEventListener('ma:level-started',()=>{void startSession(true);});
document.addEventListener('ma:resume-requested',()=>{void startSession();});
function exitToMainMenu(event){
  if(!['playing','paused','dead'].includes(S.mode))return;
  if(S.mode==='playing')pauseGame();
  scoreSystem.finish('abandoned',performance.now());recordSession();bestRecords.flush();
  invasionIntro?.cancel();clearEnemyArrivals();releaseWeaponInput();resetTouchInput();S.mode='menu';closeMap();
  if(LOCAL_ENEMY_LAB)clearMonsters();
  if(document.pointerLockElement)document.exitPointerLock();
  waveAtmosphere.setWave(0,'menu');rain.visible=false;setRainLevel(0);window.__maMenu.showMain(event?.detail?.panel==='settings'?'settings':'levels');
}
document.addEventListener('ma:main-menu-requested',exitToMainMenu);
el('restart-btn').addEventListener('click',()=>{void startSession(true);});
document.addEventListener('pointerlockchange', () => {
  pointerRequestPending=false;
  const locked = document.pointerLockElement === canvas;
  if(locked&&(S.mode!=='playing'||mapOpen||document.hidden)){
    document.exitPointerLock();pointerWasLocked=false;return;
  }
  if (!locked && pointerWasLocked && S.mode === 'playing') {
    pauseGame();
  }
  if (locked) { pointerFallback = false; pointerHint.classList.add('hidden'); }
  pointerWasLocked = locked;
});
function clearMonsters() { clearEnemyArrivals();gameAudio.reset();for (const m of monsters) releaseGroundVisual(m); monsters.length = 0; floatingSystem.reset(); }
function die() {
  if(S.mode==='dead')return;
  scoreSystem.finish('death',performance.now());S.elapsed=scoreSystem.info().activeMs/1000;
  playerDodge.cancel();thirdPerson.die();
  recordSession();bestRecords.flush();
  S.mode = 'dead'; releaseWeaponInput(); resetTouchInput();
  playerMovementAudio?.stop();
  updateAmmoShop();
  setRainLevel(0.6);   // la lluvia sigue sonando como ambiente al 60%
  vel.x = 0; vel.z = 0; visualVelocity.x=visualVelocity.z=0; vy = 0; jumpY = 0; grounded = true;
  if (document.pointerLockElement) document.exitPointerLock();
  el('death-kills').textContent = S.kills;
  const t = Math.floor(S.elapsed);
  el('death-time').textContent = `${(t / 60) | 0}:${String(t % 60).padStart(2, '0')}`;
  window.__maMenu.showDeath();
}

// ---------- Controles táctiles (celular) ----------
// Detección: puntero grueso (coarse) o soporte de touch. En equipos sin
// táctil nada de esto se activa y el escritorio queda idéntico.
let touchMode = ('ontouchstart' in window) ||
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
function enableTouchMode() {
  if (!touchMode) { touchMode = true; document.body.classList.add('touch'); }
}
if (touchMode) document.body.classList.add('touch');
window.addEventListener('touchstart', enableTouchMode, { passive: true });
window.__ma.isTouch = () => touchMode;

const fullscreenControls = nativeGamepadHost ? {enter:()=>false} : createFullscreenControls({
  onHelp() { if (S.mode === 'playing') pauseGame(); },
  onResize() { requestAnimationFrame(resizeGameViewport); },
});
function tryMobileLandscape() { fullscreenControls.enter(); }

// Joystick virtual (izquierdo): joy.x = lateral, joy.y = vertical (abajo +)
const joy = { id: null, x: 0, y: 0 };
const JOY_R = 42;
const TOUCH_MOVE_DEADZONE=.08,TOUCH_FULL_SPEED=.85;
const TOUCH_SPRINT_START=.80,TOUCH_SPRINT_STOP=.65;
let touchSprinting=false;
const joyBase = el('joystick'), joyKnob = el('joystick-knob');
function handleJoy(t) {
  const r = joyBase.getBoundingClientRect();
  let dx = t.clientX - (r.left + r.width / 2);
  let dy = t.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
  joy.x = dx / JOY_R; joy.y = dy / JOY_R;
  joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function resetJoy() {
  joy.id = null; joy.x = 0; joy.y = 0; touchSprinting=false;
  if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
}
onBrowserTouch(joyBase,'touchstart', e => {
  if(S.mode!=='playing')return;
  e.preventDefault(); enableTouchMode();
  const t = e.changedTouches[0]; joy.id = t.identifier; handleJoy(t);
}, { passive: false });

// Mirada: arrastrar en la mitad derecha (misma sensibilidad/límites que el mouse)
const look = { id: null, lx: 0, ly: 0 };
const fireTouch = { id: null, lx: 0, ly: 0 };
const LOOK_SENS = 0.0042;
onBrowserTouch(el('look-zone'),'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode !== 'playing' || look.id !== null) return;
  const t = e.changedTouches[0]; look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY;
}, { passive: false });

onBrowserTouch(window,'touchmove', e => {
  if (S.mode !== 'playing') return;
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) { e.preventDefault(); handleJoy(t); }
    const drag = t.identifier === fireTouch.id ? fireTouch : t.identifier === look.id ? look : null;
    if (drag) {
      e.preventDefault();
      if(tacticalView.elevated)tacticalPointerInput(t.clientX-drag.lx,t.clientY-drag.ly);
      else{
        yaw -= (t.clientX - drag.lx) * LOOK_SENS * sens;
        pitch = THREE.MathUtils.clamp(pitch - (t.clientY - drag.ly) * LOOK_SENS * sens, -1.35, 1.35);
      }
      drag.lx = t.clientX; drag.ly = t.clientY;
    }
  }
}, { passive: false });
function endTouch(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) resetJoy();
    if (t.identifier === look.id) look.id = null;
    if (t.identifier === fireTouch.id) {
      fireTouch.id = null; S.touchFire = false; btnFire.classList.remove('active');
    }
  }
}
onBrowserTouch(window,'touchend', endTouch);
onBrowserTouch(window,'touchcancel', endTouch);

// Disparar: mantener para fuego automático y arrastrar ese mismo dedo para mirar.
const btnFire = el('btn-fire');
onBrowserTouch(btnFire,'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode !== 'playing' || fireTouch.id !== null) return;
  const t = e.changedTouches[0];
  fireTouch.id = t.identifier; fireTouch.lx = t.clientX; fireTouch.ly = t.clientY;
  S.touchFire = true; btnFire.classList.add('active');
}, { passive: false });
function resetTouchInput() {
  resetJoy(); look.id = null; fireTouch.id = null;
  S.touchFire = false; btnFire.classList.remove('active');
}
window.addEventListener('blur',()=>{resetTouchInput();S.keys={};if(S.mode==='playing')pauseGame();});
document.addEventListener('visibilitychange', () => {
  if(document.hidden){resetTouchInput();S.keys={};if(S.mode==='playing')pauseGame();}
});
onBrowserTouch(el('btn-reload'),'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing') startReload(performance.now() / 1000);
}, { passive: false });
onBrowserTouch(el('btn-jump'),'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  tryJump();
}, { passive: false });
onBrowserTouch(el('btn-pause'),'touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing') pauseGame();
}, { passive: false });
function pauseGame() {
  if(S.mode==='playing'&&S.reloading)S.reloadPausedAt=performance.now()/1000;
  invasionIntro?.pause();
  worldImpactAudio?.stop();
  playerMovementAudio?.stop();
  scoreSystem.setActive(false,performance.now());S.elapsed=scoreSystem.info().activeMs/1000;scoreSystem.flush();
  recordSession();bestRecords.flush();
  S.mode = 'paused'; releaseWeaponInput(); resetTouchInput();
  updateAmmoShop();
  setRainLevel(0.4);
  window.__maMenu.showPaused();
}

function moveIntroCharacter(dx,dz){
  if(!invasionIntro?.active||S.mode!=='playing'||document.hidden||!Number.isFinite(dx)||!Number.isFinite(dz))return;
  // Reuse the player capsule and all current map/vehicle/building boundaries.
  // Substeps also cover a late frame without tunnelling through a thin wall.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
  for(let i=0;i<steps;i++){playerPos.x+=dx/steps;playerPos.z+=dz/steps;resolveCollisions(playerPos,PLAYER_RADIUS);}
}
function moveHitCharacter(dx,dz){
  if(S.mode!=='playing'||invasionIntro?.active||document.hidden||!Number.isFinite(dx)||!Number.isFinite(dz))return {x:0,z:0};
  const x=playerPos.x,z=playerPos.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
  for(let i=0;i<steps;i++)movePlayerWithEnemyContacts(playerPos,dx/steps,dz/steps,PLAYER_RADIUS,monsters,resolveCollisions);
  return {x:playerPos.x-x,z:playerPos.z-z};
}
function updateThirdPerson(dt,now,mode=S.mode){
  const reloadProgress=S.reloading?THREE.MathUtils.clamp(1-(S.reloadEnd-now)/(RELOAD_MS/1000),0,1):0;
  const evasion=playerDodge.info();
  thirdPerson.update(dt,{position:playerPos,yaw:evasion.active?evasion.heading:yaw,pitch:tacticalView.elevated?tacticalAim.info().pitch:pitch,velocity:visualVelocity,aim:tacticalView.elevated?Math.max(.2,aimBlend):aimBlend,jump:jumpY,grounded,
    reloading:S.reloading,reloadProgress,recoil,mode,intro:invasionIntro?.active?invasionIntro.info():null,quake:cityChaos?.reaction(),dodge:evasion});
}

const visualVelocity={x:0,z:0};
function advancePlayerMovement(dt){
    if(thirdPerson.recovering){
      playerDodge.cancel();vel.x=vel.z=visualVelocity.x=visualVelocity.z=0;
      playerStamina.update(dt,{requested:false,running:false,active:!document.hidden});updateStaminaHUD();
      return {sprinting:false,speed:0};
    }
    const wasDodging=playerDodge.info().active;
    const evasion=playerDodge.update(dt,{playing:S.mode==='playing'&&!document.hidden,blocked:playerImpact.stunned||quakeAim.info().active});
    if(wasDodging){
      vel.x=vel.z=0;const beforeX=playerPos.x,beforeZ=playerPos.z,steps=Math.max(1,Math.ceil(Math.hypot(evasion.dx,evasion.dz)/.08));
      for(let i=0;i<steps;i++)movePlayerWithEnemyContacts(playerPos,evasion.dx/steps,evasion.dz/steps,PLAYER_RADIUS,monsters,resolveCollisions);
      visualVelocity.x=dt>0?(playerPos.x-beforeX)/dt:0;visualVelocity.z=dt>0?(playerPos.z-beforeZ)/dt:0;
      playerStamina.update(dt,{requested:false,running:false,active:!document.hidden});updateStaminaHUD();
      return {sprinting:false,speed:Math.hypot(visualVelocity.x,visualVelocity.z)};
    }
    // Movimiento WASD y/o joystick táctil, con aceleración y
    // desaceleración suaves: la velocidad actual se acerca a la
    // velocidad objetivo con amortiguación exponencial.
    // Sprint táctil con margen: una pequeña variación del dedo no corta la carrera.
    let fwd = (S.keys.KeyW ? 1 : 0) - (S.keys.KeyS ? 1 : 0);
    let strafe = (S.keys.KeyD ? 1 : 0) - (S.keys.KeyA ? 1 : 0);
    let joyMag = 0;
    if (touchMode) {
      joyMag = Math.min(1, Math.hypot(joy.x, joy.y));
      const strength=THREE.MathUtils.clamp((joyMag-TOUCH_MOVE_DEADZONE)/(TOUCH_FULL_SPEED-TOUCH_MOVE_DEADZONE),0,1);
      if(joyMag>TOUCH_MOVE_DEADZONE){fwd+=-joy.y/joyMag*strength;strafe+=joy.x/joyMag*strength;}
      touchSprinting=joyMag>=(touchSprinting?TOUCH_SPRINT_STOP:TOUCH_SPRINT_START);
    }
    const inputLen = Math.hypot(fwd, strafe);
    const mag = Math.min(1, inputLen);
    const sprintRequested = mag > 0.01 &&
      (!!S.keys.ShiftLeft || !!S.keys.ShiftRight || (touchMode && touchSprinting));
    const sprinting = playerStamina.canSprint(sprintRequested)&&aimBlend<.1&&!playerImpact.stunned;
    // Apuntar conserva la reducción a la mitad de la velocidad de caminar.
    const maxSpeed = THREE.MathUtils.lerp(sprinting ? SPRINT_SPEED : PLAYER_SPEED,
      PLAYER_SPEED * ADS_MOVE_SCALE, aimBlend)*playerImpact.movementScale();
    const movementYaw=tacticalView.movementYaw(yaw);
    const sin = Math.sin(movementYaw), cos = Math.cos(movementYaw);
    let tx = 0, tz = 0;
    if (inputLen > 0.01) {
      tx = ((-sin * fwd + cos * strafe) / inputLen) * maxSpeed * mag;
      tz = ((-cos * fwd - sin * strafe) / inputLen) * maxSpeed * mag;
    }
    const blend = 1-Math.exp(-dt*(inputLen>.01?MOVE_ACCEL:MOVE_BRAKE));
    vel.x += (tx - vel.x) * blend;
    vel.z += (tz - vel.z) * blend;
    const beforeX=playerPos.x,beforeZ=playerPos.z;
    movePlayerWithEnemyContacts(playerPos,vel.x*dt,vel.z*dt,PLAYER_RADIUS,monsters,resolveCollisions);
    const vx=dt>0?(playerPos.x-beforeX)/dt:0,vz=dt>0?(playerPos.z-beforeZ)/dt:0;
    const actual=Math.hypot(vx,vz),requested=Math.hypot(vel.x,vel.z),scale=actual>requested&&actual>0?requested/actual:1;
    visualVelocity.x=vx*scale;visualVelocity.z=vz*scale;
    playerStamina.update(dt,{requested:sprintRequested,running:sprinting,speed:Math.hypot(visualVelocity.x,visualVelocity.z),active:!document.hidden});
    updateStaminaHUD();
    return {sprinting,speed:Math.hypot(vel.x,vel.z)};

}

// Native SwiftUI owns the one in-game controller. Browser fallback remains for Web.
if(nativeGamepadHost)el('touch-ui').remove();

// ---------- Bucle principal ----------
const clock = new THREE.Clock();
let frozenMenuMode=null;
let lastIdleRender=-Infinity,idleVisualDelta=0;
function animate() {
  requestAnimationFrame(animate);
  const rawFrameMs=clock.getDelta()*1000;
  let dt = Math.min(rawFrameMs/1000, .05);
  graphics.sample(rawFrameMs,S.mode==='playing'&&!invasionIntro?.active&&!document.hidden);
  // Load assets in the background; leave the GPU free while the opening video plays.
  if (document.body.classList.contains('intro-playing')||S.mode==='loading') return;
  const now = performance.now() / 1000;

  invasionIntro?.update(rawFrameMs/1000,{mode:S.mode});
  const cityPreferences=invasionIntro?.info();
  placedBuildingSystem.update(dt,{active:S.mode==='playing'&&!document.hidden,reduced:!!(cityPreferences?.preferences.reduced||cityPreferences?.systemReducedMotion)});
  cityChaos?.update(dt,{mode:S.mode,hidden:document.hidden,intro:!!invasionIntro?.active,listener:playerPos,prefs:cityPreferences?.preferences,systemReducedMotion:cityPreferences?.systemReducedMotion});
  if(S.mode==='menu'||S.mode==='dead')quakeAim.reset();
  else quakeAim.update({playing:S.mode==='playing'&&!document.hidden,quake:cityChaos?.reaction(),intro:!!invasionIntro?.active,blocked:mapOpen,reduced:!!(cityPreferences?.preferences.reduced||cityPreferences?.systemReducedMotion)});
  dodgeWarning.update(monsters,{active:S.mode==='playing'&&!document.hidden&&!invasionIntro?.active&&!mapOpen&&!thirdPerson.recovering});
  syncScoreClock(now*1000);
  waveAtmosphere.update(dt,{mode:S.mode,hidden:document.hidden});
  syncBackgroundMusic();
  // Menu artwork covers the world. Release its audio and submit no invisible 3D frames.
  if(S.mode==='menu'||S.mode==='paused'){
    if(frozenMenuMode!==S.mode){
      gameAudio.update(0,now,playerPos,yaw,[...monsters,...floatingSystem.state.entities]);
      environmentDemo?.pause();frozenMenuMode=S.mode;
      playerMovementAudio?.stop();
    }
    return;
  }
  frozenMenuMode=null;

  // A paused/backgrounded city needs occasional redraws for layout, not a full GPU frame every rAF.
  // The clock and Score pause tracking still run on every tick; live play keeps its original cadence/quality.
  if(S.mode==='paused'||S.mode==='dead'||document.hidden){
    idleVisualDelta+=dt;
    if(now-lastIdleRender<.2)return;
    dt=idleVisualDelta;idleVisualDelta=0;lastIdleRender=now;
  }else idleVisualDelta=0;

  storm.update(dt,invasionIntro?.active||waveAtmosphere.suppressStorm?'paused':S.mode);
  citySkyline.update(storm.strength);
  propSystem.update(dt, playerPos, S.mode);
  lavaHazard?.update(dt,{mode:S.mode,playerPosition:playerPos,jumpY,blocked:!!invasionIntro?.active||document.hidden});
  ammoShopAcc += dt;
  if (ammoShopAcc >= .1 || ammoShopMode !== S.mode) {
    ammoShopAcc = 0; ammoShopMode = S.mode; updateAmmoShop();
  }

  // Hogueras
  if (window.__fires) for (const f of window.__fires) {
    const n = Math.sin(now * 11 + f.phase) * .35 + Math.sin(now * 23 + f.phase) * .2;
    f.light.intensity = f.base * (1 + n * .35);
    f.fire.scale.set(1 + n * .15, 1 + n * .3, 1 + n * .15);
  }
  muzzleFlash.intensity = Math.max(0, muzzleFlash.intensity - dt * 100);

  // Lluvia (ambiente): cae también en pausa y en la pantalla de
  // muerte; en el menú está oculta y no se actualiza.
  if (rain.visible) updateRain(dt);

  if (S.mode === 'playing'&&!invasionIntro?.active) {
    updateEnemyArrivals(dt);
    // S.elapsed is accumulated active-wave time; pause/background/intermission do not count.

    // Un mismo blend sincroniza postura, sensibilidad, FOV y marcha al apuntar.
    const aimTarget = S.aimHeld && weaponReady && !S.reloading&&!playerDodge.info().active&&!thirdPerson.recovering ? 1 : 0;
    aimBlend += (aimTarget - aimBlend) * (1 - Math.exp(-dt * 16));
    // Al asentarse queda exactamente sobre el eje óptico; el bob desaparece al apuntar.
    if (Math.abs(aimTarget - aimBlend) < .001) aimBlend = aimTarget;
    setScopeView(!tacticalView.elevated&&!S.reloading&&aimBlend>=.65);


    // Etapa C1: descubrimiento y minimapa a 10 Hz (nada por frame)
    discAcc += dt;
    if (discAcc >= 0.1) { discAcc = 0; updateDiscovery(now); }

    playerImpact.update(dt,{reduced:!!(cityPreferences?.preferences.reduced||cityPreferences?.systemReducedMotion),blocked:mapOpen});
    const {sprinting}=advancePlayerMovement(dt);

    // Salto: gravedad simple, solo suelo plano (no sube a obstáculos)
    if (!grounded) {
      vy += GRAVITY * dt;
      jumpY += vy * dt;
      if (jumpY <= 0) { jumpY = 0; vy = 0; grounded = true; }
    }

    // Cámara cercana sobre el hombro, independiente del cuerpo físico.
    const sway=aimSway.update(dt,{active:!document.hidden,blocked:tacticalView.elevated||mapOpen,aim:aimBlend,speed:Math.hypot(visualVelocity.x,visualVelocity.z),fatigue:playerStamina.info().fatigue,stun:playerImpact.info().remaining/.7,reduced:!!(cityPreferences?.preferences.reduced||cityPreferences?.systemReducedMotion)});
    const feedback=rifleFeedback.update(dt,{active:!document.hidden,...rifleFeedbackOptions()});
    thirdPerson.updateCamera(dt,{position:playerPos,yaw:yaw+sway.yaw+feedback.yaw,pitch:THREE.MathUtils.clamp(pitch+sway.pitch+feedback.pitch,-1.35,1.35),aim:tacticalView.elevated?0:aimBlend,jump:jumpY,followReaction:!!cityChaos?.reaction(),reactionMotionScale:GAMEPLAY_QUAKE_CAMERA_SCALE,reducedMotion:!!cityChaos?.reaction()?.reduced});
    drawMinimap();
    recoil = Math.max(0, recoil - dt * 7);
    // Clic derecho recupera el zoom óptico original del rifle.
    const targetFov = THREE.MathUtils.lerp(sprinting ? 62 : 60, ADS_FOV, aimBlend);
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();
    } else if (camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }

    tacticalView.update(dt,{player:playerPos,jump:jumpY});
    updateTacticalAim(dt);
    updateThirdPerson(dt,now);
    if(thirdPerson.followingAction){
      // Root motion has just moved the real capsule and animated pelvis. Follow
      // this frame, with the normal shoulder distance and the same wall rays.
      thirdPerson.updateCamera(0,{position:playerPos,yaw:yaw+sway.yaw+feedback.yaw,pitch:THREE.MathUtils.clamp(pitch+sway.pitch+feedback.pitch,-1.35,1.35),aim:tacticalView.elevated?0:aimBlend,jump:jumpY,followReaction:!!cityChaos?.reaction(),reactionMotionScale:GAMEPLAY_QUAKE_CAMERA_SCALE,reducedMotion:!!cityChaos?.reaction()?.reduced});
      tacticalView.update(0,{player:playerPos,jump:jumpY});
    }
    if(scopeView)updateScopeWeapon();
    applyWeakPointAimAssist(dt);

    // Disparo automático (clic sostenido o botón DISPARAR táctil)
    if ((S.mouseDown || S.touchFire) && now - S.lastShot >= FIRE_INTERVAL) shoot(now);
    // Fin de recarga
    if (S.reloading && now >= S.reloadEnd) {
      finishReload();
    }

    if(propSystem.state.ready) floatingSystem.update(dt,playerPos,{autoSpawn:false});

    // Spawner
    if(ENEMIES_ENABLED&&!window.__maNetGuest)waveSystem.update(dt);
    waveHudClock+=dt;if(waveHudClock>=.2){waveHudClock=0;updateWaveHUD();}

    // Monstruos: máquina de estados IDLE → CHASE → ATTACK, con HURT,
    // DEAD y SEARCH (búsqueda en la última posición conocida). La
    // percepción va escalonada; el resto, con escalares por frame.
    for (let i = monsters.length - 1; i >= 0; i--) {
      const mon = monsters[i];
      if(mon.spawning&&!mon.explosiveLab)continue;
      if(mon.explosiveLab){
        if(explosiveLab.update(mon,dt,playerPos)){releaseGroundVisual(mon);monsters.splice(i,1);}
        if(S.mode==='dead')break;
        continue;
      }
      mon.routeSteering=null;mon.crowdFacing=null;
      if(mon.swarm){
        if(groundSwarm.update(mon,dt,playerPos)){releaseGroundVisual(mon);monsters.splice(i,1);}
        if(S.mode==='dead')break;
        continue;
      }
      const p = mon.g.position;
      if (mon.alien) mon.alien.actualSpeed = 0;
      const dx = playerPos.x - p.x, dz = playerPos.z - p.z;
      const dist = Math.hypot(dx, dz, p.y);
      mon.stateT += dt;
      crawlerLeap.tick(mon,dt);enemyAlert.tick(mon,dt);

      // Feedback de impacto: destello rojo que decae (también en DEAD)
      if (mon.flash > 0) {
        mon.flash = Math.max(0, mon.flash - dt * 6);
        mon.mats.forEach(m => m.emissive.setRGB(mon.flash * .8, mon.flash * .08, mon.flash * .05));
      }

      if (mon.state === 'dead') {
        if (mon.alien) {
          // GLB: suena su clip de muerte (la caída ya viene en la
          // animación; nada de rotación procedural) y el cadáver se
          // retira al cerrar el clip (~2.3 s).
          updateAlienAnim(mon, dt);
          if (mon.stateT >= ALIEN_DEAD_TIME) { releaseGroundVisual(mon); monsters.splice(i, 1); }
          continue;
        }
        // Caída gobernada por el bucle (respeta pausa y reinicio):
        // rotación z hasta 90° en ~0.3 s y retirada a los 0.35 s.
        const k = Math.min(1, mon.stateT / 0.3);
        mon.g.rotation.z = (Math.PI / 2) * k;
        p.y = .3 * k;
        if (mon.stateT >= DEAD_TIME) { scene.remove(mon.g); monsters.splice(i, 1); }
        continue;
      }

      // Percepción escalonada (Etapa B, ajustes): cada ~0.2 s por
      // enemigo, con offset propio, comprueba si ve al jugador. Si lo
      // ve, su última posición conocida se refresca; si no, envejece.
      mon.lastSeenAgo += dt;
      mon.percepT -= dt;
      if (mon.percepT <= 0) {
        mon.percepT += PERCEPTION_INTERVAL;
        mon.seesPlayer = canSeePlayer(mon, dist);
        if (mon.seesPlayer) {
          if (!mon.lastKnown) mon.lastKnown = { x: 0, z: 0 };
          mon.lastKnown.x = playerPos.x; mon.lastKnown.z = playerPos.z;
          mon.lastSeenAgo = 0;
          enemyAlert.tryStart(mon,playerPos);
        }
      }

      let flinchX = 0;
      let faceX = playerPos.x, faceZ = playerPos.z;   // mirada por defecto: el jugador
      if(mon.state==='alert'){
        if(mon.lastKnown){faceX=mon.lastKnown.x;faceZ=mon.lastKnown.z;}
        enemyAlert.update(mon);
      } else if(mon.state==='leap'){
        const jump=mon.leap;
        if(jump){faceX=p.x+jump.x-jump.fromX;faceZ=p.z+jump.z-jump.fromZ;}
        crawlerLeap.update(mon,dt,playerPos);
        if(S.mode==='dead')break;
      } else if (mon.state === 'hurt') {
        // Keep walking/crawling through the brief hit reaction. Static world
        // collision and crowd steering remain the same as regular pursuit.
        const hurtDur = mon.alien ? mon.hurtDurNow : HURT_TIME * mon.hurtMul;
        const k = Math.min(1, mon.stateT / hurtDur);
        flinchX = mon.alien ? 0 : -0.15 * Math.sin(Math.PI * k);
        if(dist>MONSTER_ATTACK_RANGE)moveEnemy(mon,dt,enemyAlert.speed(mon),playerPos.x,playerPos.z);
        if (mon.stateT >= hurtDur) {
          // ATTACK y HURT usan la distancia real (contacto físico)
          if (dist <= MONSTER_ATTACK_RANGE) { mon.state = 'attack'; mon.stateT = 0; mon.struck = false; }
          else toChase(mon, false);
        }
      } else if (mon.state === 'attack') {
        // Ciclo individual: 0.75 s × attackCdMul (×0.9–1.1); la
        // recuperación absorbe la anticipación de 0.35 s.
        const cyc = MONSTER_ATTACK_CD * mon.attackCdMul;
        mon.walkPhase += dt * 7 * mon.animRate;
        if (!mon.alien) p.y = Math.abs(Math.sin(mon.walkPhase)) * mon.bobAmp;
        if (dist > ATTACK_EXIT_RANGE) {
          toChase(mon, false);
        } else {
          // Animación del golpe: preparación (brazos arriba, 0.35 s),
          // golpe (bajada rápida) y recuperación hasta cerrar el
          // ciclo; un solo intento de golpe por ciclo.
          const t = mon.stateT;
          let pose;
          if (t < ATTACK_WINDUP) pose = mon.armBase + (-2.2 - mon.armBase) * (t / ATTACK_WINDUP);
          else if (t < ATTACK_WINDUP + 0.15) pose = -2.2 + 1.05 * ((t - ATTACK_WINDUP) / 0.15);
          else pose = -1.15 + (mon.armBase + 1.15) * Math.min(1, (t - ATTACK_WINDUP - 0.15) / (cyc - ATTACK_WINDUP - 0.15));
          mon.parts.armL.rotation.x = pose;
          mon.parts.armR.rotation.x = pose;
          if (!mon.struck && t >= ATTACK_WINDUP) {
            mon.struck = true;
            // El daño solo aplica si el jugador sigue al alcance del
            // golpe y no está en su ventana de invulnerabilidad
            // (Etapa A); si es invulnerable, la animación ocurre igual.
            if (dist <= ATTACK_HIT_RANGE && now >= S.invulnUntil) {
              S.invulnUntil = now + INVULN_TIME;
              S.health -= MONSTER_DAMAGE;
              flashDamage(); sfx.hurt(); updateHUD();
              if (S.health <= 0) { die(); break; }
            }
          }
          if (t >= cyc) { mon.stateT = 0; mon.struck = false; }
        }
      } else if (mon.state === 'idle') {
        // IDLE: patrulla entre waypoints de la calle SIN conocer la
        // posición del jugador. Solo detecta por visión (percepción)
        // o por daño (damageMonster → HURT → CHASE).
        faceX = mon.patrolX; faceZ = mon.patrolZ;
        mon.walkPhase += dt * 7 * mon.animRate;
        moveEnemy(mon, dt, mon.speed * ENEMY_IDLE_SPEED, mon.patrolX, mon.patrolZ);
        walkAnim(mon);
        const pdx = mon.patrolX - p.x, pdz = mon.patrolZ - p.z;
        if (pdx * pdx + pdz * pdz < 2.25) pickPatrol(mon);   // llegó: otro extremo
        if (mon.seesPlayer) toChase(mon, true);
      } else if (mon.state === 'chase') {
        // CHASE: el objetivo es la última posición conocida. Mientras
        // lo ve, la percepción la mantiene igual a la real; si lo
        // pierde, va a ese punto, no al jugador.
        const tx = mon.lastKnown ? mon.lastKnown.x : playerPos.x;
        const tz = mon.lastKnown ? mon.lastKnown.z : playerPos.z;
        faceX = tx; faceZ = tz;
        if (mon.reactLeft > 0) {
          // Reacción individual: se orienta hacia el objetivo pero
          // aún no avanza (nada de arranques sincronizados).
          mon.reactLeft -= dt;
        } else if(crawlerLeap.tryStart(mon,playerPos)){
          faceX=mon.leap.x;faceZ=mon.leap.z;
        } else {
          mon.walkPhase += dt * 7 * mon.animRate;
          moveEnemy(mon, dt, enemyAlert.speed(mon), tx, tz);
          walkAnim(mon);
          const tdx = tx - p.x, tdz = tz - p.z;
          const atKnown = tdx * tdx + tdz * tdz < 0.64;
          if (dist <= MONSTER_ATTACK_RANGE) { mon.state = 'attack'; mon.stateT = 0; mon.struck = false; }
          else if (mon.lastSeenAgo > MEMORY_TIME || (atKnown && mon.lastSeenAgo > 0.25)) toSearch(mon);
        }
      } else if (mon.state === 'search') {
        // SEARCH: va a la última posición conocida y, al llegar, la
        // escanea girando la mirada durante SEARCH_TIME. Si vuelve a
        // ver al jugador → CHASE; si la búsqueda expira → IDLE (lo
        // perdió de verdad: se limpia la memoria y el aggro).
        if (mon.seesPlayer) {
          toChase(mon, true);
        } else if (!mon.searchArrived) {
          const tx = mon.lastKnown ? mon.lastKnown.x : p.x;
          const tz = mon.lastKnown ? mon.lastKnown.z : p.z;
          faceX = tx; faceZ = tz;
          mon.walkPhase += dt * 7 * mon.animRate;
          moveEnemy(mon, dt, mon.speed, tx, tz);
          walkAnim(mon);
          const tdx = tx - p.x, tdz = tz - p.z;
          if (tdx * tdx + tdz * tdz < 0.64 || groundNavigation.arrived(mon)) { mon.searchArrived = true; mon.scanT = 0; mon.scanYaw = mon.g.rotation.y; }
        } else {
          mon.scanT += dt;
          const a = mon.scanYaw + Math.sin(mon.scanT * 2.2) * 0.95;
          faceX = p.x + Math.sin(a); faceZ = p.z + Math.cos(a);
          p.y = 0;
          mon.parts.armL.rotation.x = mon.armBase;
          mon.parts.armR.rotation.x = mon.armBase;
          if (mon.scanT >= SEARCH_TIME) toIdle(mon);
        }
      }
      updateAlienAnim(mon, dt);   // no-op si el enemigo es procedural
      const facing=mon.crowdFacing||mon.routeSteering;
      if(facing){faceX=facing.x;faceZ=facing.z;}
      mon.g.lookAt(faceX, mon.state==='leap'?mon.g.position.y:0, faceZ);
      if (flinchX) mon.g.rotation.x += flinchX;
      if (mon.alien) resolveEnemyCollisions(mon);
    }

    dodgeWarning.update(monsters,{active:S.mode==='playing'&&!document.hidden&&!invasionIntro?.active&&!mapOpen&&!thirdPerson.recovering});
    // Spiders pass through aliens; same-kind bodies yield softly, without
    // animated limb penetration pushing entire actors backwards into obstacles.
    separateCrowd(monsters,dt,resolveEnemyCollisions);
  }

  if(S.mode!=='playing'){
    if(scopeView||aimBlend>0){setScopeView(false);aimBlend=0;thirdPerson.updateCamera(0,{position:playerPos,yaw,pitch,aim:0,jump:jumpY});updateThirdPerson(0,now,S.mode==='dead'?'dead':'playing');}
    tacticalView.update(0,{player:playerPos,jump:jumpY});
    updateThirdPerson(dt,now);
  }
  if(invasionIntro?.active){
    updateThirdPerson(dt,now,'playing');
    const intro=invasionIntro.info();
    thirdPerson.updateCamera(dt,{position:playerPos,yaw,pitch,aim:0,jump:0,followReaction:true,reducedMotion:intro.preferences.reduced||intro.systemReducedMotion});
    tacticalView.update(dt,{player:playerPos,jump:0});
  }
  // Follow the current frame's movement and camera, after the running pose.
  flashlightPosition.copy(playerPos);flashlightPosition.y+=jumpY-.22;
  if(tacticalView.elevated)tacticalView.shotDirection(tacticalShotYaw(),tacticalAim.info().pitch,flashlightDirection);
  else camera.getWorldDirection(flashlightDirection);
  waveAtmosphere.aim(flashlightPosition,flashlightDirection);
  if(!invasionIntro?.active&&healthRegeneration.update(dt,S))updateHUD();
  gameAudio.update(dt,now,playerPos,yaw,[...monsters,...floatingSystem.state.entities]);
  playerMovementAudio?.update(dt,{mode:S.mode,position:playerPos,grounded,blocked:!!invasionIntro?.active,hidden:document.hidden,fatigue:playerStamina.info().fatigue,...thirdPerson.footstepState()});
  // Temporary render-space compensation; weather and saved fog retain their real state.
  const worldFogDensity=scene.fog.density;
  const gameplayFov=camera.fov;
  captureRifleReticle();
  if(scopeView){opticAnchor.getWorldPosition(opticLocal);scopeBaseQuaternion.copy(camera.quaternion);}
  cinematicPosition.copy(camera.position);cinematicRotation.copy(camera.quaternion);
  try{
  scene.fog.density=(invasionIntro?.fogDensity(worldFogDensity)??worldFogDensity)*(1-.65*tacticalView.blend);
  stratExplosionCamera.apply(camera,invasionIntro?.info(),environmentDemo?.stratBlastAnchor);
  scene.fog.density=stratExplosionCamera.fogDensity(scene.fog.density);
  if(environmentDemo){
    environmentDemo.setStratShotVeil?.(stratExplosionCamera.info().weight);
    environmentDemo.setBlastLight?.(invasionIntro?.blastLight()||0);
    camera.getWorldDirection(environmentForward);environmentUp.set(0,1,0).applyQuaternion(camera.quaternion);
    environmentDemo.update(dt,{mode:S.mode,phase:invasionIntro?.active?'invasion':waveSystem.state.phase,listener:playerPos,playerPosition:playerPos,jumpY,forward:environmentForward,up:environmentUp,pixelScale:renderer.domElement.height*camera.projectionMatrix.elements[5]*.5});
  }

  // Partículas y trazadoras
  combatVFX.update(dt,{camera,pixelScale:renderer.domElement.height*camera.projectionMatrix.elements[5]*.5});
  enemyPoints.update(dt);
  damageOverlay.update(dt);
  worldMuzzleFlash.intensity = muzzleFlash.intensity;
  if (worldMuzzleFlash.intensity > 0||combatVFX.muzzleVisible){getMuzzleWorld(worldMuzzleFlash.position);combatVFX.setMuzzlePosition(worldMuzzleFlash.position);}
  graphics.updateLights(playerPos);
  enemyShadows.follow(playerPos);
  viewOptimization.setDrawDistance?.(graphics.policy.info().profile.drawDistance);
  viewOptimization.update(monsters,floatingSystem.state.entities);
  // Tactical visibility uses the original eye-level blockers, never rooftop/X-ray detection.
  if(tacticalView.elevated){
    for(const enemy of [...monsters,...floatingSystem.state.entities]){
      if(!enemy.g.visible)continue;
      const distance=Math.hypot(enemy.g.position.x-playerPos.x,enemy.g.position.z-playerPos.z);
      let cached=tacticalVisibility.get(enemy);
      if(!cached||now-cached.time>=.2){cached={time:now,visible:canSeePlayer(enemy,distance)};tacticalVisibility.set(enemy,cached);}
      enemy.g.visible=cached.visible;
    }
  }
  const introQuake=!!invasionIntro?.active;
  const cinematicShake=introQuake?invasionIntro.shake():cityChaos?.shake()||[0,0,0];
  const impact=playerImpact.camera(),feedback=rifleFeedback.info();
  // Split the existing recoil between camera motion and weapon aim. The
  // quake-deflected shot ray was captured above; project it into this shaken view.
  // Softer recurring camera motion; the approved introduction and physical
  // weapon instability retain their own existing clocks and settings.
  const quakePitch=introQuake?0:THREE.MathUtils.clamp(cinematicShake[1]*2.8,-.10,.10)*GAMEPLAY_QUAKE_CAMERA_SCALE;
  const quakeYaw=introQuake?0:THREE.MathUtils.clamp(cinematicShake[0]*2.6,-.07,.07)*GAMEPLAY_QUAKE_CAMERA_SCALE;
  const quakeRoll=introQuake?cinematicShake[2]:THREE.MathUtils.clamp(cinematicShake[2]*1.8,-.045,.045)*GAMEPLAY_QUAKE_CAMERA_SCALE;
  const cameraPitch=impact.pitch+quakePitch-feedback.pitch*.5;
  const cameraYaw=impact.yaw+quakeYaw-feedback.yaw*.5;
  camera.translateX(introQuake?cinematicShake[0]:THREE.MathUtils.clamp(cinematicShake[0]*2,-.1,.1)*GAMEPLAY_QUAKE_CAMERA_SCALE);camera.translateY(introQuake?cinematicShake[1]:THREE.MathUtils.clamp(cinematicShake[1]*2,-.1,.1)*GAMEPLAY_QUAKE_CAMERA_SCALE);
  camera.rotation.x+=cameraPitch;camera.rotation.y+=cameraYaw;camera.rotateZ(quakeRoll+impact.roll);camera.updateMatrixWorld(true);
  updateRifleReticle();
  cameraFeedbackSnapshot={impact,aimDisturbance:quakeAim.info(),quake:[...cinematicShake],renderAngles:[camera.rotation.x,camera.rotation.y,camera.rotation.z],renderPosition:camera.position.toArray(),fov:camera.fov,aimPoint:reticleCenter.toArray(),ray:reticleDirection.toArray(),origin:reticleOrigin.toArray(),reticle:[parseFloat(el('crosshair').style.left||'50'),parseFloat(el('crosshair').style.top||'50')]};
  renderer.render(scene, camera);
  if(scopeView){
    weaponCamera.fov=camera.fov;weaponCamera.aspect=camera.aspect;weaponCamera.updateProjectionMatrix();
    // Render the same moving optic that selected the bullet. Compensate the
    // temporary camera shake too; otherwise the overlay gun stays fixed while
    // its target moves. Align at the captured target distance, avoiding near-
    // camera parallax during earthquake translations.
    const disturbance=quakeAim.info();
    scopeQuakeQuaternion.setFromEuler(quakeAimRotation.set(disturbance.pitch,disturbance.yaw,0,'YXZ'));
    weaponScene.quaternion.copy(camera.quaternion).invert().multiply(scopeBaseQuaternion).multiply(scopeQuakeQuaternion);
    opticRendered.copy(opticLocal).applyQuaternion(weaponScene.quaternion);
    opticTarget.copy(reticleCenter).project(camera);
    const opticDepth=-opticRendered.z,tangent=Math.tan(weaponCamera.fov*Math.PI/360);
    weaponScene.position.set(opticTarget.x*opticDepth*tangent*weaponCamera.aspect-opticRendered.x,opticTarget.y*opticDepth*tangent-opticRendered.y,0);
    weaponScene.updateMatrixWorld(true);
    opticAnchor.getWorldPosition(opticRendered).project(weaponCamera);
    cameraFeedbackSnapshot.optic=[(opticRendered.x*.5+.5)*100,(.5-opticRendered.y*.5)*100];
    renderer.autoClear=false;renderer.clearDepth();renderer.render(weaponScene,weaponCamera);renderer.autoClear=true;
  }
  isoMinimap?.composite();
  }finally{weaponScene.position.set(0,0,0);weaponScene.quaternion.identity();weaponScene.updateMatrixWorld(true);cityChaos?.restoreReactions();scene.fog.density=worldFogDensity;camera.position.copy(cinematicPosition);camera.quaternion.copy(cinematicRotation);if(camera.fov!==gameplayFov){camera.fov=gameplayFov;camera.updateProjectionMatrix();}camera.updateMatrixWorld(true);}
}
updateHUD();
animate();

// Match the canvas's dynamic viewport, including mobile browser bars and rotation.
let viewportWidth = 0, viewportHeight = 0;
function resizeGameViewport() {
  const { width, height } = renderer.domElement.getBoundingClientRect();
  const w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
  if (w === viewportWidth && h === viewportHeight) return;
  viewportWidth = w; viewportHeight = h;
  camera.aspect = weaponCamera.aspect = w / h;
  camera.updateProjectionMatrix(); weaponCamera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (touchMode) resetTouchInput();
}
// Remove Three's inline dimensions so CSS can follow the available viewport.
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '';
window.addEventListener('resize', resizeGameViewport);
window.visualViewport?.addEventListener('resize', resizeGameViewport);
resizeGameViewport();

// PLAY may have started the intro while this module was still downloading.
if(window.__maIntro&&window.__maIntro.phase!=='pending')void startSession();

// Online Etapa 1 (cooperativo): adaptador mínimo para netplay.js. El invitado
// no genera oleadas propias (ver el guard de waveSystem.update en animate);
// el anfitrión expone su estado y el de sus monstruos para transmitirlos.
let __netMonsterSeq=0;
window.__maNetAdapter={
  scene,camera,THREE,
  localState(){return {p:[playerPos.x,playerPos.y,playerPos.z],yaw,pitch,hp:S.health,mode:S.mode};},
  monsters(){const out=[];for(const m of monsters){if(!m.g)continue;m.__nid??=++__netMonsterSeq;out.push({id:m.__nid,x:m.g.position.x,y:m.g.position.y,z:m.g.position.z,hp:Math.max(0,Math.ceil(m.hp||0))});}return out;},
  setGuest(v){window.__maNetGuest=!!v;},
};
