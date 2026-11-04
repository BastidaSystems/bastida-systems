import * as THREE from 'three';
import {createEnvironmentSystem} from './environment-system.js?v=spotlight82';
import {createElectricalHazard} from './environment-hazard.js';
import {planVehicleHoodFires} from './vehicle-hood-fire.js?v=20261017-adjust45';
import {findStratTip} from './strat-tip-anchor.js';

// Explicit art placement; never walk the map to distribute effects.
export const WORLD_ENVIRONMENT_LAYOUT=Object.freeze({
  trashOrigins:Object.freeze([Object.freeze([-5,46]),Object.freeze([-8,-18])]),
  damagedPostOrigin:Object.freeze([11,42]),rubbleBuildingID:'STRAT-A5',
  rubbleSurfaceXZ:Object.freeze([-25,-32]),
  tipBuildingID:'STRAT-TIP',
  tipFaultsXZ:Object.freeze([Object.freeze([24.8,-41.64]),Object.freeze([36,-40])]),
  tipGroundFireXZ:Object.freeze([20,-36.1]),
  blastOffset:Object.freeze([4,-2,8]),
});
export async function installWorldEnvironment({scene,audio,props,posts,buildings,ready,onElectricalContact,cars=[],vehicles=[],invasion=false}){
  await ready;
  const layout=WORLD_ENVIRONMENT_LAYOUT,warnings=[],owned=[],sites=[];
  function anchor(name,point){const a=new THREE.Object3D();a.name=name;a.position.copy(point);scene.add(a);owned.push(a);return a;}
  const bins=layout.trashOrigins.map(([x,z])=>props.state.trash.find(t=>t.x===x&&t.z===z&&t.loaded&&t.visual));
  if(!bins[0])throw Error('Authored primary trash bin unavailable');
  const bounds=bins.map(b=>b?new THREE.Box3().setFromObject(b.visual,true):null);
  const binAnchors=bounds.map((box,i)=>{
    if(!box){warnings.push('Basurero secundario no disponible; no se inventó otro anclaje.');return null;}
    const p=box.getCenter(new THREE.Vector3());p.y=box.max.y;
    const a=anchor('ambient-bin-'+i,p);
    sites.push({id:'BIN-'+layout.trashOrigins[i].join('-'),type:'burning-trash-bin',position:p.toArray(),size:box.getSize(new THREE.Vector3()).toArray()});return a;
  });
  let electric=null,rubble=null,stratElectric=null,tip=null,stratBlast=null,tipLowerFire=null;
  const tipElectric=[];
  const post=posts.state.records.find(r=>r.original.x===layout.damagedPostOrigin[0]&&r.original.z===layout.damagedPostOrigin[1]);
  if(post){
    electric=anchor('ambient-fault-post-11-42',post.bulb.clone().add(new THREE.Vector3(0,-.12,0)));
    sites.push({id:'POST-11-42',type:'electrical-fault',position:electric.position.toArray()});
  }else warnings.push('Poste 11/42 no disponible; chispas omitidas.');
  const strat=buildings.state.records.find(r=>r.entry.id===layout.rubbleBuildingID);
  if(strat){
    strat.root.updateWorldMatrix(true,true);const meshes=[];
    strat.root.traverse(o=>{if(o.isMesh&&!o.userData.buildingCollisionProxy)meshes.push(o);});
    const upperBuilding=findStratTip(meshes);
    if(upperBuilding)stratBlast=anchor('ambient-strat-building-upper-blast',upperBuilding.add(new THREE.Vector3().fromArray(layout.blastOffset)));
    const [x,z]=layout.rubbleSurfaceXZ;
    const ray=new THREE.Raycaster(new THREE.Vector3(x,strat.bounds.max.y+2,z),new THREE.Vector3(0,-1,0),0,strat.bounds.max.y-strat.bounds.min.y+6);
    const hit=ray.intersectObjects(meshes,false)[0];
    if(hit&&hit.point.y<strat.bounds.min.y+6){
      rubble=anchor('ambient-fallen-strat-debris',hit.point.clone().add(new THREE.Vector3(0,.12,0)));
      rubble.userData.environmentGroundY=hit.point.y+.02;
      stratElectric=anchor('ambient-fallen-strat-electric',hit.point.clone().add(new THREE.Vector3(0,2.4,0)));
      sites.push({id:'STRAT-A5-DEBRIS',type:'electrified-rubble',position:rubble.position.toArray(),surfaceY:hit.point.y});
    }else warnings.push('Superficie de Strat no válida; electricidad, daño y humo omitidos.');
  }else warnings.push('Strat caída no disponible; zona omitida.');
  const tipBuilding=buildings.state.records.find(r=>r.entry.id===layout.tipBuildingID);
  if(tipBuilding){
    const meshes=[];tipBuilding.root.traverse(o=>{if(o.isMesh&&!o.userData.buildingCollisionProxy)meshes.push(o);});
    const point=findStratTip(meshes);
    if(point){
      tip=anchor('ambient-strat-tip-fire-electric',point);
      sites.push({id:layout.tipBuildingID,type:'burning-electrical-tip',position:point.toArray()});
      // Real surfaces of the PUNTA model: one fault beside its highest point, one on its lower section.
      for(const [i,[x,z]]of layout.tipFaultsXZ.entries()){
        const ray=new THREE.Raycaster(new THREE.Vector3(x,tipBuilding.bounds.max.y+2,z),new THREE.Vector3(0,-1,0),0,tipBuilding.bounds.max.y-tipBuilding.bounds.min.y+6);
        const hit=ray.intersectObjects(meshes,false)[0];
        if(!hit||(i===0&&hit.point.distanceTo(point)>4)||(i===1&&hit.point.y>point.y-3)){
          warnings.push('Superficie de punta '+i+' no válida; efecto omitido.');continue;
        }
        const fault=anchor('ambient-strat-tip-electric-'+(i+2),hit.point.clone().add(new THREE.Vector3(0,i===0?.25:1.5,0)));
        tipElectric.push(fault);
        sites.push({id:'STRAT-TIP-ELECTRIC-'+(i+2),type:'tip-electrical-fault',position:fault.position.toArray(),surfaceY:hit.point.y});
      }
      // Separate the fire from the elevated electrical fault. This street-facing debris
      // surface is at ground level, not the 1.8 m ledge used by the previous placement.
      const [fx,fz]=layout.tipGroundFireXZ;
      const groundRay=new THREE.Raycaster(new THREE.Vector3(fx,tipBuilding.bounds.max.y+2,fz),new THREE.Vector3(0,-1,0),0,tipBuilding.bounds.max.y-tipBuilding.bounds.min.y+6);
      const groundHit=groundRay.intersectObjects(meshes,false)[0];
      if(groundHit&&Math.abs(groundHit.point.y)<=.25){
        tipLowerFire=anchor('ambient-strat-tip-lower-fire',groundHit.point.clone().add(new THREE.Vector3(0,.03,0)));
        tipLowerFire.userData.environmentGroundY=groundHit.point.y;
      }else warnings.push('Escombros de punta al nivel del suelo no válidos; fuego inferior omitido.');
    }
    else warnings.push('Punta Strat sin superficie válida; efectos de punta omitidos.');
  }else warnings.push('Modelo de punta Strat no disponible; efectos de punta omitidos.');
  const effects=[
    // The lower half remains inside each existing bin; no floating flames above a vehicle.
    {asset:'fire',anchor:'vehicle',offset:[0,.2,0],size:[.55,1.15],opacity:.9},
    {asset:'smoke',anchor:'vehicle',offset:[0,1.1,0],size:[1.4,2],opacity:.35,phase:24},
  ];
  if(binAnchors[1])effects.push(
    {asset:'fire',anchor:'bin2',offset:[0,.2,0],size:[.55,1.15],opacity:.86,phase:30},
    {asset:'smoke',anchor:'bin2',offset:[0,1.1,0],size:[1.4,2],opacity:.32,phase:8});
  if(rubble)effects.push({id:'strat-smoke',enabled:!invasion,asset:'smoke',anchor:'rubble',offset:[0,1.4,0],size:[3.7,4.2],opacity:.35,phase:8});
  if(invasion&&rubble){rubble.userData.environmentAudioEnabled=false;rubble.userData.environmentStructure=true;effects.push({id:'strat-fire',enabled:false,asset:'fire',anchor:'rubble',offset:[0,.7,0],size:[1.6,2.8],opacity:.85});}
  if(tipLowerFire){
    tipLowerFire.userData.environmentAudioEnabled=!invasion;
    effects.push({id:'strat-tip-lower-fire',enabled:!invasion,asset:'fire',anchor:'tipLowerFire',offset:[0,1.6,0],size:[2.1,3.2],opacity:.88,phase:23});
    sites.push({id:'STRAT-TIP-LOWER-FIRE',type:'tip-lower-fire',position:tipLowerFire.position.toArray(),surfaceY:tipLowerFire.userData.environmentGroundY});
  }
  if(tip)effects.push(
    {id:'strat-tip-fire',enabled:!invasion,asset:'fire',anchor:'tip',offset:[0,1,0],size:[2.4,3.6],opacity:.9,phase:12},
    {id:'strat-tip-smoke',enabled:!invasion,asset:'smoke',anchor:'tip',offset:[0,3,0],size:[3.4,4.6],opacity:.4,phase:18});
  // A single foreground veil softens the broken endpoint against the backlit blast.
  // It shares the existing atlas and the 12-sprite pool; no extra particle system.
  let shotVeil=null;
  if(invasion&&stratBlast){
    const forward=new THREE.Vector3(0,0,46).sub(stratBlast.position).setY(0).normalize().multiplyScalar(12);
    shotVeil=anchor('ambient-strat-shot-veil',stratBlast.position.clone().add(forward).add(new THREE.Vector3(0,2,0)));
    effects.push({id:'strat-shot-veil',asset:'smoke',anchor:'shotVeil',enabled:false,size:[34,30],opacity:0,phase:24,cinematic:true,maxDistance:160});
  }
  const hood=planVehicleHoodFires({cars,vehicles}),hoodAnchors={};
  warnings.push(...hood.warnings);
  for(const [i,plan]of hood.plans.entries()){
    const names=[];
    for(const [j,point]of plan.points.entries()){
      const name=`hood-${i}-${j}`;hoodAnchors[name]=anchor('ambient-'+plan.id+'-hood-'+j,point);names.push(name);
      effects.push({id:name,asset:'fire',anchor:name,offset:[0,plan.flameSize[1]*.40,0],size:plan.flameSize,opacity:.9,phase:(i*13+j*29)%64});
    }
    sites.push({id:plan.id,type:'vehicle-hood-fire',kind:plan.kind,position:plan.points[0].toArray(),flames:1,size:[...plan.flameSize],anchors:names,points:plan.points.map(p=>p.toArray())});
  }
  const flipbookCapacity=15+hood.plans.length;
  try{
    const system=await createEnvironmentSystem({scene,audio,sparkCapacity:84,flipbookCapacity,particleBudget:96,preloadExplosion:invasion,vehicle:binAnchors[0],smokeZone:rubble||binAnchors[0],
      sparkAnchors:{...(electric?{electric}:{}),...(rubble?{metal:rubble}:{}),...(stratElectric||tip?{electricLarge:stratElectric||tip}:{})},
      placement:{fireOffset:[0,0,0],emberOffset:[0,.1,0],effects,anchors:{bin2:binAnchors[1],tip,shotVeil,tipLowerFire,...hoodAnchors},additionalFireAnchors:[...(binAnchors[1]?[binAnchors[1]]:[]),...(invasion&&rubble?[rubble]:[]),...(tipLowerFire?[tipLowerFire]:[])]},
    });
    if(stratElectric||tip)system.setSparkAdditionalAnchors('electricLarge',[...(stratElectric&&tip?[tip]:[]),...tipElectric]);
    // Low alpha plus stronger local fog attenuation keeps the softened fireball veiled.
    const blastStyle={size:[44,48],offset:[0,4,0],maxDistance:160,cinematic:true,emissiveFogScale:.14,softness:3,opacity:.4};
    if(invasion&&(stratBlast||rubble)){system.prepareBlastGlow(stratBlast||rubble);system.prepareBlastExplosion(stratBlast||rubble,blastStyle);}
    const info=system.info,dispose=system.dispose,update=system.update,setEnabled=system.setEnabled,setSparksEnabled=system.setSparksEnabled;
    // A missing electrical texture must never leave an invisible damaging field.
    const visualReady=!!info().sparks;
    const hazard=rubble?createElectricalHazard({position:rubble.position,onDamage:onElectricalContact}):null;
    let layerEnabled=true,sparksEnabled=true,stratActive=!invasion,flash=null;
    if(invasion){
      system.stratIntroAnchor=rubble;
      system.stratBlastAnchor=stratBlast;
      system.setStratShotVeil=weight=>{const opacity=Number.isFinite(weight)?Math.max(0,Math.min(1,weight))*.9:0;system.setEffectOpacity('strat-shot-veil',opacity);system.setEffectEnabled('strat-shot-veil',opacity>.001);};
      system.resetStratIntro=()=>{system.setStratShotVeil(0);stratActive=false;if(rubble)rubble.userData.environmentAudioEnabled=false;if(tipLowerFire)tipLowerFire.userData.environmentAudioEnabled=false;system.removeEffect(flash);flash=null;system.clearBlastGlow();system.setEffectEnabled('strat-smoke',false);system.setEffectEnabled('strat-fire',false);system.setEffectEnabled('strat-tip-lower-fire',false);system.setEffectEnabled('strat-tip-fire',false);system.setEffectEnabled('strat-tip-smoke',false);system.setSparkKindEnabled('electricLarge',false);system.setEmberAnchors([]);};
      system.flashStratIntro=(burst=true)=>{if(burst&&(stratBlast||rubble)&&layerEnabled){system.removeEffect(flash);flash=system.flashExplosion(stratBlast||rubble,160,blastStyle);system.flashGlow(stratBlast||rubble);}};
      system.activateStratIntro=()=>{if(stratActive)return;stratActive=true;if(rubble)rubble.userData.environmentAudioEnabled=true;if(tipLowerFire)tipLowerFire.userData.environmentAudioEnabled=true;system.setEffectEnabled('strat-smoke',true);system.setEffectEnabled('strat-fire',true);system.setEffectEnabled('strat-tip-lower-fire',true);system.setEffectEnabled('strat-tip-fire',true);system.setEffectEnabled('strat-tip-smoke',true);system.setSparkKindEnabled('electricLarge',true);system.setEmberAnchors([rubble,tipLowerFire].filter(Boolean));};
      system.resetStratIntro();
    }
    hazard?.setEnabled(visualReady);
    system.update=(dt,frame)=>{update(dt,frame);hazard?.update(dt,frame);};
    system.setEnabled=value=>{layerEnabled=!!value;setEnabled(value);hazard?.setEnabled(visualReady&&layerEnabled&&sparksEnabled);};
    system.setSparksEnabled=value=>{sparksEnabled=!!value;setSparksEnabled(value);hazard?.setEnabled(visualReady&&layerEnabled&&sparksEnabled);};
    system.info=()=>{const base=info();return {...base,world:true,sites:sites.map(s=>({...s,position:[...s.position]})),warnings:[...warnings],invasion:{staged:invasion,active:stratActive,blastPosition:stratBlast?.position.toArray()||null},particleBudget:{maximum:96,sparkCapacity:84,reservedFlipbooks:12,arrivalFlipbooks:3,maximumFlipbooks:flipbookCapacity,visibleFlipbooks:base.vfx.visible,weakTargets:base.weakTargets||0,active:base.vfx.visible+(base.sparks?.active||0)+(base.weakTargets||0)},hazards:hazard?[hazard.info()]:[],maxSites:8+hood.plans.length};};
    system.dispose=()=>{hazard?.setEnabled(false);dispose();for(const a of owned)a.removeFromParent();};
    return system;
  }catch(error){for(const a of owned)a.removeFromParent();throw error;}
}
