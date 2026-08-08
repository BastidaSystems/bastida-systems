(() => {
  const normalizePage = value => {
    const clean = String(value || '').split('#')[0].split('?')[0].replace(/\/+$/, '');
    const page = (clean.split('/').pop() || 'index.html').toLowerCase();
    return (!page || page === 'index' || page === 'index.html')
      ? 'index.html'
      : (page.endsWith('.html') ? page : `${page}.html`);
  };

  const solutionPages = new Set(['websites.html', 'systems.html', 'industries.html']);
  const storePages = new Set(['filtracore.html', 'beoflow.html']);

  const markup = `
    <header class="bs-header">
      <a class="bs-brand" href="index.html" aria-label="Bastida Systems home">
        <span class="bs-brand-logo"><img src="img/logo_bastida_sys.png" alt="" aria-hidden="true"></span>
        <span class="bs-brand-text">
          <strong class="bs-brand-name">Bastida Systems</strong>
        </span>
      </a>

      <input class="bs-menu-toggle" type="checkbox" id="bs-mobile-menu-toggle" aria-hidden="true">
      <label class="bs-menu-button" for="bs-mobile-menu-toggle" role="button" tabindex="0" aria-label="Open navigation menu" aria-expanded="false" aria-controls="bs-primary-nav" data-menu-button data-i18n-aria-label="nav.openMenu">
        <span></span><span></span><span></span>
      </label>

      <nav class="bs-nav" id="bs-primary-nav" aria-label="Primary navigation">
        <a href="index.html" data-nav-page="index.html" data-i18n="nav.home">Home</a>

        <div class="bs-nav-group" data-nav-group="solutions">
          <button class="bs-nav-dropdown-toggle" type="button" aria-expanded="false" aria-controls="bs-solutions-menu">
            <span data-i18n="nav.solutions">Solutions</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
          </button>
          <div class="bs-nav-dropdown" id="bs-solutions-menu">
            <a href="websites.html" data-nav-page="websites.html">
              <strong data-i18n="nav.websites">Websites</strong>
              <small data-i18n="nav.websitesDescription">Premium digital experiences for real businesses.</small>
            </a>
            <a href="systems.html" data-nav-page="systems.html">
              <strong data-i18n="nav.systems">Systems</strong>
              <small data-i18n="nav.systemsDescription">Custom platforms, automation, and business technology.</small>
            </a>
            <a href="industries.html" data-nav-page="industries.html">
              <strong data-i18n="nav.industries">Industries</strong>
              <small data-i18n="nav.industriesDescription">Technology shaped around real operational needs.</small>
            </a>
          </div>
        </div>

        <div class="bs-nav-group" data-nav-group="store">
          <button class="bs-nav-dropdown-toggle" type="button" aria-expanded="false" aria-controls="bs-store-menu">
            <span data-i18n="nav.store">Products</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
          </button>
          <div class="bs-nav-dropdown bs-nav-dropdown--store" id="bs-store-menu">
            <a href="systems.html" data-nav-page="systems.html">
              <strong data-i18n="nav.allProducts">Products & Platforms</strong>
              <small data-i18n="nav.allProductsDescription">Explore Bastida Systems technology.</small>
            </a>
            <a href="filtracore.html" data-nav-page="filtracore.html"><strong>FiltraCore</strong><small data-i18n="nav.filtracoreDescription">Smart water monitoring hardware and software.</small></a>
            <a href="beoflow.html" data-nav-page="beoflow.html"><strong>BEOFlow</strong><small data-i18n="nav.beoflowDescription">Event and business workflow platform.</small></a>
          </div>
        </div>

        <a href="about.html" data-nav-page="about.html" data-i18n="nav.about">About</a>
        <a href="contact.html" data-nav-page="contact.html" data-i18n="nav.contact">Contact</a>
        <a class="bs-nav-cta" href="contact.html" data-i18n="nav.getStarted">Get Started</a>

        <label class="language-picker">
          <span data-i18n="nav.language">Language</span>
          <select id="language-select" aria-label="Language selector" data-i18n-aria-label="nav.languageSelector">
            <option value="en">EN</option><option value="es">ES</option>
          </select>
        </label>
      </nav>
    </header>`;

  const closeDropdowns = target => {
    target.querySelectorAll('.bs-nav-group.is-open').forEach(group => {
      group.classList.remove('is-open');
      group.querySelector('.bs-nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  };

  const bind = target => {
    const current = normalizePage(location.pathname);
    const mobileToggle = target.querySelector('#bs-mobile-menu-toggle');
    const mobileButton = target.querySelector('[data-menu-button]');

    const syncMobileMenuState = () => {
      if (!mobileToggle || !mobileButton) return;
      mobileButton.setAttribute('aria-expanded', String(mobileToggle.checked));
    };

    target.querySelectorAll('[data-nav-page]').forEach(link => {
      if (link.dataset.navPage === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (solutionPages.has(current)) {
      target.querySelector('[data-nav-group="solutions"]')?.classList.add('is-current');
      target.querySelector('[data-nav-group="solutions"] .bs-nav-dropdown-toggle')?.setAttribute('aria-current', 'page');
    }
    if (storePages.has(current)) {
      target.querySelector('[data-nav-group="store"]')?.classList.add('is-current');
      target.querySelector('[data-nav-group="store"] .bs-nav-dropdown-toggle')?.setAttribute('aria-current', 'page');
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('change', syncMobileMenuState);
    }

    if (mobileButton && mobileToggle) {
      mobileButton.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        mobileToggle.checked = !mobileToggle.checked;
        syncMobileMenuState();
      });
    }

    target.querySelectorAll('.bs-nav-dropdown-toggle').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const group = button.closest('.bs-nav-group');
        const open = !group.classList.contains('is-open');
        closeDropdowns(target);
        group.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
      });
    });

    target.querySelectorAll('.bs-nav a').forEach(link => {
      link.addEventListener('click', () => {
        closeDropdowns(target);
        if (mobileToggle) {
          mobileToggle.checked = false;
          syncMobileMenuState();
        }
      });
    });

    document.addEventListener('click', event => {
      if (!target.contains(event.target)) closeDropdowns(target);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeDropdowns(target);
        if (mobileToggle) {
          mobileToggle.checked = false;
          syncMobileMenuState();
        }
      }
    });

    syncMobileMenuState();
  };

  const mount = () => {
    const target = document.getElementById('site-header');
    if (!target) return;
    target.innerHTML = markup;
    bind(target);
    document.dispatchEvent(new CustomEvent('site-header-loaded', { detail: { target } }));
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', mount)
    : mount();
})();
