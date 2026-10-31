(() => {
  'use strict';
  const init = () => {
    const gallery = document.querySelector('[data-launch-gallery]');
    const dialog = document.getElementById('barberlink-launch');
    if (!gallery || !dialog) return;
    const track = gallery.querySelector('[data-gallery-track]');
    const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));
    const dots = Array.from(gallery.querySelectorAll('[data-gallery-dot]'));
    const pause = gallery.querySelector('[data-gallery-pause]');
    const icon = gallery.querySelector('[data-gallery-pause-icon]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const labels = {
      es: { gallery: 'Capturas de BarberLink', carousel: 'carrusel', pause: 'Pausar galería', play: 'Reproducir galería', view: 'Ver captura',
        images: ['Inicio de BarberLink', 'Buscar u ofrecer servicios', 'Servicios de barbería', 'Detalle del corte', 'Elegir fecha y hora'] },
      en: { gallery: 'BarberLink screenshots', carousel: 'carousel', pause: 'Pause slideshow', play: 'Play slideshow', view: 'View screenshot',
        images: ['BarberLink welcome', 'Find or offer services', 'Barbering services', 'Haircut details', 'Choose a date and time'] }
    };
    let index = 0, paused = motion.matches, hovered = false, focused = false;
    const language = () => document.documentElement.lang.startsWith('es') ? 'es' : 'en';
    const render = () => {
      const text = labels[language()];
      gallery.setAttribute('aria-label', text.gallery);
      gallery.setAttribute('aria-roledescription', text.carousel);
      pause.setAttribute('aria-label', paused ? text.play : text.pause);
      pause.setAttribute('aria-pressed', String(paused));
      icon.textContent = paused ? '▶' : 'Ⅱ';
      dots.forEach((dot, i) => {
        dot.setAttribute('aria-current', String(i === index));
        dot.setAttribute('aria-label', `${text.view} ${i + 1}: ${text.images[i]}`);
      });
      gallery.querySelectorAll('[data-gallery-image]').forEach((image, i) => { image.alt = text.images[i]; });
      gallery.querySelectorAll('[data-gallery-image-link]').forEach((link, i) => {
        link.setAttribute('aria-label', `${text.view} ${i + 1}: ${text.images[i]}`);
      });
    };
    const show = (next, smooth = true) => {
      index = (next + slides.length) % slides.length;
      track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !motion.matches ? 'smooth' : 'instant' });
      render();
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    pause.addEventListener('click', () => { paused = !paused; focused = false; render(); });
    gallery.addEventListener('mouseenter', () => { hovered = true; });
    gallery.addEventListener('mouseleave', () => { hovered = false; });
    gallery.addEventListener('focusin', () => { focused = true; });
    gallery.addEventListener('focusout', event => { if (!gallery.contains(event.relatedTarget)) focused = false; });
    track.addEventListener('pointerdown', () => { paused = true; render(); }, { passive: true });
    track.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); paused = true;
      show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    track.addEventListener('scroll', () => {
      if (!track.clientWidth) return;
      const next = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (index !== next) { index = next; render(); }
    }, { passive: true });
    new ResizeObserver(() => show(index, false)).observe(track);
    motion.addEventListener('change', () => { if (motion.matches) paused = true; render(); });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    setInterval(() => {
      if (!paused && !hovered && !focused && dialog.open && !document.hidden) show(index + 1);
    }, 4000);
    render();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
