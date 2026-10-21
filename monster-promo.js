(() => {
  const init = () => {
    const dialog = document.getElementById('monster-promo');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    // Skip the promotion when storage is unavailable so it cannot nag on every visit.
    const sessionKey = 'bastida:monster-apocalypse:seen';
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    } catch (_) {
      return;
    }

    const previousFocus = document.activeElement;
    dialog.querySelector('[data-monster-promo-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      // The native backdrop targets the dialog; clicks on its content stay inside.
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('monster-promo-open');
      const target = previousFocus && previousFocus !== document.body && previousFocus.isConnected
        ? previousFocus
        : document.querySelector('.home-redesign-hero__actions a');
      if (target) target.focus({ preventScroll: true });
    });

    // Native dialog supplies focus containment, inert background and Escape dismissal.
    dialog.showModal();
    document.documentElement.classList.add('monster-promo-open');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
