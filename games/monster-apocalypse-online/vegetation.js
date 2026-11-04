import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Static decoration: never registers gameplay colliders, shot blockers or updates.
export function createVegetationSystem({scene,MAP,MAPREG,propSystem,resolvePosition,spawnPoints,enabled=true}) {
  const state={enabled,ready:false,error:null,records:[],batches:[],skipped:[]};
  let loading;
  return {
    state,
    load(environmentReady) {
      if(!enabled){state.ready=true;return Promise.resolve();}
      if (loading) return loading;
      loading=(async()=>{
        try {
          const base='assets/props/desert-neon/';
          const response=await fetch(base+'manifest.json');if(!response.ok)throw new Error('Catálogo de plantas: '+response.status);
          const manifest=await response.json();
          const materialTask=(async()=>{
            const library=await new MTLLoader().loadAsync(base+'materials.mtl');
            await new Promise((resolve,reject)=>{library.setManager(new THREE.LoadingManager(resolve,undefined,url=>reject(new Error(url))));library.preload();});
            const material=library.create('Material');material.map.flipY=false;material.map.needsUpdate=true;return material;
          })();
          const [material,files]=await Promise.all([materialTask,Promise.all(manifest.plants.map(p=>new GLTFLoader().loadAsync(base+p.file)))]);
          const templates=files.map((file,i)=>{
            file.scene.updateMatrixWorld(true);const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
            if(meshes.length!==1)throw new Error('Se esperaba una malla por planta');
            const m=meshes[0],g=m.geometry.clone().applyMatrix4(m.matrixWorld);m.geometry.dispose();m.material.dispose();
            g.computeBoundingBox();const box=g.boundingBox,size=box.getSize(new THREE.Vector3());
            g.translate(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);g.scale(1/size.y,1/size.y,1/size.y);g.computeBoundingBox();g.computeBoundingSphere();
            return {...manifest.plants[i],geometry:g,width:size.x/size.y,depth:size.z/size.y};
          });
          await environmentReady;
          if(!propSystem.state.ready)throw new Error('Los objetos del escenario no están listos');
          scene.updateMatrixWorld(true);
          const surfaces=scene.children.filter(o=>o.isMesh&&(o.geometry.type==='PlaneGeometry'||(o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height*o.scale.y<=.30)));
          const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),point=new THREE.Vector3();
          const ground=(x,z)=>{ray.set(point.set(x,3,z),down);ray.far=4;return ray.intersectObjects(surfaces,false)[0]?.point.y??0;};
          let seed=0x31ea2026;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          const hits=(x,z,r,b)=>x+r>b.minX&&x-r<b.maxX&&z+r>b.minZ&&z-r<b.maxZ;
          const records=[];
          // Interleave species, scatter with a separate PRNG, and retain full road width.
          for(let copy=0;copy<Math.max(...templates.map(t=>t.count));copy++)for(const[kind,t]of templates.entries()){
            if(copy>=t.count)continue;
            const height=t.height*(.9+rng()*.2),radius=Math.hypot(t.width,t.depth)*height/2,yaw=rng()*Math.PI*2;
            let placed;
            for(let attempt=0;attempt<2400;attempt++){
              const x=(rng()-.5)*(MAP.halfW*2-4),z=(rng()-.5)*(MAP.halfL*2-4),margin=radius+.55;
              if(Math.abs(x)+margin>MAP.halfW||Math.abs(z)+margin>MAP.halfL)continue;
              if(MAPREG.streets.some(b=>hits(x,z,margin,b))||MAPREG.buildings.some(b=>hits(x,z,margin,b))||propSystem.state.paths.some(b=>hits(x,z,margin,b)))continue;
              if(spawnPoints.some(p=>Math.abs(x-p.x)<radius+2.5+p.jx&&Math.abs(z-p.z)<radius+2.5+p.jz)||Math.hypot(x,z-46)<radius+3)continue;
              if(propSystem.state.trash.some(p=>Math.hypot(x-p.x,z-p.z)<radius+3.4))continue;
              if(records.some(p=>Math.hypot(x-p.x,z-p.z)<radius+p.radius+.65))continue;
              point.set(x,0,z);resolvePosition(point,margin,true);if(Math.hypot(point.x-x,point.z-z)>1e-5)continue;
              const y=ground(x,z);let supported=true;
              for(let j=0;j<12;j++){const a=j*Math.PI/6;if(Math.abs(ground(x+Math.cos(a)*radius,z+Math.sin(a)*radius)-y)>.015){supported=false;break;}}
              if(supported){placed={kind,file:t.file,name:t.name,x,y,z,height,radius,yaw};break;}
            }
            if(placed)records.push(placed);else state.skipped.push({file:t.file,copy});
          }
          const transform=new THREE.Object3D(),batches=[];
          for(const[kind,t]of templates.entries()){
            const placed=records.filter(r=>r.kind===kind);if(!placed.length){t.geometry.dispose();continue;}
            const batch=new THREE.InstancedMesh(t.geometry,material,placed.length);batch.name=t.name;
            placed.forEach((r,instanceId)=>{
              transform.position.set(r.x,r.y,r.z);transform.rotation.set(0,r.yaw,0);transform.scale.setScalar(r.height);transform.updateMatrix();batch.setMatrixAt(instanceId,transform.matrix);
              Object.assign(r,{batch,instanceId});
            });
            batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();scene.add(batch);batches.push(batch);
          }
          Object.assign(state,{records,batches,ready:true});
        } catch(error){state.error=error.message;console.warn('No cargó la vegetación',error);}
      })();return loading;
    },
    info(){return {enabled:state.enabled,ready:state.ready,error:state.error,count:state.records.length,skipped:state.skipped,plants:state.records.map(({file,name,x,y,z,height,yaw})=>({file,name,x,y,z,height,yaw}))};},
  };
}
