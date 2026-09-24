/* Bastida Systems — single dynamic store catalog.
   Renders every active product from the Supabase `products` table into
   #home-store-grid. Anything changed in the inventory app (price, name,
   description, new product) shows up here automatically on reload. */
(function () {
  'use strict';

  var STRINGS = {
    en: {
      quote: 'Get a quote',
      buyNow: 'Buy now',
      customQuote: 'Custom quote',
      appStore: 'Download on the App Store',
      appsTitle: 'Also on the App Store',
      loadError: 'The store could not be loaded right now. Please try again later.'
    },
    es: {
      quote: 'Cotizar',
      buyNow: 'Comprar ahora',
      customQuote: 'Cotización personalizada',
      appStore: 'Descargar en el App Store',
      appsTitle: 'También en el App Store',
      loadError: 'No se pudo cargar la tienda. Intenta más tarde.'
    }
  };

  /* Curated display order; products not listed here append at the end. */
  var ORDER = [
    'pagina-express', 'landing', 'sitio-web-completo', 'sitio-estandar',
    'sitio-premium', 'app', 'sistema-basico', 'sistema-intermedio',
    'sistema-avanzado', 'sistema-a-medida', 'beoflow', 'lineops',
    'filtracore', 'sistema-de-adquisiciones', 'pieza-3d'
  ];

  /* Fallback artwork when a product has no image_url. */
  var ICONS = {
    'pagina-express': 'img/cat-websites.png',
    'landing': 'img/cat-websites.png',
    'sitio-web-completo': 'img/cat-websites.png',
    'sitio-estandar': 'img/cat-websites.png',
    'sitio-premium': 'img/cat-websites.png',
    'app': 'img/cat-apps.png',
    'sistema-basico': 'img/cat-systems.png',
    'sistema-intermedio': 'img/cat-systems.png',
    'sistema-avanzado': 'img/cat-systems.png',
    'sistema-a-medida': 'img/cat-systems.png',
    'sistema-de-adquisiciones': 'img/cat-systems.png',
    'beoflow': 'img/cat-apps.png',
    'lineops': 'img/lineops-devices.png',
    'filtracore': 'img/LOGO_FILTRACOREXCODE.png',
    'pieza-3d': 'img/cat-3d.png'
  };

  /* Products that also live on the App Store (secondary link). */
  var APP_STORE_LINKS = {
    lineops: 'https://apps.apple.com/us/app/lineops-shiftrotation/id6767958380',
    filtracore: 'https://apps.apple.com/us/app/filtracore/id6767891950'
  };

  /* Bastida Systems apps sold only through the App Store (not in the DB). */
  var APPS_ONLY = [
    {
      name: 'WatchTuner Pro',
      img: 'img/watchtuner-pro-icon.jpg',
      url: 'https://apps.apple.com/us/app/watchtuner-pro/id6801949693',
      desc: {
        en: 'Precision instrument tuner for musicians.',
        es: 'Afinador de precisión para músicos.'
      }
    },
    {
      name: 'StudioGamePlan',
      img: 'IMG/studiogameplan-sgp-icon.jpg',
      url: 'https://apps.apple.com/us/app/studiogameplan-sgp/id6773214058',
      desc: {
        en: 'A game production workspace for planning ideas, tasks, and creative development.',
        es: 'Espacio de producción de videojuegos para planear ideas, tareas y desarrollo creativo.'
      }
    }
  ];

  function lang() {
    try {
      var l = localStorage.getItem('site-language') ||
        (window.BASTIDA_I18N && window.BASTIDA_I18N.lang) || 'en';
      return l === 'es' ? 'es' : 'en';
    } catch (e) { return 'en'; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(price, currency) {
    var cur = currency || 'USD';
    try {
      return new Intl.NumberFormat(cur === 'MXN' ? 'es-MX' : 'en-US',
        { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(price);
    } catch (e) { return cur + ' ' + price; }
  }

  function ctaFor(p, L) {
    var S = STRINGS[L];
    if (p.slug === 'pagina-express') {
      return '<a data-track="click_product" class="store-product-card__button" href="generador.html">' +
        esc(S.buyNow) + '</a>';
    }
    if (p.stripe_link) {
      return '<a data-track="click_product" class="store-product-card__button" href="' +
        esc(p.stripe_link) + '" target="_blank" rel="noopener noreferrer">' + esc(S.buyNow) + '</a>';
    }
    return '<a data-track="click_product" class="store-product-card__button" href="cotizar.html?producto=' +
      esc(p.slug || '') + '">' + esc(S.quote) + '</a>';
  }

  function appStoreGhost(p, L) {
    var url = APP_STORE_LINKS[p.slug];
    if (!url) return '';
    return '<a class="store-product-card__button store-product-card__button--ghost" href="' +
      esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(STRINGS[L].appStore) + '</a>';
  }

  function card(p, L) {
    var S = STRINGS[L];
    var price = Number(p.price) > 0 ? money(p.price, p.currency) : S.customQuote;
    var visual;
    if (p.image_url) {
      visual = '<img class="store-product-card__photo" src="' + esc(p.image_url) + '" alt="' +
        esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600">';
    } else if (ICONS[p.slug]) {
      visual = '<img class="store-product-card__icon" src="' + esc(ICONS[p.slug]) + '" alt="' +
        esc(p.name) + '" loading="lazy" decoding="async" width="160" height="160">';
    } else {
      visual = '';
    }
    var top = p.image_url
      ? '<div class="store-product-card__top"><div class="store-product-card__identity">' +
        '<h2>' + esc(p.name) + '</h2>' +
        '<span class="store-product-card__price">' + esc(price) + '</span></div></div>'
      : '<div class="store-product-card__top">' + visual +
        '<div class="store-product-card__identity">' +
        '<h2>' + esc(p.name) + '</h2>' +
        '<span class="store-product-card__price">' + esc(price) + '</span></div></div>';
    return '<article class="store-product-card reveal is-visible" role="listitem">' +
      (p.image_url ? visual : '') + top +
      (p.description ? '<p class="store-product-card__description">' + esc(p.description) + '</p>' : '') +
      '<div class="store-product-card__actions">' + ctaFor(p, L) + appStoreGhost(p, L) + '</div>' +
      '</article>';
  }

  function appOnlyCard(a, L) {
    var S = STRINGS[L];
    return '<article class="store-product-card reveal is-visible" role="listitem">' +
      '<div class="store-product-card__top">' +
      '<img class="store-product-card__icon" src="' + esc(a.img) + '" alt="' + esc(a.name) +
      '" loading="lazy" decoding="async" width="160" height="160">' +
      '<div class="store-product-card__identity"><h2>' + esc(a.name) + '</h2></div></div>' +
      '<p class="store-product-card__description">' + esc(a.desc[L]) + '</p>' +
      '<div class="store-product-card__actions">' +
      '<a class="store-product-card__button" href="' + esc(a.url) +
      '" target="_blank" rel="noopener noreferrer">' + esc(S.appStore) + '</a></div></article>';
  }

  function sortProducts(rows) {
    var rank = {};
    ORDER.forEach(function (slug, i) { rank[slug] = i; });
    return rows.slice().sort(function (a, b) {
      var ra = rank[a.slug] == null ? 999 : rank[a.slug];
      var rb = rank[b.slug] == null ? 999 : rank[b.slug];
      if (ra !== rb) return ra - rb;
      return String(a.name).localeCompare(String(b.name));
    });
  }

  async function init() {
    var grid = document.getElementById('home-store-grid');
    if (!grid) return;
    if (!window.supabase || !window.BASTIDA_SUPABASE_CONFIG) return;
    var L = lang();
    try {
      var client = window.supabase.createClient(
        window.BASTIDA_SUPABASE_CONFIG.url,
        window.BASTIDA_SUPABASE_CONFIG.anonKey
      );
      var res = await client.from('products')
        .select('slug,name,description,price,currency,image_url,stripe_link')
        .eq('active', true)
        .order('created_at', { ascending: true });
      if (res.error || !res.data || !res.data.length) throw new Error('empty');
      var html = sortProducts(res.data).map(function (p) { return card(p, L); }).join('');
      html += '<div class="home-store-apps-break" role="presentation"><h3>' +
        esc(STRINGS[L].appsTitle) + '</h3></div>';
      html += APPS_ONLY.map(function (a) { return appOnlyCard(a, L); }).join('');
      grid.innerHTML = html;
      if (window.bsTrack) window.bsTrack('view_home_store', { count: res.data.length });
    } catch (e) {
      grid.innerHTML = '<p class="home-store-error">' + esc(STRINGS[L].loadError) + '</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
