// Monster Apocalypse — Online Etapa 1 (cooperativo, 2 jugadores, mismo personaje).
// El anfitrión corre la partida completa (oleadas, monstruos, daño de lava) y
// transmite su estado; el invitado no genera oleadas propias: ve al anfitrión
// (Julián) y a sus monstruos como fantasmas sincronizados. Transporte: PeerJS
// (WebRTC, señalización en la nube pública de PeerJS). Sin servidor propio.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { createPlayablePlayer } from './player-characters.js?v=20261103-julian-only1';
import { GLTFLoader } from './asset-loader.js';

const $ = id => document.getElementById(id);
const statusEl = () => $('net-status');
function setStatus(text) { const el = statusEl(); if (el) el.textContent = text; const hud = $('net-hud'); if (hud) hud.textContent = text; }

const adapter = () => window.__maNetAdapter;
const SEND_MS = 1000 / 12; // 12 actualizaciones por segundo

let role = null;           // 'host' | 'guest'
let peer = null, conn = null;
let sendTimer = null;
let remotePlayer = null;   // createPlayablePlayer del otro jugador
let remoteReady = false;
let remoteTarget = null;   // último estado recibido del otro jugador
let remotePos = new THREE.Vector3(0, 1.7, 46);
let remotePrevPos = new THREE.Vector3(0, 1.7, 46);
let remoteVel = { x: 0, z: 0 };
let remoteDead = false;
let guestStarted = false;  // el invitado ya arrancó el nivel por señal del anfitrión

// ---------- Fantasmas (monstruos del anfitrión en la pantalla del invitado) ----------
let alienTemplate = null, alienLoadFailed = false;
const ghosts = new Map(); // id -> {root, mixer, actions, current, target:Vector3, hp, deadAt}

function loadAlienTemplate() {
  if (alienTemplate || alienLoadFailed) return;
  new GLTFLoader().load('alien1.glb', gltf => {
    const clips = {};
    for (const clip of gltf.animations) clips[clip.name] = clip;
    alienTemplate = { root: gltf.scene, clips };
  }, undefined, () => { alienLoadFailed = true; });
}

function setClip(ghost, name, once = false) {
  if (ghost.current === name || !ghost.actions[name]) return;
  for (const [n, a] of Object.entries(ghost.actions)) { if (n !== name) a.fadeOut(0.15); }
  const action = ghost.actions[name];
  action.reset().fadeIn(0.15).setEffectiveWeight(1);
  if (once) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
  else action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  ghost.current = name;
}

function spawnGhost(id, x, y, z) {
  const visual = cloneSkinned(alienTemplate.root);
  visual.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(visual);
  const actions = {};
  for (const name in alienTemplate.clips) { const a = mixer.clipAction(alienTemplate.clips[name]); a.enabled = true; actions[name] = a; }
  const root = new THREE.Group();
  root.add(visual);
  root.position.set(x, y, z);
  adapter().scene.add(root);
  const ghost = { root, visual, mixer, actions, current: '', target: new THREE.Vector3(x, y, z), hp: 1, deadAt: 0 };
  if (actions.idle) { actions.idle.play(); ghost.current = 'idle'; }
  ghosts.set(id, ghost);
  return ghost;
}

function updateGhosts(snapshot, dt) {
  if (!alienTemplate) { loadAlienTemplate(); return; }
  const seen = new Set();
  for (const m of snapshot.slice(0, 48)) {
    seen.add(m.id);
    let g = ghosts.get(m.id);
    if (!g) g = spawnGhost(m.id, m.x, m.y, m.z);
    g.target.set(m.x, m.y, m.z);
    g.hp = m.hp;
  }
  const now = performance.now();
  for (const [id, g] of ghosts) {
    if (!seen.has(id)) { adapter().scene.remove(g.root); g.mixer.stopAllAction(); ghosts.delete(id); continue; }
    const dist = g.root.position.distanceTo(g.target);
    const speed = dt > 0 ? dist / Math.max(dt, 0.001) : 0;
    g.root.position.lerp(g.target, Math.min(1, dt * 10));
    if (dist > 0.05) {
      const dir = g.target.clone().sub(g.root.position); dir.y = 0;
      if (dir.lengthSq() > 0.0001) g.root.rotation.y = Math.atan2(dir.x, dir.z);
    }
    if (g.hp <= 0) { if (!g.deadAt) { g.deadAt = now; setClip(g, 'death', true); } }
    else setClip(g, speed > 2.2 ? 'run' : speed > 0.35 ? 'crawl' : 'idle');
    if (g.deadAt && now - g.deadAt > 2600) { adapter().scene.remove(g.root); g.mixer.stopAllAction(); ghosts.delete(id); continue; }
    g.mixer.update(dt);
  }
}

// ---------- Jugador remoto ----------
async function ensureRemotePlayer() {
  if (remotePlayer) return;
  remotePlayer = createPlayablePlayer({
    scene: adapter().scene, camera: adapter().camera, blockers: [],
    moveCinematic: () => {}, moveReaction: () => ({ x: 0, z: 0 }), brace: () => {},
  });
  try { await remotePlayer.load(); remoteReady = true; } catch { remoteReady = false; }
}

function updateRemotePlayer(dt) {
  if (!remotePlayer || !remoteReady || !remoteTarget) return;
  remotePrevPos.copy(remotePos);
  remotePos.lerp(new THREE.Vector3(remoteTarget.p[0], remoteTarget.p[1], remoteTarget.p[2]), Math.min(1, dt * 10));
  if (dt > 0) { remoteVel.x = (remotePos.x - remotePrevPos.x) / dt; remoteVel.z = (remotePos.z - remotePrevPos.z) / dt; }
  const dead = remoteTarget.hp <= 0 || remoteTarget.mode === 'dead';
  if (dead && !remoteDead) { remoteDead = true; try { remotePlayer.die(); } catch {} }
  if (!dead && remoteDead) { remoteDead = false; try { remotePlayer.reset(); } catch {} }
  try {
    remotePlayer.update(dt, {
      position: remotePos, yaw: remoteTarget.yaw || 0, pitch: remoteTarget.pitch || 0,
      velocity: remoteVel, aim: 0, jump: 0, grounded: true, reloading: false,
      reloadProgress: 0, recoil: 0, mode: 'playing', intro: null, quake: null, dodge: null,
    });
  } catch {}
}

// ---------- Transporte (PeerJS) ----------
function loadPeerJS() {
  return new Promise((resolve, reject) => {
    if (window.Peer) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
    s.onload = resolve; s.onerror = () => reject(new Error('No se pudo cargar PeerJS'));
    document.head.appendChild(s);
  });
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

function send(obj) { if (conn && conn.open) { try { conn.send(obj); } catch {} } }

function startSendLoop() {
  stopSendLoop();
  sendTimer = setInterval(() => {
    const a = adapter(); if (!a) return;
    const s = a.localState();
    if (role === 'host') send({ t: 's', p: s, m: s.mode === 'playing' ? a.monsters() : [] });
    else send({ t: 'p', p: s });
  }, SEND_MS);
}
function stopSendLoop() { if (sendTimer) { clearInterval(sendTimer); sendTimer = null; } }

function wireConnection(c) {
  conn = c;
  conn.on('open', async () => {
    await ensureRemotePlayer();
    startSendLoop();
    if (role === 'host') setStatus('Invitado conectado. Pulsa JUGAR NIVEL 1 para empezar los dos.');
    else setStatus('Conectado a la sala. Esperando a que el anfitrión inicie el nivel…');
  });
  conn.on('data', data => {
    if (!data || typeof data !== 'object') return;
    if (role === 'guest' && data.t === 's') {
      remoteTarget = data.p;
      if (Array.isArray(data.m)) pendingGhosts = data.m;
      if (data.p && data.p.mode === 'playing' && !guestStarted) {
        guestStarted = true;
        setStatus('El anfitrión inició el nivel. Entrando…');
        document.dispatchEvent(new CustomEvent('ma:level-started'));
      }
    } else if (role === 'host' && data.t === 'p') {
      remoteTarget = data.p;
    }
  });
  conn.on('close', () => { setStatus('El otro jugador se desconectó.'); stopSendLoop(); if (role === 'guest') adapter()?.setGuest(false); });
  conn.on('error', () => setStatus('Error de conexión con el otro jugador.'));
}
let pendingGhosts = [];

// Puente de señalización: por defecto la nube pública de PeerJS. Solo para
// pruebas locales puede apuntarse a un puente propio con ?sala-local=1.
const PEER_OPTS = new URLSearchParams(location.search).has('sala-local')
  ? { host: '127.0.0.1', port: 9000, secure: false } : undefined;

async function hostRoom() {
  if (role) return;
  setStatus('Creando sala…');
  try { await loadPeerJS(); } catch { setStatus('Sin conexión a internet para el modo en línea.'); return; }
  const code = makeCode();
  role = 'host';
  peer = new window.Peer('ma-' + code.toLowerCase(), PEER_OPTS);
  peer.on('open', () => {
    $('net-code-display')?.classList.remove('hidden');
    const v = $('net-code-value'); if (v) v.textContent = code;
    setStatus('Sala creada. Esperando al invitado…');
    const hud = $('net-hud'); if (hud) hud.classList.remove('hidden');
  });
  peer.on('connection', c => { if (conn && conn.open) { c.close(); return; } wireConnection(c); });
  peer.on('error', err => {
    if (err.type === 'unavailable-id') { role = null; hostRoom(); return; }
    setStatus('Error al crear la sala (' + err.type + '). Revisa tu conexión.');
  });
}

async function joinRoom() {
  if (role) return;
  const code = ($('net-code-input')?.value || '').trim().toUpperCase();
  if (code.length !== 4) { setStatus('Escribe el código de 4 letras que te pasó el anfitrión.'); return; }
  setStatus('Buscando la sala…');
  try { await loadPeerJS(); } catch { setStatus('Sin conexión a internet para el modo en línea.'); return; }
  role = 'guest';
  adapter()?.setGuest(true);
  peer = new window.Peer(PEER_OPTS);
  peer.on('open', () => {
    const c = peer.connect('ma-' + code.toLowerCase(), { reliable: true });
    wireConnection(c);
    const hud = $('net-hud'); if (hud) hud.classList.remove('hidden');
  });
  peer.on('error', err => {
    if (err.type === 'peer-unavailable') setStatus('Sala no encontrada. Revisa el código y que el anfitrión tenga la sala abierta.');
    else setStatus('Error de conexión (' + err.type + ').');
  });
}

// ---------- Bucle de render de red ----------
let lastT = performance.now();
function netLoop(now) {
  requestAnimationFrame(netLoop);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (!conn || !conn.open) return;
  updateRemotePlayer(dt);
  if (role === 'guest' && pendingGhosts) updateGhosts(pendingGhosts, dt);
}
requestAnimationFrame(netLoop);

// ---------- UI ----------
$('net-host-btn')?.addEventListener('click', () => void hostRoom());
$('net-join-btn')?.addEventListener('click', () => void joinRoom());

// Diagnóstico (consola/pruebas): estado de la conexión y de la sincronización.
window.__maNetDebug = () => ({
  role, connected: !!(conn && conn.open), remoteReady,
  hasRemoteState: !!remoteTarget, ghosts: ghosts.size,
  guestMode: !!window.__maNetGuest, guestStarted,
});
