import * as THREE from 'three';

// Five shared batches: all source rocks retain their own shape, UVs and material.
export function replaceRocks({ roots, material, records, scene, colliders, shootBlockers, paths, trash, MAP, MAPREG, resolvePosition, groundY }) {
  const templates = roots.map(root => {
    root.updateMatrixWorld(true);
    const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
    if (meshes.length !== 1) throw new Error('Se esperaba una malla por roca');
    const mesh = meshes[0], geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox, size = box.getSize(new THREE.Vector3());
    geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    return { geometry, width: size.x, depth: size.z, height: size.y };
  });
  let seed = 0x50c2026;
  const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const oldColliders = records.map(r => r.collider).filter(Boolean), plans = [];
  for (const c of oldColliders) colliders.splice(colliders.indexOf(c), 1);
  try {
    for (const [i, record] of records.entries()) {
      const kind = i % 5, template = templates[kind];
      const scale = record.size * 2 / Math.max(template.width, template.depth);
      const radius = Math.hypot(template.width, template.depth) * scale / 2;
      const yaw = rng() * Math.PI * 2, cos = Math.cos(yaw), sin = Math.sin(yaw);
      let placement;
      for (let attempt = 0; attempt < 256; attempt++) {
        const angle = rng() * Math.PI * 2, jitter = attempt === 0 ? 0 : .65 * Math.sqrt(attempt);
        const x = attempt < 160 ? record.x + Math.cos(angle) * jitter : (rng() - .5) * 96;
        const z = attempt < 160 ? record.z + Math.sin(angle) * jitter : (rng() - .5) * 100;
        const margin = radius + .4;
        if (Math.abs(x) > MAP.halfW - margin || Math.abs(z) > MAP.halfL - margin) continue;
        // Corredores continuos por el centro de las tres calles.
        if (Math.abs(x) < radius + 1.2 || Math.abs(z + 20) < radius + 1.2 || Math.abs(z - 24) < radius + 1.2) continue;
        if ((Math.abs(z) > 51 && Math.abs(x) < 12) || (Math.abs(x) > 47 && (Math.abs(z + 20) < 6 || Math.abs(z - 24) < 6))) continue;
        if (Math.hypot(x, z - 46) < radius + 2) continue;
        if (paths.some(p => x + margin > p.minX && x - margin < p.maxX && z + margin > p.minZ && z - margin < p.maxZ)) continue;
        if (MAPREG.buildings.some(p => x + margin > p.minX && x - margin < p.maxX && z + margin > p.minZ && z - margin < p.maxZ)) continue;
        if (trash.some(t => Math.hypot(x - t.x, z - t.z) < radius + 2.8)) continue;
        const point = new THREE.Vector3(x, 0, z); resolvePosition(point, margin, true);
        if (Math.hypot(point.x - x, point.z - z) > 1e-5) continue;
        const y = groundY(x, z);
        let supported = true;
        for (let j = 0; j < 8; j++) {
          const a = j * Math.PI / 4;
          if (Math.abs(groundY(x + Math.cos(a) * radius, z + Math.sin(a) * radius) - y) > .03) { supported = false; break; }
        }
        if (supported) { placement = { x, y, z }; break; }
      }
      if (!placement) throw new Error('No hay posición libre para roca ' + (i + 1));
      const { x, y, z } = placement, halfX = template.width * scale / 2, halfZ = template.depth * scale / 2;
      const ex = Math.abs(cos) * halfX + Math.abs(sin) * halfZ, ez = Math.abs(sin) * halfX + Math.abs(cos) * halfZ;
      const collider = { cx: x, cz: z, halfX, halfZ, cos, sin, minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez };
      colliders.push(collider);
      plans.push({ record, kind, x, y, z, scale, radius, yaw, collider, height: template.height * scale });
    }
  } catch (error) {
    for (const p of plans) colliders.splice(colliders.indexOf(p.collider), 1);
    colliders.push(...oldColliders);
    for (const t of templates) t.geometry.dispose();
    throw error;
  }
  const batches = templates.map((t, kind) => {
    const batch = new THREE.InstancedMesh(t.geometry, material, plans.filter(p => p.kind === kind).length);
    batch.name = 'Rocas ' + (kind + 1); return batch;
  });
  const counts = [0, 0, 0, 0, 0], transform = new THREE.Object3D();
  for (const p of plans) {
    const batch = batches[p.kind], instanceId = counts[p.kind]++;
    transform.position.set(p.x, p.y, p.z); transform.rotation.set(0, p.yaw, 0); transform.scale.setScalar(p.scale); transform.updateMatrix();
    batch.setMatrixAt(instanceId, transform.matrix);
    scene.remove(p.record.mesh);
    const index = shootBlockers.indexOf(p.record.mesh); if (index >= 0) shootBlockers.splice(index, 1);
    const { record, ...placed } = p;
    Object.assign(record, { ...placed, batch, instanceId, loaded: true });
  }
  for (const batch of batches) {
    batch.instanceMatrix.needsUpdate = true; batch.computeBoundingBox(); batch.computeBoundingSphere();
    scene.add(batch); shootBlockers.push(batch);
  }
  return batches;
}
