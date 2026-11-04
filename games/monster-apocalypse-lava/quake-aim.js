// Weapon instability follows the existing gameplay earthquake clock. It is
// shared by the displayed aim and the real shot, independent of player input.
export function createQuakeAim(){
 let yaw=0,pitch=0,age=0,active=false;
 const info=()=>({yaw,pitch,age,active});
 function reset(){yaw=pitch=age=0;active=false;}
 return {
  update({playing=true,quake=null,intro=false,reduced=false,blocked=false}={}){
   if(intro||reduced||blocked){reset();return info();}
   if(!playing)return info(); // Pause/background freeze the same event, never restart it.
   if(!quake?.active||quake.reduced||!Number.isFinite(quake.age)||quake.age<0||quake.age>=2.8){reset();return info();}
   age=quake.age;active=true;
   const attack=Math.min(1,age/.08),envelope=attack*(1-age/2.8)**2;
   // Slower weapon sway than the camera shake, so the tip cannot stay locked
   // to the camera centre. No per-frame randomness or cumulative input drift.
   yaw=.10*(Math.sin(age*15+.45)+.35*Math.sin(age*31))/1.35*envelope;
   pitch=.085*(Math.sin(age*19+1.1)+.3*Math.sin(age*11-.2))/1.3*envelope;
   return info();
  },reset,info,
 };
}
