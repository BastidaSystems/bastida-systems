import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';

// The existing slabs remain hidden ground-support proxies. Only their visual changes.
export function createSidewalkSystem({scene}) {
  const state={ready:false,error:null,originals:[],records:[],batch:null};
  let loading;
  return {state,
    register(mesh,yaw){state.originals.push({mesh,yaw});},
    load(){if(loading)return loading;loading=(async()=>{try {
      const file=await createModelLoader().loadAsync('assets/sidewalks/banqueta.glb?v=20261013-sidewalk1');
      file.scene.updateMatrixWorld(true);
      const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
      if(meshes.length!==1)throw new Error('Se esperaba una sola malla de banqueta');
      const source=meshes[0],geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
      geometry.computeBoundingBox();geometry.computeBoundingSphere();
      const size=geometry.boundingBox.getSize(new THREE.Vector3());
      if(!source.material.map||!geometry.attributes.uv||!geometry.attributes.normal||
        [size.x,size.y,size.z].some(n=>Math.abs(n-1)>.001)||!state.originals.length)
        throw new Error('Modelo de banqueta incompleto');
      const records=[];
      for(const {mesh,yaw} of state.originals){
        const p=mesh.geometry.parameters,alongZ=Math.abs(Math.sin(yaw))>.5;
        const length=alongZ?p.depth:p.width,width=alongZ?p.width:p.depth;
        // Short repeated modules keep the concrete panels at a useful scale.
        const count=Math.ceil(length/(width*2.625)),tileLength=length/count;
        for(let i=0;i<count;i++){
          const offset=-length/2+(i+.5)*tileLength;
          records.push({original:mesh,x:mesh.position.x+(alongZ?0:offset),
            z:mesh.position.z+(alongZ?offset:0),y:mesh.position.y-p.height/2,
            length:tileLength,width,height:p.height,yaw});
        }
      }
      const batch=new THREE.InstancedMesh(geometry,source.material.clone(),records.length);
      batch.name='Banquetas de concreto Meshy';
      const transform=new THREE.Object3D();
      records.forEach((r,i)=>{
        transform.position.set(r.x,r.y,r.z);transform.rotation.set(0,r.yaw,0);
        transform.scale.set(r.length,r.height,r.width);transform.updateMatrix();
        batch.setMatrixAt(i,transform.matrix);r.instanceId=i;
      });
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
      // Commit after a complete load; a failed asset leaves all original sidewalks visible.
      scene.add(batch);state.originals.forEach(({mesh})=>mesh.visible=false);
      Object.assign(state,{ready:true,records,batch});
    }catch(error){state.error=error.message;console.warn('No cargaron las banquetas nuevas',error);}})();return loading;},
    info(){return {ready:state.ready,error:state.error,segments:state.originals.length,
      tiles:state.records.length,triangles:state.batch?(state.batch.geometry.index.count/3)*state.batch.count:0,
      supportSurfacesPreserved:state.originals.every(({mesh})=>scene.children.includes(mesh))};},
  };
}
