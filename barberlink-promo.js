(() => {
  'use strict';
  const copy = {
    es: {
      title: 'BarberLink.',
      description: 'Únete antes del lanzamiento.',
      founderTitle: '★ Primeros 100 barberos', founderBenefit: 'Insignia azul y cuota de fundador: $9.99 USD/mes.',
      standardRate: '1 mes gratis. Tu cuota se conserva con Pro activo.',
      tapBenefit: 'Tap to Pay incluido al llegar la versión 2.',
      tapInfo: 'Sobre Tap to Pay',
      tapDetails: 'Los fundadores tendrán Tap to Pay incluido en su plan, sin cuota adicional de BarberLink, cuando llegue la versión 2. Requiere un iPhone compatible, un procesador aprobado y disponibilidad regional. Se aplican las comisiones del procesador de pagos.',
      appleGuide: 'Ver guía de Apple ↗',
      target: '30 de noviembre · Lanzamiento previsto',
      days: 'Días', hours: 'Horas', minutes: 'Min', seconds: 'Seg',
      barbers: 'barberos', community: 'en comunidad',
      barberCta: 'Soy barbero', communityCta: 'Unirme como cliente', visitCta: 'Visitar BarberLink',
      category: 'PRÓXIMAMENTE · BARBERLINK', detailsCta: 'Ver lanzamiento',
      close: 'Cerrar anuncio', timer: 'Tiempo hasta el lanzamiento previsto',
      reached: 'La cuenta regresiva terminó. Consulta las novedades de la app.',
      verified: 'Actualizado: {date}', unavailable: 'Cifras no disponibles por el momento.', statsNote: 'La comunidad incluye a los barberos.'
    },
    en: {
      title: 'BarberLink.',
      description: 'Join before launch.',
      founderTitle: '★ First 100 barbers', founderBenefit: 'Blue badge and founder rate: $9.99 USD/month.',
      standardRate: '1 month free. Keep your rate while Pro stays active.',
      tapBenefit: 'Tap to Pay included when version 2 arrives.',
      tapInfo: 'About Tap to Pay',
      tapDetails: 'Founders will have Tap to Pay included in their plan, with no additional BarberLink fee, when version 2 arrives. A compatible iPhone, an approved processor and regional availability are required. Payment processing fees apply.',
      appleGuide: 'View Apple’s guide ↗',
      target: 'November 30 · Target launch',
      days: 'Days', hours: 'Hours', minutes: 'Min', seconds: 'Sec',
      barbers: 'barbers', community: 'in the community',
      barberCta: 'I’m a barber', communityCta: 'Join as a client', visitCta: 'Visit BarberLink',
      category: 'COMING SOON · BARBERLINK', detailsCta: 'See the launch',
      close: 'Close announcement', timer: 'Time until the target launch',
      reached: 'The countdown has ended. Check the latest app updates.',
      verified: 'Updated: {date}', unavailable: 'Registration totals are temporarily unavailable.', statsNote: 'Community includes barbers.'
    }
  };
  // One fixed calendar-month target, shared by every visitor; never reset on reload.
  const launchAt = Date.parse('2026-11-30T10:00:00-08:00');
  let snapshot = null;
  // Publishable client key; grants no access to private user or billing records.
  const countsUrl = 'https://ihtabhmsmmllgtqakiah.supabase.co/rest/v1/rpc/mp_public_registration_counts';
  const publishableKey = 'sb_publishable_a-qS0uJ1PdAGQFX2VOQhgw_deKgfmNT';
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
        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
      }).format(new Date(snapshot ? snapshot.updatedAt : Date.now()));
      document.querySelectorAll('[data-launch-copy]').forEach(element => {
        const value = strings[element.dataset.launchCopy];
        if (value) element.textContent = element.dataset.launchCopy === 'verified' && !snapshot
          ? strings.unavailable : value.replace('{date}', date);
      });
      dialog.querySelector('[data-launch-close]').setAttribute('aria-label', strings.close);
      dialog.querySelector('[data-launch-timer]').setAttribute('aria-label', strings.timer);
      dialog.querySelector('[data-launch-barbers]').textContent = snapshot ? snapshot.barbers.toLocaleString(lang) : '—';
      dialog.querySelector('[data-launch-community]').textContent = snapshot ? snapshot.community.toLocaleString(lang) : '—';
      renderTimer();
    };
    let pendingCounts = false, lastAttempt = 0;
    async function refreshCounts() {
      if (pendingCounts || Date.now() - lastAttempt < 10000) return;
      pendingCounts = true;
      lastAttempt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(countsUrl, {
          method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
          body: '{}', cache: 'no-store', credentials: 'omit', signal: controller.signal
        });
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if (!Number.isSafeInteger(data.barbers) || data.barbers < 0 || !Number.isSafeInteger(data.community) ||
            data.community < data.barbers || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('Invalid totals');
        snapshot = { barbers: data.barbers, community: data.community, updatedAt: data.updatedAt };
        render();
      } catch (_) { /* Keep the last successful totals and their timestamp, or show unavailable. */ }
      finally { clearTimeout(timeout); pendingCounts = false; }
    }
    let previousFocus;
    const show = () => {
      if (typeof dialog.showModal !== 'function' || dialog.open) return;
      previousFocus = document.activeElement;
      render();
      dialog.showModal();
      refreshCounts();
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
    refreshCounts();
    setInterval(() => { if (dialog.open && !document.hidden) refreshCounts(); }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (dialog.open && !document.hidden) refreshCounts();
    });
    try {
      const seenKey = 'bastida:barberlink-launch:2026-11:seen';
      if (!sessionStorage.getItem(seenKey)) { sessionStorage.setItem(seenKey, '1'); show(); }
    } catch (_) { /* The card can always reopen the announcement without storage. */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
