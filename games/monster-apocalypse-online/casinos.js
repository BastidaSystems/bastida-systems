import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import {addCasinoNeon} from './casino-neon.js?v=20261015-casino-neon1';
import { selectedBuildingAsset } from './building-catalog.js?v=20261015-casino-gas-lower1';
import { loadCustomBuilding, prepareCustomBuilding } from './custom-buildings.js?v=20261015-mobile-memory1';

// Loads only active registered casinos. The hospital and removed lion casino are excluded.
export function createCasinoSystem({ scene, colliders, shootBlockers, MAPREG, getSidewalks, terrainReady, onPlacementChanged, getTextureAnisotropy=()=>1 }) {
  const state = { ready: false, error: null, records: [] };
  let loading;
  const remove = (list, items) => {
    for (const item of items) { const i = list.indexOf(item); if (i >= 0) list.splice(i, 1); }
  };
  const rounded = n => Math.round(n * 1e8) / 1e8;
  function prepare(record, file, footprint, material) {
    const root = new THREE.Group(); root.name = record.def.name;
    root.add(file.scene);
    const blockers = [];
    file.scene.traverse(o => {
      if (o.isMesh) { o.material.dispose(); o.material = material; blockers.push(o); }
    });
    let box = new THREE.Box3().setFromObject(root, true);
    const scale = footprint.width / (box.max.x - box.min.x);
    file.scene.scale.setScalar(scale);
    box = new THREE.Box3().setFromObject(root, true);
    // Local front is +Z; anchor it to the same west/north street frontage as before.
    file.scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -box.max.z);
    const west = record.def.id === 'comisaria', yaw = west ? -Math.PI / 2 : Math.PI;
    const cos = rounded(Math.cos(yaw)), sin = rounded(Math.sin(yaw));
    const x = west ? record.rect.minX : record.def.cx, z = west ? record.def.cz : record.rect.minZ;
    root.rotation.y = yaw; root.position.set(x, 0, z); root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root, true);
    if (box.min.x < record.rect.minX - .001 || box.max.x > record.rect.maxX + .001 ||
        box.min.z < record.rect.minZ - .001 || box.max.z > record.rect.maxZ + .001 ||
        !footprint.rectangles.length || !footprint.boundaries.length) throw new Error('Casino fuera de su espacio reservado');
    const point = (lx, lz) => [rounded(x + lx * cos + lz * sin), rounded(z - lx * sin + lz * cos)];
    const rectangles = footprint.rectangles.map(([x1, x2, z1, z2]) => {
      const corners = [[x1,z1],[x2,z1],[x1,z2],[x2,z2]].map(p => point(...p));
      return { minX: Math.min(...corners.map(p => p[0])), maxX: Math.max(...corners.map(p => p[0])),
        minZ: Math.min(...corners.map(p => p[1])), maxZ: Math.max(...corners.map(p => p[1])) };
    });
    const boundaries = footprint.boundaries.map(([ax, az, bx, bz, nx, nz]) => {
      const a = point(ax,az), b = point(bx,bz);
      return { ax:Math.min(a[0],b[0]), az:Math.min(a[1],b[1]), bx:Math.max(a[0],b[0]), bz:Math.max(a[1],b[1]),
        nx:rounded(nx*cos+nz*sin), nz:rounded(-nx*sin+nz*cos) };
    });
    return { root, blockers, bounds:box, scale, footprint:rectangles, collider:{
      minX:box.min.x, maxX:box.max.x, minZ:box.min.z, maxZ:box.max.z, rectangles, boundaries } };
  }
  return {
    state,
    register(record) { state.records.push(record); },
    load() {
      if (loading) return loading;
      loading = (async () => {
        try {
          const base = 'assets/casinos/';
          const selections = state.records.map(r => selectedBuildingAsset(r.def.id));
          const legacyRecords = state.records.filter((_,i) => !selections[i]);
          const activeAssets = legacyRecords.map(r => r.def.id === 'comisaria' ? 1 : 2);
          const materialTask = (async () => {
            if (!legacyRecords.length) return null;
            const library = await new MTLLoader().loadAsync(base + 'materials.mtl');
            await new Promise((resolve,reject) => {
              library.setManager(new THREE.LoadingManager(resolve,undefined,url => reject(new Error(url)))); library.preload();
            });
            const material = library.create('Material'); material.map.flipY = false; material.map.needsUpdate = true;
            return material;
          })();
          const [material, files, footprints] = await Promise.all([
            materialTask,
            Promise.all(activeAssets.map(i => new GLTFLoader().loadAsync(base + 'casino' + i + '.glb'))),
            Promise.all(activeAssets.map(async i => {
              const response = await fetch(base + 'footprint' + i + '.json');
              if (!response.ok) throw new Error('Huella del casino: ' + response.status);
              return response.json();
            })),
          ]);
          // Validate active replacements before removing their fallbacks.
          let legacyIndex = 0;
          const replacements = await Promise.all(state.records.map(async (record,i) => {
            const asset = selections[i];
            if (!asset) { const j=legacyIndex++; return prepare(record,files[j],footprints[j],material); }
            const loaded = await loadCustomBuilding(asset);
            loaded.file.scene.traverse(o=>{if(o.isMesh)for(const texture of new Set([o.material.map,o.material.normalMap,o.material.roughnessMap,o.material.metalnessMap])){
              texture.anisotropy=Math.min(8,getTextureAnisotropy());texture.needsUpdate=true;
            }});
            await terrainReady();
            const replacement=prepareCustomBuilding(record,asset,loaded,{scene,streets:MAPREG.streets,
              sidewalks:getSidewalks(),otherBuildings:MAPREG.buildings.filter(r => r !== record.rect)});
            if(record.def.id==='comisaria')try{replacement.neonInfo=await addCasinoNeon(replacement,scene);}catch(error){replacement.neonInfo={error:error.message};console.warn('No cargó el neón del casino',error);}
            return replacement;
          }));
          state.records.forEach((record,i) => {
            const replacement = replacements[i];
            for (const object of record.fallback) scene.remove(object);
            record.floor.material.dispose();
            remove(colliders,record.oldColliders); remove(shootBlockers,record.oldBlockers);
            scene.add(replacement.root); colliders.push(replacement.collider); shootBlockers.push(...replacement.blockers);
            Object.assign(record,replacement,{loaded:true});
            if (replacement.custom) {
              Object.assign(record.rect,{minX:replacement.bounds.min.x,maxX:replacement.bounds.max.x,
                minZ:replacement.bounds.min.z,maxZ:replacement.bounds.max.z});
              Object.assign(MAPREG.landmarks.find(l => l.id === record.def.id),record.rect);
              onPlacementChanged();
            }
          });
          state.ready = true;
        } catch (error) { state.error = error.message; console.warn('No cargaron los casinos',error); }
      })();
      return loading;
    },
    info() { return { ready:state.ready, error:state.error, casinos:state.records.map(r => ({
      id:r.def.id, name:r.def.name, loaded:!!r.loaded, height:r.custom?r.placement.size[1]:r.bounds?.max.y,
      bounds:r.bounds && {min:r.bounds.min.toArray(),max:r.bounds.max.toArray()}, slot:{...r.rect},
      custom:!!r.custom, asset:r.assetId, triangles:r.triangles, placement:r.placement,neon:r.neonInfo,
    })) }; },
  };
}
