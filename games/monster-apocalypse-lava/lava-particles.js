import * as THREE from 'three';

// Hot air over the molten-heart tiles — NO color, NO sparkle: faint, translucent
// wisps that rise, swell and drift like the shimmer above hot asphalt. One
// THREE.Points cloud per lava zone with a small custom shader: each wisp fades
// in at the ground, grows as it climbs and dissolves at the top. Normal blending
// at very low opacity, so it reads as moving air, not as an object. A zone only
// animates while the player is near, keeping the cost flat across the map.
const RISE_TOP = 2.1, NEAR_DISTANCE = 48, AIR_OPACITY = .16;

const VERT = /* glsl */`
  attribute float aSize;
  attribute float aAlpha;
  uniform float uTop;
  uniform float uScale;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float h = clamp((position.y - 0.05) / uTop, 0.0, 1.0);
    vFade = aAlpha * smoothstep(0.0, 0.22, h) * (1.0 - smoothstep(0.55, 1.0, h));
    float world = mix(0.8, 2.0, h) * aSize;
    gl_PointSize = world * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */`
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float fall = smoothstep(0.5, 0.04, d);
    gl_FragColor = vec4(vec3(0.92), fall * vFade * uOpacity);
  }
`;

export function createLavaParticles({ scene, zones } = {}) {
  if (!scene || !Array.isArray(zones) || !zones.length) throw new Error('Invalid lava particles');
  const clouds = zones.map((zone, zoneIndex) => {
    const area = zone.halfX * 2 * (zone.halfZ * 2);
    const count = Math.max(70, Math.min(240, Math.round(area / 4)));
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count), alphas = new Float32Array(count);
    const seeds = new Float32Array(count * 3); // rise speed, wobble phase, wobble amount
    for (let i = 0; i < count; i++) {
      positions[i * 3] = zone.x + (Math.random() * 2 - 1) * zone.halfX;
      positions[i * 3 + 1] = .06 + Math.random() * RISE_TOP;
      positions[i * 3 + 2] = zone.z + (Math.random() * 2 - 1) * zone.halfZ;
      sizes[i] = .75 + Math.random() * .6;
      alphas[i] = .55 + Math.random() * .45;
      seeds[i * 3] = .22 + Math.random() * .38;
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 2] = .25 + Math.random() * .45;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uTop: { value: RISE_TOP }, uScale: { value: 620 }, uOpacity: { value: AIR_OPACITY } },
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'Lava heat air ' + zoneIndex;
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
            y = .06;
            positions[i * 3] = zone.x + (Math.random() * 2 - 1) * zone.halfX;
            positions[i * 3 + 2] = zone.z + (Math.random() * 2 - 1) * zone.halfZ;
          }
          positions[i * 3 + 1] = y;
          // Air drifts sideways more as it rises, like a heat current.
          const h = Math.min(1, y / RISE_TOP);
          positions[i * 3] += Math.sin(elapsed * 1.4 + seeds[i * 3 + 1]) * seeds[i * 3 + 2] * h * dt;
          positions[i * 3 + 2] += Math.cos(elapsed * 1.1 + seeds[i * 3 + 1] * 1.7) * seeds[i * 3 + 2] * .6 * h * dt;
        }
        points.geometry.attributes.position.needsUpdate = true;
      }
    },
    info: () => ({ style: 'heat-air', zones: clouds.length, particles: clouds.reduce((n, c) => n + c.count, 0), visibleZones: clouds.filter(c => c.visible).length, riseTop: RISE_TOP, nearDistance: NEAR_DISTANCE, opacity: AIR_OPACITY }),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const cloud of clouds) {
        cloud.points.removeFromParent();
        cloud.points.geometry.dispose();
        cloud.points.material.dispose();
      }
    },
  };
}
