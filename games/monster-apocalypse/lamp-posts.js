import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';

export const LAMP_POST_SETTINGS=Object.freeze({enabled:true,height:5.4,curbOffset:1.3,
  model:'assets/props/lamp-post/model.glb?v=20261013-posts1',
  descriptor:'assets/props/lamp-post/asset.json?v=20261013-posts1'});
const overlaps=(a,b)=>b.rectangles?b.rectangles.some(part=>overlaps(a,part)):a.minX<b.maxX-1e-5&&a.maxX>b.minX+1e-5&&a.minZ<b.maxZ-1e-5&&a.maxZ>b.minZ+1e-5;
const rect=b=>({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});

export function createLampPostSystem({scene,colliders,shootBlockers,getSidewalks,getSidewalkSurface,getStreets,terrainReady}) {
  const state={ready:false,error:null,originals:[],records:[],batch:null,triangles:0};let loading;
  const remove=(list,item)=>{const i=list.indexOf(item);if(i>=0)list.splice(i,1);};
  function site(record){
    const margin=LAMP_POST_SETTINGS.curbOffset;
    const choices=getSidewalks().filter(({mesh})=>record.main?mesh.geometry.parameters.width===7:mesh.geometry.parameters.width===39);
    const candidates=choices.map(({mesh})=>{
      const p=mesh.geometry.parameters,r={minX:mesh.position.x-p.width/2,maxX:mesh.position.x+p.width/2,
        minZ:mesh.position.z-p.depth/2,maxZ:mesh.position.z+p.depth/2};
      let x,z,yaw;
      if(record.main){
        if(Math.sign(mesh.position.x)!==Math.sign(record.x))return null;
        x=record.x<0?r.maxX-margin:r.minX+margin;
        z=THREE.MathUtils.clamp(record.z,r.minZ+margin,r.maxZ-margin);yaw=record.x<0?0:Math.PI;
      } else {
        if(Math.sign(mesh.position.x)!==Math.sign(record.x))return null;
        const street=getStreets().filter(s=>s.maxX-s.minX>s.maxZ-s.minZ)
          .sort((a,b)=>Math.abs((a.minZ+a.maxZ)/2-record.z)-Math.abs((b.minZ+b.maxZ)/2-record.z))[0];
        const center=(street.minZ+street.maxZ)/2,north=record.z<center;
        if(Math.abs(mesh.position.z-center)>13||Math.sign(mesh.position.z-center)!==(north?-1:1))return null;
        x=THREE.MathUtils.clamp(record.x,r.minX+margin,r.maxX-margin);
        z=north?r.maxZ-margin:r.minZ+margin;yaw=north?-Math.PI/2:Math.PI/2;
      }
      return {x,z,yaw,y:mesh.position.y+p.height/2,sidewalk:r,distance:(x-record.x)**2+(z-record.z)**2};
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance);
    if(!candidates.length)throw new Error('No hay banqueta para el poste');
    return candidates[0];
  }
  return {state,
    register(record){record.saved={lampPosition:record.lamp.position.clone(),lampScale:record.lamp.scale.clone(),
      lampQuaternion:record.lamp.quaternion.clone(),
      lightPosition:record.light.position.clone()};state.originals.push(record);},
    load(){if(loading)return loading;if(!LAMP_POST_SETTINGS.enabled)return Promise.resolve();
      loading=(async()=>{try {
        const [file,response]=await Promise.all([createModelLoader().loadAsync(LAMP_POST_SETTINGS.model),
          fetch(LAMP_POST_SETTINGS.descriptor),terrainReady()]);
        if(!response.ok)throw new Error('No cargó el descriptor del poste');const asset=await response.json();
        file.scene.updateMatrixWorld(true);const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
        if(meshes.length!==1||!state.originals.length)throw new Error('Modelo de poste incompleto');
        const source=meshes[0],geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
        geometry.computeBoundingBox();geometry.computeBoundingSphere();
        const triangles=(geometry.index?.count||geometry.attributes.position.count)/3;
        if(triangles!==asset.triangles||triangles<15000||triangles>18000||!geometry.attributes.uv||!geometry.attributes.normal||
          !source.material.map||!source.material.normalMap||!source.material.roughnessMap||!source.material.metalnessMap)
          throw new Error('Poste sin PBR o fuera del presupuesto');
        const scale=LAMP_POST_SETTINGS.height/(geometry.boundingBox.max.y-geometry.boundingBox.min.y);
        const housing=new THREE.Mesh(geometry,source.material);housing.updateMatrixWorld(true);
        const underside=x=>new THREE.Raycaster(new THREE.Vector3(x,asset.bulb[1]-.5,asset.bulb[2]),
          new THREE.Vector3(0,1,0),0,1.5).intersectObject(housing)[0]?.point.y;
        const bulb=new THREE.Vector3(...asset.bulb),centerHeight=underside(bulb.x),left=underside(bulb.x-.45),right=underside(bulb.x+.45);
        if(centerHeight!==undefined)bulb.y=centerHeight-.02;
        const glowTilt=left!==undefined&&right!==undefined?Math.atan2(right-left,.9):0;
        const batch=new THREE.InstancedMesh(geometry,source.material,state.originals.length);batch.name='Postes Meshy sobre banquetas';
        const transform=new THREE.Object3D(),boxGeometry=new THREE.BoxGeometry(1,1,1),proxyMaterial=new THREE.MeshBasicMaterial();
        const records=state.originals.map((original,i)=>{
          const placement=site(original);transform.position.set(placement.x,placement.y-geometry.boundingBox.min.y*scale,placement.z);
          transform.rotation.set(0,placement.yaw,0);transform.scale.setScalar(scale);transform.updateMatrix();
          let matrix=transform.matrix.clone(),base=new THREE.Box3(new THREE.Vector3(...asset.base.min),new THREE.Vector3(...asset.base.max)).applyMatrix4(matrix);
          // The Meshy slab is uneven and lower than the hidden 24 cm support box.
          const surface=getSidewalkSurface();
          if(surface){
            surface.updateMatrixWorld(true);const heights=[];
            for(const x of [base.min.x+.001,placement.x,base.max.x-.001])for(const z of [base.min.z+.001,placement.z,base.max.z-.001]){
              const hit=new THREE.Raycaster(new THREE.Vector3(x,placement.y+1,z),new THREE.Vector3(0,-1,0),0,2).intersectObject(surface)[0];
              if(hit)heights.push(hit.point.y);
            }
            if(!heights.length)throw new Error('El poste no encuentra superficie de banqueta');
            placement.y=Math.max(...heights);transform.position.y=placement.y-asset.base.min[1]*scale;transform.updateMatrix();
            matrix=transform.matrix.clone();base=new THREE.Box3(new THREE.Vector3(...asset.base.min),new THREE.Vector3(...asset.base.max)).applyMatrix4(matrix);
          }
          const collider=rect(base);
          if(Object.keys(collider).some(k=>k.startsWith('min')?collider[k]<placement.sidewalk[k]-.001:collider[k]>placement.sidewalk[k]+.001)||
            getStreets().some(s=>overlaps(collider,s))||colliders.some(c=>overlaps(collider,c)))throw new Error('La base del poste invade otro obstáculo');
          const blockers=[];
          for(const b of [{min:[asset.base.min[0],0,asset.base.min[2]],max:[asset.base.max[0],asset.height,asset.base.max[2]]},
            {min:[asset.bulb[0]-.68,asset.bulb[1],-.4],max:[asset.bulb[0]+.68,asset.bulb[1]+.5,.4]}]){
            const proxy=new THREE.Mesh(boxGeometry,proxyMaterial);proxy.position.set(...b.min.map((v,a)=>(v+b.max[a])/2));
            proxy.scale.set(...b.max.map((v,a)=>v-b.min[a]));proxy.applyMatrix4(matrix);proxy.visible=false;
            proxy.userData.lampCollisionProxy=true;blockers.push(proxy);
          }
          batch.setMatrixAt(i,matrix);
          return {original,placement,collider,blockers,matrix,baseY:base.min.y,scale,
            bulb:bulb.clone().applyMatrix4(matrix),glowTilt,bounds:geometry.boundingBox.clone().applyMatrix4(matrix)};
        });
        batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
        // Preserve the original six light objects and emissive materials; only their fixtures move.
        for(const r of records){scene.remove(r.original.pole);r.original.lamp.position.copy(r.bulb);
          r.original.lamp.scale.set(1.5,.12,.8);r.original.lamp.rotation.set(0,r.placement.yaw,0);r.original.lamp.rotateZ(r.glowTilt);
          r.original.light.position.copy(r.bulb);
          colliders.push(r.collider);shootBlockers.push(...r.blockers);r.blockers.forEach(o=>scene.add(o));}
        scene.add(batch);Object.assign(state,{ready:true,records,batch,triangles});
      }catch(error){state.error=error.message;console.warn('No cargaron los postes nuevos',error);}})();return loading;
    },
    restore(){for(const r of state.records){scene.add(r.original.pole);r.original.lamp.position.copy(r.original.saved.lampPosition);
      r.original.lamp.scale.copy(r.original.saved.lampScale);r.original.light.position.copy(r.original.saved.lightPosition);
      r.original.lamp.quaternion.copy(r.original.saved.lampQuaternion);
      remove(colliders,r.collider);r.blockers.forEach(o=>{scene.remove(o);remove(shootBlockers,o);});}
      if(state.batch)scene.remove(state.batch);state.ready=false;state.records=[];state.batch=null;
    },
    info(){return {ready:state.ready,error:state.error,count:state.records.length,trianglesPerPost:state.triangles,
      sharedGeometry:!!state.batch,posts:state.records.map(r=>({x:r.placement.x,z:r.placement.z,yaw:r.placement.yaw,
        baseY:r.baseY,supportY:r.placement.y,height:LAMP_POST_SETTINGS.height,scale:r.scale,sidewalk:r.placement.sidewalk,base:r.collider,
        bulb:r.bulb.toArray(),light:{color:r.original.light.color.getHex(),intensity:r.original.light.intensity,
          distance:r.original.light.distance,decay:r.original.light.decay},
        glow:{color:r.original.lamp.material.emissive.getHex(),intensity:r.original.lamp.material.emissiveIntensity}}))};},
  };
}
