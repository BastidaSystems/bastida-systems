import {Vector4} from 'three';

// Upload the whole loaded city before PLAY can leave the loading screen.
// Compile alone prepares programs, but textures/buffers are deferred until a draw.
export function createSceneGpuWarmup({renderer,scene,camera}) {
  const state={ready:false,meshes:0,textures:0,draws:0,durationMs:0};
  let loading;
  const nextFrame=()=>new Promise(resolve=>{let done=false;const fire=()=>{if(!done){done=true;resolve();}};requestAnimationFrame(fire);setTimeout(fire,100);});
  async function waitForGpu(){
    // Best-effort sync only: the warmup pre-uploads textures to avoid hitches,
    // but a slow GPU must never fail the session — whatever is not uploaded yet
    // is uploaded lazily by three.js on first draw.
    const gl=renderer.getContext();
    if(!gl.fenceSync){gl.finish();return;}
    const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
    try{
      const started=performance.now();
      while(true){
        const status=gl.clientWaitSync(fence,0,0);
        if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED)return;
        if(status===gl.WAIT_FAILED||gl.isContextLost()||performance.now()-started>120000)return;
        await nextFrame();
      }
    }catch{/* warmup is optional; continue without the fence sync */}
    finally{gl.deleteSync(fence);}
  }
  function warm({extraObjects=[],extraWarmup=()=>{}}={}){
    if(loading)return loading;
    loading=(async()=>{
      const started=performance.now(),savedExtra=extraObjects.map(o=>[o,o.visible]);
      const target=renderer.getRenderTarget(),viewport=renderer.getViewport(new Vector4()),scissor=renderer.getScissor(new Vector4()),scissorTest=renderer.getScissorTest();
      const meshes=[],textures=new Set();
      try{
        for(const [object]of savedExtra)object.visible=true;
        scene.traverseVisible(o=>{
          if(!o.isMesh&&!o.isLine&&!o.isPoints&&!o.isSprite)return;
          meshes.push([o,o.frustumCulled]);
          for(const material of [o.material].flat())for(const value of Object.values(material||{}))if(value?.isTexture)textures.add(value);
        });
        state.meshes=meshes.length;state.textures=textures.size;
        let count=0;for(const texture of textures){renderer.initTexture(texture);if(++count%4===0)await nextFrame();}
        // Use the real canvas/output color space, lights and fog so shader variants match play.
        // A one-pixel viewport avoids shading a second full-resolution city behind the intro.
        renderer.setRenderTarget(null);renderer.setViewport(0,0,1,1);renderer.setScissor(0,0,1,1);renderer.setScissorTest(true);
        for(const [mesh]of meshes)mesh.frustumCulled=false;
        renderer.render(scene,camera);state.draws=renderer.info.render.calls;
        extraWarmup();
        await waitForGpu();
        state.ready=true;
      }finally{
        for(const [mesh,culled]of meshes)mesh.frustumCulled=culled;
        for(const [object,visible]of savedExtra)object.visible=visible;
        renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
        state.durationMs=performance.now()-started;
      }
    })().catch(error=>{loading=null;throw error;});return loading;
  }
  return {warm,info:()=>({...state})};
}
