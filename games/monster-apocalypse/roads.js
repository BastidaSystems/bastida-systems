import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';
import {indexRoadHeights} from './road-height-index.js';
import {levelRoadSurface} from './road-leveling.js';

// Visual replacement only. Original flat surfaces stay as hidden support proxies;
// map routes, player physics, colliders and shooting blockers remain unchanged.
export function createRoadSystem({scene,MAPREG}) {
  const state={ready:false,error:null,originals:[],batches:[],records:[],underlay:null};
  let loading;
  function template(file,label) {
    file.scene.updateMatrixWorld(true);
    const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
    if(meshes.length!==1)throw new Error('Se esperaba una malla de suelo: '+label);
    const mesh=meshes[0],geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const box=geometry.boundingBox,size=box.getSize(new THREE.Vector3());
    if(!geometry.attributes.uv||!geometry.attributes.normal||size.x<.99||size.z<.99||!mesh.material.map)
      throw new Error('Modelo de suelo incompleto: '+label);
    const material=mesh.material.clone();
    if(label.startsWith('cracked/')){
      const molten=label==='cracked/molten-heart';
      levelRoadSurface(geometry);
      material.normalScale.set(1.8,1.8);
      if(molten){
        material.emissiveMap=material.map;
        material.emissive.set(0xffffff);material.emissiveIntensity=1.4;
      }
      // Bring out the existing dark fissures and raised edges without new maps
      // or lights. Height is the original normalized source relief, not noise.
      material.onBeforeCompile=shader=>{
        shader.vertexShader='varying float vRoadRelief;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvRoadRelief=position.y;');
        shader.fragmentShader='varying float vRoadRelief;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          diffuseColor.rgb=max(vec3(0.0),(diffuseColor.rgb-vec3(0.035))*1.65+vec3(0.05));
          diffuseColor.rgb*=mix(0.48,1.22,smoothstep(0.45,0.92,vRoadRelief));
        `);
        if(molten)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          float roadHeat=smoothstep(0.06,0.30,totalEmissiveRadiance.r-max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));
          totalEmissiveRadiance*=roadHeat;
        `);
      };
      material.customProgramCacheKey=()=> 'cracked-road-relief-contrast-v1'+(molten?'-molten':'');
    }
    return {label,geometry,material};
  }
  function plan() {
    const floor=state.originals.find(r=>r.role==='ground')?.mesh;
    if(!floor||MAPREG.streets.length!==3)throw new Error('Faltan las superficies originales');
    const {width,height}=floor.geometry.parameters,rows=4,columns=3,records=[];
    const minX=floor.position.x-width/2,minZ=floor.position.z-height/2;
    const cracked=['cracked/fractured-asphalt','cracked/shattered-crossroads','cracked/shattered-impact'];
    for(let layer=0;layer<2;layer++)for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)records.push({
      role:'ground',kind:'terrain-asphalt',x:minX+(col+.5+layer*.5)*width/columns,z:minZ+(row+.5+layer*.5)*height/rows,
      length:width/columns*1.06,width:height/rows*1.06,y:-.14-layer*.01,relief:.12,yaw:(row+col)%2?Math.PI:0,
    });
    const main=MAPREG.streets[0],crossings=MAPREG.streets.slice(1).sort((a,b)=>a.minZ-b.minZ);
    const intervals=[[main.minZ,crossings[0].minZ],[crossings[0].maxZ,crossings[1].minZ],[crossings[1].maxZ,main.maxZ]];
    intervals.forEach(([start,end],i)=>records.push({role:'main',kind:i===1?'cracked/molten-heart':cracked[0],
      x:(main.minX+main.maxX)/2,z:(start+end)/2,length:end-start,width:main.maxX-main.minX,
      y:-.56,relief:.60,yaw:Math.PI/2}));
    crossings.forEach((r,row)=>{
      const count=4,length=(r.maxX-r.minX)/count;
      for(let col=0;col<count;col++)records.push({role:'cross',kind:row===0&&col===0||row===1&&col===3?'cracked/molten-heart':col===0||col===3?cracked[0]:cracked[1+(row+col)%2],
        x:r.minX+(col+.5)*length,z:(r.minZ+r.maxZ)/2,length,width:r.maxZ-r.minZ,
        y:-.56,relief:.60,yaw:0});
    });
    return records;
  }
  return {state,
    register(role,mesh){state.originals.push({role,mesh});},
    load(){if(loading)return loading;loading=(async()=>{try{
      const labels=['cracked/fractured-asphalt','cracked/shattered-crossroads','cracked/shattered-impact','cracked/molten-heart'];
      const files=await Promise.all(labels.map(label=>createModelLoader().loadAsync('assets/roads/'+label+'.glb?v=20261103-cracked1')));
      const templates=files.map((file,i)=>template(file,labels[i])),records=plan(),transform=new THREE.Object3D(),batches=[];
      const asphalt=templates.find(t=>t.label==='cracked/fractured-asphalt');
      const terrainMaterial=asphalt.material.clone();
      terrainMaterial.onBeforeCompile=asphalt.material.onBeforeCompile;
      terrainMaterial.customProgramCacheKey=asphalt.material.customProgramCacheKey;
      templates.push({...asphalt,label:'terrain-asphalt',material:terrainMaterial});
      for(const t of templates){
        const placed=records.filter(r=>r.kind===t.label),batch=new THREE.InstancedMesh(t.geometry,t.material,placed.length);
        batch.name=t.label==='terrain-asphalt'?'Suelo ampliado agrietado':'Calle '+t.label;
        placed.forEach((r,i)=>{transform.position.set(r.x,r.y,r.z);transform.rotation.set(0,r.yaw,0);
          transform.scale.set(r.length,r.relief,r.width);transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);
          Object.assign(r,{batch,instanceId:i});});
        batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
        indexRoadHeights(batch);
        batches.push(batch);
      }
      // All visible coverage comes from the source models; no flat backing.
      scene.add(...batches);state.originals.forEach(r=>r.mesh.visible=false);
      Object.assign(state,{ready:true,records,batches,underlay:null});
    }catch(error){state.error=error.message;console.warn('No cargaron las calles nuevas',error);}})();return loading;},
    info(){return {ready:state.ready,error:state.error,groundTiles:state.records.filter(r=>r.role==='ground').length,
      streetTiles:state.records.filter(r=>r.role!=='ground').length,
      streetRelief:.60,underlayY:state.underlay?.position.y,groundUnderRoadsHidden:state.batches.some(b=>b.material.userData.streetCutouts),
      streetLipY:.04,
      triangles:state.batches.reduce((n,b)=>n+b.geometry.index.count/3*b.count,0),
      models:state.batches.map(b=>({name:b.name,count:b.count,triangles:b.geometry.index.count/3})),
      supportSurfacesPreserved:state.originals.every(r=>scene.children.includes(r.mesh))};},
  };
}
