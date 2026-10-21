(() => {
  const init = () => {
    const carousel = document.querySelector('[data-home-updates]');
    if (!carousel) return;
    const slides = Array.from(carousel.querySelectorAll('[data-update-slide]'));
    const count = carousel.querySelector('[data-updates-count]');
    let index = 0;
    const move = direction => {
      const focusInSlide = slides[index].contains(document.activeElement);
      index = (index + direction + slides.length) % slides.length;
      slides.forEach((slide, position) => { slide.hidden = position !== index; });
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (focusInSlide) slides[index].querySelector('a').focus({ preventScroll: true });
    };
    carousel.querySelector('[data-updates-prev]').addEventListener('click', () => move(-1));
    carousel.querySelector('[data-updates-next]').addEventListener('click', () => move(1));
    carousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    let start = null;
    carousel.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) { start = null; return; }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    carousel.addEventListener('touchend', event => {
      if (!start) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
      start = null;
    }, { passive: true });
    carousel.addEventListener('touchcancel', () => { start = null; });
    carousel.querySelector('[data-updates-controls]').hidden = false;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
