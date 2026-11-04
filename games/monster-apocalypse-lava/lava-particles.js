import * as THREE from 'three';

// Heat embers over the molten-heart tiles: one THREE.Points cloud per lava zone,
// soft round sprite generated on a canvas (no external assets), additive blending.
// Particles rise, wobble and recycle inside their zone rect. A zone only animates
// while the player is near, so the cost stays flat wherever you are on the map.
const RISE_TOP = 1.7, NEAR_DISTANCE = 48;

function makeSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(.35, 'rgba(255,255,255,.65)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLavaParticles({ scene, zones } = {}) {
  if (!scene || !Array.isArray(zones) || !zones.length) throw new Error('Invalid lava particles');
  const texture = makeSpriteTexture();
  const clouds = zones.map((zone, zoneIndex) => {
    const area = zone.halfX * 2 * (zone.halfZ * 2);
    const count = Math.max(60, Math.min(220, Math.round(area / 5)));
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3); // rise speed, wobble phase, wobble amount
    const hot = new THREE.Color(0xffd23f), warm = new THREE.Color(0xff5a00), tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = zone.x + (Math.random() * 2 - 1) * zone.halfX;
      positions[i * 3 + 1] = .08 + Math.random() * RISE_TOP;
      positions[i * 3 + 2] = zone.z + (Math.random() * 2 - 1) * zone.halfZ;
      seeds[i * 3] = .35 + Math.random() * .75;
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 2] = .12 + Math.random() * .3;
      tmp.copy(warm).lerp(hot, Math.random());
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: .34, map: texture, vertexColors: true, transparent: true, opacity: .85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'Lava embers ' + zoneIndex;
    points.frustumCulled = false;
    points.renderOrder = 5;
    scene.add(points);
    return { zone, points, positions, seeds, count, visible: true };
  });
  let elapsed = 0, disposed = false;
  return {
    update(dt, playerPosition) {
      if (disposed) return;
      dt = Math.min(.05, Math.max(0, Number.isFinite(dt) ? dt : 0));
      elapsed += dt;
      for (const cloud of clouds) {
        const { zone, points, positions, seeds, count } = cloud;
        const near = !playerPosition || Math.hypot(playerPosition.x - zone.x, playerPosition.z - zone.z) < NEAR_DISTANCE + Math.max(zone.halfX, zone.halfZ);
        points.visible = near;
        cloud.visible = near;
        if (!near || dt === 0) continue;
        for (let i = 0; i < count; i++) {
          let y = positions[i * 3 + 1] + seeds[i * 3] * dt;
          if (y > RISE_TOP + .1) {
            y = .08;
            positions[i * 3] = zone.x + (Math.random() * 2 - 1) * zone.halfX;
            positions[i * 3 + 2] = zone.z + (Math.random() * 2 - 1) * zone.halfZ;
          }
          positions[i * 3 + 1] = y;
          positions[i * 3] += Math.sin(elapsed * 2.2 + seeds[i * 3 + 1]) * seeds[i * 3 + 2] * dt;
        }
        points.geometry.attributes.position.needsUpdate = true;
        points.material.opacity = .72 + Math.sin(elapsed * 3.1 + zone.x) * .13;
      }
    },
    info: () => ({ zones: clouds.length, particles: clouds.reduce((n, c) => n + c.count, 0), visibleZones: clouds.filter(c => c.visible).length, riseTop: RISE_TOP, nearDistance: NEAR_DISTANCE }),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const cloud of clouds) {
        cloud.points.removeFromParent();
        cloud.points.geometry.dispose();
        cloud.points.material.dispose();
      }
      texture.dispose();
    },
  };
}
