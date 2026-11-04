// Align the pavement of differently shaped source slabs to one common level.
// Keep all vertices/UVs/triangles, with depressions below the walking surface.
export function levelRoadSurface(geometry){
 const positions=geometry.attributes.position,index=geometry.index,bins=new Float64Array(128);
 let total=0;
 for(let offset=0;offset<index.count;offset+=3){
  const a=index.getX(offset),b=index.getX(offset+1),c=index.getX(offset+2);
  const ax=positions.getX(a),az=positions.getZ(a),bx=positions.getX(b),bz=positions.getZ(b),cx=positions.getX(c),cz=positions.getZ(c);
  const area=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);
  if(area<=1e-12)continue; // Ignore the bottom and vertical sides.
  const height=(positions.getY(a)+positions.getY(b)+positions.getY(c))/3;
  bins[Math.max(0,Math.min(127,Math.floor(height*128)))]+=area;total+=area;
 }
 let accumulated=0,datum=1;
 for(let i=0;i<bins.length;i++){
  accumulated+=bins[i];
  if(accumulated>=total*.65){datum=Math.max(.05,(i+.5)/128);break;}
 }
 for(let i=0;i<positions.count;i++){
  const t=Math.max(0,Math.min(1,positions.getY(i)/datum));
  const height=1-(1-t)**4;
  const distance=Math.min(.5-Math.abs(positions.getX(i)),.5-Math.abs(positions.getZ(i)));
  const edge=Math.max(0,Math.min(1,distance/.035)),blend=1-edge*edge*(3-2*edge);
  positions.setY(i,height+(1-height)*blend);
 }
 positions.needsUpdate=true;
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {datum,upperLevel:1};
}
