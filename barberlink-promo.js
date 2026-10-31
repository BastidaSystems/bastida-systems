(() => {
  'use strict';
  const copy = {
    es: {
      title: 'BarberLink.',
      description: 'Únete antes del lanzamiento.',
      target: '30 de noviembre · Lanzamiento previsto',
      days: 'Días', hours: 'Horas', minutes: 'Min', seconds: 'Seg',
      barbers: 'barberos', community: 'en comunidad',
      barberCta: 'Soy barbero', communityCta: 'Unirme como cliente',
      category: 'PRÓXIMAMENTE · BARBERLINK', detailsCta: 'Ver lanzamiento',
      close: 'Cerrar anuncio', timer: 'Tiempo hasta el lanzamiento previsto',
      reached: 'La cuenta regresiva terminó. Consulta las novedades de la app.',
      verified: 'Datos al {date}', statsNote: 'La comunidad incluye a los barberos.'
    },
    en: {
      title: 'BarberLink.',
      description: 'Join before launch.',
      target: 'November 30 · Target launch',
      days: 'Days', hours: 'Hours', minutes: 'Min', seconds: 'Sec',
      barbers: 'barbers', community: 'in the community',
      barberCta: 'I’m a barber', communityCta: 'Join as a client',
      category: 'COMING SOON · BARBERLINK', detailsCta: 'See the launch',
      close: 'Close announcement', timer: 'Time until the target launch',
      reached: 'The countdown has ended. Check the latest app updates.',
      verified: 'As of {date}', statsNote: 'Community includes barbers.'
    }
  };
  // One fixed calendar-month target, shared by every visitor; never reset on reload.
  const launchAt = Date.parse('2026-11-30T10:00:00-08:00');
  let snapshot = { barbers: 3, community: 5, updatedAt: '2026-10-31T16:57:51.726592Z' };
  const init = () => {
    const dialog = document.getElementById('barberlink-launch');
    if (!dialog) return;
    const language = () => document.documentElement.lang.startsWith('es') ? 'es' : 'en';
    const renderTimer = () => {
      let remaining = Math.max(0, Math.floor((launchAt - Date.now()) / 1000));
      const units = { days: Math.floor(remaining / 86400), hours: Math.floor(remaining % 86400 / 3600),
        minutes: Math.floor(remaining % 3600 / 60) };
      Object.entries(units).forEach(([unit, value]) => {
        dialog.querySelector(`[data-launch-${unit}]`).textContent = String(value).padStart(2, '0');
      });
      if (!remaining) dialog.querySelector('[data-launch-copy="target"]').textContent = copy[language()].reached;
    };
    const render = () => {
      const lang = language(), strings = copy[lang];
      const date = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Los_Angeles'
      }).format(new Date(snapshot.updatedAt));
      document.querySelectorAll('[data-launch-copy]').forEach(element => {
        const value = strings[element.dataset.launchCopy];
        if (value) element.textContent = value.replace('{date}', date);
      });
      dialog.querySelector('[data-launch-close]').setAttribute('aria-label', strings.close);
      dialog.querySelector('[data-launch-timer]').setAttribute('aria-label', strings.timer);
      dialog.querySelector('[data-launch-barbers]').textContent = snapshot.barbers.toLocaleString(lang);
      dialog.querySelector('[data-launch-community]').textContent = snapshot.community.toLocaleString(lang);
      renderTimer();
    };
    let previousFocus;
    const show = () => {
      if (typeof dialog.showModal !== 'function' || dialog.open) return;
      previousFocus = document.activeElement;
      render();
      dialog.showModal();
      document.documentElement.classList.add('bl-launch-open');
    };
    document.querySelectorAll('[data-launch-open]').forEach(link => link.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault(); show();
    }));
    dialog.querySelector('[data-launch-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('bl-launch-open');
      const target = previousFocus && previousFocus !== document.body && previousFocus.isConnected
        ? previousFocus : document.querySelector('[data-launch-open]');
      if (target) target.focus({ preventScroll: true });
    });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
    setInterval(() => { if (dialog.open && !document.hidden) renderTimer(); }, 1000);
    document.addEventListener('visibilitychange', renderTimer);
    // Only aggregate counts are public. This is a dated snapshot, not a live-registration claim.
    fetch('/barberlink-launch.json', { cache: 'no-cache', credentials: 'omit' })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
      .then(data => {
        if (!Number.isSafeInteger(data.barbers) || data.barbers < 0 || !Number.isSafeInteger(data.community) ||
            data.community < data.barbers || !Number.isFinite(Date.parse(data.updatedAt))) return;
        snapshot = { barbers: data.barbers, community: data.community, updatedAt: data.updatedAt };
        render();
      }).catch(() => { /* Retain the verified, dated snapshot already in the HTML. */ });
    try {
      const seenKey = 'bastida:barberlink-launch:2026-11:seen';
      if (!sessionStorage.getItem(seenKey)) { sessionStorage.setItem(seenKey, '1'); show(); }
    } catch (_) { /* The card can always reopen the announcement without storage. */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
