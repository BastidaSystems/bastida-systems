/* Bastida Systems — physical products on store.html.
   Reads active rows from the Supabase `products` table and renders them with
   the site's own store card styles. If Supabase is unreachable or there are
   no active products, the section stays hidden and the static catalog is
   untouched. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(price, currency) {
    var cur = currency || 'USD';
    try {
      return new Intl.NumberFormat(cur === 'MXN' ? 'es-MX' : 'en-US',
        { style: 'currency', currency: cur }).format(price);
    } catch (e) { return cur + ' ' + price; }
  }

  function t(key, fallback) {
    var lang = 'en';
    try {
      lang = localStorage.getItem('site-language') ||
        (window.BASTIDA_I18N && window.BASTIDA_I18N.lang) || 'en';
    } catch (e) {}
    var dict = window.pageTranslations && window.pageTranslations[lang];
    return (dict && dict[key]) || fallback;
  }

  function card(p) {
    var buyLabel = t('store.buyNow', 'Buy Now');
    var buy = p.stripe_link
      ? '<a data-track="click_product" class="store-product-card__button" href="' +
        esc(p.stripe_link) + '" target="_blank" rel="noopener noreferrer">' + esc(buyLabel) + '</a>'
      : '';
    return '<article class="store-product-card reveal">' +
      (p.image_url ? '<img class="store-product-card__photo" src="' + esc(p.image_url) + '" alt="' +
        esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600">' : '') +
      '<div class="store-product-card__top">' +
        '<div class="store-product-card__identity">' +
          '<h2>' + esc(p.name) + '</h2>' +
          '<span class="store-product-card__price">' + esc(money(p.price, p.currency)) + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="store-product-card__description">' + esc(p.description) + '</p>' +
      (buy ? '<div class="store-product-card__actions">' + buy + '</div>' : '') +
      '</article>';
  }

  async function init() {
    var section = document.getElementById('physical-products');
    var grid = document.getElementById('physical-products-grid');
    if (!section || !grid) return;
    if (!window.supabase || !window.BASTIDA_SUPABASE_CONFIG) return;
    try {
      var client = window.supabase.createClient(
        window.BASTIDA_SUPABASE_CONFIG.url,
        window.BASTIDA_SUPABASE_CONFIG.anonKey
      );
      var res = await client.from('products')
        .select('name,description,price,currency,image_url,stripe_link')
        .eq('active', true)
        .eq('show_in_store', true)
        .order('created_at', { ascending: false });
      if (res.error || !res.data || !res.data.length) return;
      grid.innerHTML = res.data.map(card).join('');
      section.hidden = false;
      if (window.bsTrack) window.bsTrack('view_physical_products', { count: res.data.length });
    } catch (e) { /* section stays hidden */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
