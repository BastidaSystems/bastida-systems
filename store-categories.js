/* Bastida Systems store: live catalog grouped by category.
   Reads products flagged "show in store" from Supabase and renders them
   under the same categories used in the inventory app.
   The category comes from the product's "category" column (synced from the
   app); a small slug map below is only a fallback for products with no
   category set. */
(function () {
  'use strict';

  // Same categories (and order) as the Bastida Stock app.
  var CATEGORIES = [
    { id: 1, es: 'Páginas web', en: 'Websites' },
    { id: 2, es: 'Crear un sistema', en: 'Custom systems' },
    { id: 6, es: 'Sistemas listos', en: 'Ready systems' },
    { id: 7, es: 'Sistemas en desarrollo', en: 'Systems in development' },
    { id: 3, es: 'Apps móviles', en: 'Mobile apps' },
    { id: 4, es: 'Impresión 3D', en: '3D printing' },
    { id: 5, es: 'Recomendados', en: 'Featured' }
  ];

  // Product slug -> category id, mirroring the app on 2026-09-23.
  // Product slug -> category id, used only when the product has no
  // category set in Supabase (the app syncs the category column).
  var SLUG_CATEGORY = {
    'sitio-web-completo': 1,
    'landing': 1,
    'pagina-express': 1,
    'sistema-a-medida': 2,
    'sistema-de-adquisiciones': 7,
    'filtracore': 7,
    'beoflow': 7,
    'lineops': 3,
    'app': 3,
    'treenest-desktop-organizer': 4
  };
  var FALLBACK_CATEGORY = 5; // Recomendados / Featured

  // Category name (as synced from the app) -> category id.
  var CATEGORY_ID_BY_NAME = {};
  CATEGORIES.forEach(function (cat) {
    CATEGORY_ID_BY_NAME[cat.es.toLowerCase()] = cat.id;
    CATEGORY_ID_BY_NAME[cat.en.toLowerCase()] = cat.id;
  });

  function categoryIdFor(p) {
    var name = p.category ? String(p.category).toLowerCase() : '';
    if (name && CATEGORY_ID_BY_NAME[name]) return CATEGORY_ID_BY_NAME[name];
    return SLUG_CATEGORY[p.slug] || FALLBACK_CATEGORY;
  }

  var WHATSAPP = 'https://wa.me/17026617149';

  function lang() {
    try {
      var stored = localStorage.getItem('site-language');
      if (stored === 'es' || stored === 'en') return stored;
    } catch (e) { /* ignore */ }
    return document.documentElement.lang === 'es' ? 'es' : 'en';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(value, currency) {
    var n = Number(value);
    if (!isFinite(n)) return '';
    var formatted = n.toLocaleString('en-US', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
    return '$' + formatted + ' ' + (currency || 'USD');
  }

  var cachedProducts = null;

  function categoryName(cat) {
    return lang() === 'es' ? cat.es : cat.en;
  }

  function cardHtml(p, catLabel) {
    var isExpress = p.slug === 'pagina-express';
    var cta, href;
    if (isExpress) {
      href = 'generador.html';
      cta = lang() === 'es' ? 'Comprar' : 'Buy now';
    } else {
      var msg = (lang() === 'es' ? 'Hola, me interesa ' : "Hi, I'm interested in ") + p.name;
      href = WHATSAPP + '?text=' + encodeURIComponent(msg);
      cta = lang() === 'es' ? 'Cotizar' : 'Get a quote';
    }
    var img = p.image_url
      ? '<img width="512" height="512" class="store-product-card__icon" src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">'
      : '';
    var desc = p.description
      ? '<p class="store-product-card__description">' + esc(p.description) + '</p>'
      : '';
    // NOTE: no "reveal" class here on purpose: dynamically added cards are
    // never observed by the scroll animation, so "reveal" would leave them
    // invisible while still taking up space.
    return '' +
      '<article class="store-product-card">' +
        '<div class="store-product-card__top">' + img +
          '<div class="store-product-card__identity">' +
            '<h2>' + esc(p.name) + '</h2>' +
            '<span class="store-product-card__category">' + esc(catLabel) + '</span>' +
          '</div>' +
        '</div>' + desc +
        '<div class="store-product-card__footer">' +
          '<strong class="store-product-card__price">' + esc(money(p.price, p.currency)) + '</strong>' +
          '<a class="store-product-card__button" href="' + esc(href) + '"' + (isExpress ? '' : ' target="_blank" rel="noopener"') + '>' + esc(cta) + '</a>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var section = document.getElementById('shop-by-category');
    var mount = document.getElementById('store-categories');
    if (!section || !mount || !cachedProducts) return;

    var groups = {};
    cachedProducts.forEach(function (p) {
      var catId = categoryIdFor(p);
      (groups[catId] = groups[catId] || []).push(p);
    });

    var html = '';
    CATEGORIES.forEach(function (cat) {
      var items = groups[cat.id];
      if (!items || !items.length) return; // never render an empty category
      var label = categoryName(cat);
      html += '<div class="store-category-block">' +
        '<h3 class="store-category-block__title">' + esc(label) + '</h3>' +
        '<div class="store-grid">' +
        items.map(function (p) { return cardHtml(p, label); }).join('') +
        '</div></div>';
    });

    if (!html) {
      section.hidden = true;
      return;
    }
    mount.innerHTML = html;
    section.hidden = false;
  }

  function init() {
    var cfg = window.BASTIDA_SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return;
    fetch(cfg.url + '/rest/v1/products?select=slug,name,description,price,currency,image_url,category&active=eq.true&show_in_store=eq.true&order=name', {
      headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then(function (rows) {
        cachedProducts = Array.isArray(rows) ? rows : [];
        render();
      })
      .catch(function () {
        // Keep the section hidden: no products, no blank space.
      });

    // Re-render in the new language when the visitor switches it.
    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'language-select') setTimeout(render, 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
