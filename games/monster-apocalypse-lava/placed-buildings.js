import {addCompaRafaLighting} from './compa-rafa-lighting.js?v=20261015-rafa1';
import {addVegasSignLighting} from './vegas-sign-lighting.js?v=108';
import { PLACED_BUILDINGS } from './building-catalog.js?v=20261015-turn-warm1';
import { loadCustomBuilding, prepareCustomBuilding } from './custom-buildings.js?v=20261015-mobile-memory1';

// Reuse a single GLB's geometry and PBR materials across independently placed buildings.
export function createPlacedBuildingSystem({scene,colliders,shootBlockers,MAPREG,terrainReady,getSidewalks,getSidewalkSurface,onPlacementChanged,getTextureAnisotropy=()=>1}) {
  const state={ready:false,error:null,records:[]};let loading;
  return {
    state,
    load(){
      if(loading)return loading;
      loading=(async()=>{
        try {
          const entries=PLACED_BUILDINGS.filter(e=>e.enabled!==false),templates=new Map();
          for(const entry of entries){
            const key=entry.model+'|'+entry.descriptor;
            if(!templates.has(key))templates.set(key,loadCustomBuilding(entry));
          }
          // A missing new building must not prevent previously approved buildings from loading.
          const terrain=terrainReady();await Promise.allSettled([...templates.values(),terrain]);await terrain;
          const records=[],reserved=[],errors=[];
          for(const entry of entries){
            try {
            const template=await templates.get(entry.model+'|'+entry.descriptor);
            const loaded={...template,file:{...template.file,scene:template.file.scene.clone(true)}};
            const asset={...entry,id:entry.asset,pose:entry.cell,review:false,originalSize:false};
            const record={def:{id:entry.id,name:entry.name},fallback:[],entry};
            const replacement=prepareCustomBuilding(record,asset,loaded,{scene,streets:MAPREG.streets,
              sidewalks:getSidewalks(),sidewalkSurface:getSidewalkSurface?.(),otherBuildings:[...MAPREG.buildings,...reserved]});
            if(entry.id==='RAFA-C8')try{replacement.lightingInfo=await addCompaRafaLighting(replacement,scene);}catch(error){replacement.lightingInfo={error:error.message};console.warn('No cargó iluminación COMPA RAFA',error);}
            if(entry.id==='VEGAS-AC')try{replacement.lightingInfo=addVegasSignLighting(replacement);}catch(error){replacement.lightingInfo={error:error.message};console.warn('No cargó iluminación LAS VEGAS',error);}
            Object.assign(record,replacement);
            if(entry.textureAnisotropy)record.root.traverse(o=>{if(o.isMesh&&!o.userData.buildingCollisionProxy)
              for(const texture of new Set([o.material.map,o.material.normalMap,o.material.roughnessMap,o.material.metalnessMap]))
                if(texture){texture.anisotropy=Math.min(entry.textureAnisotropy,getTextureAnisotropy());texture.needsUpdate=true;}});
            reserved.push({minX:replacement.bounds.min.x,maxX:replacement.bounds.max.x,
              minZ:replacement.bounds.min.z,maxZ:replacement.bounds.max.z,
              ...(entry.supportOutsideGround?{supportOutsideGround:true}:{}),
            });
            records.push(record);
            } catch(error){errors.push(entry.id+': '+error.message);}
          }
          // Register only validated placements; each keeps its own simplified ground bodies.
          records.forEach((record,i)=>{
            scene.add(record.root);colliders.push(...record.colliders);shootBlockers.push(...record.blockers);
            record.rect=reserved[i];
            // The arch's open span may contain cars; reserve its actual support footprints.
            const mapRects=record.entry.reserveGroundOnly?record.colliders.flatMap(c=>c.rectangles||[c]):[record.rect];
            MAPREG.buildings.push(...mapRects.map(r=>({minX:r.minX,maxX:r.maxX,minZ:r.minZ,maxZ:r.maxZ,...(record.entry.supportOutsideGround?{supportOutsideGround:true}:{})})));
            record.landmark={id:record.entry.id,name:record.entry.name,...record.rect};MAPREG.landmarks.push(record.landmark);
          });
          state.records=records;state.error=errors.length?errors.join('; '):null;state.ready=true;
          if(records.length)onPlacementChanged();
        } catch(error){state.error=error.message;console.warn('No cargaron los edificios adicionales',error);}
      })();
      return loading;
    },
    update(dt,options){for(const r of state.records)r.vegasLighting?.update(dt,options);},
    info(){return {ready:state.ready,error:state.error,buildings:state.records.map(r=>({
      id:r.entry.id,name:r.entry.name,cell:r.entry.cell,asset:r.assetId,triangles:r.triangles,...(r.lightingInfo?{lighting:{...r.lightingInfo,...r.vegasLighting?.info()}}:{}),
      ...(r.entry.cells?{cells:r.entry.cells,collisionBodies:r.colliders.length}:{}),
      scale:r.scale,widthScale:r.widthScale,depthScale:r.depthScale,verticalScale:r.verticalScale,yaw:r.root.rotation.y,loaded:true,
      bounds:{min:r.bounds.min.toArray(),max:r.bounds.max.toArray()},placement:r.placement,
    }))};},
  };
}
