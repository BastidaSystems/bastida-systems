import * as THREE from 'three';

// Render-only visibility: collision proxies and AI remain present and fully simulated.
export function createViewOptimization({scene,camera}) {
  const records=[],frustum=new THREE.Frustum(),fogFrustum=new THREE.Frustum();
  const projection=new THREE.Matrix4(),fogCamera=new THREE.PerspectiveCamera(),sphere=new THREE.Sphere();
  let drawDistance=300;
  let prepared=false,enabled=true,sceneAuto=scene.matrixAutoUpdate;
  const state={staticRoots:0,frozenNodes:0,hiddenStatic:0,hiddenEnemies:0,enemies:0,fogDistance:300,instances:0,hiddenInstances:0};
  function prepare(excluded){
    if(prepared)return;
    scene.updateMatrixWorld(true);
    for(const root of [...scene.children]){
      if(excluded.has(root)||!root.visible||root.isLight||root.isCamera||root.isSprite)continue;
      let dynamic=false,meshes=0,allFog=true;const nodes=[];
      root.traverse(o=>{
        nodes.push({object:o,auto:o.matrixAutoUpdate,world:o.matrixWorldAutoUpdate});
        if(o.isSkinnedMesh||o.isSprite||o.isLight||o.isCamera)dynamic=true;
        if(o.isMesh||o.isLine||o.isPoints){meshes++;for(const m of [o.material].flat())if(!m?.fog)allFog=false;}
      });
      if(dynamic||!meshes)continue;
      const bounds=new THREE.Box3().setFromObject(root);if(bounds.isEmpty())continue;
      let visual=root,instances=null;
      // Instanced roads/sidewalks span the entire city. Cull their individual
      // tiles without changing the full meshes used by ground rays and placement.
      if(root.isInstancedMesh&&!root.children.length&&![root.material].flat().some(m=>m.transparent)){
        visual=root.clone(false);visual.name=root.name+' (visible tiles)';
        visual.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        if(visual.instanceColor)visual.instanceColor.setUsage(THREE.DynamicDrawUsage);
        root.geometry.computeBoundingBox();
        const transform=new THREE.Matrix4(),boxes=[];
        for(let i=0;i<root.count;i++){
          root.getMatrixAt(i,transform);transform.premultiply(root.matrixWorld);
          boxes.push(root.geometry.boundingBox.clone().applyMatrix4(transform));
        }
        instances={source:root,boxes,ids:Array.from({length:root.count},(_,i)=>i)};
        state.instances+=root.count;root.visible=false;scene.add(visual);
        nodes.push({object:visual,auto:visual.matrixAutoUpdate,world:visual.matrixWorldAutoUpdate});
      }
      records.push({root:visual,nodes,bounds,allFog,instances});state.frozenNodes+=nodes.length;
    }
    state.staticRoots=records.length;prepared=true;setEnabled(enabled);
  }
  function setEnabled(value){
    enabled=value;
    // The world scene itself never moves; dynamic children still update normally.
    scene.matrixAutoUpdate=value?false:sceneAuto;
    for(const r of records){r.root.visible=true;for(const n of r.nodes){n.object.matrixAutoUpdate=value?false:n.auto;n.object.matrixWorldAutoUpdate=value?false:n.world;}}
  }
  function updateInstances(record,view){
    const {source,boxes,ids}=record.instances,mesh=record.root;
    let count=0,changed=false;
    for(let i=0;i<boxes.length;i++)if(!enabled||view.intersectsBox(boxes[i])){
      if(ids[count]!==i){ids[count]=i;changed=true;}
      count++;
    }
    state.hiddenInstances+=boxes.length-count;
    if(changed){
      const matrix=mesh.instanceMatrix.array,color=mesh.instanceColor?.array;
      for(let j=0;j<count;j++){
        const i=ids[j];matrix.set(source.instanceMatrix.array.subarray(i*16,i*16+16),j*16);
        if(color)color.set(source.instanceColor.array.subarray(i*3,i*3+3),j*3);
      }
      mesh.instanceMatrix.needsUpdate=true;if(color)mesh.instanceColor.needsUpdate=true;
    }
    mesh.count=count;
  }
  function update(enemies,floating){
    if(!prepared)return;
    camera.updateMatrixWorld(true);
    projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
    // Transmittance below 1e-6 is already invisible in the existing exponential fog.
    state.fogDistance=scene.fog?.isFogExp2&&scene.fog.density>0?Math.min(camera.far,Math.sqrt(-Math.log(1e-6))/scene.fog.density):camera.far;
    fogCamera.fov=camera.fov;fogCamera.aspect=camera.aspect;fogCamera.near=camera.near;fogCamera.far=state.fogDistance;fogCamera.updateProjectionMatrix();
    projection.multiplyMatrices(fogCamera.projectionMatrix,camera.matrixWorldInverse);fogFrustum.setFromProjectionMatrix(projection);
    state.hiddenStatic=state.hiddenEnemies=state.enemies=state.hiddenInstances=0;
    for(const r of records){
      const view=r.allFog?fogFrustum:frustum;
      r.root.visible=!enabled||(view.intersectsBox(r.bounds)&&r.bounds.distanceToPoint(camera.position)<=drawDistance);
      if(!r.root.visible){state.hiddenStatic++;if(r.instances)state.hiddenInstances+=r.instances.boxes.length;}
      else if(r.instances)updateInstances(r,view);
    }
    for(const list of [enemies,floating])for(const e of list){
      // Generous bounds cover all animated limbs, crawl, death and wall climbing.
      const size=Math.max(e.g.scale.x,e.g.scale.y,e.g.scale.z);
      sphere.center.copy(e.g.position);sphere.center.y+=size;sphere.radius=5*size;
      e.g.visible=(!e.spawning||e.spawnVisible)&&(!enabled||frustum.intersectsSphere(sphere));state.enemies++;if(!e.g.visible)state.hiddenEnemies++;
    }
  }
  return {prepare,update,setEnabled,setDrawDistance(value){if(Number.isFinite(value))drawDistance=Math.max(60,Math.min(300,value));},info:()=>({...state,enabled,prepared})};
}
