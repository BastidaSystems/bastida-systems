// Four landed backsteps, retimed to the ~0.52 s cadence of the supplied recording.
export const CHAOS_FOOTFALLS=Object.freeze([1,1.52,2.04,2.56]);
const AGE=[0,.7,...CHAOS_FOOTFALLS,2.95],SOURCE=[0,.70,1.03,1.33,1.52,1.87,8/3];
export function reactionClipTime(age,duration){
  if(age<=0)return 0;if(age>=2.95)return duration;
  let i=0;while(AGE[i+1]<age)i++;
  const slope=k=>(SOURCE[k+1]-SOURCE[k])/(AGE[k+1]-AGE[k]);
  const tangent=k=>k===0?slope(0):k===AGE.length-1?slope(k-1):2/(1/slope(k-1)+1/slope(k));
  const h=AGE[i+1]-AGE[i],t=(age-AGE[i])/h,t2=t*t,t3=t2*t;
  return ((2*t3-3*t2+1)*SOURCE[i]+(t3-2*t2+t)*h*tangent(i)+(-2*t3+3*t2)*SOURCE[i+1]+(t3-t2)*h*tangent(i+1))*duration/(8/3);
}
// Sample the existing intro clock, never a second timer or gameplay animation trigger.
export function sampleChaosReaction(intro,duration){
  if(!intro||intro.phase!=='countdown'||!Number.isFinite(intro.shakeAt)||!Number.isFinite(duration)||duration<=0)return {time:0,age:0,weight:0};
  const age=intro.elapsed-intro.shakeAt,end=Math.min(2.95,10-intro.shakeAt),time=reactionClipTime(age,duration);
  if(age<=0||age>=end)return {time,age:Math.max(0,age),weight:0};
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const reduced=intro.preferences?.reduced||intro.systemReducedMotion;
  // The close camera follows the authored motion instead of restraining the pose.
  return {time,age,weight:smooth(age/.22)*smooth((end-age)/.35)*(reduced?.5:1)};
}

// Sample Edge Slip at a steady pace; the approved Dodging Back intro keeps its own timing.
export function samplePeriodicReaction(quake,duration){
  if(!quake?.active||!Number.isFinite(duration)||duration<=0)return {time:0,age:0,weight:0};
  const age=quake.age,end=2.8,time=Math.min(1,Math.max(0,age)/end)*duration;
  if(!Number.isFinite(age)||age<=0||age>=end)return {time:Number.isFinite(time)?time:0,age:Math.max(0,age)||0,weight:0};
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  return {time,age,weight:smooth(age/.2)*smooth((end-age)/.3)*(quake.reduced?.5:1)};
}
