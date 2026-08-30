(() => {
  const normalizePage = value => {
    const clean = String(value || '').split('#')[0].split('?')[0].replace(/\/+$/, '');
    const page = (clean.split('/').pop() || 'index.html').toLowerCase();
    return (!page || page === 'index' || page === 'index.html')
      ? 'index.html'
      : (page.endsWith('.html') ? page : `${page}.html`);
  };

  const solutionPages = new Set(['websites.html', 'systems.html', 'industries.html']);
  const workPages = new Set(['work.html']);

  const markup = `
    <header class="bs-header">
      <input class="bs-menu-toggle" type="checkbox" id="bs-mobile-menu-toggle" aria-hidden="true">
      <label class="bs-menu-button" for="bs-mobile-menu-toggle" role="button" tabindex="0" aria-label="Open navigation menu" aria-expanded="false" aria-controls="bs-primary-nav" data-menu-button data-i18n-aria-label="nav.openMenu">
        <span></span><span></span><span></span>
      </label>

      <a class="bs-brand" href="index.html" aria-label="Bastida Systems home">
        <span class="bs-brand-logo"><img src="img/logo_bastida_sys.png" alt="" aria-hidden="true"></span>
      </a>

      <nav class="bs-nav site-menu-links" id="bs-primary-nav" aria-label="Primary navigation">
        <a href="index.html" data-nav-page="index.html" data-i18n="nav.home">Home</a>
        <a href="index.html#solutions" data-nav-section="solutions" data-i18n="nav.solutions">Solutions</a>
        <a href="work.html" data-nav-page="work.html" data-i18n="nav.work">Work</a>
        <a href="index.html#process" data-i18n="nav.process">Process</a>
        <a href="about.html" data-nav-page="about.html" data-i18n="nav.about">About</a>
        <a class="bs-nav-cta" href="contact.html">
          <span data-i18n="nav.getStarted">Start a Project</span>
        </a>
      </nav>

      <label class="language-picker">
        <span data-i18n="nav.language">Language</span>
        <select id="language-select" aria-label="Language selector" data-i18n-aria-label="nav.languageSelector">
          <option value="en">EN</option><option value="es">ES</option>
        </select>
      </label>
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
      target.querySelector('[data-nav-section="solutions"]')?.setAttribute('aria-current', 'page');
    }
    if (workPages.has(current)) {
      target.querySelector('[data-nav-page="work.html"]')?.setAttribute('aria-current', 'page');
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
