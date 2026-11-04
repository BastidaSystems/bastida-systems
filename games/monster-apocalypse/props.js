// Environmental props only: original gameplay functions stay in game.js.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { addAmmoDecoration } from './ammo-decoration.js';
import { replaceRocks } from './rocks.js';
import { addGroundPebbles,addGroundGrain } from './ground-pebbles.js?v=110';

const EGG_SIZE_MULTIPLIER = 2; // Uniform doubling; placement and hit volumes use the same size.
const EGG_ANCHORS = [
  [-24.4, -30.2, 'hospital'], [-34.1, -29.8, 'hospital'], [-13.3, -46.8, 'hospital'],
  [-5.6, -44.4, 'vehículo norte'], [-9.6, -25.4, 'vehículo oeste'], [9.8, -11.4, 'vehículo este'],
  [-10.0, 2.5, 'vehículo volcado'], [-10.9, -17.3, 'zona infectada oeste'], [11.5, 26.2, 'zona infectada este'],
  [7.2, 35.2, 'vehículo sur'], [14.2, 34.4, 'comisaría'], [25.0, 29.2, 'comisaría'],
  [43.0, 34.6, 'fábrica'], [49.5, 34.2, 'fábrica'], [-8.1, 48.4, 'zona infectada sur'],
];
// Separate PRNG: placement/effects don't consume the gameplay random stream.
function randomSequence(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
async function loadMaterials(base) {
  const materials = await new MTLLoader().loadAsync(base + 'materials.mtl');
  await new Promise((resolve, reject) => {
    materials.setManager(new THREE.LoadingManager(resolve, undefined, url => reject(new Error(url))));
    materials.preload();
  });
  const material = materials.create('Material');
  material.map.flipY = false; // Blender already flipped V for glTF.
  material.map.needsUpdate = true;
  return material;
}
function setMaterial(root, material) {
  root.traverse(mesh => { if (mesh.isMesh) { mesh.material.dispose(); mesh.material = material; } });
}
function normalizedTemplate(root, height) {
  const wrapper = new THREE.Group(); wrapper.add(root);
  let box = new THREE.Box3().setFromObject(wrapper, true);
  root.scale.setScalar(height / (box.max.y - box.min.y));
  box = new THREE.Box3().setFromObject(wrapper, true);
  root.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  wrapper.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(wrapper, true);
  return { root: wrapper, width: box.max.x - box.min.x, depth: box.max.z - box.min.z, height };
}

export function createPropSystem({ scene, colliders, shootBlockers, MAPREG, MAP, resolvePosition, getAudioContext, getAudioOutput=()=>null, getGroundSurfaces=()=>[], rocksEnabled=true,pebblesEnabled=true }) {
  const state = { ready: false, trash: [], eggs: [], rocks: [], paths: [], sound: null, error: null };
  let effectTime = 0, soundAcc = 0;
  const terrainRay = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  const scratch = new THREE.Vector3();
  function groundY(x, z, surfaces) {
    terrainRay.set(scratch.set(x, 3, z), down); terrainRay.far = 4;
    return terrainRay.intersectObjects(surfaces, false)[0]?.point.y ?? 0;
  }
  function replaceTrash(template, surfaces) {
    for (const record of state.trash) {
      const visual = template.root.clone(true);
      visual.name = 'Bote de basura';
      visual.position.set(record.x, groundY(record.x, record.z, surfaces), record.z);
      visual.rotation.y = record.x < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(visual);
      // Keep the exact old cylinder as an invisible ray proxy, along with its collider,
      // fire cone, flickering light and original reference in __fires.
      record.mesh.visible = false;
      record.visual = visual; record.loaded = true;
    }
  }
  function placeEggs(templates, surfaces) {
    const rng = randomSequence(0xead2026), obstacles = [];
    scene.traverse(o => {
      if (o.isMesh && o.geometry.type === 'DodecahedronGeometry') obstacles.push(new THREE.Box3().setFromObject(o, true));
    });
    for (const trash of state.trash) obstacles.push(new THREE.Box3().setFromObject(trash.visual, true));
    const kinds = [2, 0, 4, 1, 3, 4, 0, 2, 1, 3, 2, 4, 3, 0, 1];
    function clear(x, z, radius) {
      const margin = radius + .35;
      if (Math.abs(x) > MAP.halfW - margin || Math.abs(z) > MAP.halfL - margin) return false;
      if (state.paths.some(r => x + margin > r.minX && x - margin < r.maxX && z + margin > r.minZ && z - margin < r.maxZ)) return false;
      if (MAPREG.buildings.some(r => x + margin > r.minX && x - margin < r.maxX && z + margin > r.minZ && z - margin < r.maxZ)) return false;
      if (obstacles.some(b => x + radius > b.min.x && x - radius < b.max.x && z + radius > b.min.z && z - radius < b.max.z)) return false;
      scratch.set(x, 0, z); resolvePosition(scratch, margin, true);
      if (Math.hypot(scratch.x - x, scratch.z - z) > 1e-5) return false;
      return state.eggs.every(e => Math.hypot(e.x - x, e.z - z) > e.radius + margin);
    }
    for (let i = 0; i < EGG_ANCHORS.length; i++) {
      const [ax, az, zone] = EGG_ANCHORS[i], kind = kinds[i], template = templates[kind];
      const size = (.92 + rng() * .30) * EGG_SIZE_MULTIPLIER, radius = Math.hypot(template.width, template.depth) / 2 * size;
      let x, y, z;
      function tryPosition(px,pz){
        if(!clear(px,pz,radius))return false;
        const floor=groundY(px,pz,surfaces);
        for(let sample=0;sample<8;sample++){
          const a=sample*Math.PI/4;
          if(Math.abs(groundY(px+Math.cos(a)*radius,pz+Math.sin(a)*radius,surfaces)-floor)>.03)return false;
        }
        x=px;y=floor;z=pz;return true;
      }
      for (let attempt = 0; attempt < 64; attempt++) {
        const angle = rng() * Math.PI * 2, jitter = .12 + Math.sqrt(attempt) * .45;
        const px = ax + Math.cos(angle) * jitter, pz = az + Math.sin(angle) * jitter;
        if(tryPosition(px,pz))break;
      }
      if(x===undefined){
        // Oversized landmarks can cover an entire old anchor zone. Keep all
        // eggs, using the nearest supported free ground only as a fallback.
        const margin=radius+.35,candidates=[];
        for(let pz=-MAP.halfL+margin;pz<=MAP.halfL-margin;pz+=2)for(let px=-MAP.halfW+margin;px<=MAP.halfW-margin;px+=2)
          candidates.push({x:px,z:pz,d:(px-ax)**2+(pz-az)**2});
        candidates.sort((a,b)=>a.d-b.d);
        for(const p of candidates)if(tryPosition(p.x,p.z))break;
      }
      if (x === undefined) throw new Error('No hay posición libre para el huevo de ' + zone);
      const g = template.root.clone(true); g.name = 'Huevo alienígena ' + (i + 1);
      const material = template.material.clone(); material.emissive.setHex(0x722535);
      material.emissiveMap = material.map; material.emissiveIntensity = .08;
      const meshes = []; g.traverse(o => { if (o.isMesh) { o.material = material; meshes.push(o); } });
      // Face the nearest street, with varied yaw, rather than repeating parallel rows.
      let target = null, distance = Infinity;
      for (const r of MAPREG.streets) {
        const vertical = r.maxZ - r.minZ > r.maxX - r.minX;
        const tx = vertical ? (r.minX + r.maxX) / 2 : THREE.MathUtils.clamp(x, r.minX, r.maxX);
        const tz = vertical ? THREE.MathUtils.clamp(z, r.minZ, r.maxZ) : (r.minZ + r.maxZ) / 2;
        const d = (x - tx) ** 2 + (z - tz) ** 2;
        if (d < distance) { distance = d; target = { x: tx, z: tz }; }
      }
      const yaw = Math.atan2(target.x - x, target.z - z) + (rng() - .5) * 1.4;
      const cos = Math.cos(yaw), sin = Math.sin(yaw), halfX = template.width * size / 2, halfZ = template.depth * size / 2;
      const ex = Math.abs(cos) * halfX + Math.abs(sin) * halfZ, ez = Math.abs(sin) * halfX + Math.abs(cos) * halfZ;
      const collider = { cx: x, cz: z, halfX, halfZ, cos, sin, minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez };
      g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(size);
      scene.add(g); colliders.push(collider); shootBlockers.push(...meshes);
      state.eggs.push({ g, x, y, z, kind, zone, size, radius, material, meshes, collider,
        phase: rng() * Math.PI * 2, rate: .78 + rng() * .28 });
    }
  }
  function startSound() {
    const ac = getAudioContext(); if (!ac || ac.state === 'closed' || state.sound || state.soundUnavailable) return;
    try {
    const gain = ac.createGain(), filter = ac.createBiquadFilter();
    gain.gain.value = 0; filter.type = 'lowpass'; filter.frequency.value = 300; filter.Q.value = .7;
    filter.connect(gain).connect(getAudioOutput()||ac.destination);
    const voices = [];
    for (const [frequency, type] of [[58, 'triangle'], [91.5, 'sine']]) {
      const oscillator = ac.createOscillator(), voiceGain = ac.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency; voiceGain.gain.value = .5;
      oscillator.connect(voiceGain).connect(filter); oscillator.start(); voices.push(oscillator);
    }
    state.sound = { gain, voices, target: 0, context: ac };
    } catch { state.soundUnavailable = true; } // Audio is optional; rendering/gameplay continue.
  }
  return {
    state,
    registerTrash(record) { state.trash.push(record); },
    registerRock(record) { state.rocks.push(record); },
    reservePath(rect) { state.paths.push(rect); },
    async load(environmentReady) {
      try {
        const eggBase = 'assets/props/eggs/', trashBase = 'assets/props/trash/', rockBase = 'assets/props/rocks/';
        const [eggMaterial, trashMaterial, eggFiles, trashFile, rockMaterial, rockFiles] = await Promise.all([
          loadMaterials(eggBase), loadMaterials(trashBase),
          Promise.all([1, 2, 3, 4, 5].map(i => new GLTFLoader().loadAsync(eggBase + 'egg' + i + '.glb'))),
          new GLTFLoader().loadAsync(trashBase + 'model.glb'),
          loadMaterials(rockBase), // Shared by small ground stones even when large rocks are disabled.
          rocksEnabled ? Promise.all([1, 2, 3, 4, 5].map(i => new GLTFLoader().loadAsync(rockBase + 'rock' + i + '.glb'))) : [],
        ]);
        await environmentReady; // placement sees the final hospital/car colliders.
        const surfaces = scene.children.filter(o => o.isMesh && (o.geometry.type === 'PlaneGeometry' ||
          (o.geometry.type === 'BoxGeometry' && o.geometry.parameters.height * o.scale.y <= .30)));
        setMaterial(trashFile.scene, trashMaterial); replaceTrash(normalizedTemplate(trashFile.scene, 1.4), surfaces);
        const templates = eggFiles.map(file => {
          setMaterial(file.scene, eggMaterial);
          return { ...normalizedTemplate(file.scene, 1), material: eggMaterial };
        });
        placeEggs(templates, surfaces);
        state.rockBatches = rocksEnabled ? replaceRocks({ roots: rockFiles.map(f => f.scene), material: rockMaterial, records: state.rocks,
          scene, colliders, shootBlockers, paths: state.paths, trash: state.trash, MAP, MAPREG, resolvePosition,
          groundY: (x, z) => groundY(x, z, surfaces) }) : [];
        state.ammoDecoration = addAmmoDecoration(scene, state.trash, (x, z) => groundY(x, z, surfaces));
        const pebbleSurfaces=getGroundSurfaces();
        state.groundGrain=addGroundGrain(pebbleSurfaces.filter(s=>s.name!=='Banquetas de concreto Meshy'));
        state.pebbles=pebblesEnabled?addGroundPebbles({scene,material:rockMaterial,MAP,MAPREG,resolvePosition,groundY:(x,z)=>groundY(x,z,pebbleSurfaces.length?pebbleSurfaces:surfaces)}):{info:()=>({count:0,batches:0,disabled:true})};
        state.ready = true;
      } catch (error) { state.error = error.message; console.warn('No cargaron los objetos nuevos', error); }
    },
    update(dt, playerPos, mode) {
      if (!state.ready) return;
      let nearest2 = Infinity;
      if (mode === 'playing') effectTime += dt;
      for (const e of state.eggs) {
        const d2 = (e.x - playerPos.x) ** 2 + (e.z - playerPos.z) ** 2;
        if (d2 < nearest2) nearest2 = d2;
        if (mode === 'playing' && d2 < 32 * 32) {
          const wave = Math.sin(effectTime * e.rate + e.phase);
          e.g.scale.y = e.size * (1 + wave * .006); // base pivot stays exactly on the ground.
          e.material.emissiveIntensity = .09 + wave * .04;
        }
      }
      soundAcc += dt;
      if (soundAcc < .1) return; soundAcc = 0;
      if (mode === 'playing' && nearest2 < 64) startSound();
      if (state.sound) {
        const proximity = mode === 'playing' ? Math.max(0, 1 - Math.sqrt(nearest2) / 8) : 0;
        const target = .012 * proximity * proximity * (.9 + .1 * Math.sin(effectTime * .61));
        if (Math.abs(target - state.sound.target) > .00001 || target === 0 && state.sound.target !== 0) {
          state.sound.gain.gain.setTargetAtTime(target, state.sound.context.currentTime, .2);
          state.sound.target = target;
        }
      }
    },
    info() {
      return { ready: state.ready, error: state.error, pebbles:state.pebbles?.info(), groundGrain:state.groundGrain?.info(), trash: state.trash.map(t => ({ x: t.x, z: t.z, loaded: !!t.loaded })),
        rocks: state.rocks.map(r => ({ kind: r.kind + 1, x: r.x, y: r.y, z: r.z, height: r.height, loaded: !!r.loaded })),
        eggs: state.eggs.map(e => ({ kind: e.kind + 1, zone: e.zone, x: e.x, y: e.y, z: e.z, height: e.size })) };
    },
  };
}
