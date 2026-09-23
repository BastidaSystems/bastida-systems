/*
  ============================================================================
  Bastida Systems — Contact / quote form
  ============================================================================
  Progressive enhancement for #quote-form (contact.html).

  Behavior:
  - Real client-side validation (required fields, email format, min lengths).
  - Honeypot field + localStorage rate limiting (anti-spam, no CAPTCHA needed
    for the default flow).
  - UI states: idle → loading → success | error.
  - Delivery:
      * If BASTIDA_SITE_CONFIG.contactFormEndpoint is set: POSTs JSON
        {name,email,company,phone,service,projectType,budget,message,
         page,language} (+ recaptchaToken when recaptchaSiteKey is set).
      * Otherwise: opens the visitor's email app with a pre-filled message
        to contactEmail (works today, no backend required).
  - Analytics: form_started / form_submitted / form_success / form_error
    via window.bsTrack when analytics is enabled. No personal data is sent.

  The form is fully usable with JavaScript disabled: it degrades to a
  mailto: link rendered in <noscript>.
*/
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }

  function init() {
    var form = $('#quote-form');
    if (!form) return;

    var cfg = window.BASTIDA_SITE_CONFIG || {};
    var endpoint = (cfg.contactFormEndpoint || '').trim();
    var contactEmail = (cfg.contactEmail || 'bastidasystems@gmail.com').trim();
    var recaptchaKey = (cfg.recaptchaSiteKey || '').trim();

    var statusEl = $('#quote-form-status');
    var submitBtn = form.querySelector('[type="submit"]');
    var started = false;

    function t(key, fallback) {
      try {
        if (typeof window.siteTranslate === 'function') {
          var v = window.siteTranslate(key);
          if (v && v !== key) return v;
        }
      } catch (e) {}
      return fallback;
    }

    function setStatus(kind, msg) {
      if (!statusEl) return;
      statusEl.className = 'form-status form-status--' + kind;
      statusEl.textContent = msg;
      statusEl.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    }

    function setLoading(loading) {
      form.classList.toggle('is-submitting', loading);
      if (submitBtn) {
        submitBtn.disabled = loading;
        submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
      }
    }

    /* ---- analytics: form_started (once) ---- */
    form.addEventListener('input', function () {
      if (!started) {
        started = true;
        if (window.bsTrack) window.bsTrack('form_started', { form_id: 'quote-form' });
      }
    }, { passive: true });

    /* ---- validation ---- */
    function field(name) { return form.elements[name]; }

    function showError(input, message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      var err = form.querySelector('[data-error-for="' + input.name + '"]');
      if (err) { err.textContent = message; err.hidden = false; }
    }

    function clearError(input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      var err = form.querySelector('[data-error-for="' + input.name + '"]');
      if (err) { err.textContent = ''; err.hidden = true; }
    }

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validate() {
      var ok = true;
      var checks = [
        { el: field('name'),    test: function (v) { return v.trim().length >= 2; },
          msg: t('contact.form.errName', 'Please enter your name.') },
        { el: field('email'),   test: function (v) { return EMAIL_RE.test(v.trim()); },
          msg: t('contact.form.errEmail', 'Please enter a valid email address.') },
        { el: field('service'), test: function (v) { return !!v; },
          msg: t('contact.form.errService', 'Please choose a service.') },
        { el: field('message'), test: function (v) { return v.trim().length >= 20; },
          msg: t('contact.form.errMessage', 'Tell us a bit more (at least 20 characters).') }
      ];
      checks.forEach(function (c) {
        if (!c.el) return;
        clearError(c.el);
        if (!c.test(c.el.value || '')) { showError(c.el, c.msg); ok = false; }
      });
      var phone = field('phone');
      if (phone && phone.value.trim() && !/^[+()\-.\s\d]{7,20}$/.test(phone.value.trim())) {
        showError(phone, t('contact.form.errPhone', 'That phone number does not look valid.'));
        ok = false;
      }
      return ok;
    }

    form.addEventListener('input', function (ev) {
      if (ev.target && ev.target.name) clearError(ev.target);
    });

    /* ---- anti-spam: honeypot + rate limit ---- */
    function isSpam() {
      var hp = field('company_website');
      if (hp && hp.value) return true; // honeypot filled → bot
      try {
        var key = 'bs-quote-submits';
        var now = Date.now();
        var log = JSON.parse(window.localStorage.getItem(key) || '[]')
          .filter(function (ts) { return now - ts < 3600 * 1000; });
        if (log.length >= 3) return 'rate';
        log.push(now);
        window.localStorage.setItem(key, JSON.stringify(log));
      } catch (e) {}
      return false;
    }

    /* ---- delivery ---- */
    function collectData() {
      var data = {};
      ['name', 'email', 'company', 'phone', 'service', 'projectType', 'budget', 'message']
        .forEach(function (n) {
          var el = field(n);
          data[n] = el ? (el.value || '').trim() : '';
        });
      try {
        data.language = (typeof window.activeSiteLanguage === 'string' && window.activeSiteLanguage)
          || (document.documentElement.lang || 'en');
      } catch (e) { data.language = 'en'; }
      data.page = window.location.pathname;
      return data;
    }

    function mailtoFallback(data) {
      var subject = 'Project request — ' + (data.service || 'General') + ' — ' + data.name;
      var lines = [
        'Name: ' + data.name,
        'Email: ' + data.email,
        data.company ? 'Company: ' + data.company : null,
        data.phone ? 'Phone: ' + data.phone : null,
        'Service: ' + (data.service || '-'),
        data.projectType ? 'Project type: ' + data.projectType : null,
        data.budget ? 'Budget range: ' + data.budget : null,
        '',
        data.message
      ].filter(function (l) { return l !== null; });
      window.location.href = 'mailto:' + encodeURIComponent(contactEmail) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    }

    function loadRecaptcha() {
      return new Promise(function (resolve) {
        if (!recaptchaKey || window.grecaptcha) return resolve();
        var s = document.createElement('script');
        s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(recaptchaKey);
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { resolve(); }; // never block the form on captcha failure
        document.head.appendChild(s);
      });
    }

    function postEndpoint(data) {
      return loadRecaptcha().then(function () {
        function send(token) {
          if (token) data.recaptchaToken = token;
          return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(function (res) {
            if (!res.ok) throw new Error('bad-status-' + res.status);
            return res.json().catch(function () { return {}; });
          });
        }
        if (recaptchaKey && window.grecaptcha) {
          return new Promise(function (resolve, reject) {
            window.grecaptcha.ready(function () {
              window.grecaptcha.execute(recaptchaKey, { action: 'quote_request' })
                .then(function (token) { resolve(send(token)); }, function () { resolve(send(null)); });
            });
          });
        }
        return send(null);
      });
    }

    /* ---- submit ---- */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      setStatus('', '');
      if (window.bsTrack) window.bsTrack('form_submitted', { form_id: 'quote-form' });

      var spam = isSpam();
      if (spam === 'rate') {
        setStatus('error', t('contact.form.errRate', 'You have sent several requests recently. Please try again later.'));
        if (window.bsTrack) window.bsTrack('form_error', { form_id: 'quote-form', reason: 'rate_limited' });
        return;
      }
      if (spam) {
        // Honeypot: pretend success so bots learn nothing.
        onSuccess(true);
        return;
      }
      if (!validate()) {
        setStatus('error', t('contact.form.errFix', 'Please fix the highlighted fields and try again.'));
        if (window.bsTrack) window.bsTrack('form_error', { form_id: 'quote-form', reason: 'validation' });
        var firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = collectData();
      setLoading(true);
      setStatus('loading', t('contact.form.sending', 'Sending your request…'));

      function onSuccess(silent) {
        setLoading(false);
        setStatus('success', silent
          ? ''
          : t('contact.form.success', 'Request ready — your email app should open with everything pre-filled. We reply within one business day.'));
        if (!silent) form.reset();
        if (window.bsTrack) window.bsTrack('form_success', { form_id: 'quote-form', via: endpoint ? 'endpoint' : 'mailto' });
      }
      function onError(reason) {
        setLoading(false);
        setStatus('error', t('contact.form.errSend',
          'Something went wrong sending your request. You can also email us directly at ' + contactEmail + '.'));
        if (window.bsTrack) window.bsTrack('form_error', { form_id: 'quote-form', reason: reason || 'send_failed' });
      }

      if (endpoint) {
        postEndpoint(data).then(function () { onSuccess(false); }, function () { onError('endpoint'); });
      } else {
        try {
          mailtoFallback(data);
          onSuccess(false);
        } catch (e) { onError('mailto'); }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
