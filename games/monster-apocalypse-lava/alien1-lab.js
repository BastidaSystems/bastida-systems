// Isolated local encounter. The regular Alien 1 state machine owns all behavior.
export function alien1LabEnabled(location){
 return ['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('alien1Lab')==='1';
}
export function createAlien1Lab(){
 return {
  bind(mon){
   if(!mon?.alien?.actions.walk)return null;
   mon.alien1Lab=true;
   return mon;
  },
 };
}
