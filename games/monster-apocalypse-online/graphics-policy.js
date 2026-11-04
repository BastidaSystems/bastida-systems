export const GRAPHICS_PROFILES=Object.freeze({
 low:Object.freeze({scale:.65,dpr:1,texture:512,sparks:24,effectDistance:30,drawDistance:75,secondaryLights:2,rain:.35,simple:true}),
 medium:Object.freeze({scale:.8,dpr:1.5,texture:1024,sparks:48,effectDistance:40,drawDistance:110,secondaryLights:4,rain:.65,simple:false}),
 high:Object.freeze({scale:1,dpr:2,texture:2048,sparks:72,effectDistance:55,drawDistance:170,secondaryLights:8,rain:1,simple:false}),
 ultra:Object.freeze({scale:1,dpr:2,texture:4096,sparks:84,effectDistance:55,drawDistance:300,secondaryLights:Infinity,rain:1,simple:false}),
});
const names=Object.keys(GRAPHICS_PROFILES);
export function initialGraphics({maxTextureSize=2048,cores=4,memoryGB=null,mobile=false}={}){
 return maxTextureSize<4096||cores<=2||memoryGB!==null&&memoryGB<=2?'low':mobile||cores<8||memoryGB!==null&&memoryGB<8?'medium':'high';
}
// CPU/rAF observation, not a GPU timer. No background/loading/pause samples.
export function createGraphicsPolicy({initial='medium',selection='auto',onChange=()=>{}}={}){
 let selected=selection==='auto'||names.includes(selection)?selection:'auto',level=names.includes(initial)?initial:'medium';
 let scale=GRAPHICS_PROFILES[level].scale,age=0,window=[],cooldown=10,slow=0,fast=0,changes=0;
 if(selected!=='auto'){level=selected;scale=GRAPHICS_PROFILES[level].scale;}
 function notify(){onChange(info());}
 function info(){return {selected,effective:level,scale,changes,profile:{...GRAPHICS_PROFILES[level],scale}};}
 return {
  info,
  select(value){if(value!=='auto'&&!names.includes(value))return false;selected=value;level=value==='auto'?(names.includes(initial)?initial:'medium'):value;scale=GRAPHICS_PROFILES[level].scale;window=[];age=slow=fast=0;cooldown=10;notify();return true;},
  resetSampling(){window=[];age=slow=fast=0;cooldown=10;},
  sample(ms,active=true){
   if(!active){window=[];age=slow=fast=0;return;}
   if(!Number.isFinite(ms)||ms<1||ms>1000)return;
   if(selected!=='auto')return;
   const seconds=ms/1000;age+=seconds;cooldown=Math.max(0,cooldown-seconds);window.push(Math.min(ms,100));
   if(age<2)return;
   const mean=window.reduce((a,b)=>a+b,0)/window.length;window=[];const elapsed=age;age=0;
   slow=mean>26?slow+elapsed:0;fast=mean<18?fast+elapsed:0;
   if(cooldown>0)return;
   if(slow>=6){
    if(scale>.55+.001)scale=Math.max(.55,Math.round((scale-.1)*100)/100);
    else if(names.indexOf(level)>0){level=names[names.indexOf(level)-1];scale=.55;}
    else return;
    changes++;slow=fast=0;cooldown=12;notify();
   }else if(fast>=24){
    const ceiling=GRAPHICS_PROFILES[level].scale;
    if(scale<ceiling-.001)scale=Math.min(ceiling,Math.round((scale+.05)*100)/100);
    else if(names.indexOf(level)<names.indexOf(initial)){level=names[names.indexOf(level)+1];scale=Math.min(.65,GRAPHICS_PROFILES[level].scale);}
    else return;
    changes++;slow=fast=0;cooldown=30;notify();
   }
  },
 };
}
