/*
  ============================================================================
  Bastida Systems — Analytics (GA4 direct OR Google Tag Manager, never both)
  ============================================================================
  Reads window.BASTIDA_SITE_CONFIG (site-config.js).

  Loading rules:
  - If gtmId is set: loads GTM only. GA4, conversions and events are then
    managed inside the GTM container. The direct gtag.js snippet is NOT
    loaded, so events are never duplicated.
  - Else if gaMeasurementId is set: loads gtag.js directly.
  - Else: analytics is a silent no-op. Nothing is loaded, nothing is sent.

  Public API:
    window.bsTrack(eventName, params)   — queue/send one event
  Auto-tracking (no code changes needed on buttons):
    any element with data-track="click_contact" (etc.) fires that event
    on click, with page_path + site language attached.

  Privacy: only event names, page paths and UI language are sent.
  Never send names, emails, phone numbers or message text to analytics.
*/
(function () {
  'use strict';

  var cfg = (window.BASTIDA_SITE_CONFIG || {});
  var gtmId = (cfg.gtmId || '').trim();
  var gaId = (cfg.gaMeasurementId || '').trim();

  function siteLanguage() {
    try {
      if (typeof window.activeSiteLanguage === 'string' && window.activeSiteLanguage) {
        return window.activeSiteLanguage;
      }
      var stored = window.localStorage && window.localStorage.getItem('site-language');
      if (stored) return stored;
      return (document.documentElement.lang || 'en').slice(0, 2);
    } catch (e) { return 'en'; }
  }

  function baseParams(extra) {
    var p = {
      page_path: window.location.pathname,
      page_title: document.title,
      site_language: siteLanguage()
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k) && p[k] === undefined) {
          p[k] = extra[k];
        }
      }
    }
    return p;
  }

  /* ---------------- transport ---------------- */

  window.dataLayer = window.dataLayer || [];

  function loadScript(src, attrs) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    if (attrs) {
      for (var k in attrs) s.setAttribute(k, attrs[k]);
    }
    var first = document.getElementsByTagName('script')[0];
    (first.parentNode || document.head).insertBefore(s, first);
  }

  var mode = 'off';
  if (gtmId && /^GTM-[A-Z0-9]+$/i.test(gtmId)) {
    mode = 'gtm';
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId));
  } else if (gaId && /^G-[A-Z0-9]+$/i.test(gaId)) {
    mode = 'ga4';
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId));
    window.dataLayer.push({ event: 'gtag_init' });
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      send_page_view: true,
      page_path: window.location.pathname
    });
  }
  // else: mode stays 'off' — no scripts, no beacons.

  /* ---------------- public API ---------------- */

  window.bsTrack = function (eventName, params) {
    if (!eventName || mode === 'off') return;
    try {
      if (mode === 'gtm') {
        var dl = baseParams(params);
        dl.event = eventName;
        window.dataLayer.push(dl);
      } else if (window.gtag) {
        window.gtag('event', eventName, baseParams(params));
      }
    } catch (e) { /* analytics must never break the site */ }
  };

  window.bsAnalyticsMode = mode;

  /* ---------------- auto-tracking ----------------
     Convention: <a data-track="click_contact" href="...">.
     Supported names (see docs/google-integrations.md):
     click_contact, click_email, click_phone, click_project, click_product,
     click_get_quote, click_github, click_linkedin */

  var CLICK_EVENTS = {
    click_contact: true, click_email: true, click_phone: true,
    click_project: true, click_product: true, click_get_quote: true,
    click_github: true, click_linkedin: true
  };

  function bindClickTracking() {
    if (mode === 'off') return;
    document.addEventListener('click', function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-track]') : null;
      if (!el) return;
      var name = el.getAttribute('data-track');
      if (!CLICK_EVENTS[name]) return;
      window.bsTrack(name, {
        link_url: el.getAttribute('href') || '',
        link_text: (el.textContent || '').trim().slice(0, 80)
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindClickTracking);
  } else {
    bindClickTracking();
  }
})();
