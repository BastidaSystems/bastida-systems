// Animation selection only: no input, speed, stamina, ammo or combat changes.
export const SHOOTER_GAITS=Object.freeze({
 walk:{cycles:1,contacts:[.1916666667,.775]},
 run:{cycles:1,contacts:[.225,.725]}, // Julián's alternative Rifle Run, one left/right cycle.
 walkBack:{cycles:1,contacts:[.1916666667,.6666666667]},
 runBack:{cycles:1,contacts:[.3166666667,.75]},
 strafeLeft:{cycles:1,contacts:[.1583333333,.6833333333]},
 strafeRight:{cycles:1,contacts:[.2083333333,.6333333333]},
});
export const SHOOTER_NAMES=Object.freeze(Object.keys(SHOOTER_GAITS));
export function selectShooterLocomotion(kind,velocity,yaw,locked){
 if(kind==='idle'||!locked)return kind;
 const speed=Math.hypot(velocity.x,velocity.z);if(speed<.001)return kind;
 const forward=(-Math.sin(yaw)*velocity.x-Math.cos(yaw)*velocity.z)/speed;
 const right=(Math.cos(yaw)*velocity.x-Math.sin(yaw)*velocity.z)/speed;
 if(Math.abs(right)>.72)return right>0?'strafeRight':'strafeLeft';
 if(forward<-.45)return kind==='run'?'runBack':'walkBack';
 return kind;
}
export function validateShooterClips(clips,model){
 const names=['idle',...SHOOTER_NAMES];
 for(const name of names){const clip=clips.find(c=>c.name===name);
  if(!clip||!Number.isFinite(clip.duration)||clip.duration<=.1||!clip.tracks.length)throw Error('Clip de movimiento incompleto: '+name);
  for(const track of clip.tracks){const node=track.name.slice(0,track.name.lastIndexOf('.'));
   if(!model.getObjectByName(node)||!Array.from(track.values).every(Number.isFinite))throw Error('Esqueleto de movimiento incompatible: '+name);
  }
 }
 return clips.filter(c=>names.includes(c.name));
}
