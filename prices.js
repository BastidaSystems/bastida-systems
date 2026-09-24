/* Bastida Systems — live prices from Supabase.
   Pages tag price elements with data-price-slug="..." and this file fills
   them with the current price from the `products` table.

   - window.BS_PRICES.load() -> Promise of {slug: product}
   - window.BS_PRICES.get(slug) -> product or null
   - window.BS_PRICES.money(price, currency) -> formatted string
   - window.BS_PRICES.apply() -> fills [data-price-slug] elements

   If Supabase is unreachable, hardcoded prices stay untouched (safe fallback).
   Re-applies automatically when the site language changes. */
(function () {
  'use strict';

  var cache = null;
  var pending = null;

  function siteLang() {
    try {
      return document.documentElement.lang === 'es' ? 'es' : 'en';
    } catch (e) { return 'en'; }
  }

  function money(price, currency) {
    var cur = currency || 'USD';
    try {
      return new Intl.NumberFormat(cur === 'MXN' ? 'es-MX' : 'en-US',
        { style: 'currency', currency: cur }).format(price);
    } catch (e) { return cur + ' ' + price; }
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (pending) return pending;
    pending = new Promise(function (resolve) {
      var done = function (map) { cache = map; resolve(map); };
      try {
        if (!window.supabase || !window.BASTIDA_SUPABASE_CONFIG) return done({});
        var client = window.supabase.createClient(
          window.BASTIDA_SUPABASE_CONFIG.url,
          window.BASTIDA_SUPABASE_CONFIG.anonKey
        );
        client.from('products')
          .select('slug,price,currency,active,stripe_link')
          .then(function (res) {
            var map = {};
            if (!res.error && res.data) {
              res.data.forEach(function (p) {
                if (p.slug && p.active !== false) map[p.slug] = p;
              });
            }
            done(map);
          }, function () { done({}); });
      } catch (e) { done({}); }
    });
    return pending;
  }

  function apply() {
    if (!cache) return;
    var lang = siteLang();
    document.querySelectorAll('[data-price-slug]').forEach(function (el) {
      var p = cache[el.getAttribute('data-price-slug')];
      if (!p || p.price === null || p.price === undefined) return; // keep fallback
      var prefix = '';
      if (el.hasAttribute('data-price-from')) {
        prefix = (lang === 'es' ? 'Desde ' : 'From ');
      }
      el.textContent = prefix + money(p.price, p.currency);
    });
  }

  function applyWhenReady() {
    load().then(apply);
  }

  // Re-apply when the site language changes (data-i18n rewrites text).
  try {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'lang') { apply(); break; }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {}

  window.BS_PRICES = {
    load: load,
    get: function (slug) { return (cache && cache[slug]) || null; },
    money: money,
    apply: apply,
    ready: applyWhenReady
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyWhenReady);
  } else {
    applyWhenReady();
  }
})();
