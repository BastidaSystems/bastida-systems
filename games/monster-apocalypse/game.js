// ============================================================
// MONSTER APOCALYPSE — Prototipo Etapa 1 (FPS 3D para web)
// Alcance: 1 calle destruida, WASD + mouse (pointer lock) en escritorio,
// clic disparar, R recargar, 1 rifle, monstruos y zombies corredores,
// vida, munición, feedback de impacto, muerte y reinicio.
// Etapa A (sensación y daño): inercia al moverse, sprint (Shift /
// joystick a fondo), salto (Space / botón SALTAR), sensibilidad
// ajustable y persistente, dispersión ligera, recarga animada del
// rifle e invulnerabilidad breve (0.5 s) tras recibir daño.
// Etapa B (IA de enemigos): máquina de estados IDLE/CHASE/ATTACK/
// HURT/DEAD/SEARCH con percepción y memoria (última posición
// conocida), separación, evitación por atasco y variantes.
// En celular (táctil): joystick para moverse, arrastrar para apuntar,
// botón DISPARAR / recargar / pausa, intento de horizontal al jugar.
// Motor: Three.js 0.160 desde CDN (copia web desplegada). La copia local usa ./lib vendored.
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
// Etapa C1 (exploración): registro estructurado del mapa (MAPREG),
// minimapa circular y mapa expandido (tecla M / botón MAPA) con
// descubrimiento progresivo por línea de vista 2D — no atraviesa
// paredes — persistente entre partidas (modo 'explore').

// ---------- Constantes ----------
const MAG_SIZE = 30;
const RELOAD_MS = 1500;
const FIRE_INTERVAL = 0.115;      // s entre disparos (automático)
const RIFLE_DAMAGE = 34;          // 3 impactos por monstruo
const MONSTER_HP = 100;
const MONSTER_SPEED = 2.6;        // m/s
const MONSTER_DAMAGE = 10;
const MONSTER_ATTACK_RANGE = 1.5;
const MONSTER_ATTACK_CD = 0.75;   // s: duración del ciclo de ataque
// ---------- Etapa B: IA de enemigos ----------
const ENEMY_AGGRO_RANGE = 38;     // m: distancia máxima de visión del enemigo
const PERCEPTION_INTERVAL = 0.2;  // s entre comprobaciones de visión por enemigo
const MEMORY_TIME = 4;            // s sin ver al jugador en CHASE → SEARCH
const SEARCH_TIME = 2.5;          // s escaneando la última posición conocida
const ENEMY_IDLE_SPEED = 0.35;    // fracción de velocidad al patrullar (IDLE)
const ATTACK_WINDUP = 0.35;       // s de preparación del golpe (brazos arriba)
const ATTACK_HIT_RANGE = 1.9;     // m: el golpe conecta si el jugador sigue aquí
const ATTACK_EXIT_RANGE = 2.2;    // m: si el jugador se aleja más, vuelve a CHASE
const HURT_TIME = 0.18;           // s sin avanzar tras recibir daño
const DEAD_TIME = 0.35;           // s de caída del cadáver antes de retirarlo
const SEPARATION_DIST = 1.1;      // m: distancia mínima entre enemigos vivos
const STUCK_CHECK_TIME = 0.5;     // s: ventana para detectar atasco
const STUCK_MIN_RATIO = 0.3;      // desplazamiento real < 30% del esperado = atasco
const STUCK_STEER_TIME = 0.6;     // s de rodeo lateral al detectar atasco
const ZOMBIE_HP = 68;             // muere con 2 impactos del rifle
const ZOMBIE_SPEED = 5.2;         // corre: el doble que el monstruo
const ZOMBIE_DELAY = 15;          // s de partida antes de que aparezcan
const ZOMBIE_CHANCE = 0.40;       // 40% de cada spawn tras esa marca
const MAX_ALIVE = 4;
const SPAWN_EVERY = 2.8;          // s
const PLAYER_SPEED = 6;           // velocidad máxima caminando (m/s)
const SPRINT_SPEED = 8.7;         // velocidad máxima esprintando (m/s)
const JUMP_VEL = 5.6;             // velocidad inicial del salto (apex ≈ 1 m)
const GRAVITY = -16;              // gravedad del salto
const SPREAD = 0.012;             // rad: dispersión máxima por disparo
const INVULN_TIME = 0.5;          // s de invulnerabilidad tras recibir daño
const MOUSE_SENS = 0.0021;        // sensibilidad base del mouse (× ajuste del jugador)
const PLAYER_RADIUS = 0.55;
const MAP = { halfW: 13, halfL: 58 }; // calle jugable (x, z)

// ---------- Estado ----------
const S = {
  mode: 'menu',            // menu | playing | paused | dead
  health: 100,
  mag: MAG_SIZE,
  reloading: false,
  reloadEnd: 0,
  lastShot: 0,
  mouseDown: false,
  touchFire: false,
  kills: 0,
  startTime: 0,
  elapsed: 0,
  spawnTimer: 0,
  invulnUntil: 0,
  keys: {},
};
window.__ma = { version: 'etapa1', state: S, monstersAlive: () => monsters.length };

// Sensibilidad de apuntado: multiplicador 0.5–2.0 ajustable en la
// pantalla inicial y persistente entre sesiones (localStorage ma_sens).
let sens = 1;
try { const v = parseFloat(localStorage.getItem('ma_sens')); if (v >= .5 && v <= 2) sens = v; } catch (e) { /* almacenamiento no disponible */ }

// Niebla apocalíptica: FogExp2 gris oscura ligeramente azulada con tres
// niveles de densidad, ajustables en la pantalla inicial y persistentes
// entre sesiones (localStorage ma_fog). Predeterminado: Densa.
// Densidades calibradas para transmitancia ~5% a la distancia objetivo:
// T(d) = exp(-(ρ·d)²) → ρ = sqrt(ln 20)/d ≈ 1.73/d.
const FOG_LEVELS = { normal: 0.050, densa: 0.085, extrema: 0.145 }; // ≈35 m / ≈20 m / ≈12 m
let fogLevel = 'densa';
try { const v = localStorage.getItem('ma_fog'); if (v in FOG_LEVELS) fogLevel = v; } catch (e) { /* almacenamiento no disponible */ }

// ---------- Renderer / escena ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x30363c, FOG_LEVELS[fogLevel]);
scene.background = scene.fog.color; // misma instancia de Color: las siluetas se funden con el fondo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
camera.rotation.order = 'YXZ';
scene.add(camera);

scene.add(new THREE.HemisphereLight(0xffd9b0, 0x201409, 0.85));
const moon = new THREE.DirectionalLight(0xffb37a, 1.1);
moon.position.set(-20, 40, -15);
scene.add(moon);

// ---------- Texturas procedurales (canvas, sin assets externos) ----------
function makeTexture(draw, w = 256, h = 256, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const asphaltTex = makeTexture((g, w, h) => {
  g.fillStyle = '#33302e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${20 + Math.random() * 60 | 0},${18 + Math.random() * 50 | 0},${16 + Math.random() * 40 | 0},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(214,178,60,.75)'; g.fillRect(w / 2 - 3, 0, 6, 26); g.fillRect(w / 2 - 3, 58, 6, 26); g.fillRect(w / 2 - 3, 116, 6, 26);
}, 256, 256, 3, 16);
function facadeTex(base, brokenRatio) {
  return makeTexture((g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 14; y < h - 20; y += 34) for (let x = 14; x < w - 24; x += 32) {
      const broken = Math.random() < brokenRatio;
      g.fillStyle = broken ? '#060505' : (Math.random() < .18 ? '#c98f3d' : '#14161c');
      g.fillRect(x, y, 20, 24);
      if (broken) { g.strokeStyle = 'rgba(200,200,200,.35)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y + 24); g.moveTo(x + 20, y); g.lineTo(x, y + 24); g.stroke(); }
    }
    g.fillStyle = 'rgba(0,0,0,.4)';
    for (let i = 0; i < 26; i++) g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 30, 4 + Math.random() * 14);
  }, 256, 256, 1, 2);
}

// ---------- Mapa: calle destruida ----------
const colliders = [];       // {minX,maxX,minZ,maxZ}
const shootBlockers = [];   // meshes que bloquean disparos
function addCollider(cx, cz, w, d) { colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 }); }

// ---------- Registro estructurado del mapa (Etapa C1) ----------
// buildMap() anota aquí la geometría que construye, sin cambiarla:
// calles y huellas de edificios como rectángulos {minX,maxX,minZ,maxZ}
// y landmarks con nombre (Hospital/Comisaría/Fábrica llegarán en C2).
// El minimapa y el mapa expandido se alimentan SOLO de este registro.
const MAPREG = { streets: [], buildings: [], landmarks: [] };

function buildMap() {
  // Suelo: calle + aceras
  const street = new THREE.Mesh(new THREE.PlaneGeometry(MAP.halfW * 2, MAP.halfL * 2), new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: .95 }));
  street.rotation.x = -Math.PI / 2; scene.add(street);
  MAPREG.streets.push({ minX: -MAP.halfW, maxX: MAP.halfW, minZ: -MAP.halfL, maxZ: MAP.halfL });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x554c42, roughness: 1 });
  [-1, 1].forEach(s => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(7, 0.24, MAP.halfL * 2), sidewalkMat);
    sw.position.set(s * (MAP.halfW + 3.5), 0.12, 0); scene.add(sw);
  });

  // Edificios en ruinas (ambos lados)
  const facades = [facadeTex('#4a3d33', .45), facadeTex('#3b3630', .6), facadeTex('#54453a', .35)];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  [-1, 1].forEach(side => {
    let z = -MAP.halfL + 4;
    while (z < MAP.halfL - 6) {
      const bw = 10 + rnd() * 5, bh = 9 + rnd() * 16, bd = 9 + rnd() * 4;
      const x = side * (MAP.halfW + 7 + bd / 2);
      const ruined = rnd() < 0.4;
      const b = new THREE.Mesh(new THREE.BoxGeometry(bd, bh, bw), new THREE.MeshStandardMaterial({ map: facades[(rnd() * 3) | 0], roughness: .9 }));
      b.position.set(x, bh / 2, z + bw / 2);
      if (ruined) b.rotation.z = side * 0.03;
      scene.add(b); shootBlockers.push(b);
      addCollider(x, z + bw / 2, bd, bw);
      MAPREG.buildings.push({ minX: x - bd / 2, maxX: x + bd / 2, minZ: z, maxZ: z + bw });
      if (ruined) { // escombro frente al edificio derruido
        for (let i = 0; i < 5; i++) addRubble(side * (MAP.halfW + 1.5 + rnd() * 3), z + rnd() * bw, 0.5 + rnd() * 1.1, true);
      }
      z += bw + 2 + rnd() * 5;
    }
  });

  // Autos abandonados (volúmenes: carrocería + cabina + llantas)
  const carColors = [0x6e3b1f, 0x44586b, 0x5c5546, 0x71302a, 0x3f4a3a, 0x77603a];
  const carSpots = [[-6, -26, .2], [5.5, -13, -.15], [-4.5, 2, 1.45], [6.5, 14, .1], [-7, 27, -.3], [3, 38, 1.5], [-2.5, -40, .05]];
  carSpots.forEach(([x, z, rot], i) => addCar(x, z, rot, carColors[i % carColors.length], i === 2));

  // Escombros en la calle
  for (let i = 0; i < 26; i++) addRubble((Math.random() - .5) * (MAP.halfW * 2 - 4), (Math.random() - .5) * (MAP.halfL * 2 - 8), 0.3 + Math.random() * 0.9, false);

  // Faroles inclinados con luz tenue
  [[-11, -30], [11, -5], [-11, 20], [11, 42]].forEach(([x, z], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 5.4, 6), new THREE.MeshStandardMaterial({ color: 0x2c2c30 }));
    pole.position.set(x, 2.7, z); pole.rotation.z = (i % 2 ? -1 : 1) * 0.1; scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 8), new THREE.MeshStandardMaterial({ emissive: 0xffa845, emissiveIntensity: 2, color: 0x221100 }));
    lamp.position.set(x + (i % 2 ? -0.5 : 0.5), 5.4, z); scene.add(lamp);
    const pl = new THREE.PointLight(0xff9a40, 12, 15); pl.position.copy(lamp.position); scene.add(pl);
  });

  // Hogueras (luz parpadeante) en barriles
  window.__fires = [];
  [[-8, -18], [8.5, 24], [-5, 46]].forEach(([x, z]) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0x59331c, roughness: .85 }));
    barrel.position.set(x, .55, z); scene.add(barrel); shootBlockers.push(barrel); addCollider(x, z, 1.1, 1.1);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.1, 8), new THREE.MeshStandardMaterial({ emissive: 0xff6a1a, emissiveIntensity: 3, color: 0x381a00, transparent: true, opacity: .9 }));
    fire.position.set(x, 1.5, z); scene.add(fire);
    const l = new THREE.PointLight(0xff7a26, 20, 17); l.position.set(x, 1.8, z); scene.add(l);
    window.__fires.push({ fire, light: l, base: 20, phase: Math.random() * 9 });
  });

  // Barricadas al final de la calle (límites)
  [-1, 1].forEach(s => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(MAP.halfW * 2 + 14, 4, 1.5), new THREE.MeshStandardMaterial({ color: 0x3a332b, roughness: 1 }));
    wall.position.set(0, 2, s * (MAP.halfL + 0.8)); scene.add(wall); shootBlockers.push(wall);
  });
}
const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x59504a, roughness: 1 });
const rubbleGeo = new THREE.DodecahedronGeometry(1, 0);
function addRubble(x, z, s, collide) {
  const r = new THREE.Mesh(rubbleGeo, rubbleMat);
  r.position.set(x, s * 0.4, z); r.scale.setScalar(s);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  scene.add(r); shootBlockers.push(r);
  if (collide) addCollider(x, z, s * 1.4, s * 1.4);
}
function addCar(x, z, rot, color, flipped) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, .62, 4.4), mat); body.position.y = .55; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, .55, 2.1), new THREE.MeshStandardMaterial({ color: 0x151a20, roughness: .3, metalness: .4 })); cab.position.set(0, 1.1, -.2); g.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(.36, .36, .25, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c });
  [[-.95, 1.45], [.95, 1.45], [-.95, -1.45], [.95, -1.45]].forEach(([wx, wz]) => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.z = Math.PI / 2; w.position.set(wx, .36, wz); g.add(w); });
  g.position.set(x, flipped ? .75 : 0, z); g.rotation.y = rot;
  if (flipped) g.rotation.z = Math.PI * .94;
  scene.add(g);
  g.traverse(m => { if (m.isMesh) shootBlockers.push(m); });
  addCollider(x, z, Math.abs(Math.sin(rot)) > .7 ? 4.4 : 2.2, Math.abs(Math.sin(rot)) > .7 ? 2.2 : 4.4);
}
buildMap();

// ---------- Colisiones (círculo vs AABB) ----------
function resolveCollisions(p, radius) {
  p.x = THREE.MathUtils.clamp(p.x, -MAP.halfW + radius, MAP.halfW - radius);
  p.z = THREE.MathUtils.clamp(p.z, -MAP.halfL + radius, MAP.halfL - radius);
  for (const c of colliders) {
    const nx = THREE.MathUtils.clamp(p.x, c.minX, c.maxX);
    const nz = THREE.MathUtils.clamp(p.z, c.minZ, c.maxZ);
    const dx = p.x - nx, dz = p.z - nz, d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = nx + dx / d * radius; p.z = nz + dz / d * radius; }
      else p.z = c.maxZ + radius;
    }
  }
}

// ---------- Rifle (view model) ----------
const rifle = new THREE.Group();
{
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: .45, metalness: .55 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: .8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.09, .13, .62), dark); rifle.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .42, 8), dark); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .035, -.5); rifle.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .11), dark); mag.position.set(0, -.14, -.02); mag.rotation.x = .15; rifle.add(mag);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(.07, .11, .24), grip); stock.position.set(0, -.015, .36); rifle.add(stock);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(.02, .07, .02), dark); sight.position.set(0, .1, -.12); rifle.add(sight);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.085, .09, .14), grip); hand.position.set(0, -.055, -.3); rifle.add(hand);
  rifle.traverse(m => { if (m.isMesh) m.material.fog = false; }); // el arma en primera persona no se niebla
  rifle.position.set(.24, -.22, -.45);
  camera.add(rifle);
}
const muzzleFlash = new THREE.PointLight(0xffc36b, 0, 9);
muzzleFlash.position.set(.24, -.16, -1.05); camera.add(muzzleFlash);
let recoil = 0;

// ---------- Audio procedural (sin archivos) ----------
let AC = null;
function audio() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function beep(freq, dur, type = 'square', vol = .12, slide = 0) {
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio no disponible */ }
}
const sfx = {
  shoot() { beep(160, .09, 'sawtooth', .16, -110); },
  hit() { beep(320, .05, 'square', .07, -80); },
  kill() { beep(90, .35, 'sawtooth', .14, -55); },
  hurt() { beep(70, .2, 'triangle', .18, -25); },
  reload() { beep(220, .06, 'square', .08); setTimeout(() => beep(180, .06, 'square', .08), 700); },
  empty() { beep(900, .04, 'square', .06); },
};

// ---------- Monstruos ----------
const monsters = [];
const monsterMats = [];
let enemySeq = 0;   // secuencia de creación: define el signo de rodeo al atascarse
function createMonster() {
  const g = new THREE.Group();
  // Variante (Etapa B): 20% bruto, 20% veloz, 60% normal
  const roll = Math.random();
  const variant = roll < 0.20 ? 'bruto' : (roll < 0.40 ? 'veloz' : 'normal');
  const skin = new THREE.MeshStandardMaterial({ color: variant === 'bruto' ? 0x46543a : 0x5d7345, roughness: .85 });
  const darkSkin = new THREE.MeshStandardMaterial({ color: variant === 'bruto' ? 0x35412a : 0x445433, roughness: .9 });
  monsterMats.push(skin);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.78, 1.05, .44), skin); torso.position.y = 1.15; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), skin); head.position.y = 1.95; g.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .42), darkSkin); jaw.position.set(0, 1.68, .03); g.add(jaw);
  const eyeGeo = new THREE.SphereGeometry(.055, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ emissive: 0xff2211, emissiveIntensity: 4, color: 0x220000 });
  [-.13, .13].forEach(x => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(x, 2.0, .26); g.add(e); });
  const hornGeo = new THREE.ConeGeometry(.07, .3, 6);
  [-.18, .18].forEach(x => { const h = new THREE.Mesh(hornGeo, darkSkin); h.position.set(x, 2.3, 0); h.rotation.z = x > 0 ? -.3 : .3; g.add(h); });
  const armGeo = new THREE.BoxGeometry(.2, .95, .2);
  const armL = new THREE.Mesh(armGeo, skin); armL.position.set(-.52, 1.25, .3); armL.rotation.x = -1.25; g.add(armL);
  const armR = new THREE.Mesh(armGeo, skin); armR.position.set(.52, 1.25, .3); armR.rotation.x = -1.25; g.add(armR);
  const legGeo = new THREE.BoxGeometry(.24, .68, .24);
  const legL = new THREE.Mesh(legGeo, darkSkin); legL.position.set(-.2, .34, 0); g.add(legL);
  const legR = new THREE.Mesh(legGeo, darkSkin); legR.position.set(.2, .34, 0); g.add(legR);
  g.traverse(m => { if (m.isMesh) m.userData.isMonsterPart = true; });

  // Spawn: extremo lejano de la calle
  const fromNorth = Math.random() < .5;
  g.position.set((Math.random() - .5) * (MAP.halfW * 2 - 6), 0, fromNorth ? -MAP.halfL + 3 : MAP.halfL - 3);
  scene.add(g);
  // Estadísticas por variante: el bruto es grande (escala 1.18), tanque
  // (150 HP = 5 impactos) y lento (×0.85); el veloz es frágil (70 HP =
  // 3 impactos) y rápido (×1.3); el normal conserva los valores de siempre.
  let hp = MONSTER_HP, speed = MONSTER_SPEED * (0.85 + Math.random() * .35);
  if (variant === 'bruto') { hp = 150; speed = MONSTER_SPEED * 0.85; g.scale.setScalar(1.18); }
  else if (variant === 'veloz') { hp = 70; speed = MONSTER_SPEED * 1.3; }
  // Variación individual (Etapa B, ajustes): nada se mueve sincronizado —
  // reacción al aggro 0.25–0.45 s, ciclo de ataque ×0.9–1.1, duración
  // HURT ×0.85–1.2, ritmo de animación ±10% y percepción desfasada.
  const mon = { g, type: 'monster', variant, hp, speed, state: 'idle', stateT: 0, struck: false, steerT: 0, steerSign: (enemySeq++ % 2 === 0) ? 1 : -1, stuckT: 0, stuckX: g.position.x, stuckZ: g.position.z, flash: 0, walkPhase: Math.random() * 6, animRate: 0.9 + Math.random() * .2, swing: .6, armBase: -1.25, armSwing: .12, bobAmp: .05, partColor: 0x9db86a, parts: { armL, armR, legL, legR }, mats: [skin, darkSkin], lastKnown: null, lastSeenAgo: 999, seesPlayer: false, percepT: Math.random() * PERCEPTION_INTERVAL, reactT: 0.25 + Math.random() * .2, reactLeft: 0, attackCdMul: 0.9 + Math.random() * .2, hurtMul: 0.85 + Math.random() * .35, patrolX: (Math.random() - .5) * 16, patrolZ: g.position.z > 0 ? -30 : 30, searchArrived: false, scanT: 0, scanYaw: 0 };
  g.userData.monster = mon;
  monsters.push(mon);
  return mon;
}
function createZombie() {
  const g = new THREE.Group();
  const bodyG = new THREE.Group();       // cuerpo inclinado hacia adelante al correr
  bodyG.rotation.x = 0.3;
  g.add(bodyG);
  const skin = new THREE.MeshStandardMaterial({ color: 0x9aa584, roughness: .95 });      // piel gris verdosa pálida
  const skinDark = new THREE.MeshStandardMaterial({ color: 0x7c8468, roughness: .95 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2e3436, roughness: .95 });      // camisa oscura
  const shirtPatch = new THREE.MeshStandardMaterial({ color: 0x503a28, roughness: 1 });   // parche marrón: la camisa está rota
  const pants = new THREE.MeshStandardMaterial({ color: 0x3a3f3d, roughness: 1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x23211c, roughness: 1 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.72, 1.0, .4), shirt); torso.position.y = 1.12; bodyG.add(torso);
  const patch = new THREE.Mesh(new THREE.BoxGeometry(.3, .34, .03), shirtPatch); patch.position.set(.14, 1.24, .21); bodyG.add(patch);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.46, .48, .46), skin); head.position.y = 1.88; bodyG.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(.36, .13, .38), skinDark); jaw.position.set(0, 1.6, .03); bodyG.add(jaw);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(.48, .1, .48), hairMat); hair.position.y = 2.14; bodyG.add(hair);
  const eyeGeo = new THREE.SphereGeometry(.05, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ emissive: 0xff2211, emissiveIntensity: 4, color: 0x220000 });
  [-.12, .12].forEach(x => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(x, 1.93, .24); bodyG.add(e); });
  const armGeo = new THREE.BoxGeometry(.17, .9, .17);
  const armL = new THREE.Mesh(armGeo, skin); armL.position.set(-.46, 1.3, .42); armL.rotation.x = -1.55; bodyG.add(armL);
  const armR = new THREE.Mesh(armGeo, skin); armR.position.set(.46, 1.3, .42); armR.rotation.x = -1.55; bodyG.add(armR);
  const legGeo = new THREE.BoxGeometry(.21, .64, .21);
  const legL = new THREE.Mesh(legGeo, pants); legL.position.set(-.18, .32, 0); bodyG.add(legL);
  const legR = new THREE.Mesh(legGeo, pants); legR.position.set(.18, .32, 0); bodyG.add(legR);
  g.traverse(m => { if (m.isMesh) m.userData.isMonsterPart = true; });

  // Spawn: mismo extremo lejano de la calle que el monstruo
  const fromNorth = Math.random() < .5;
  g.position.set((Math.random() - .5) * (MAP.halfW * 2 - 6), 0, fromNorth ? -MAP.halfL + 3 : MAP.halfL - 3);
  scene.add(g);
  // Variante (Etapa B): 25% frenético — más rápido (×1.2) y frágil
  // (51 HP, sigue cayendo con 2 impactos); 75% normal. La velocidad
  // base lleva además variación individual de ±8%, y la reacción al
  // aggro es más corta que la del monstruo (0.10–0.25 s).
  const frenetic = Math.random() < 0.25;
  const mon = { g, type: 'zombie', variant: frenetic ? 'frenetico' : 'normal', hp: frenetic ? 51 : ZOMBIE_HP, speed: ZOMBIE_SPEED * (frenetic ? 1.2 : 1) * (0.92 + Math.random() * .16), state: 'idle', stateT: 0, struck: false, steerT: 0, steerSign: (enemySeq++ % 2 === 0) ? 1 : -1, stuckT: 0, stuckX: g.position.x, stuckZ: g.position.z, flash: 0, walkPhase: Math.random() * 6, animRate: 2.1 * (0.9 + Math.random() * .2), swing: .95, armBase: -1.55, armSwing: .3, bobAmp: .1, partColor: 0xb9bfa4, parts: { armL, armR, legL, legR }, mats: [skin, skinDark, shirt, pants, hairMat], lastKnown: null, lastSeenAgo: 999, seesPlayer: false, percepT: Math.random() * PERCEPTION_INTERVAL, reactT: 0.10 + Math.random() * .15, reactLeft: 0, attackCdMul: 0.9 + Math.random() * .2, hurtMul: 0.85 + Math.random() * .35, patrolX: (Math.random() - .5) * 16, patrolZ: g.position.z > 0 ? -30 : 30, searchArrived: false, scanT: 0, scanYaw: 0 };
  g.userData.monster = mon;
  monsters.push(mon);
  return mon;
}
// A partir de ZOMBIE_DELAY segundos, parte de los spawns son zombies corredores
function spawnEnemy() {
  if (S.elapsed >= ZOMBIE_DELAY && Math.random() < ZOMBIE_CHANCE) return createZombie();
  return createMonster();
}
const _hitPush = new THREE.Vector3();   // temporal reutilizable del retroceso
function damageMonster(mon, dmg, hitPoint) {
  if (mon.state === 'dead') return;   // un cadáver no recibe más daño ni da bajas
  mon.hp -= dmg;
  mon.flash = 1;
  // Escuchó el disparo: recuerda dónde está el jugador en este
  // instante (sin seguimiento permanente: si lo pierde de vista,
  // perseguirá este punto, no al jugador).
  if (!mon.lastKnown) mon.lastKnown = { x: 0, z: 0 };
  mon.lastKnown.x = playerPos.x; mon.lastKnown.z = playerPos.z;
  mon.lastSeenAgo = 0; mon.seesPlayer = true;
  mon.g.position.add(_hitPush.set(-dirVec.x, 0, -dirVec.z).multiplyScalar(.12)); // retroceso
  spawnHitParticles(hitPoint, mon.partColor);
  showHitmarker();
  if (mon.hp <= 0) {
    sfx.kill();
    S.kills++; updateHUD();
    // Pasa a DEAD: la caída y la retirada las gobierna el bucle
    // principal con stateT (sin setTimeout: respeta pausa y reinicio).
    mon.state = 'dead'; mon.stateT = 0;
  } else {
    sfx.hit();
    // Reacción HURT: se detiene un instante; al salir va a CHASE, así
    // que recibir daño también despierta el aggro desde IDLE.
    mon.state = 'hurt'; mon.stateT = 0;
  }
}

// ---------- Percepción y transiciones de estado (Etapa B, ajustes) ----------
// Visión de un enemigo: distancia ≤ ENEMY_AGGRO_RANGE y línea de
// visión libre contra los mismos bloqueadores que paran los disparos.
// Raycast dedicado con vectores reutilizables; se evalúa ~cada
// PERCEPTION_INTERVAL segundos por enemigo (no por frame).
const visionRay = new THREE.Raycaster();
const _visFrom = new THREE.Vector3();
const _visDir = new THREE.Vector3();
function canSeePlayer(mon, dist) {
  if (dist > ENEMY_AGGRO_RANGE) return false;
  const p = mon.g.position;
  _visFrom.set(p.x, 1.8 * mon.g.scale.y, p.z);          // altura de su cabeza
  _visDir.set(playerPos.x - p.x, 1.4 - _visFrom.y, playerPos.z - p.z);
  const len = _visDir.length();
  if (len < 1e-4) return true;
  visionRay.set(_visFrom, _visDir.divideScalar(len));
  visionRay.far = len;
  const hits = visionRay.intersectObjects(shootBlockers, false);
  return hits.length === 0 || hits[0].distance >= len - 0.05;
}
// Entrar en CHASE: con reacción (react = true) el enemigo se orienta
// durante reactT antes de avanzar; sin reacción ya estaba en combate.
function toChase(mon, react) {
  mon.state = 'chase'; mon.stateT = 0;
  mon.reactLeft = react ? mon.reactT : 0;
  mon.stuckT = 0; mon.stuckX = mon.g.position.x; mon.stuckZ = mon.g.position.z;
}
// Volver a IDLE: olvida al jugador y elige un waypoint de patrulla en
// el extremo opuesto de la calle (x aleatorio ±8).
function pickPatrol(mon) {
  mon.patrolZ = mon.g.position.z > 0 ? -30 : 30;
  mon.patrolX = (Math.random() - .5) * 16;
}
function toIdle(mon) {
  mon.state = 'idle'; mon.stateT = 0;
  mon.lastKnown = null; mon.lastSeenAgo = 999; mon.seesPlayer = false;
  pickPatrol(mon);
}
// Entrar en SEARCH: irá a la última posición conocida y la escaneará.
function toSearch(mon) {
  mon.state = 'search'; mon.stateT = 0;
  mon.searchArrived = false; mon.scanT = 0;
  mon.stuckT = 0; mon.stuckX = mon.g.position.x; mon.stuckZ = mon.g.position.z;
}
// Animación de caminar/correr compartida por IDLE, CHASE y SEARCH.
function walkAnim(mon) {
  mon.parts.legL.rotation.x = Math.sin(mon.walkPhase) * mon.swing;
  mon.parts.legR.rotation.x = -Math.sin(mon.walkPhase) * mon.swing;
  mon.parts.armL.rotation.x = mon.armBase + Math.sin(mon.walkPhase) * mon.armSwing;
  mon.parts.armR.rotation.x = mon.armBase - Math.sin(mon.walkPhase) * mon.armSwing;
  mon.g.position.y = Math.abs(Math.sin(mon.walkPhase)) * mon.bobAmp;
}

// Movimiento de un enemigo hacia un objetivo (tx, tz) con evitación activa:
// resolveCollisions impide atravesar edificios y autos; además, si en
// CHASE/SEARCH el desplazamiento real en 0.5 s es menor del 30% del
// esperado, se activa un rodeo lateral de 0.6 s (signo fijo por
// enemigo) para bordear el obstáculo en vez de frotarse contra él.
function moveEnemy(mon, dt, speed, tx, tz) {
  const p = mon.g.position;
  const dx = tx - p.x, dz = tz - p.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-4) return;
  let mx = dx / dist, mz = dz / dist;
  if (mon.steerT > 0) {
    mon.steerT -= dt;
    const px = -mz * mon.steerSign, pz = mx * mon.steerSign;
    mx += px * 0.9; mz += pz * 0.9;
    const l = Math.hypot(mx, mz); mx /= l; mz /= l;
  }
  p.x += mx * speed * dt;
  p.z += mz * speed * dt;
  resolveCollisions(p, .5);
  if (mon.state === 'chase' || mon.state === 'search') {
    mon.stuckT += dt;
    if (mon.stuckT >= STUCK_CHECK_TIME) {
      const moved = Math.hypot(p.x - mon.stuckX, p.z - mon.stuckZ);
      if (moved < speed * STUCK_CHECK_TIME * STUCK_MIN_RATIO && mon.steerT <= 0) mon.steerT = STUCK_STEER_TIME;
      mon.stuckT = 0; mon.stuckX = p.x; mon.stuckZ = p.z;
    }
  }
}

// ---------- Partículas de impacto ----------
const particles = [];
const partGeo = new THREE.BoxGeometry(.07, .07, .07);
function spawnHitParticles(point, color) {
  const mat = new THREE.MeshBasicMaterial({ color });
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(partGeo, mat);
    m.position.copy(point);
    scene.add(m);
    particles.push({ m, vel: new THREE.Vector3((Math.random() - .5) * 2.4, Math.random() * 2.2, (Math.random() - .5) * 2.4), life: .38 });
  }
}

// ---------- Jugador ----------
const playerPos = new THREE.Vector3(0, 1.7, 46);
let yaw = Math.PI, pitch = 0; // mirando hacia -Z de la calle (hacia el norte del mapa)
const vel = { x: 0, z: 0 };              // velocidad horizontal actual (con inercia)
let vy = 0, jumpY = 0, grounded = true;  // salto: velocidad vertical, altura y apoyo en el suelo
let bobPhase = 0;                        // fase del balanceo: avanza según la velocidad real
function tryJump() {
  if (S.mode === 'playing' && grounded) { grounded = false; vy = JUMP_VEL; }
}
function resetPlayer() {
  playerPos.set(0, 1.7, 46); yaw = Math.PI; pitch = 0;
  vel.x = 0; vel.z = 0; vy = 0; jumpY = 0; grounded = true; bobPhase = 0;
  S.health = 100; S.mag = MAG_SIZE; S.reloading = false; S.kills = 0; S.elapsed = 0; S.spawnTimer = 1; S.invulnUntil = 0;
}

// ---------- Disparo ----------
const raycaster = new THREE.Raycaster();
const dirVec = new THREE.Vector3();
const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: .85, fog: false });
const tracers = [];
function shoot(now) {
  if (S.reloading) return;
  if (S.mag <= 0) { sfx.empty(); startReload(now); return; }
  S.mag--; S.lastShot = now;
  recoil = 1; muzzleFlash.intensity = 26;
  sfx.shoot();
  camera.getWorldDirection(dirVec);
  // Dispersión ligera: perturbación aleatoria pequeña de la dirección
  // (la mira no se mueve; solo cambia la trayectoria del disparo)
  dirVec.x += (Math.random() * 2 - 1) * SPREAD;
  dirVec.y += (Math.random() * 2 - 1) * SPREAD;
  dirVec.z += (Math.random() * 2 - 1) * SPREAD;
  dirVec.normalize();
  raycaster.set(camera.position, dirVec);
  raycaster.far = 120;
  // ¿Monstruo más cercano en la línea de tiro?
  let bestMon = null, bestDist = Infinity, bestPoint = null;
  for (const mon of monsters) {
    const center = new THREE.Vector3(mon.g.position.x, 1.25, mon.g.position.z);
    const toC = center.clone().sub(camera.position);
    const t = toC.dot(dirVec);
    if (t < 0 || t > 120) continue;
    const closest = camera.position.clone().add(dirVec.clone().multiplyScalar(t));
    const d = closest.distanceTo(center);
    if (d < 1.0 && t < bestDist) { bestMon = mon; bestDist = t; bestPoint = closest; }
  }
  // ¿Un obstáculo bloquea antes?
  const wallHits = raycaster.intersectObjects(shootBlockers, false);
  const wallDist = wallHits.length ? wallHits[0].distance : Infinity;
  const muzzleWorld = new THREE.Vector3(); rifle.children[1].getWorldPosition(muzzleWorld);
  if (bestMon && bestDist < wallDist) {
    damageMonster(bestMon, RIFLE_DAMAGE, bestPoint);
    addTracer(muzzleWorld, bestPoint);
  } else if (wallDist < Infinity) {
    spawnHitParticles(wallHits[0].point, 0xccaa77);
    addTracer(muzzleWorld, wallHits[0].point);
  } else {
    addTracer(muzzleWorld, camera.position.clone().add(dirVec.clone().multiplyScalar(60)));
  }
  if (S.mag === 0) startReload(now);
  updateHUD();
}
function addTracer(from, to) {
  const len = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(.012, .012, len, 4);
  const m = new THREE.Mesh(geo, tracerMat);
  m.position.copy(from).lerp(to, .5);
  m.lookAt(to); m.rotateX(Math.PI / 2);
  scene.add(m); tracers.push({ m, life: .06 });
}
function startReload(now) {
  if (S.reloading || S.mag === MAG_SIZE) return;
  S.reloading = true; S.reloadEnd = now + RELOAD_MS / 1000;
  document.getElementById('reload-msg').classList.remove('hidden');
  sfx.reload();
}

// ---------- HUD ----------
const el = id => document.getElementById(id);
// Control de sensibilidad de la pantalla inicial: aplica al mouse y al
// arrastre táctil, muestra el valor y lo guarda en localStorage.
const sensSlider = el('sens-slider'), sensValue = el('sens-value');
if (sensSlider && sensValue) {
  sensSlider.value = sens;
  sensValue.textContent = sens.toFixed(1) + '×';
  sensSlider.addEventListener('input', () => {
    sens = parseFloat(sensSlider.value);
    sensValue.textContent = sens.toFixed(1) + '×';
    try { localStorage.setItem('ma_sens', String(sens)); } catch (e) { /* almacenamiento no disponible */ }
  });
}
// Selector de niebla de la pantalla inicial: tres niveles que aplican la
// densidad al instante (también en pausa, que muestra esta pantalla) y
// guardan la elección en localStorage.
const fogBtns = document.querySelectorAll('.fog-btn');
function paintFogBtns() { fogBtns.forEach(b => b.classList.toggle('active', b.dataset.level === fogLevel)); }
fogBtns.forEach(b => b.addEventListener('click', () => {
  if (!(b.dataset.level in FOG_LEVELS)) return;
  fogLevel = b.dataset.level;
  scene.fog.density = FOG_LEVELS[fogLevel];
  paintFogBtns();
  try { localStorage.setItem('ma_fog', fogLevel); } catch (e) { /* almacenamiento no disponible */ }
}));
paintFogBtns();
function updateHUD() {
  el('health-bar').style.width = Math.max(0, S.health) + '%';
  el('health-text').textContent = Math.max(0, Math.ceil(S.health));
  el('ammo-mag').textContent = S.mag;
  el('ammo').classList.toggle('low', S.mag <= 6);
  el('kills').textContent = S.kills;
}
let hitT = null;
function showHitmarker() {
  const h = el('hitmarker'); h.classList.add('show');
  clearTimeout(hitT); hitT = setTimeout(() => h.classList.remove('show'), 70);
}
function flashDamage() {
  const v = el('damage-vignette'); v.classList.add('show');
  setTimeout(() => v.classList.remove('show'), 90);
}

// ---------- Etapa C1: descubrimiento, minimapa y mapa expandido ----------
// Descubrimiento progresivo sobre una retícula de celdas de 4 m que
// cubre los límites del registro (MAPREG). El estado vive en un Set
// de claves "cx,cz" y se persiste entre partidas y sesiones en
// localStorage. La clave se deriva de DISCOVERY_MODE: el modo actual
// es 'explore'; un futuro modo supervivencia usará su propia clave y
// podrá partir de cero llamando a resetDiscovery() (gancho listo,
// hoy ninguna UI lo invoca).
const CELL = 4;                          // m por celda de la retícula
const DISCOVERY_MODE = 'explore';        // futuro: 'survival'
const DISCOVERY_KEY = 'ma_discovery_' + DISCOVERY_MODE;   // hoy: 'ma_discovery_explore'
const REVEAL_RADIUS = { extrema: 14, densa: 18, normal: 26 }; // m, según la niebla activa (ma_fog)
const MAP_SCALE = 2;                     // px por metro en la capa estática
const MAP_VIEW_M = 40;                   // m de radio visible en el minimapa
const discovered = new Set();
let mapBounds = null, gridCols = 0, gridRows = 0;
let staticLayer = null, staticCtx = null;
let discoveryDirty = false, lastDiscoverySave = 0;
let mapOpen = false;
let discAcc = 0;                         // acumulador del revelado a 10 Hz

function computeMapBounds() {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const list of [MAPREG.streets, MAPREG.buildings]) for (const r of list) {
    if (r.minX < minX) minX = r.minX; if (r.maxX > maxX) maxX = r.maxX;
    if (r.minZ < minZ) minZ = r.minZ; if (r.maxZ > maxZ) maxZ = r.maxZ;
  }
  const pad = 2;
  mapBounds = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
  gridCols = Math.ceil((mapBounds.maxX - mapBounds.minX) / CELL);
  gridRows = Math.ceil((mapBounds.maxZ - mapBounds.minZ) / CELL);
}
function cellKey(cx, cz) { return cx + ',' + cz; }
function cellCenterX(cx) { return mapBounds.minX + (cx + 0.5) * CELL; }
function cellCenterZ(cz) { return mapBounds.minZ + (cz + 0.5) * CELL; }
function rectAt(x, z) {
  // Qué hay en un punto del registro: 'building' | 'street' | null
  for (const r of MAPREG.buildings) if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return 'building';
  for (const r of MAPREG.streets) if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return 'street';
  return null;
}

// Capa estática fuera de pantalla (a MAP_SCALE px/m, norte arriba):
// solo se repinta cuando se revelan celdas nuevas; minimapa y mapa
// expandido la reutilizan con drawImage, sin recalcular nada.
function paintCell(cx, cz) {
  const kind = rectAt(cellCenterX(cx), cellCenterZ(cz));
  const px = cx * CELL * MAP_SCALE;
  const py = (mapBounds.maxZ - (mapBounds.minZ + (cz + 1) * CELL)) * MAP_SCALE;
  const sz = CELL * MAP_SCALE;
  if (kind === 'building') {
    staticCtx.fillStyle = '#7a6248';
    staticCtx.fillRect(px, py, sz, sz);
    staticCtx.strokeStyle = '#2a2119';
    staticCtx.lineWidth = 1;
    staticCtx.strokeRect(px + .5, py + .5, sz - 1, sz - 1);
  } else {
    staticCtx.fillStyle = kind === 'street' ? '#39414a' : '#10141a';
    staticCtx.fillRect(px, py, sz, sz);
  }
}
function buildStaticLayer() {
  staticLayer = document.createElement('canvas');
  staticLayer.width = Math.ceil((mapBounds.maxX - mapBounds.minX) * MAP_SCALE);
  staticLayer.height = Math.ceil((mapBounds.maxZ - mapBounds.minZ) * MAP_SCALE);
  staticCtx = staticLayer.getContext('2d');
  staticCtx.fillStyle = '#07090b';   // no descubierto
  staticCtx.fillRect(0, 0, staticLayer.width, staticLayer.height);
  for (const key of discovered) {
    const [cx, cz] = key.split(',').map(Number);
    paintCell(cx, cz);
  }
}

// Línea de vista 2D para el descubrimiento: intersección segmento–
// AABB (método de slabs) contra la lista `colliders` — los mismos
// AABB que bloquean el movimiento. Así el descubrimiento NO atraviesa
// paredes: cuando C2 agregue paredes interiores a `colliders`, las
// habitaciones quedarán tras ellas y no se revelarán desde fuera; la
// exploración de interiores nacerá de entrar, no de mirar el mapa.
// El colisionador que CONTIENE el punto destino no lo bloquea: la
// huella de un edificio se descubre al ver el edificio desde fuera.
function segHitsRect(x1, z1, x2, z2, r) {
  let tmin = 0, tmax = 1;
  const dx = x2 - x1, dz = z2 - z1;
  if (Math.abs(dx) < 1e-9) { if (x1 < r.minX || x1 > r.maxX) return false; }
  else {
    let ta = (r.minX - x1) / dx, tb = (r.maxX - x1) / dx;
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    tmin = Math.max(tmin, ta); tmax = Math.min(tmax, tb);
    if (tmax < tmin) return false;
  }
  if (Math.abs(dz) < 1e-9) { if (z1 < r.minZ || z1 > r.maxZ) return false; }
  else {
    let ta = (r.minZ - z1) / dz, tb = (r.maxZ - z1) / dz;
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    tmin = Math.max(tmin, ta); tmax = Math.min(tmax, tb);
    if (tmax < tmin) return false;
  }
  return true;
}
function los2D(x, z) {
  for (const c of colliders) {
    if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) continue;
    if (segHitsRect(playerPos.x, playerPos.z, x, z, c)) return false;
  }
  return true;
}

// Revelado (se llama a 10 Hz desde el bucle): solo celdas dentro del
// radio según la niebla activa; las de ≤3 m se revelan siempre
// (campo cercano) y el resto exige línea de vista 2D libre.
function updateDiscovery(now) {
  const radius = REVEAL_RADIUS[fogLevel] || 18;
  const minCx = Math.max(0, Math.floor((playerPos.x - radius - mapBounds.minX) / CELL));
  const maxCx = Math.min(gridCols - 1, Math.floor((playerPos.x + radius - mapBounds.minX) / CELL));
  const minCz = Math.max(0, Math.floor((playerPos.z - radius - mapBounds.minZ) / CELL));
  const maxCz = Math.min(gridRows - 1, Math.floor((playerPos.z + radius - mapBounds.minZ) / CELL));
  for (let cz = minCz; cz <= maxCz; cz++) for (let cx = minCx; cx <= maxCx; cx++) {
    const key = cellKey(cx, cz);
    if (discovered.has(key)) continue;
    const wx = cellCenterX(cx), wz = cellCenterZ(cz);
    const dx = wx - playerPos.x, dz = wz - playerPos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > radius * radius) continue;
    if (d2 > 9 && !los2D(wx, wz)) continue;
    discovered.add(key);
    paintCell(cx, cz);
    discoveryDirty = true;
  }
  if (discoveryDirty && now - lastDiscoverySave >= 1) {   // guardado con debounce ~1 s
    lastDiscoverySave = now; discoveryDirty = false;
    try { localStorage.setItem(DISCOVERY_KEY, JSON.stringify([...discovered])); } catch (e) { /* almacenamiento no disponible */ }
  }
}
function loadDiscovery() {
  try {
    const arr = JSON.parse(localStorage.getItem(DISCOVERY_KEY) || '[]');
    if (Array.isArray(arr)) for (const k of arr) if (typeof k === 'string') discovered.add(k);
  } catch (e) { /* datos corruptos o almacenamiento no disponible */ }
}
// Gancho para el futuro modo supervivencia (hoy ninguna UI lo
// invoca): limpia el descubrimiento del modo activo y repinta todo.
function resetDiscovery() {
  discovered.clear();
  discoveryDirty = false;
  try { localStorage.removeItem(DISCOVERY_KEY); } catch (e) { /* almacenamiento no disponible */ }
  buildStaticLayer();
  drawMinimap();
  if (mapOpen) drawBigMap();
}

// Minimapa circular: ventana de MAP_VIEW_M m centrada en el jugador,
// norte arriba (recorte circular por CSS). Sin enemigos ni otros
// marcadores dinámicos: la única pieza móvil es la flecha.
const minimapCv = el('minimap'), minimapCtx = minimapCv.getContext('2d');
function drawPlayerArrow(g, x, y, size) {
  g.save();
  g.translate(x, y);
  g.rotate(-yaw);   // norte = -Z queda arriba; la flecha sigue la mira
  g.beginPath();
  g.moveTo(0, -size);
  g.lineTo(size * 0.72, size * 0.8);
  g.lineTo(0, size * 0.35);
  g.lineTo(-size * 0.72, size * 0.8);
  g.closePath();
  g.fillStyle = '#ffffff';
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(0,0,0,.85)';
  g.stroke();
  g.restore();
}
function drawMinimap() {
  if (!staticLayer) return;
  const W = minimapCv.width, C = W / 2;
  const g = minimapCtx;
  g.save();
  g.beginPath(); g.arc(C, C, C - 1, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#07090b';
  g.fillRect(0, 0, W, W);
  const k = (W / (2 * MAP_VIEW_M)) / MAP_SCALE;
  g.translate(C, C);
  g.scale(k, k);
  const lx = (playerPos.x - mapBounds.minX) * MAP_SCALE;
  const ly = (mapBounds.maxZ - playerPos.z) * MAP_SCALE;
  g.drawImage(staticLayer, -lx, -ly);
  g.restore();
  drawPlayerArrow(g, C, C, 11);
}

// Mapa expandido: la misma capa estática completa, a 7 px/m, con la
// flecha del jugador, la "N" de norte y los landmarks descubiertos
// con nombre (el registro está vacío hasta C2: no se dibujan).
const bigmapCv = el('bigmap'), bigmapCtx = bigmapCv.getContext('2d');
function drawBigMap() {
  const s = 7;
  bigmapCv.width = Math.round((mapBounds.maxX - mapBounds.minX) * s);
  bigmapCv.height = Math.round((mapBounds.maxZ - mapBounds.minZ) * s);
  const g = bigmapCtx;
  g.fillStyle = '#07090b';
  g.fillRect(0, 0, bigmapCv.width, bigmapCv.height);
  g.drawImage(staticLayer, 0, 0, bigmapCv.width, bigmapCv.height);
  g.textAlign = 'center';
  for (const lm of MAPREG.landmarks) {
    const cxm = (lm.minX + lm.maxX) / 2, czm = (lm.minZ + lm.maxZ) / 2;
    const key = cellKey(Math.floor((cxm - mapBounds.minX) / CELL), Math.floor((czm - mapBounds.minZ) / CELL));
    if (!discovered.has(key)) continue;
    g.font = '700 13px "Segoe UI", Arial, sans-serif';
    g.fillStyle = '#ffd9ae';
    g.fillText(lm.name, (cxm - mapBounds.minX) * s, (mapBounds.maxZ - czm) * s);
  }
  g.font = '800 20px "Segoe UI", Arial, sans-serif';
  g.fillStyle = '#e8e0d0';
  g.fillText('N', bigmapCv.width / 2, 24);
  drawPlayerArrow(g, (playerPos.x - mapBounds.minX) * s, (mapBounds.maxZ - playerPos.z) * s, 10);
}

// Abrir/cerrar el mapa SIN estados de juego nuevos: abrir pausa con
// el flujo existente (en escritorio, salir del pointer lock ya
// dispara la pausa y el overlay queda encima; en táctil, la misma
// ruta que el botón ⏸) y cerrar vuelve a la pantalla de pausa, desde
// donde JUGAR reanuda como siempre.
function openMap() {
  if (mapOpen || (S.mode !== 'playing' && S.mode !== 'paused')) return;
  mapOpen = true;
  if (S.mode === 'playing') {
    if (touchMode) pauseGame();
    else if (document.pointerLockElement) document.exitPointerLock();
  }
  drawBigMap();
  el('map-overlay').classList.remove('hidden');
}
function closeMap() {
  if (!mapOpen) return;
  mapOpen = false;
  el('map-overlay').classList.add('hidden');
}
el('map-close').addEventListener('click', closeMap);
el('btn-map').addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing' || S.mode === 'paused') openMap();
}, { passive: false });

// Inicialización del descubrimiento: límites del registro, estado
// persistido y capa estática inicial.
computeMapBounds();
loadDiscovery();
buildStaticLayer();
drawMinimap();
window.__ma.resetDiscovery = resetDiscovery;   // gancho de consola para pruebas
window.__ma.discoverySize = () => discovered.size;

// ---------- Entrada ----------
document.addEventListener('keydown', e => {
  S.keys[e.code] = true;
  if (e.code === 'Space' && S.mode === 'playing') { e.preventDefault(); tryJump(); }
  if (e.code === 'KeyR' && S.mode === 'playing') startReload(performance.now() / 1000);
  // Etapa C1: M abre/cierra el mapa expandido; Esc solo lo cierra si
  // está abierto (no interfiere con la pausa normal por Esc).
  if (e.code === 'KeyM') { if (mapOpen) closeMap(); else openMap(); }
  if (e.code === 'Escape' && mapOpen) closeMap();
});
document.addEventListener('keyup', e => { S.keys[e.code] = false; });
document.addEventListener('mousemove', e => {
  if (S.mode !== 'playing' || document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * MOUSE_SENS * sens;
  pitch = THREE.MathUtils.clamp(pitch - e.movementY * MOUSE_SENS * sens, -1.35, 1.35);
});
document.addEventListener('mousedown', e => { if (S.mode === 'playing' && document.pointerLockElement === canvas) S.mouseDown = true; });
document.addEventListener('mouseup', () => { S.mouseDown = false; });

function lockPointer() { canvas.requestPointerLock(); }
function startInput() { if (touchMode) tryMobileLandscape(); else lockPointer(); }
el('play-btn').addEventListener('click', () => {
  audio();
  if (S.mode === 'menu' || S.mode === 'dead') { resetPlayer(); clearMonsters(); }
  el('start-screen').classList.add('hidden');
  el('death-screen').classList.add('hidden');
  el('hud').classList.remove('hidden');
  S.mode = 'playing'; S.startTime = performance.now() / 1000 - S.elapsed;
  updateHUD(); startInput();
});
el('restart-btn').addEventListener('click', () => {
  resetPlayer(); clearMonsters();
  el('death-screen').classList.add('hidden');
  el('hud').classList.remove('hidden');
  S.mode = 'playing'; S.startTime = performance.now() / 1000;
  updateHUD(); startInput();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && S.mode === 'playing') {
    S.mode = 'paused';
    el('start-screen').classList.remove('hidden');
    el('resume-hint').classList.remove('hidden');
  } else if (document.pointerLockElement === canvas && S.mode === 'paused') {
    S.mode = 'playing';
    el('start-screen').classList.add('hidden');
  }
});
function clearMonsters() { for (const m of monsters) scene.remove(m.g); monsters.length = 0; }
function die() {
  S.mode = 'dead'; S.mouseDown = false; S.touchFire = false;
  resetJoy();
  vel.x = 0; vel.z = 0; vy = 0; jumpY = 0; grounded = true;
  if (document.pointerLockElement) document.exitPointerLock();
  el('death-kills').textContent = S.kills;
  const t = Math.floor(S.elapsed);
  el('death-time').textContent = `${(t / 60) | 0}:${String(t % 60).padStart(2, '0')}`;
  el('death-screen').classList.remove('hidden');
}

// ---------- Controles táctiles (celular) ----------
// Detección: puntero grueso (coarse) o soporte de touch. En equipos sin
// táctil nada de esto se activa y el escritorio queda idéntico.
let touchMode = ('ontouchstart' in window) ||
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
function enableTouchMode() {
  if (!touchMode) { touchMode = true; document.body.classList.add('touch'); }
}
if (touchMode) document.body.classList.add('touch');
window.addEventListener('touchstart', enableTouchMode, { passive: true });
window.__ma.isTouch = () => touchMode;

// Al jugar en táctil: intentar fullscreen + bloqueo horizontal.
// En Android Chrome ambos suelen funcionar; en iOS Safari
// screen.orientation.lock no existe: el error se ignora y el juego
// arranca igual (el aviso "gira tu celular" cubre ese caso).
function tryMobileLandscape() {
  try {
    const root = document.documentElement;
    if (root.requestFullscreen) {
      const p = root.requestFullscreen({ navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
    }
  } catch (e) { /* fullscreen no disponible: se ignora */ }
  try {
    if (screen.orientation && screen.orientation.lock) {
      const p = screen.orientation.lock('landscape');
      if (p && p.catch) p.catch(() => {});
    }
  } catch (e) { /* bloqueo de orientación no disponible (iOS): se ignora */ }
}

// Joystick virtual (izquierdo): joy.x = lateral, joy.y = vertical (abajo +)
const joy = { id: null, x: 0, y: 0 };
const JOY_R = 42;
const joyBase = el('joystick'), joyKnob = el('joystick-knob');
function handleJoy(t) {
  const r = joyBase.getBoundingClientRect();
  let dx = t.clientX - (r.left + r.width / 2);
  let dy = t.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
  joy.x = dx / JOY_R; joy.y = dy / JOY_R;
  joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function resetJoy() {
  joy.id = null; joy.x = 0; joy.y = 0;
  if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
}
joyBase.addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  const t = e.changedTouches[0]; joy.id = t.identifier; handleJoy(t);
}, { passive: false });

// Mirada: arrastrar en la mitad derecha (misma sensibilidad/límites que el mouse)
const look = { id: null, lx: 0, ly: 0 };
const LOOK_SENS = 0.0042;
el('look-zone').addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  const t = e.changedTouches[0]; look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY;
}, { passive: false });

window.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) { e.preventDefault(); handleJoy(t); }
    if (t.identifier === look.id) {
      e.preventDefault();
      yaw -= (t.clientX - look.lx) * LOOK_SENS * sens;
      pitch = THREE.MathUtils.clamp(pitch - (t.clientY - look.ly) * LOOK_SENS * sens, -1.35, 1.35);
      look.lx = t.clientX; look.ly = t.clientY;
    }
  }
}, { passive: false });
function endTouch(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) resetJoy();
    if (t.identifier === look.id) look.id = null;
  }
}
window.addEventListener('touchend', endTouch);
window.addEventListener('touchcancel', endTouch);

// Botones táctiles: disparar (mantener = automático), recargar y pausa
const btnFire = el('btn-fire');
btnFire.addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  S.touchFire = true; btnFire.classList.add('active');
}, { passive: false });
['touchend', 'touchcancel'].forEach(ev => btnFire.addEventListener(ev, e => {
  e.preventDefault(); S.touchFire = false; btnFire.classList.remove('active');
}, { passive: false }));
el('btn-reload').addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing') startReload(performance.now() / 1000);
}, { passive: false });
el('btn-jump').addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  tryJump();
}, { passive: false });
el('btn-pause').addEventListener('touchstart', e => {
  e.preventDefault(); enableTouchMode();
  if (S.mode === 'playing') pauseGame();
}, { passive: false });
function pauseGame() {
  S.mode = 'paused'; S.touchFire = false; S.mouseDown = false; resetJoy();
  btnFire.classList.remove('active');
  el('start-screen').classList.remove('hidden');
  el('resume-hint').classList.remove('hidden');
}

// ---------- Bucle principal ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const now = performance.now() / 1000;

  // Hogueras
  if (window.__fires) for (const f of window.__fires) {
    const n = Math.sin(now * 11 + f.phase) * .35 + Math.sin(now * 23 + f.phase) * .2;
    f.light.intensity = f.base * (1 + n * .35);
    f.fire.scale.set(1 + n * .15, 1 + n * .3, 1 + n * .15);
  }
  muzzleFlash.intensity = Math.max(0, muzzleFlash.intensity - dt * 320);

  if (S.mode === 'playing') {
    S.elapsed = now - S.startTime;

    // Etapa C1: descubrimiento y minimapa a 10 Hz (nada por frame)
    discAcc += dt;
    if (discAcc >= 0.1) { discAcc = 0; updateDiscovery(now); drawMinimap(); }

    // Movimiento WASD y/o joystick táctil, con aceleración y
    // desaceleración suaves: la velocidad actual se acerca a la
    // velocidad objetivo con amortiguación exponencial.
    // Sprint: Shift (escritorio) o joystick casi a fondo (táctil).
    let fwd = (S.keys.KeyW ? 1 : 0) - (S.keys.KeyS ? 1 : 0);
    let strafe = (S.keys.KeyD ? 1 : 0) - (S.keys.KeyA ? 1 : 0);
    let joyMag = 0;
    if (touchMode) {
      fwd += -joy.y; strafe += joy.x;
      joyMag = Math.min(1, Math.hypot(joy.x, joy.y));
    }
    const inputLen = Math.hypot(fwd, strafe);
    const mag = Math.min(1, inputLen);
    const sprinting = mag > 0.01 &&
      (!!S.keys.ShiftLeft || !!S.keys.ShiftRight || (touchMode && joyMag >= 0.92));
    const maxSpeed = sprinting ? SPRINT_SPEED : PLAYER_SPEED;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    let tx = 0, tz = 0;
    if (inputLen > 0.01) {
      tx = ((-sin * fwd + cos * strafe) / inputLen) * maxSpeed * mag;
      tz = ((-cos * fwd - sin * strafe) / inputLen) * maxSpeed * mag;
    }
    const blend = Math.min(1, dt * 10);
    vel.x += (tx - vel.x) * blend;
    vel.z += (tz - vel.z) * blend;
    playerPos.x += vel.x * dt;
    playerPos.z += vel.z * dt;
    resolveCollisions(playerPos, PLAYER_RADIUS);
    const curSpeed = Math.hypot(vel.x, vel.z);

    // Salto: gravedad simple, solo suelo plano (no sube a obstáculos)
    if (!grounded) {
      vy += GRAVITY * dt;
      jumpY += vy * dt;
      if (jumpY <= 0) { jumpY = 0; vy = 0; grounded = true; }
    }

    // Cámara + rifle: balanceo proporcional a la velocidad real
    if (curSpeed > 0.2) bobPhase += dt * (1.5 + curSpeed * 1.1);
    const bobAmt = Math.min(1, curSpeed / PLAYER_SPEED);
    const bob = Math.sin(bobPhase) * .012 * bobAmt;
    camera.position.set(playerPos.x, 1.7 + jumpY + Math.abs(Math.sin(bobPhase)) * .03 * bobAmt, playerPos.z);
    camera.rotation.set(pitch, yaw, 0);
    recoil = Math.max(0, recoil - dt * 7);
    // Animación de recarga: el rifle baja y se inclina siguiendo la
    // curva sin(π·progreso); el punto más bajo es a mitad de recarga.
    let relDip = 0, relTilt = 0;
    if (S.reloading) {
      const prog = THREE.MathUtils.clamp(1 - (S.reloadEnd - now) / (RELOAD_MS / 1000), 0, 1);
      const s = Math.sin(Math.PI * prog);
      relDip = s * .16; relTilt = s * .55;
    }
    rifle.position.set(.24, -.22 + bob - recoil * .02 - relDip, -.45 + recoil * .07);
    rifle.rotation.x = recoil * .09 - relTilt;

    // FOV al esprintar: 75 → 80 con transición suave (y de vuelta)
    const targetFov = sprinting ? 80 : 75;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();
    } else if (camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }

    // Disparo automático (clic sostenido o botón DISPARAR táctil)
    if ((S.mouseDown || S.touchFire) && now - S.lastShot >= FIRE_INTERVAL) shoot(now);
    // Fin de recarga
    if (S.reloading && now >= S.reloadEnd) {
      S.reloading = false; S.mag = MAG_SIZE;
      el('reload-msg').classList.add('hidden'); updateHUD();
    }

    // Spawner
    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0 && monsters.length < MAX_ALIVE) { spawnEnemy(); S.spawnTimer = SPAWN_EVERY; }

    // Monstruos: máquina de estados IDLE → CHASE → ATTACK, con HURT,
    // DEAD y SEARCH (búsqueda en la última posición conocida). La
    // percepción va escalonada; el resto, con escalares por frame.
    for (let i = monsters.length - 1; i >= 0; i--) {
      const mon = monsters[i];
      const p = mon.g.position;
      const dx = playerPos.x - p.x, dz = playerPos.z - p.z;
      const dist = Math.hypot(dx, dz);
      mon.stateT += dt;

      // Feedback de impacto: destello rojo que decae (también en DEAD)
      if (mon.flash > 0) {
        mon.flash = Math.max(0, mon.flash - dt * 6);
        mon.mats.forEach(m => m.emissive.setRGB(mon.flash * .8, mon.flash * .08, mon.flash * .05));
      }

      if (mon.state === 'dead') {
        // Caída gobernada por el bucle (respeta pausa y reinicio):
        // rotación z hasta 90° en ~0.3 s y retirada a los 0.35 s.
        const k = Math.min(1, mon.stateT / 0.3);
        mon.g.rotation.z = (Math.PI / 2) * k;
        p.y = .3 * k;
        if (mon.stateT >= DEAD_TIME) { scene.remove(mon.g); monsters.splice(i, 1); }
        continue;
      }

      // Percepción escalonada (Etapa B, ajustes): cada ~0.2 s por
      // enemigo, con offset propio, comprueba si ve al jugador. Si lo
      // ve, su última posición conocida se refresca; si no, envejece.
      mon.lastSeenAgo += dt;
      mon.percepT -= dt;
      if (mon.percepT <= 0) {
        mon.percepT += PERCEPTION_INTERVAL;
        mon.seesPlayer = canSeePlayer(mon, dist);
        if (mon.seesPlayer) {
          if (!mon.lastKnown) mon.lastKnown = { x: 0, z: 0 };
          mon.lastKnown.x = playerPos.x; mon.lastKnown.z = playerPos.z;
          mon.lastSeenAgo = 0;
        }
      }

      let flinchX = 0;
      let faceX = playerPos.x, faceZ = playerPos.z;   // mirada por defecto: el jugador
      if (mon.state === 'hurt') {
        // Reacción al daño: no avanza; inclinación breve del cuerpo.
        // Duración individual: HURT_TIME × hurtMul (×0.85–1.2).
        const hurtDur = HURT_TIME * mon.hurtMul;
        const k = Math.min(1, mon.stateT / hurtDur);
        flinchX = -0.25 * Math.sin(Math.PI * k);
        if (mon.stateT >= hurtDur) {
          // ATTACK y HURT usan la distancia real (contacto físico)
          if (dist <= MONSTER_ATTACK_RANGE) { mon.state = 'attack'; mon.stateT = 0; mon.struck = false; }
          else toChase(mon, false);
        }
      } else if (mon.state === 'attack') {
        // Ciclo individual: 0.75 s × attackCdMul (×0.9–1.1); la
        // recuperación absorbe la anticipación de 0.35 s.
        const cyc = MONSTER_ATTACK_CD * mon.attackCdMul;
        mon.walkPhase += dt * 7 * mon.animRate;
        p.y = Math.abs(Math.sin(mon.walkPhase)) * mon.bobAmp;
        if (dist > ATTACK_EXIT_RANGE) {
          toChase(mon, false);
        } else {
          // Animación del golpe: preparación (brazos arriba, 0.35 s),
          // golpe (bajada rápida) y recuperación hasta cerrar el
          // ciclo; un solo intento de golpe por ciclo.
          const t = mon.stateT;
          let pose;
          if (t < ATTACK_WINDUP) pose = mon.armBase + (-2.2 - mon.armBase) * (t / ATTACK_WINDUP);
          else if (t < ATTACK_WINDUP + 0.15) pose = -2.2 + 1.05 * ((t - ATTACK_WINDUP) / 0.15);
          else pose = -1.15 + (mon.armBase + 1.15) * Math.min(1, (t - ATTACK_WINDUP - 0.15) / (cyc - ATTACK_WINDUP - 0.15));
          mon.parts.armL.rotation.x = pose;
          mon.parts.armR.rotation.x = pose;
          if (!mon.struck && t >= ATTACK_WINDUP) {
            mon.struck = true;
            // El daño solo aplica si el jugador sigue al alcance del
            // golpe y no está en su ventana de invulnerabilidad
            // (Etapa A); si es invulnerable, la animación ocurre igual.
            if (dist <= ATTACK_HIT_RANGE && now >= S.invulnUntil) {
              S.invulnUntil = now + INVULN_TIME;
              S.health -= MONSTER_DAMAGE;
              flashDamage(); sfx.hurt(); updateHUD();
              if (S.health <= 0) { die(); break; }
            }
          }
          if (t >= cyc) { mon.stateT = 0; mon.struck = false; }
        }
      } else if (mon.state === 'idle') {
        // IDLE: patrulla entre waypoints de la calle SIN conocer la
        // posición del jugador. Solo detecta por visión (percepción)
        // o por daño (damageMonster → HURT → CHASE).
        faceX = mon.patrolX; faceZ = mon.patrolZ;
        mon.walkPhase += dt * 7 * mon.animRate;
        moveEnemy(mon, dt, mon.speed * ENEMY_IDLE_SPEED, mon.patrolX, mon.patrolZ);
        walkAnim(mon);
        const pdx = mon.patrolX - p.x, pdz = mon.patrolZ - p.z;
        if (pdx * pdx + pdz * pdz < 2.25) pickPatrol(mon);   // llegó: otro extremo
        if (mon.seesPlayer) toChase(mon, true);
      } else if (mon.state === 'chase') {
        // CHASE: el objetivo es la última posición conocida. Mientras
        // lo ve, la percepción la mantiene igual a la real; si lo
        // pierde, va a ese punto, no al jugador.
        const tx = mon.lastKnown ? mon.lastKnown.x : playerPos.x;
        const tz = mon.lastKnown ? mon.lastKnown.z : playerPos.z;
        faceX = tx; faceZ = tz;
        if (mon.reactLeft > 0) {
          // Reacción individual: se orienta hacia el objetivo pero
          // aún no avanza (nada de arranques sincronizados).
          mon.reactLeft -= dt;
        } else {
          mon.walkPhase += dt * 7 * mon.animRate;
          moveEnemy(mon, dt, mon.speed, tx, tz);
          walkAnim(mon);
          const tdx = tx - p.x, tdz = tz - p.z;
          const atKnown = tdx * tdx + tdz * tdz < 0.64;
          if (dist <= MONSTER_ATTACK_RANGE) { mon.state = 'attack'; mon.stateT = 0; mon.struck = false; }
          else if (mon.lastSeenAgo > MEMORY_TIME || (atKnown && mon.lastSeenAgo > 0.25)) toSearch(mon);
        }
      } else if (mon.state === 'search') {
        // SEARCH: va a la última posición conocida y, al llegar, la
        // escanea girando la mirada durante SEARCH_TIME. Si vuelve a
        // ver al jugador → CHASE; si la búsqueda expira → IDLE (lo
        // perdió de verdad: se limpia la memoria y el aggro).
        if (mon.seesPlayer) {
          toChase(mon, true);
        } else if (!mon.searchArrived) {
          const tx = mon.lastKnown ? mon.lastKnown.x : p.x;
          const tz = mon.lastKnown ? mon.lastKnown.z : p.z;
          faceX = tx; faceZ = tz;
          mon.walkPhase += dt * 7 * mon.animRate;
          moveEnemy(mon, dt, mon.speed, tx, tz);
          walkAnim(mon);
          const tdx = tx - p.x, tdz = tz - p.z;
          if (tdx * tdx + tdz * tdz < 0.64) { mon.searchArrived = true; mon.scanT = 0; mon.scanYaw = mon.g.rotation.y; }
        } else {
          mon.scanT += dt;
          const a = mon.scanYaw + Math.sin(mon.scanT * 2.2) * 0.95;
          faceX = p.x + Math.sin(a); faceZ = p.z + Math.cos(a);
          p.y = 0;
          mon.parts.armL.rotation.x = mon.armBase;
          mon.parts.armR.rotation.x = mon.armBase;
          if (mon.scanT >= SEARCH_TIME) toIdle(mon);
        }
      }
      mon.g.lookAt(faceX, 0, faceZ);
      if (flinchX) mon.g.rotation.x += flinchX;
    }

    // Separación local entre enemigos vivos: si dos están a menos de
    // 1.1 m, cada uno retrocede la mitad del solape sobre el eje que
    // los une (O(n²) con n ≤ 4: despreciable). Los DEAD no participan.
    for (let i = 0; i < monsters.length; i++) {
      const a = monsters[i];
      if (a.state === 'dead') continue;
      for (let j = i + 1; j < monsters.length; j++) {
        const b = monsters[j];
        if (b.state === 'dead') continue;
        const dx = b.g.position.x - a.g.position.x;
        const dz = b.g.position.z - a.g.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 >= SEPARATION_DIST * SEPARATION_DIST) continue;
        let ux = 1, uz = 0, d = 0;
        if (d2 > 1e-8) { d = Math.sqrt(d2); ux = dx / d; uz = dz / d; }
        const push = (SEPARATION_DIST - d) / 2;
        a.g.position.x -= ux * push; a.g.position.z -= uz * push;
        b.g.position.x += ux * push; b.g.position.z += uz * push;
        resolveCollisions(a.g.position, .5);
        resolveCollisions(b.g.position, .5);
      }
    }
  }

  // Partículas y trazadoras
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]; pt.life -= dt;
    pt.m.position.add(pt.vel.clone().multiplyScalar(dt)); pt.vel.y -= 5 * dt;
    if (pt.life <= 0) { scene.remove(pt.m); particles.splice(i, 1); }
  }
  for (let i = tracers.length - 1; i >= 0; i--) {
    tracers[i].life -= dt;
    if (tracers[i].life <= 0) { scene.remove(tracers[i].m); tracers[i].m.geometry.dispose(); tracers.splice(i, 1); }
  }

  renderer.render(scene, camera);
}
updateHUD();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
