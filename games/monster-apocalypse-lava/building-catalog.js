// One entry per existing building slot. Switch active to legacy to restore CA.
// The review page retains the full-size trial; the playable placement fits within F.
// Original seeded slots, using the IDs from mapa-monster-apocalypse-secciones.pdf.
export const CITY_BUILDING_REFERENCES=Object.freeze(['E04','E08','E01','E05','E09','E02','E03','E07','E06']);
// Keep the original city/hospital assets for future additions, but empty their lots now.
export const CITY_BUILDING_SETTINGS=Object.freeze({enabled:false});
export const HOSPITAL_SETTINGS=Object.freeze({enabled:false});
// With the old city enabled, removing this entry restores E09. Guard its original footprint.
export const CITY_BUILDING_REMOVALS=Object.freeze({
  E09:Object.freeze({minX:20,maxX:32.51023051678679,minZ:50.53705942888607,maxZ:62.494218565288094}),
});
// New buildings use cell references independently of the original city's enabled flag.
export const PLACED_BUILDINGS=Object.freeze([
  {id:'BS-D5',cell:'D5',name:'BASTIDA SYSTEMS',enabled:true,
    asset:'BASTIDA SYSTEMS',model:'assets/custom-buildings/bastida-systems/model.glb?v=20261013-bs1',
    descriptor:'assets/custom-buildings/bastida-systems/asset.json?v=20261013-bs1',collisionFootprint:'assets/custom-buildings/bastida-systems/collision-footprint.json?v=20261014-contour1',
    targetHeight:45,targetWidth:28,targetDepth:16.5,anchor:{x:36,z:-6.25},frontYaw:Math.PI,
    allowed:{minX:20,maxX:52,minZ:-7,maxZ:11}},
  {id:'BS-D8',cell:'D8',name:'BASTIDA SYSTEMS',enabled:false,
    asset:'BASTIDA SYSTEMS',model:'assets/custom-buildings/bastida-systems/model.glb?v=20261013-bs1',
    descriptor:'assets/custom-buildings/bastida-systems/asset.json?v=20261013-bs1',collisionFootprint:'assets/custom-buildings/bastida-systems/collision-footprint.json?v=20261014-contour1',
    targetHeight:15,anchor:{x:36.8,z:10.85},frontYaw:0,
    allowed:{minX:20,maxX:52,minZ:-7,maxZ:11}},
  {id:'GS-E5',cell:'E5',cells:['E1','E2','E4','E5','E6','E7','E8','E9'],name:'GASOLINERA',enabled:true,
    asset:'GASOLINERA / LAST STOP AT DUSK',model:'assets/custom-buildings/gas-station/model-no-sign.glb?v=20261013-fleet1',
    descriptor:'assets/custom-buildings/gas-station/asset-no-sign.json?v=20261013-fleet1',collisionFootprint:'assets/custom-buildings/gas-station/collision-footprint.json?v=20261015-casino-gas-lower1',
    // A modest 15% reduction, with only the separate roadside sign removed.
    targetHeight:11.22,heightOffset:-.5,allowOutsideLot:true,collisionMode:'per-body-footprint',supportOutsideGround:true,
    anchor:{x:-20.4,z:47.8},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-39,maxX:-20,minZ:37,maxZ:58}},
  {id:'P13-C4',cell:'C4',cells:['C1','C2','C4','C5','C7','C8','E1','E2'],name:'PLANET 13',enabled:true,
    asset:'PLANET 13',model:'assets/custom-buildings/planet13/model.glb?v=20261013-p131',
    descriptor:'assets/custom-buildings/planet13/asset.json?v=20261013-p131',collisionFootprint:'assets/custom-buildings/planet13/collision-footprint.json?v=20261014-contour1',
    // User-approved full proportions, including extension beyond this lot and over roads.
    targetHeight:18.3,allowOutsideLot:true,anchor:{x:-33.5,z:14},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-52,maxX:-33.5,minZ:-7,maxZ:11}},
  {id:'B13-C5-C6',cell:'C5-C6',cells:['C5','C6'],name:'BOLA13',enabled:true,
    asset:'PLANET 13 / BOLA13',model:'assets/custom-buildings/bola13/model.glb?v=20261013-b131',
    descriptor:'assets/custom-buildings/bola13/asset.json?v=20261013-b131',collisionFootprint:'assets/custom-buildings/bola13/collision-footprint.json?v=20261014-contour1',
    targetHeight:6,anchor:{x:-23.22504147603485,z:2},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-39,maxX:-20,minZ:-2.6666666667,maxZ:6.6666666667}},
  {id:'SD-A5',cell:'A5',cells:['A1','A2','A3','A4','A5','A6','A7','A8','A9'],name:'TORRE DESTRUIDA',enabled:false,
    asset:'TORRE DESTRUIDA',model:'assets/custom-buildings/torre-destruida/model.glb?v=20261014-torre1',
    descriptor:'assets/custom-buildings/torre-destruida/asset.json?v=20261014-torre1',
    // Torre destruida landmark de la sección A (sustituye a Sky Needle SN-A5): 55 m de alto;
    // footprintHeight fija la escala horizontal y targetHeight la vertical (proporciones de la referencia).
    targetHeight:55,footprintHeight:22.9,anchor:{x:-36,z:-33.2},frontYaw:0,textureAnisotropy:8,
    allowed:{minX:-52,maxX:-20,minZ:-58,maxZ:-33}},
  {id:'STRAT-A5',cell:'A5',cells:['A1','A2','A3','A4','A5','A6','A7','A8','A9'],name:'FALLEN STRAT',enabled:true,
    asset:'FALLEN STRAT',model:'assets/custom-buildings/fallen-strat/model.glb?v=20261014-strat-matte1',
    descriptor:'assets/custom-buildings/fallen-strat/asset.json?v=20261014-strat-matte1',
    collisionFootprint:'assets/custom-buildings/fallen-strat/collision-footprint.json?v=20261014-strat-ground2',
    // Rotate east toward Punta around the existing world center (-36,-53.8768554).
    targetHeight:55,allowOutsideLot:true,supportOutsideGround:true,
    heightOffset:-0.3,anchor:{x:-15.32314459122573,z:-53.87685540877427},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-52,maxX:-20,minZ:-58,maxZ:-33}},
  {id:'VEGAS-AC',cell:'A8-C2',cells:['A8','A9','C1','C2','C3'],name:'LAS VEGAS',enabled:true,
    asset:'LAS VEGAS ARCH',model:'assets/custom-buildings/vegas-sign/model.glb?v=20261014-vegas1',
    descriptor:'assets/custom-buildings/vegas-sign/asset.json?v=20261014-vegas1',
    collisionFootprint:'assets/custom-buildings/vegas-sign/collision-footprint.json?v=20261015-vegas-lower2',
    // Gateway in front of the east-facing Strat; face south toward the player start. Keep its open span traversable.
    targetHeight:13.7,heightOffset:-.82,allowOutsideLot:true,reserveGroundOnly:true,anchor:{x:-2.5,z:-26.970910302253987},frontYaw:0,textureAnisotropy:8,
    allowed:{minX:-52,maxX:-13,minZ:-33,maxZ:-7}},
  {id:'STRAT-TIP',cell:'B5',cells:['B1','B2','B3','B4','B5','B6','B7','B8','B9'],name:'PUNTA STRAT',enabled:true,
    asset:'FALLEN STRAT TIP',model:'assets/custom-buildings/strat-tip/model.glb?v=20261014-vegas1',
    descriptor:'assets/custom-buildings/strat-tip/asset.json?v=20261014-vegas1',
    collisionFootprint:'assets/custom-buildings/strat-tip/collision-footprint.json?v=20261015-tip-lower1',
    targetHeight:15,heightOffset:-.5,allowOutsideLot:true,supportOutsideGround:true,anchor:{x:36,z:-33},frontYaw:0,textureAnisotropy:8,
    allowed:{minX:13,maxX:52,minZ:-58,maxZ:-28}},
  {id:'BARRIER-CE',cell:'C-E',name:'BARRERA DE CARROS',enabled:true,
    asset:'BARRERA DE CARROS',model:'assets/custom-buildings/car-barrier/model.glb?v=20261015-barrier-centered4',
    descriptor:'assets/custom-buildings/car-barrier/asset.json?v=20261015-barrier-centered4',
    collisionFootprint:'assets/custom-buildings/car-barrier/collision-footprint.json?v=20261015-barrier-centered4',
    // Planet 13 side, centered across the south road (z16..32 => center z24). Half-size.
    targetHeight:1.65,allowOutsideLot:true,anchor:{x:-23.5,z:24},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-33.5,maxX:-13,minZ:16,maxZ:32}},
  {id:'STOP-P13',cell:'C',name:'PARADA PLANET 13',enabled:true,
    asset:'PARADA CON BABA',model:'assets/custom-buildings/bus-stop-slime/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop-slime/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop-slime/collision-footprint.json?v=20261015-stop-collision1',
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:-15,z:10.2},frontYaw:Math.PI/2,textureAnisotropy:8,
    allowed:{minX:-20,maxX:-13,minZ:-12,maxZ:16}},
  {id:'STOP-BS',cell:'D',name:'PARADA BASTIDA',enabled:true,
    asset:'PARADA AUTOBUS',model:'assets/custom-buildings/bus-stop/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop/collision-footprint.json?v=20261015-stop-collision1',
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:36,z:-11},frontYaw:Math.PI,textureAnisotropy:8,
    allowed:{minX:13,maxX:52,minZ:-12,maxZ:-7}},
  {id:'STOP-STRAT',cell:'B6',name:'PARADA STRAT',enabled:true,
    asset:'PARADA AUTOBUS',model:'assets/custom-buildings/bus-stop/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop/collision-footprint.json?v=20261015-stop-collision1',
    // Former E02 frontage, on the north sidewalk facing south toward section D.
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:41.01334696845773,z:-29},frontYaw:0,textureAnisotropy:8,
    allowed:{minX:13,maxX:52,minZ:-33,maxZ:-28}},
  {id:'STOP-BS-SIDE',cell:'D4',name:'PARADA COSTADO BASTIDA',enabled:true,
    asset:'PARADA AUTOBUS',model:'assets/custom-buildings/bus-stop/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop/collision-footprint.json?v=20261015-stop-collision1',
    // West side of Bastida, on the main avenue sidewalk, facing the roadway.
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:15,z:2},frontYaw:-Math.PI/2,textureAnisotropy:8,
    allowed:{minX:13,maxX:20,minZ:-12,maxZ:16}},
  {id:'STOP-GAS-WEST',cell:'E2',name:'PARADA GASOLINERA OESTE',enabled:true,
    asset:'PARADA AUTOBUS',model:'assets/custom-buildings/bus-stop/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop/collision-footprint.json?v=20261015-stop-collision1',
    // Gas station's north sidewalk, facing the south cross street; reuse the existing shelter.
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:-29.8,z:33.3},frontYaw:Math.PI,textureAnisotropy:8,
    allowed:{minX:-33.5,maxX:-20,minZ:32,maxZ:37}},
  {id:'STOP-GAS-EAST',cell:'E2',name:'PARADA GASOLINERA ESTE',enabled:true,
    asset:'PARADA AUTOBUS',model:'assets/custom-buildings/bus-stop/model.glb?v=20261015-stops1',
    descriptor:'assets/custom-buildings/bus-stop/asset.json?v=20261015-stops1',
    collisionFootprint:'assets/custom-buildings/bus-stop/collision-footprint.json?v=20261015-stop-collision1',
    // Gas station's north sidewalk, facing the south cross street; reuse the existing shelter.
    targetHeight:3,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:-23,z:33.3},frontYaw:Math.PI,textureAnisotropy:8,
    allowed:{minX:-33.5,maxX:-20,minZ:32,maxZ:37}},
  {id:'RAFA-C8',cell:'C8',name:'COMPA RAFA',enabled:true,
    asset:'COMPA RAFA',model:'assets/custom-buildings/compa-rafa/model.glb?v=20261015-rafa1',
    descriptor:'assets/custom-buildings/compa-rafa/asset.json?v=20261015-rafa1',
    collisionFootprint:'assets/custom-buildings/compa-rafa/collision-footprint.json?v=20261015-rafa1',
    targetHeight:9,supportSurface:'sidewalk',allowOutsideLot:true,anchor:{x:-29.5,z:15.5},frontYaw:0,textureAnisotropy:8,
    allowed:{minX:-39,maxX:-26,minZ:11,maxZ:16}},
]);
export const BUILDING_CATALOG=Object.freeze({
  comisaria:{reference:'CA',active:'custom',
    custom:{id:'CASINO3/CASINO1',model:'assets/custom-buildings/casino1/model-detail.glb?v=20261013-audio1',
      descriptor:'assets/custom-buildings/casino1/asset-detail.json?v=20261013-audio1',collisionFootprint:'assets/custom-buildings/casino1/collision-footprint.json?v=20261015-casino-gas-lower1',targetHeight:15,
      originalFront:{x:16,z:40},interiorFront:{x:20.25,z:48.775034346343745},
      allowed:{minX:20,maxX:52,minZ:37,maxZ:58},frontYaw:-Math.PI/2,
    },
    placement:{pose:'F5',targetHeight:13.799132621521066,heightOffset:-.5,
      anchor:{x:20.25,z:47.65236516085218},
      // Only the low rear platform may extend beyond the playable south edge.
      visualOverhang:{south:.26,maxHeight:.5}},
  },
});

export function selectedBuildingAsset(id) {
  const entry=BUILDING_CATALOG[id];
  if(!entry)return null;
  const review=location.pathname.endsWith('/casino3-preview.html');
  const pose=new URLSearchParams(location.search).get('pose')==='interior'?'interior':'original';
  if(review)return {...entry.custom,review:true,originalSize:true,pose,anchor:pose==='interior'?entry.custom.interiorFront:entry.custom.originalFront};
  return entry.active==='custom'?{...entry.custom,...entry.placement,review:false,
    originalSize:entry.placement.targetHeight===entry.custom.targetHeight}:null;
}
