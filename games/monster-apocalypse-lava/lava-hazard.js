// Lava hazard — pure logic, no imports (same pattern as environment-hazard.js).
// Standing on a molten-heart road tile burns through the game's existing damage
// pipeline: this module only decides WHEN a tick is due; onDamage decides whether
// it applies (mode, invulnerability) and returns true only when damage landed.
export const LAVA_HAZARD_RULES = Object.freeze({ damage: 10, interval: 1, warningDelay: .5, zoneScale: .62, maxJumpY: .05 });

// Builds axis-aligned burn zones from the road placement records (roads.js plan()).
// Only 'cracked/molten-heart' street tiles burn. Records carry x/z center plus
// length/width and a yaw: main-street tiles are rotated (yaw = PI/2), so their
// length runs along Z; crossing tiles (yaw = 0) run along X. zoneScale shrinks
// each tile to its molten core so the asphalt rim of the tile does not burn.
export function lavaZonesFromRecords(records, rules = LAVA_HAZARD_RULES) {
  if (!Array.isArray(records)) throw new Error('Invalid road records');
  if (!Number.isFinite(rules.zoneScale) || rules.zoneScale <= 0 || rules.zoneScale > 1) throw new Error('Invalid zone scale');
  const zones = [];
  for (const r of records) {
    if (!r || r.kind !== 'cracked/molten-heart' || r.role === 'ground') continue;
    if (![r.x, r.z, r.length, r.width].every(Number.isFinite) || r.length <= 0 || r.width <= 0) continue;
    const rotated = Math.abs(Math.sin(r.yaw || 0)) > .5;
    const halfX = (rotated ? r.width : r.length) / 2 * rules.zoneScale;
    const halfZ = (rotated ? r.length : r.width) / 2 * rules.zoneScale;
    zones.push({ x: r.x, z: r.z, halfX, halfZ, role: r.role || 'street' });
  }
  return zones;
}

export function createLavaHazard({ zones, onDamage, rules = LAVA_HAZARD_RULES } = {}) {
  if (!Array.isArray(zones) || !zones.length) throw new Error('Invalid lava zones');
  for (const z of zones) if (!z || ![z.x, z.z, z.halfX, z.halfZ].every(Number.isFinite) || z.halfX <= 0 || z.halfZ <= 0) throw new Error('Invalid lava zone');
  if (![rules.damage, rules.interval, rules.warningDelay, rules.maxJumpY].every(Number.isFinite) ||
      rules.damage <= 0 || rules.interval <= 0 || rules.warningDelay < 0 || rules.maxJumpY < 0) throw new Error('Invalid lava rules');
  let cooldown = 0, exposure = 0, inside = false, hits = 0, enabled = true, activeZone = -1;
  return {
    setEnabled(value) { enabled = !!value; if (!enabled) { exposure = 0; inside = false; activeZone = -1; } },
    update(dt, { mode, playerPosition, jumpY = 0, blocked = false } = {}) {
      inside = false; activeZone = -1;
      if (['menu', 'loading', 'dead'].includes(mode)) { cooldown = 0; exposure = 0; return; }
      if (!enabled || blocked || mode !== 'playing' || !playerPosition) { exposure = 0; return; }
      dt = Math.min(.1, Math.max(0, Number.isFinite(dt) ? dt : 0));
      cooldown = Math.max(0, cooldown - dt);
      const grounded = (Number.isFinite(jumpY) ? jumpY : 0) <= rules.maxJumpY;
      if (grounded) for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        if (Math.abs(playerPosition.x - z.x) <= z.halfX && Math.abs(playerPosition.z - z.z) <= z.halfZ) { inside = true; activeZone = i; break; }
      }
      exposure = inside ? exposure + dt : 0;
      if (inside && exposure >= rules.warningDelay && cooldown === 0 && onDamage?.(rules.damage) === true) { cooldown = rules.interval; hits++; }
    },
    info: () => ({ enabled, inside, activeZone, hits, cooldown, exposure, zones: zones.map(z => ({ ...z })), ...rules }),
  };
}
