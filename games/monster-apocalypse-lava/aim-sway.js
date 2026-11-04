// One continuous breathing oscillator. Only the camera receives these offsets;
// the player's input angles, body, collisions and centred reticle stay intact.
export function createAimSway(){
 let time=0,phase=0,frequency=.22,amplitude=0;const sample={yaw:0,pitch:0};
 return {
  update(dt,{active=true,blocked=false,aim=0,speed=0,fatigue=0,stun=0,reduced=false}={}){
   if(!active||!Number.isFinite(dt)||dt<=0)return sample;
   if(blocked||reduced){amplitude=0;sample.yaw=sample.pitch=0;return sample;}
   const clamp=x=>Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
   dt=Math.min(dt,.05);time+=dt;
   const effort=clamp(speed/3),tired=clamp(fatigue),targetFrequency=.22+.045*effort+.10*tired;
   // Integrate the smoothed frequency analytically, so different frame rates
   // do not shift the breathing cycle or restart it when effort changes.
   const decay=Math.exp(-dt*1.5),oldFrequency=frequency;
   phase=(phase+Math.PI*2*(targetFrequency*dt+(oldFrequency-targetFrequency)*(1-decay)/1.5))%(Math.PI*2);
   frequency=targetFrequency+(oldFrequency-targetFrequency)*decay;
   const target=Math.min(.0088,.0032+.0018*effort+.0016*tired+.0035*clamp(stun))*(1-.65*clamp(aim));
   amplitude+=(target-amplitude)*(1-Math.exp(-dt*4));
   // The second harmonic gives inhaling/exhaling a softer, asymmetric curve.
   sample.pitch=amplitude*.86*(Math.sin(phase)-.12*Math.sin(phase*2))/1.12;
   sample.yaw=amplitude*.42*(.85*Math.sin(phase+Math.PI*.5)+.15*Math.sin(phase*2+.4));
   return sample;
  },
  reset(){time=phase=amplitude=0;frequency=.22;sample.yaw=sample.pitch=0;},
  info:()=>({time,phase,frequency,amplitude,...sample}),
 };
}
