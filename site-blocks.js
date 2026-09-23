/*
  ============================================================================
  Bastida Systems — optional config-driven blocks
  ============================================================================
  Renders discreet, on-brand blocks ONLY when their config value exists:

    <div data-block="booking"></div>         → "Schedule a consultation" button
    <div data-block="map"></div>             → lazy-loaded Google Maps iframe
    <div data-block="business-links"></div>  → Google Business / Reviews / Maps links

  Empty config = nothing rendered, no broken UI. All strings go through
  siteTranslate when available (EN/ES).
*/
(function () {
  'use strict';

  function t(key, fallback) {
    try {
      if (typeof window.siteTranslate === 'function') {
        var v = window.siteTranslate(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback;
  }

  function init() {
    var cfg = window.BASTIDA_SITE_CONFIG || {};

    /* ---- booking ---- */
    var bookingUrl = (cfg.bookingUrl || '').trim();
    document.querySelectorAll('[data-block="booking"]').forEach(function (slot) {
      if (!bookingUrl || slot.dataset.rendered) return;
      slot.dataset.rendered = '1';
      var a = document.createElement('a');
      a.className = 'button ghost';
      a.href = bookingUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('data-track', 'click_contact');
      a.textContent = t('contact.booking', 'Schedule a consultation');
      slot.appendChild(a);
    });

    /* ---- map (lazy) ---- */
    var mapsEmbed = (cfg.googleMapsEmbedUrl || '').trim();
    document.querySelectorAll('[data-block="map"]').forEach(function (slot) {
      if (!mapsEmbed || slot.dataset.rendered) return;
      slot.dataset.rendered = '1';
      var frame = document.createElement('iframe');
      frame.title = t('contact.mapTitle', 'Bastida Systems on Google Maps');
      frame.src = mapsEmbed;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.setAttribute('allowfullscreen', '');
      frame.style.border = '0';
      frame.style.width = '100%';
      frame.style.minHeight = '320px';
      frame.style.borderRadius = '12px';
      slot.appendChild(frame);
    });

    /* ---- business links ---- */
    var links = [
      { url: (cfg.googleBusinessUrl || '').trim(), label: t('contact.googleBusiness', 'Google Business') },
      { url: (cfg.googleReviewsUrl || '').trim(),  label: t('contact.googleReviews', 'Leave a review') },
      { url: (cfg.googleMapsUrl || '').trim(),     label: t('contact.googleMaps', 'Find us on Maps') }
    ].filter(function (l) { return l.url; });
    document.querySelectorAll('[data-block="business-links"]').forEach(function (slot) {
      if (!links.length || slot.dataset.rendered) return;
      slot.dataset.rendered = '1';
      var nav = document.createElement('nav');
      nav.className = 'business-links';
      nav.setAttribute('aria-label', t('contact.businessLinks', 'Google profiles'));
      links.forEach(function (l) {
        var a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'project-link';
        a.textContent = l.label;
        nav.appendChild(a);
      });
      slot.appendChild(nav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
