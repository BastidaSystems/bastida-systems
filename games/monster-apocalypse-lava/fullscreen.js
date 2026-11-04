// Fullscreen requests must run directly from the user's click, before awaiting assets.
export function createFullscreenControls({ onHelp = () => {}, onResize = () => {} } = {}) {
  const root = document.documentElement;
  const button = document.getElementById('btn-fullscreen');
  const help = document.getElementById('fullscreen-help');
  const close = document.getElementById('fullscreen-help-close');
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const nativeElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const standalone = () => !!navigator.standalone || matchMedia('(display-mode: standalone)').matches || (!nativeElement() && matchMedia('(display-mode: fullscreen)').matches);
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  const available = () => !!request && document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;
  let pending = false;
  function sync() {
    const active = !!nativeElement();
    button.classList.toggle('hidden', standalone());
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Pantalla completa');
    button.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
    button.textContent = active ? '⤢' : '⛶';
    onResize();
  }
  function showHelp() {
    onHelp();
    document.getElementById('fullscreen-help-text').textContent = ios
      ? 'En Safari, abre Compartir → Agregar a pantalla de inicio. Si aparece «Abrir como app web», actívalo. Después abre Monster Apocalypse desde ese icono para jugar sin las barras del navegador.'
      : 'Para jugar sin las barras del navegador, abre el menú del navegador y elige Instalar app o Agregar a pantalla de inicio. Después abre Monster Apocalypse desde ese icono.';
    help.classList.remove('hidden'); close.focus();
  }
  function lockLandscape() {
    try { const p = screen.orientation?.lock?.('landscape'); p?.catch(() => {}); } catch { /* Rotation remains manual when unsupported. */ }
  }
  async function enter(showInstructions = false) {
    if (nativeElement() || standalone()) { lockLandscape(); sync(); return true; }
    if (!available()) { if (showInstructions) showHelp(); return false; }
    if (pending) return false;
    pending = true;
    try {
      await request.call(root, { navigationUI: 'hide' });
      lockLandscape(); sync(); return true;
    } catch {
      if (showInstructions) showHelp(); return false;
    } finally { pending = false; }
  }
  async function toggle() {
    if (!nativeElement()) return enter(true);
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    try { await exit?.call(document); } catch { /* Keep the current view if exit is refused. */ }
    sync();
  }
  button.addEventListener('click', toggle);
  close.addEventListener('click', () => { help.classList.add('hidden'); button.focus(); });
  help.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close.click(); } });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  matchMedia('(display-mode: standalone)').addEventListener?.('change', sync);
  sync();
  return { enter, toggle, sync };
}
