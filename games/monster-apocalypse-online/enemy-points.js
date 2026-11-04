import * as THREE from 'three';

export function createEnemyPoints(scene,camera) {
  const textures=new Map(),active=[];let warmObjects;
  const position=new THREE.Vector3(),towardCamera=new THREE.Vector3();
  function texture(amount) {
    if(textures.has(amount))return textures.get(amount);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.font='900 76px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=9;ctx.strokeStyle='#211209';ctx.strokeText(String(amount),128,64);
    ctx.fillStyle=amount===10?'#fff2ce':amount===25?'#ff9966':'#ffdc75';ctx.fillText(String(amount),128,64);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    textures.set(amount,map);return map;
  }
  function remove(i){scene.remove(active[i].sprite);active[i].sprite.material.dispose();active.splice(i,1);}
  function place(effect) {
    position.copy(effect.anchor);effect.root.localToWorld(position);
    const width=THREE.MathUtils.clamp(position.distanceTo(camera.position)*.1,.9,3);
    effect.sprite.scale.set(width,width*.5,1);
    position.y+=.22+effect.row*width*.45+effect.age*.75;
    towardCamera.copy(camera.position).sub(position).normalize();position.addScaledVector(towardCamera,.16);
    effect.sprite.position.copy(position);
  }
  return {
    warmObjects(){
      if(!warmObjects)warmObjects=[1,10,25,100].map(amount=>new THREE.Sprite(new THREE.SpriteMaterial({map:texture(amount),transparent:true,depthWrite:false,depthTest:true,toneMapped:false,fog:false})));
      return warmObjects;
    },
    show(enemy,point,amount,row=0) {
      if(active.length>=48)remove(0);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture(amount),transparent:true,
        depthWrite:false,depthTest:true,toneMapped:false,fog:false}));
      sprite.scale.set(.9,.45,1);sprite.userData.enemyPoints=amount;
      const effect={sprite,root:enemy.g,anchor:enemy.g.worldToLocal(point.clone()),amount,row,age:0};
      active.push(effect);place(effect);scene.add(sprite);
    },
    update(dt) {
      for(let i=active.length-1;i>=0;i--){const effect=active[i];effect.age+=dt;
        if(effect.age>=.95){remove(i);continue;}
        place(effect);effect.sprite.material.opacity=Math.min(1,(.95-effect.age)/.3);
      }
    },
    reset(){while(active.length)remove(active.length-1);},
    info(){return {active:active.length,textures:textures.size,numbers:active.map(e=>({amount:e.amount,
      position:e.sprite.position.toArray(),age:e.age}))};},
  };
}
