import * as THREE from 'three';

// Fitted to the five actual sacs of 1.glb, in its original mesh coordinates.
// The original GLB, topology and texture maps remain untouched.
export const EXPLOSIVE_ORBS=Object.freeze([
  {center:[-.1491023,.7514496,-.0240131],radius:.1212504},
  {center:[.0412144,.7658025,-.1622858],radius:.1267910},
  {center:[.2278906,.5904432,-.1736470],radius:.1046483},
  {center:[-.2900653,.5879509,-.1143015],radius:.0964015},
  {center:[.2424029,.5388925,-.0258127],radius:.0963112},
]);
const zones=EXPLOSIVE_ORBS.map(({center,radius},i)=>
  `float orbDistance${i}=length(vExplosiveOrbPosition-vec3(${center.map(n=>n.toFixed(7)).join(',')}))/${radius.toFixed(7)};`
  +`if(orbDistance${i}<nearestOrb){nearestOrb=orbDistance${i};orbEnabled=uExplosiveOrbs[${i}];}`
).join('\n');

export function explosiveOrbAt(point){
  let best=-1,distance=1.18;
  EXPLOSIVE_ORBS.forEach(({center,radius},i)=>{
    const d=Math.hypot(point.x-center[0],point.y-center[1],point.z-center[2])/radius;
    if(d<distance){distance=d;best=i;}
  });
  return best;
}

// Abdomen below the chest, in the same original bind coordinates as the sacs.
// Actual skinned triangle hits are converted to this space before classification.
export const EXPLOSIVE_STOMACH=Object.freeze({center:[.0225,.22,-.055],radii:[.20,.16,.30]});
export function explosiveStomachAt(point){
  const {center,radii}=EXPLOSIVE_STOMACH;
  return [point?.x,point?.y,point?.z].every(Number.isFinite)
    && ((point.x-center[0])/radii[0])**2+((point.y-center[1])/radii[1])**2+((point.z-center[2])/radii[2])**2<=1;
}

export const EXPLOSIVE_ORB_HP=340;
export const EXPLOSIVE_WEAK_SECONDS=4;
export const EXPLOSIVE_PROTECTED_DAMAGE=.2;
export const EXPLOSIVE_PRECISION_RADIUS=.45; // A forgiving core inside the actual sac, not the wide red flare.
// Outer sac on the opposite arm: left edge when facing the enemy.
export const EXPLOSIVE_LATE_ORB=3,EXPLOSIVE_LATE_WAVE=15;
export function explosiveOrbMaskForWave(wave=1){
  return EXPLOSIVE_ORBS.map((_,i)=>i!==EXPLOSIVE_LATE_ORB||(Number.isInteger(wave)&&wave>=EXPLOSIVE_LATE_WAVE));
}
export function createExplosiveOrbHealth(maxHp=EXPLOSIVE_ORB_HP,activeMask=[true,true,true,true,true]){
  if(!Array.isArray(activeMask)||activeMask.length!==5||activeMask.some(v=>typeof v!=='boolean')||!activeMask.some(Boolean))throw Error('Invalid explosive sac mask');
  const active=[...activeMask],health=active.map(on=>on?maxHp:0);let weakLeft=0;
  return {
    expose(seconds=EXPLOSIVE_WEAK_SECONDS){if(Number.isFinite(seconds)&&seconds>0&&health.some(h=>h>0))weakLeft=Math.max(weakLeft,seconds);},
    update(dt){if(Number.isFinite(dt)&&dt>0)weakLeft=Math.max(0,weakLeft-dt);},
    damage(index,amount,{precision=false}={}){
      const invalid=!Number.isInteger(index)||index<0||index>=5||!Number.isFinite(amount)||amount<=0||health[index]<=0;
      if(invalid)return {accepted:false,index,damage:0,popped:false,dead:health.every(h=>h===0)};
      const vulnerable=weakLeft>0,precise=vulnerable&&precision===true;
      const hitDamage=precise?Math.max(amount,Math.ceil(maxHp/3)):amount;
      const loss=Math.min(Math.max(0,health[index]-(vulnerable?0:1)),hitDamage*(vulnerable?1:EXPLOSIVE_PROTECTED_DAMAGE));health[index]-=loss;
      return {accepted:loss>0,index,damage:loss,popped:health[index]===0,dead:health.every(h=>h===0),vulnerable,precision:precise};
    },
    info:()=>({maxHp,activeOrbs:[...active],activeCount:active.filter(Boolean).length,destroyed:health.filter((h,i)=>active[i]&&h===0).length,health:[...health],remaining:health.filter(h=>h>0).length,totalHealth:health.reduce((a,b)=>a+b,0),vulnerable:weakLeft>0,weakLeft,protectedDamage:EXPLOSIVE_PROTECTED_DAMAGE}),
  };
}

export function createExplosiveOrbGlow(root,{activeOrbs=[true,true,true,true,true],emitWeakPoint=()=>0,spotlightTexture=null,getViewPosition=()=>null,getShotOrigin=getViewPosition,targetEffectsEnabled=()=>true,onTargetCount=()=>{}}={}){
  const health=createExplosiveOrbHealth(EXPLOSIVE_ORB_HP,activeOrbs);
  const enabled=new Float32Array(health.info().health.map(h=>h/EXPLOSIVE_ORB_HP)),meshes=[];
  let weakActive=false,weakTimer=0,weakEmissions=0,disposed=false;
  let targetsMarked=false,targetAge=0,targetCount=0;
  const targets=[],targetPoint=new THREE.Vector3(),targetCenter=new THREE.Vector3(),viewDirection=new THREE.Vector3(),worldScale=new THREE.Vector3(),rootScale=new THREE.Vector3();
  const shotDirection=new THREE.Vector3(),shotToCenter=new THREE.Vector3();
  const targetMaterial=spotlightTexture?new THREE.SpriteMaterial({map:spotlightTexture,color:0xff1515,transparent:true,opacity:.75,alphaTest:.025,depthWrite:false,depthTest:true,toneMapped:false,fog:true}):null;
  function publishTargets(){const count=targets.filter(t=>t.object.visible).length;if(count!==targetCount){targetCount=count;onTargetCount(count);}}
  const local=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),weights=new THREE.Vector3();
  const bars=[],barMaterials=[
    new THREE.SpriteMaterial({color:0x090909,transparent:true,opacity:.28,depthWrite:false}),
    new THREE.SpriteMaterial({color:0xe3c05b,transparent:true,opacity:.65,depthWrite:false}),
  ];
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;meshes.push(mesh);
    for(const material of [mesh.material].flat()){
      const before=material.onBeforeCompile;
      material.onBeforeCompile=function(shader,renderer){
        before.call(this,shader,renderer);
        shader.uniforms.uExplosiveOrbs={value:enabled};
        const hasRest=mesh.geometry.hasAttribute('_orbposition');
        shader.vertexShader=(hasRest?'attribute vec3 _orbposition;\n':'')+'varying vec3 vExplosiveOrbPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvExplosiveOrbPosition='+(hasRest?'_orbposition':'position')+';');
        shader.fragmentShader='uniform float uExplosiveOrbs[5];\nvarying vec3 vExplosiveOrbPosition;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
          #include <emissivemap_fragment>
          float nearestOrb=1.18;
          float orbEnabled=0.0;
          ${zones}
          float orbMask=1.0-smoothstep(1.03,1.18,nearestOrb);
          float orbOff=orbMask*(1.0-step(0.0001,orbEnabled));
          float orbVeins=smoothstep(0.035,0.28,diffuseColor.r);
          float orbAlive=step(0.0001,orbEnabled);
          // A destroyed sac is charred, including its original yellow texture.
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.012,0.009,0.008),orbOff);
          totalEmissiveRadiance*=1.0-orbOff;
          totalEmissiveRadiance+=vec3(1.0,0.58,0.012)*0.95*orbMask*max(orbEnabled,orbAlive*0.22)*orbVeins;
        `);
      };
      material.customProgramCacheKey=()=> 'explosive-orbs-v85-'+mesh.geometry.hasAttribute('_orbposition');
      material.needsUpdate=true;
    }
  });
  const reference=meshes[0],rest=reference?.geometry.getAttribute('_orbposition')||reference?.geometry.attributes.position;
  for(let i=0;i<5;i++){
    let vertex=0,nearest=Infinity;const target=new THREE.Vector3(...EXPLOSIVE_ORBS[i].center);target.y+=EXPLOSIVE_ORBS[i].radius;
    if(rest)for(let j=0;j<rest.count;j++){local.fromBufferAttribute(rest,j);const d=local.distanceToSquared(target);if(d<nearest){nearest=d;vertex=j;}}
    const group=new THREE.Group(),back=new THREE.Sprite(barMaterials[0]),fill=new THREE.Sprite(barMaterials[1]);
    back.scale.set(.24,.022,1);fill.scale.set(.23,.010,1);fill.position.z=.002;
    back.raycast=fill.raycast=()=>{};group.add(back,fill);group.visible=false;group.name='Vida de bola · discreta';
    const anchor={
      getWorldPosition(target){reference.getVertexPosition(vertex,target);return reference.localToWorld(target);},
      isEffectActive:()=>!disposed&&weakActive&&enabled[i]>0,
    };
    root.add(group);bars.push({group,fill,vertex,timer:0,anchor});
    if(targetMaterial){
      // Skin six extremal surface samples to follow the actual sac's centre,
      // rather than following the head bone or the detached health-bar offset.
      const vertices=[];
      if(rest)for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
        const sample=new THREE.Vector3(...EXPLOSIVE_ORBS[i].center);sample.setComponent(axis,sample.getComponent(axis)+sign*EXPLOSIVE_ORBS[i].radius);
        let index=0,distance=Infinity;for(let j=0;j<rest.count;j++){local.fromBufferAttribute(rest,j);const d=local.distanceToSquared(sample);if(d<distance){distance=d;index=j;}}
        vertices.push(index);
      }
      const object=new THREE.Sprite(targetMaterial);object.name='Explosivo · objetivo rojo '+(i+1);object.visible=false;object.raycast=()=>{};root.add(object);targets.push({object,vertices,index:i});
    }
  }
  function readTargetCenter(target,out){
    if(!reference||!target?.vertices.length)return false;
    out.set(0,0,0);for(const index of target.vertices){reference.getVertexPosition(index,targetPoint);reference.localToWorld(targetPoint);out.add(targetPoint);}out.multiplyScalar(1/target.vertices.length);
    return true;
  }
  function preciseRedHit(index,worldPoint){
    const view=getShotOrigin();
    if(!targetsMarked||!health.info().vulnerable||!targetEffectsEnabled()||!view||![view.x,view.y,view.z].every(Number.isFinite)||!readTargetCenter(targets[index],targetCenter))return false;
    // The real surface was already hit and classified above. Measure that
    // bullet's line through the centre of this animated, visible red target.
    shotDirection.copy(worldPoint).sub(view);const length=shotDirection.length();if(length<.001)return false;
    shotDirection.multiplyScalar(1/length);shotToCenter.copy(targetCenter).sub(view);
    const depth=shotToCenter.dot(shotDirection);if(depth<=0)return false;
    reference.getWorldScale(worldScale);
    const radius=EXPLOSIVE_ORBS[index].radius*Math.max(worldScale.x,worldScale.y,worldScale.z);
    return shotToCenter.addScaledVector(shotDirection,-depth).lengthSq()<=(radius*EXPLOSIVE_PRECISION_RADIUS)**2;
  }
  function readHitIndex(worldPoint,hitMesh,hit){
      // Only the real struck surface counts, never a ray through a wall or a
      // nearby body hit. Match CPU selection to the shader's nearest sac.
      if(!worldPoint||![worldPoint.x,worldPoint.y,worldPoint.z].every(Number.isFinite)||!meshes.includes(hitMesh))return null;
      local.copy(worldPoint);hitMesh.worldToLocal(local);
      const bind=hitMesh.geometry.getAttribute('_orbposition');
      if(bind&&hit?.face){
        const ids=[hit.face.a,hit.face.b,hit.face.c];
        if(ids.some(i=>!Number.isInteger(i)||i<0||i>=bind.count))return null;
        hitMesh.getVertexPosition(ids[0],a);hitMesh.getVertexPosition(ids[1],b);hitMesh.getVertexPosition(ids[2],c);
        THREE.Triangle.getBarycoord(local,a,b,c,weights);
        if(![weights.x,weights.y,weights.z].every(v=>Number.isFinite(v)&&v>=-.001&&v<=1.001))return null;
        local.set(0,0,0);for(let i=0;i<3;i++)local.addScaledVector(a.fromBufferAttribute(bind,ids[i]),weights.getComponent(i));
      }else if(bind)return null; // Animated surfaces require the actual struck triangle.
      return explosiveOrbAt(local);
  }
  return {
    expose(){health.expose();weakActive=health.info().vulnerable;},
    highlightTargets(){targetsMarked=true;targetAge=0;},
    indexForHit(hit){return readHitIndex(hit?.point,hit?.object,hit);},
    aimTargets({includeProtected=false}={}){
      const hp=health.info();
      if(disposed||!includeProtected&&(!targetsMarked||!hp.vulnerable||!targetEffectsEnabled()))return [];
      root.updateMatrixWorld(true);reference?.skeleton?.update();reference?.getWorldScale(worldScale);
      return targets.filter(t=>(includeProtected||t.object.visible)&&hp.health[t.index]>0).flatMap(t=>{
        const center=new THREE.Vector3();if(!readTargetCenter(t,center))return [];
        return [{index:t.index,center,radius:EXPLOSIVE_ORBS[t.index].radius*Math.max(worldScale.x,worldScale.y,worldScale.z),exposed:targetsMarked&&hp.vulnerable&&targetEffectsEnabled()}];
      });
    },
    hit(worldPoint,hitMesh,amount=34,hit){
      const index=readHitIndex(worldPoint,hitMesh,hit);
      if(index===null)return health.damage(-1,amount);
      if(index<0&&Number.isFinite(amount)&&amount>0)return {...health.damage(-1,amount),bodyHit:true,stomachHit:explosiveStomachAt(local)};
      const result=health.damage(index,amount,{precision:index>=0&&preciseRedHit(index,worldPoint)});
      if(result.accepted){
        enabled[index]=health.info().health[index]/EXPLOSIVE_ORB_HP;
        bars[index].timer=result.popped?0:2.2;
        if(result.popped){
          bars[index].group.visible=false;
          if(targets[index])targets[index].object.visible=false;
          publishTargets();
        }
      }
      return result;
    },
    update(dt){
      health.update(dt);weakActive=health.info().vulnerable;
      const hp=health.info();root.updateMatrixWorld(true);
      targetAge+=dt;if(!weakActive)targetsMarked=false;
      const showTargets=targetsMarked&&weakActive&&!disposed&&targetEffectsEnabled();
      reference?.getWorldScale(worldScale);root.getWorldScale(rootScale);
      // Two smooth pulses per second, driven only by active game time.
      // Keep the five logical markers budgeted even at the dim phase.
      targetMaterial&&(targetMaterial.opacity=.12+.70*(.5-.5*Math.cos(targetAge*Math.PI*4)));
      for(const t of targets){
        t.object.visible=showTargets&&hp.health[t.index]>0;if(!t.object.visible)continue;
        readTargetCenter(t,targetCenter);
        const radius=EXPLOSIVE_ORBS[t.index].radius*Math.max(worldScale.x,worldScale.y,worldScale.z),view=getViewPosition();
        // Stay just in front of this sac so its surface cannot hide the flare;
        // normal depth testing still lets walls and nearer geometry occlude it.
        if(view)viewDirection.copy(view).sub(targetCenter).normalize();else viewDirection.set(0,0,1);
        targetCenter.addScaledVector(viewDirection,radius*1.08);root.worldToLocal(t.object.position.copy(targetCenter));
        const size=radius*4.4;t.object.scale.set(size/rootScale.x,size/rootScale.y,1);
      }
      publishTargets();
      weakTimer=Math.max(0,weakTimer-dt);
      if(weakActive&&weakTimer<=0){
        weakTimer=.18;
        for(let i=0;i<bars.length;i++)if(hp.health[i]>0)weakEmissions+=Math.max(0,emitWeakPoint(bars[i].anchor)||0);
      }else if(!weakActive)weakTimer=0;
      for(let i=0;i<bars.length;i++){
        const bar=bars[i];bar.timer=Math.max(0,bar.timer-dt);bar.group.visible=bar.timer>0&&hp.health[i]>0;
        if(!bar.group.visible)continue;
        reference.getVertexPosition(bar.vertex,local);reference.localToWorld(local);root.worldToLocal(local);
        bar.group.position.copy(local);bar.group.position.y+=.075;
        const ratio=hp.health[i]/hp.maxHp;bar.fill.scale.x=.23*ratio;bar.fill.position.x=-.115*(1-ratio);
      }
    },
    dispose(){disposed=true;weakActive=false;for(const t of targets){t.object.visible=false;t.object.removeFromParent();}publishTargets();targetMaterial?.dispose();for(const bar of bars)bar.group.removeFromParent();for(const m of barMaterials)m.dispose();},
    info:()=>({total:enabled.length,lit:Array.from(enabled,v=>v>0),extinguished:health.info().destroyed,
      ...health.info(),weakEmissions,targetMarkers:targetCount,visibleBars:bars.filter(b=>b.group.visible).length}),
  };
}
