// Cinematic pace: phase and footstep contacts follow actual distance, including slower movement.
// Walk With Rifle contains FOUR footfalls per clip, Rifle Run contains TWO.
export const PLAYER_MOTION=Object.freeze({walkSpeed:1.5,runSpeed:3.8,runEnter:2.5,runExit:2.2});
export const WALK_CONTACTS=Object.freeze([.13,.38,.63,.88]);
export const RUN_CONTACTS=Object.freeze([.225,.725]);
export function crossedContacts(phase,advance,contacts,offset=0){
  if(!Number.isFinite(phase)||!Number.isFinite(advance)||advance<=0||advance>.25)return [];
  const start=(phase+offset)%1;
  return contacts.map((contact,index)=>({index,delta:(contact-start+1)%1}))
    .filter(c=>c.delta>1e-8&&c.delta<=advance+1e-8).sort((a,b)=>a.delta-b.delta);
}
