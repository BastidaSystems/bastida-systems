import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { CITY_BUILDING_REFERENCES, CITY_BUILDING_REMOVALS, CITY_BUILDING_SETTINGS } from './building-catalog.js?v=20261013-wide1';

export function createBuildingSystem({ scene, colliders, shootBlockers, MAPREG }) {
  const state = { ready: false, error: null, records: [], removed: [], batches: [] };
  const remove=(items,value)=>{const i=items.indexOf(value);if(i>=0)items.splice(i,1);};
  return {
    state,
    register(record) { record.reference=CITY_BUILDING_REFERENCES[state.records.length];state.records.push(record); },
    async load() {
      try {
        // Select variants using the original nine slots so removing one cannot change the others.
        const sorted = [...state.records].sort((a,b) => a.height-b.height);
        sorted.forEach((record,i) => { record.kind = i < sorted.length/3 ? 2 : i < sorted.length*2/3 ? 0 : 1; });
        const removed=state.records.filter(r=>!CITY_BUILDING_SETTINGS.enabled||CITY_BUILDING_REMOVALS[r.reference]);
        for(const record of removed){
          const expected=CITY_BUILDING_REMOVALS[record.reference];
          if(expected&&Object.keys(expected).some(k=>Math.abs(record.rect[k]-expected[k])>1e-6))
            throw new Error('El edificio '+record.reference+' no coincide con el plano de referencia');
        }
        // Do this before the first await: the casino and perimeter read the same map registry.
        for(const record of removed){
          scene.remove(record.mesh);remove(colliders,record.collider);remove(shootBlockers,record.mesh);remove(MAPREG.buildings,record.rect);
        }
        state.removed=removed;state.records=state.records.filter(r=>!removed.includes(r));
        // No downloads or empty render batches for buildings deliberately removed from the map.
        if(!state.records.length){state.ready=true;return;}
        const base = 'assets/buildings2/';
        const [library, files] = await Promise.all([
          new MTLLoader().loadAsync(base + 'materials.mtl'),
          Promise.all([1,2,3].map(i => new GLTFLoader().loadAsync(base + 'building' + i + '.glb'))),
        ]);
        await new Promise((resolve,reject) => {
          library.setManager(new THREE.LoadingManager(resolve,undefined,url => reject(new Error(url)))); library.preload();
        });
        const material = library.create('Material'); material.map.flipY = false; material.map.needsUpdate = true;
        const geometries = files.map(file => {
          file.scene.updateMatrixWorld(true);
          const meshes = []; file.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
          if (meshes.length !== 1) throw new Error('Se esperaba una malla por edificio');
          const mesh = meshes[0], geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
          geometry.computeBoundingBox();
          const box = geometry.boundingBox, size = box.getSize(new THREE.Vector3());
          geometry.translate(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
          geometry.scale(1/size.x,1/size.y,1/size.z);
          return geometry;
        });
        const batches = geometries.map((g,kind) => {
          const batch = new THREE.InstancedMesh(g,material,state.records.filter(r => r.kind===kind).length);
          batch.name = 'Edificios nuevos ' + (kind+1); return batch;
        });
        const counts = [0,0,0], transform = new THREE.Object3D();
        for (const record of state.records) {
          if (!colliders.includes(record.collider) || !shootBlockers.includes(record.mesh)) throw new Error('Falta el volumen original del edificio');
          const { rect, height, kind } = record;
          const x = (rect.minX+rect.maxX)/2, z = (rect.minZ+rect.maxZ)/2;
          const width = rect.maxX-rect.minX, depth = rect.maxZ-rect.minZ;
          let target, nearest = Infinity;
          for (const street of MAPREG.streets) {
            const vertical = street.maxZ-street.minZ > street.maxX-street.minX;
            const tx = vertical ? (street.minX+street.maxX)/2 : THREE.MathUtils.clamp(x,street.minX,street.maxX);
            const tz = vertical ? THREE.MathUtils.clamp(z,street.minZ,street.maxZ) : (street.minZ+street.maxZ)/2;
            const d = (tx-x)**2+(tz-z)**2;
            if (d<nearest) { nearest=d; target={x:tx,z:tz}; }
          }
          const yaw = Math.round(Math.atan2(x-target.x,z-target.z)/(Math.PI/2))*(Math.PI/2);
          const quarterTurn = Math.abs(Math.sin(yaw))>.5;
          transform.position.set(x,0,z); transform.rotation.set(0,yaw,0);
          transform.scale.set(quarterTurn?depth:width,height,quarterTurn?width:depth); transform.updateMatrix();
          const batch=batches[kind], instanceId=counts[kind]++;
          batch.setMatrixAt(instanceId,transform.matrix);
          // Preserve the original solid collision/raycast volume and map footprint.
          record.mesh.visible=false;
          Object.assign(record,{batch,instanceId,yaw,width,depth,loaded:true});
        }
        for (const batch of batches) {
          batch.instanceMatrix.needsUpdate=true; batch.computeBoundingBox(); batch.computeBoundingSphere(); scene.add(batch);
        }
        state.batches=batches;state.ready=true;
      } catch (error) { state.error=error.message;console.warn('No cargaron los edificios nuevos',error); }
    },
    info() { return {ready:state.ready,error:state.error,removed:state.removed.map(r=>r.reference),buildings:state.records.map(r=>({id:r.reference,kind:r.kind+1,x:(r.rect.minX+r.rect.maxX)/2,z:(r.rect.minZ+r.rect.maxZ)/2,width:r.rect.maxX-r.rect.minX,depth:r.rect.maxZ-r.rect.minZ,height:r.height,loaded:!!r.loaded}))}; },
  };
}
