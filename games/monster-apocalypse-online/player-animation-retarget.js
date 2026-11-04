// Match imported Mixamo position tracks to a character's rest proportions.
// Rotation keys, timing and the source track buffers stay unchanged.
export function retargetPositionTracks(clips,offsets={}){
  for(const clip of clips)for(const track of clip.tracks){
    if(!track.name.endsWith('.position'))continue;
    const name=track.name.slice(0,-9).replace(/^mixamorig[:_]?/,'');
    const delta=offsets[name];
    if(!Array.isArray(delta)||delta.length!==3||!delta.every(Number.isFinite))continue;
    const values=track.values.slice();
    for(let i=0;i<values.length;i++)values[i]+=delta[i%3];
    track.values=values;
  }
  return clips;
}
