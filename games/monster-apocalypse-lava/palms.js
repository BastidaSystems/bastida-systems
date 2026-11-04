import * as THREE from 'three';
import {createModelLoader} from './model-loader.js?v=20261015-mobile-memory1';

// Shared meshes per district keep both draw calls and offscreen geometry bounded.
export const PALM_SITES=Object.freeze([
  {id:'casino-north-1',zone:'casino',x:27,z:34.5,yaw:0},
  {id:'casino-north-2',zone:'casino',x:43,z:34.5,yaw:0},
  {id:'casino-west-1',zone:'casino',x:18.7,z:42,yaw:Math.PI/2},
  {id:'casino-west-2',zone:'casino',x:18.7,z:54,yaw:Math.PI/2},
  {id:'bastida',zone:'central',x:18.7,z:9,yaw:Math.PI/2},
  {id:'planet13',zone:'central',x:-18.7,z:-3,yaw:Math.PI/2},
  {id:'strat-tip',zone:'north',x:24,z:-30.5,yaw:0},
  {id:'strat',zone:'north',x:-14.1,z:-45,yaw:Math.PI/2},
]);
const overlaps=(a,b)=>b.rectangles?b.rectangles.some(r=>overlaps(a,r)):Number.isFinite(b.minX)&&a.minX<b.maxX+.08&&a.maxX>b.minX-.08&&a.minZ<b.maxZ+.08&&a.maxZ>b.minZ-.08;
export function createPalmSystem({scene,colliders,shootBlockers,getSidewalks,getSidewalkSurface,getBuildings,getAnisotropy=()=>1}){
  const state={ready:false,error:null,records:[],batches:[],skipped:[]};let loading;
  async function model(kind){
    const base='assets/props/palms/'+kind+'/';const[file,response]=await Promise.all([createModelLoader().loadAsync(base+'model.glb'),fetch(base+'asset.json')]);
    if(!response.ok)throw Error('No cargó '+kind);const descriptor=await response.json();file.scene.updateMatrixWorld(true);const meshes=[];file.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
    if(meshes.length!==1)throw Error('Se esperaba una malla de '+kind);const m=meshes[0],geometry=m.geometry.clone().applyMatrix4(m.matrixWorld);geometry.computeBoundingBox();const b=geometry.boundingBox,size=b.getSize(new THREE.Vector3());
    if(!m.material.map||!m.material.normalMap||!m.material.roughnessMap||!m.material.metalnessMap)throw Error('Material PBR incompleto');
    if(kind==='base')geometry.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);
    else {const p=geometry.attributes.position;let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(let i=0;i<p.count;i++)if(p.getY(i)<b.min.y+.2){minX=Math.min(minX,p.getX(i));maxX=Math.max(maxX,p.getX(i));minZ=Math.min(minZ,p.getZ(i));maxZ=Math.max(maxZ,p.getZ(i));}geometry.translate(-(minX+maxX)/2,-b.min.y,-(minZ+maxZ)/2);}
    geometry.computeBoundingBox();geometry.computeBoundingSphere();for(const texture of new Set([m.material.map,m.material.normalMap,m.material.roughnessMap,m.material.metalnessMap]))texture.anisotropy=Math.min(8,getAnisotropy());
    return {geometry,material:m.material,size,triangles:descriptor.triangles};
  }
  return {state,
    load(environmentReady){if(loading)return loading;loading=(async()=>{try{
      const [base,palm]=await Promise.all([model('base'),model('palm'),environmentReady]);const surface=getSidewalkSurface();if(!surface)throw Error('Banquetas no disponibles');surface.updateMatrixWorld(true);
      const scale=.65/base.size.y,length=base.size.x*scale,width=base.size.z*scale,sidewalks=getSidewalks(),ray=new THREE.Raycaster(),records=[];
      for(const requested of PALM_SITES){const alongZ=Math.abs(Math.sin(requested.yaw))>.5,ex=(alongZ?width:length)/2,ez=(alongZ?length:width)/2;let site,rect;
        // Shift along the same sidewalk if existing lamps or street props occupy a candidate.
        for(const offset of [0,3,-3,6,-6]){const candidate={...requested,x:requested.x+(alongZ?0:offset),z:requested.z+(alongZ?offset:0)},bounds={minX:candidate.x-ex,maxX:candidate.x+ex,minZ:candidate.z-ez,maxZ:candidate.z+ez};
          if(!sidewalks.some(s=>bounds.minX>=s.minX&&bounds.maxX<=s.maxX&&bounds.minZ>=s.minZ&&bounds.maxZ<=s.maxZ)||[...getBuildings(),...colliders,...records.map(r=>r.rect)].some(r=>overlaps(bounds,r)))continue;
          site=candidate;rect=bounds;break;
        }
        if(!site){state.skipped.push(requested.id);continue;}
        const heights=[];for(const x of [rect.minX+.03,site.x,rect.maxX-.03])for(const z of [rect.minZ+.03,site.z,rect.maxZ-.03]){ray.set(new THREE.Vector3(x,.8,z),new THREE.Vector3(0,-1,0));ray.far=2;const h=ray.intersectObject(surface,false)[0];if(h)heights.push(h.point.y);}if(!heights.length)throw Error('Jardinera sin banqueta');
        records.push({...site,y:Math.max(...heights),scale,length,width,rect,palms:[]});
      }
      const obj=new THREE.Object3D(),boxGeo=new THREE.BoxGeometry(1,1,1),trunkGeo=new THREE.CylinderGeometry(.5,.5,1,8),proxyMat=new THREE.MeshBasicMaterial(),soilMat=new THREE.MeshStandardMaterial({color:0x28271e,roughness:1});
      for(const zone of ['casino','central','north']){const selected=records.filter(r=>r.zone===zone);if(!selected.length)continue;const group=new THREE.Group();group.name='Palmas '+zone;
        const bases=new THREE.InstancedMesh(base.geometry,base.material,selected.length),palms=new THREE.InstancedMesh(palm.geometry,palm.material,selected.length*2),soil=new THREE.InstancedMesh(boxGeo,soilMat,selected.length);bases.name='Jardineras '+zone;palms.name='Palmas compartidas '+zone;group.add(bases,palms,soil);
        selected.forEach((r,i)=>{obj.position.set(r.x,r.y,r.z);obj.rotation.set(0,r.yaw,0);obj.scale.setScalar(r.scale);obj.updateMatrix();bases.setMatrixAt(i,obj.matrix);
          obj.position.y=r.y+.42;obj.scale.set(r.length-.65,.1,Math.max(.12,r.width-.14));obj.updateMatrix();soil.setMatrixAt(i,obj.matrix);
          for(let j=0;j<2;j++){const siteIndex=PALM_SITES.findIndex(s=>s.id===r.id);const offset=(j?1:-1)*r.length*.25,x=r.x+Math.cos(r.yaw)*offset,z=r.z-Math.sin(r.yaw)*offset,height=7.2+((siteIndex*3+j*5)%9)*.14;
            obj.position.set(x,r.y+.42,z);obj.rotation.set(0,(i*2+j)*1.73,0);obj.scale.setScalar(height/palm.size.y);obj.updateMatrix();palms.setMatrixAt(i*2+j,obj.matrix);r.palms.push({x,z,height,y:r.y+.42});
            const trunk=new THREE.Mesh(trunkGeo,proxyMat);trunk.position.set(x,r.y+.42+height*.38,z);trunk.scale.set(.35,height*.76,.35);trunk.visible=false;trunk.userData.palmCollisionProxy=true;group.add(trunk);shootBlockers.push(trunk);
          }
          const proxy=new THREE.Mesh(boxGeo,proxyMat);proxy.position.set(r.x,r.y+.325,r.z);proxy.rotation.y=r.yaw;proxy.scale.set(r.length,.65,r.width);proxy.visible=false;proxy.userData.palmCollisionProxy=true;group.add(proxy);shootBlockers.push(proxy);colliders.push(r.rect);
        });for(const batch of [bases,palms,soil]){batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();state.batches.push(batch);}scene.add(group);
      }
      Object.assign(state,{records,ready:true,baseTriangles:base.triangles,palmTriangles:palm.triangles});
    }catch(e){state.error=e.message;console.warn('No cargaron las palmas',e);}})();return loading;},
    info(){return {ready:state.ready,error:state.error,count:state.records.length,palms:state.records.length*2,skipped:state.skipped,batches:state.batches.length,uniqueGeometry:2,baseTriangles:state.baseTriangles,palmTriangles:state.palmTriangles,sites:state.records.map(({id,x,y,z,zone,rect,palms})=>({id,x,y,z,zone,rect,palms}))};}
  };
}
