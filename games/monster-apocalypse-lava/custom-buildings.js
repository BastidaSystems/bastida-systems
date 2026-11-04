import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';

export async function loadCustomBuilding(asset) {
  const [file,response,footprint]=await Promise.all([createModelLoader().loadAsync(asset.model),fetch(asset.descriptor),
    asset.collisionFootprint?fetch(asset.collisionFootprint).then(async response=>{
      if(!response.ok)throw new Error('Contorno no disponible');
      const data=await response.json();
      if(data.version!==1||!data.rectangles?.length||data.rectangles.length>300||!data.boundaries?.length||data.boundaries.length>600||
        data.scales?.length!==3||!data.scales.every(v=>Number.isFinite(v)&&v>0)||
        !data.rectangles.every(r=>r.length===4&&r.every(Number.isFinite)&&r[0]<r[1]&&r[2]<r[3])||
        !data.boundaries.every(b=>b.length===6&&b.every(Number.isFinite)))throw new Error('Contorno inválido');
      return data;
    }).catch(error=>{console.warn('Se conserva la colisión anterior del edificio',error);return null;}):null]);
  if(!response.ok)throw new Error('No cargó el descriptor del edificio');
  const descriptor=await response.json();let triangles=0,meshes=0;
  file.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
    if(!o.geometry.attributes.uv||!o.geometry.attributes.normal||!o.material.map||!o.material.normalMap||!o.material.roughnessMap||!o.material.metalnessMap)
      throw new Error('Edificio sin geometría o materiales PBR completos');
  }});
  if(triangles>80000||triangles<30000||triangles!==descriptor.triangles||meshes!==1)
    throw new Error('Edificio fuera del presupuesto de geometría');
  return {file,descriptor,triangles,footprint};
}

const overlaps=(a,b)=>a.minX<b.maxX-1e-5&&a.maxX>b.minX+1e-5&&a.minZ<b.maxZ-1e-5&&a.maxZ>b.minZ+1e-5;
const rect=box=>({minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z});
const outsideLotTypes=new Set(['west-sidewalk','east-map-limit','north-sidewalk-or-road','south-map-limit','physical-body-outside-slot','street','sidewalk']);
export function prepareCustomBuilding(record,asset,loaded,{scene,streets,sidewalks,otherBuildings,sidewalkSurface}) {
  const {file,descriptor,triangles}=loaded;
  const name=asset.name||'CASINO1';
  const root=new THREE.Group();root.name=asset.name?asset.name+' - '+record.def.id:'CASINO1 personalizado - CA';root.add(file.scene);
  // Explicit dimensions let an approved building fit its lot without changing other assets.
  const scale=(asset.footprintHeight||asset.targetHeight)/descriptor.size.height;
  const widthScale=asset.targetWidth?asset.targetWidth/descriptor.size.width:scale;
  const depthScale=asset.targetDepth?asset.targetDepth/descriptor.size.depth:scale;
  const verticalScale=asset.targetHeight/descriptor.size.height;
  root.scale.set(widthScale,verticalScale,depthScale);root.rotation.y=asset.frontYaw;root.position.set(asset.anchor.x,0,asset.anchor.z);root.updateMatrixWorld(true);
  let bounds=new THREE.Box3().setFromObject(root,true);
  // Terrain sampling excludes every object belonging to the old casino.
  const center=bounds.getCenter(new THREE.Vector3()),ray=new THREE.Raycaster(new THREE.Vector3(center.x,.5,center.z),new THREE.Vector3(0,-1,0),0,1);
  const surfaces=scene.children.filter(o=>o.isMesh&&o.visible&&!record.fallback.includes(o)&&
    (o.geometry.type==='PlaneGeometry'||o.name==='Suelo calle1'));
  let terrainY=ray.intersectObjects(surfaces,false)[0]?.point.y??-.02;
  if(asset.supportSurface==='sidewalk'){
    if(!sidewalkSurface)throw new Error('Banqueta no disponible para la parada');
    sidewalkSurface.updateMatrixWorld(true);const heights=[];
    for(const x of [bounds.min.x+.05,center.x,bounds.max.x-.05])for(const z of [bounds.min.z+.05,center.z,bounds.max.z-.05]){
      ray.set(new THREE.Vector3(x,.8,z),new THREE.Vector3(0,-1,0));ray.far=2;
      const hit=ray.intersectObject(sidewalkSurface,false)[0];if(hit)heights.push(hit.point.y);
    }
    if(!heights.length)throw new Error('La parada no encuentra superficie de banqueta');
    terrainY=Math.max(...heights);
  }
  const heightOffset=asset.heightOffset||0;root.position.y=terrainY+heightOffset;
  const slabMin=(.25-heightOffset)/verticalScale,slabMax=(3-heightOffset)/verticalScale;
  root.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(root,true);
  // Contours are baked for the approved dimensions; a future resize falls back safely.
  const contour=Math.abs(Math.sin(asset.frontYaw*2))<1e-6&&Math.abs((loaded.footprint?.heightOffset||0)-heightOffset)<1e-6&&loaded.footprint?.scales.every((v,i)=>Math.abs(v-[widthScale,verticalScale,depthScale][i])<1e-6)?loaded.footprint:null;
  const collisionBoxes=contour?contour.rectangles.map(r=>({min:[r[0],-heightOffset/verticalScale,r[2]],max:[r[1],slabMax,r[3]]})):
    (descriptor.collisionBoxes||[descriptor.collision]);
  const bodies=collisionBoxes.map(box=>
    new THREE.Box3(new THREE.Vector3(...box.min),new THREE.Vector3(...box.max)).applyMatrix4(root.matrixWorld));
  const body=bodies.reduce((union,box)=>union.union(box),new THREE.Box3());
  const footprint=rect(bounds),violations=[];
  if(footprint.minX<asset.allowed.minX-.001)violations.push({type:'west-sidewalk',excess:asset.allowed.minX-footprint.minX});
  if(footprint.maxX>asset.allowed.maxX+.001)violations.push({type:'east-map-limit',excess:footprint.maxX-asset.allowed.maxX});
  if(footprint.minZ<asset.allowed.minZ-.001)violations.push({type:'north-sidewalk-or-road',excess:asset.allowed.minZ-footprint.minZ});
  if(footprint.maxZ>asset.allowed.maxZ+(asset.visualOverhang?.south||0)+.001)violations.push({type:'south-map-limit',excess:footprint.maxZ-asset.allowed.maxZ});
  const physical=rect(body),overhang={south:Math.max(0,footprint.maxZ-asset.allowed.maxZ),maxHeight:0};
  if(physical.minX<asset.allowed.minX-.001||physical.maxX>asset.allowed.maxX+.001||
     physical.minZ<asset.allowed.minZ-.001||physical.maxZ>asset.allowed.maxZ+.001)
    violations.push({type:'physical-body-outside-slot',bounds:physical});
  if(overhang.south>0&&asset.visualOverhang){
    const vertex=new THREE.Vector3();
    root.traverse(o=>{if(o.isMesh){const positions=o.geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        vertex.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);
        if(vertex.z>asset.allowed.maxZ+.001)overhang.maxHeight=Math.max(overhang.maxHeight,vertex.y-root.position.y);
      }
    }});
    if(overhang.maxHeight>asset.visualOverhang.maxHeight+.001)
      violations.push({type:'overhang-is-not-low-decoration',height:overhang.maxHeight});
  }
  streets.forEach((r,i)=>{if(overlaps(footprint,r))violations.push({type:'street',index:i,bounds:{...r}});});
  sidewalks.forEach((r,i)=>{if(overlaps(footprint,r))violations.push({type:'sidewalk',index:i,bounds:r});});
  otherBuildings.forEach((r,i)=>{if(overlaps(footprint,r))violations.push({type:'other-building',index:i,bounds:{...r}});});
  const p0Clear=!(0>=footprint.minX-1.5&&0<=footprint.maxX+1.5&&46>=footprint.minZ-1.5&&46<=footprint.maxZ+1.5);
  if(!p0Clear)violations.push({type:'P0'});
  // An explicit lot exception still rejects overlap with another building or P0.
  const rejected=violations.filter(v=>!(asset.allowOutsideLot===true&&outsideLotTypes.has(v.type)));
  if(rejected.length&&!asset.review)throw new Error(name+' queda fuera de su terreno o invade otro obstáculo: revisar ubicación');
  const blockers=[],proxyMaterial=new THREE.MeshBasicMaterial(),geometry=new THREE.BoxGeometry(1,1,1);
  // Match ground-level bullets/visibility to movement; keep the original upper volumes.
  const shootBoxes=contour?[...collisionBoxes.map(b=>({min:[b.min[0],slabMin,b.min[2]],max:b.max})),
    ...descriptor.shootBoxes.flatMap(b=>{
      const boxes=[];
      if(b.min[1]<slabMin)boxes.push({min:b.min,max:[b.max[0],Math.min(b.max[1],slabMin),b.max[2]]});
      if(b.max[1]>slabMax)boxes.push({min:[b.min[0],Math.max(b.min[1],slabMax),b.min[2]],max:b.max});
      return boxes;
    })]:descriptor.shootBoxes;
  for(const box of shootBoxes){
    const proxy=new THREE.Mesh(geometry,proxyMaterial);
    proxy.position.set(...box.min.map((v,i)=>(v+box.max[i])/2));proxy.scale.set(...box.max.map((v,i)=>v-box.min[i]));
    proxy.visible=false;proxy.userData.buildingCollisionProxy=true;root.add(proxy);blockers.push(proxy);
  }
  root.updateMatrixWorld(true);
  const bodyColliders=contour?[{...rect(body),rectangles:bodies.map(rect),boundaries:contour.boundaries.map(b=>{
    const a=new THREE.Vector3(b[0],0,b[1]).applyMatrix4(root.matrixWorld),z=new THREE.Vector3(b[2],0,b[3]).applyMatrix4(root.matrixWorld);
    const n=new THREE.Vector3(b[4],0,b[5]).transformDirection(root.matrixWorld);
    if(Math.abs(n.x)>.5)a.x=z.x=(a.x+z.x)/2;else a.z=z.z=(a.z+z.z)/2;
    return {ax:Math.min(a.x,z.x),az:Math.min(a.z,z.z),bx:Math.max(a.x,z.x),bz:Math.max(a.z,z.z),nx:Math.round(n.x),nz:Math.round(n.z)};
  })}]:bodies.map(rect);
  // Existing footprint physics chooses reachable exits when a building backs onto the map edge.
  if(!contour&&(descriptor.collisionType==='footprint'||asset.collisionMode==='per-body-footprint')){
    if(descriptor.collisionType==='footprint'&&bodyColliders.length!==1)throw new Error('La huella exterior requiere una sola caja corporal');
    for(const c of bodyColliders){
    const r={...c};c.rectangles=[r];
    c.boundaries=[
      {ax:r.minX,az:r.minZ,bx:r.minX,bz:r.maxZ,nx:-1,nz:0},
      {ax:r.maxX,az:r.minZ,bx:r.maxX,bz:r.maxZ,nx:1,nz:0},
      {ax:r.minX,az:r.minZ,bx:r.maxX,bz:r.minZ,nx:0,nz:-1},
      {ax:r.minX,az:r.maxZ,bx:r.maxX,bz:r.maxZ,nx:0,nz:1},
    ];
    }
  }
  return {root,blockers,bounds,scale,widthScale,depthScale,verticalScale,footprint:bodyColliders,collider:bodyColliders[0],colliders:bodyColliders,custom:true,
    assetId:asset.id,triangles,descriptor,
    placement:{pose:asset.pose,review:asset.review,originalSize:asset.originalSize,fits:violations.length===0,violations,p0Clear,
      ...(asset.allowOutsideLot===true?{outsideLotAllowed:true,accepted:rejected.length===0}:{}),
      anchor:{...asset.anchor},center:bounds.getCenter(new THREE.Vector3()).toArray(),size:bounds.getSize(new THREE.Vector3()).toArray(),groundY:root.position.y,terrainY,heightOffset,
      physicalBounds:physical,visualOverhang:overhang,
      ...(contour?{collisionContour:{cell:contour.worldCell,rectangles:contour.rectangles.length,boundaries:contour.boundaries.length,reclaimedArea:contour.previousArea-contour.area}}:{})},
  };
}
