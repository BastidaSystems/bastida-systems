import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Static neon tubes follow the existing CASINO lettering; no bloom render pass.
export async function addCasinoNeon(record,scene){
  const response=await fetch('assets/custom-buildings/casino1/neon.json?v=20261015-casino-neon1');
  if(!response.ok)throw Error('No cargó el trazado del neón');const data=await response.json(),group=new THREE.Group();group.name='Letras CASINO neón rojo';
  const geometries=data.paths.map(path=>{const points=path.points.map(p=>new THREE.Vector3(...p)),closed=path.name==='O';if(closed)points.pop();const curve=new THREE.CatmullRomCurve3(points,closed,'centripetal');return new THREE.TubeGeometry(curve,Math.max(12,points.length),.028,6,closed);});
  const merged=mergeGeometries(geometries);for(const geometry of geometries)geometry.dispose();
  const material=new THREE.MeshStandardMaterial({color:0x300300,emissive:0xff1608,emissiveIntensity:4,roughness:.3,metalness:.12});
  const tubes=new THREE.Mesh(merged,material);tubes.name='Tubos rojos CASINO';tubes.userData.casinoNeon=true;group.add(tubes);
  const padding=.35,minX=data.bounds.min[0]-padding,maxX=data.bounds.max[0]+padding,minY=data.bounds.min[1]-padding,maxY=data.bounds.max[1]+padding,width=maxX-minX,height=maxY-minY,cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=17;ctx.shadowColor='#ffffff';
  for(const path of data.paths){ctx.beginPath();path.points.forEach((p,i)=>{const x=(p[0]-minX)/width*canvas.width,y=(maxY-p[1])/height*canvas.height;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const haloGeometry=new THREE.PlaneGeometry(width,height),positions=haloGeometry.attributes.position,[a,b,c]=data.plane;for(let i=0;i<positions.count;i++)positions.setZ(i,a*(positions.getX(i)+cx)+b*(positions.getY(i)+cy)+c-.018);haloGeometry.computeVertexNormals();
  const halo=new THREE.Mesh(haloGeometry,new THREE.MeshBasicMaterial({map:texture,color:0xff1003,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false}));halo.position.set(cx,cy,0);halo.name='Halo suave CASINO';halo.userData.casinoNeon=true;group.add(halo);record.root.add(group);record.root.updateMatrixWorld(true);
  // Two short-range, shadow-free lights give the original facade a little red spill.
  const lights=[];for(const x of [-.8,4.8]){const position=record.root.localToWorld(new THREE.Vector3(x,6.6,a*x+b*6.6+c+.6)),light=new THREE.PointLight(0xff1405,7,6,2);light.position.copy(position);light.name='Resplandor rojo CASINO';scene.add(light);lights.push(light);}
  record.neon={group,lights,tubes,halo};return {letters:6,paths:data.paths.length,triangles:merged.index.count/3+2,lights:lights.length,shadowLights:0,drawCalls:2};
}
