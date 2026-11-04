// Static scenery only. This module has no inventory, pickup, sound or respawn logic.
import * as THREE from 'three';

export function addAmmoDecoration(scene, trash, groundY) {
  const group = new THREE.Group(); group.name = 'Cajas y cartuchos junto a los botes';
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 96;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = '#35402b'; ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#d4caa0'; ctx.textAlign = 'center'; ctx.font = 'bold 30px monospace';
  ctx.fillText('MUNICIÓN', 128, 37); ctx.font = 'bold 22px monospace'; ctx.fillText('5.56 mm', 128, 72);
  // Fixed scratches keep the stencil worn without consuming gameplay randomness.
  ctx.fillStyle = '#35402b';
  for (let i = 0; i < 28; i++) ctx.fillRect((i * 47) % 256, (i * 31) % 96, 7 + i % 8, 1);
  const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const paintCanvas = document.createElement('canvas'); paintCanvas.width = paintCanvas.height = 128;
  const paintCtx = paintCanvas.getContext('2d'); paintCtx.fillStyle = '#b2b59e'; paintCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 160; i++) {
    paintCtx.fillStyle = i % 3 ? '#7a8267' : '#916b4c';
    paintCtx.fillRect((i * 53) % 128, (i * 71) % 128, 1 + i % 5, 1 + i % 3);
  }
  const paintTexture = new THREE.CanvasTexture(paintCanvas); paintTexture.colorSpace = THREE.SRGBColorSpace;
  const paint = new THREE.MeshStandardMaterial({ color: 0x535e40, map: paintTexture, roughness: .94, metalness: .25 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x6b6350, roughness: .88, metalness: .4 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb29856, roughness: .55, metalness: .65 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x845331, roughness: .65, metalness: .5 });
  const label = new THREE.MeshStandardMaterial({ map: texture, roughness: .94, metalness: .15 });
  const batches = {
    box: new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), paint, trash.length * 2),
    rim: new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), metal, trash.length * 6),
    label: new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), label, trash.length * 2),
    case: new THREE.InstancedMesh(new THREE.CylinderGeometry(.007, .007, .048, 6), brass, trash.length * 18),
    bullet: new THREE.InstancedMesh(new THREE.ConeGeometry(.0065, .016, 6), copper, trash.length * 18),
  };
  const counts = { box: 0, rim: 0, label: 0, case: 0, bullet: 0 };
  const transform = new THREE.Object3D(), matrix = new THREE.Matrix4(), tipOffset = new THREE.Vector3();
  transform.rotation.order = 'YXZ';
  const up = new THREE.Vector3(0, 1, 0);
  function instance(kind, x, y, z, yaw, sx, sy, sz) {
    transform.position.set(x, y, z); transform.rotation.set(0, yaw, 0); transform.scale.set(sx, sy, sz);
    transform.updateMatrix(); batches[kind].setMatrixAt(counts[kind]++, transform.matrix);
  }
  for (const [i, record] of trash.entries()) {
    const yaw = record.visual.rotation.y, cos = Math.cos(yaw), sin = Math.sin(yaw);
    const point = (x, z) => ({ x: record.x + x * cos + z * sin, z: record.z - x * sin + z * cos });
    const closed = point(-.32, 1.02), opened = point(.34, .98);
    const cy = groundY(closed.x, closed.z), oy = groundY(opened.x, opened.z);
    const closedYaw = yaw + .18 - i * .09, openYaw = yaw - .3 + i * .13;
    instance('box', closed.x, cy + .09, closed.z, closedYaw, .34, .18, .22);
    instance('rim', closed.x, cy + .186, closed.z, closedYaw, .36, .012, .235);
    instance('box', opened.x, oy + .014, opened.z, openYaw, .30, .028, .20);
    // Low open tray and a lid leaning back; the cartridges remain visible.
    for (const dx of [-.145, .145]) {
      const x = opened.x + dx * Math.cos(openYaw), z = opened.z - dx * Math.sin(openYaw);
      instance('rim', x, oy + .05, z, openYaw, .012, .075, .20);
    }
    for (const dz of [-.095, .095]) {
      instance('rim', opened.x + dz * Math.sin(openYaw), oy + .05,
        opened.z + dz * Math.cos(openYaw), openYaw, .30, .075, .012);
    }
    transform.position.set(opened.x - .11 * Math.sin(openYaw), oy + .095, opened.z - .11 * Math.cos(openYaw));
    transform.rotation.set(-.45, openYaw, 0); transform.scale.set(.31, .18, .01); transform.updateMatrix();
    batches.rim.setMatrixAt(counts.rim++, transform.matrix);
    for (const [p, floor, direction, h] of [[closed, cy, closedYaw, .09], [opened, oy, openYaw, .058]]) {
      instance('label', p.x + .111 * Math.sin(direction), floor + h,
        p.z + .111 * Math.cos(direction), direction, .24, .06, 1);
    }
    const round = (x, y, z, direction) => {
      transform.position.set(x, y, z); transform.rotation.set(Math.PI / 2, direction, 0); transform.scale.setScalar(1);
      transform.updateMatrix(); batches.case.setMatrixAt(counts.case++, transform.matrix);
      tipOffset.copy(up).applyQuaternion(transform.quaternion).multiplyScalar(.032);
      matrix.copy(transform.matrix); matrix.setPosition(x + tipOffset.x, y + tipOffset.y, z + tipOffset.z);
      batches.bullet.setMatrixAt(counts.bullet++, matrix);
    };
    for (let n = 0; n < 12; n++) {
      const dx = -.11 + (n % 6) * .038, dz = -.043 + Math.floor(n / 6) * .07;
      round(opened.x + dx * Math.cos(openYaw) + dz * Math.sin(openYaw), oy + .036,
        opened.z - dx * Math.sin(openYaw) + dz * Math.cos(openYaw), openYaw);
    }
    for (let n = 0; n < 6; n++) {
      const p = point(-.05 + (n % 3) * .07, 1.19 + Math.floor(n / 3) * .055);
      round(p.x, groundY(p.x, p.z) + .007, p.z, yaw + n * .67);
    }
    record.ammoDecoration = { closed, opened, rounds: 18, ground: [cy, oy] };
  }
  for (const [name, batch] of Object.entries(batches)) {
    batch.name = 'Decoración de munición: ' + name; batch.count = counts[name];
    batch.instanceMatrix.needsUpdate = true; batch.computeBoundingSphere(); group.add(batch);
  }
  scene.add(group);
  return group;
}
