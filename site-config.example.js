/*
  ============================================================================
  Bastida Systems — public site configuration
  ============================================================================
  This file holds ONLY public-by-design identifiers. Google Analytics 4
  measurement IDs and Tag Manager container IDs are visible in page source
  by nature; they are not secrets.

  HOW TO USE:
  1. Copy this file to `site-config.js` (same folder).
  2. Fill in the values you have. Leave the rest as empty strings.
  3. Every feature degrades gracefully when its value is empty: the site
     never renders broken buttons, empty maps, or dead links.

  NEVER put secrets here: no API secret keys, no OAuth client secrets,
  no reCAPTCHA secret keys, no Supabase service_role keys.
*/
window.BASTIDA_SITE_CONFIG = {
  /* Google Analytics 4 — Measurement ID, e.g. "G-XXXXXXXXXX".
     Used only when gtmId is empty (see below). */
  gaMeasurementId: '',

  /* Google Tag Manager — Container ID, e.g. "GTM-XXXXXXX".
     When set, Analytics/Events load THROUGH GTM only; the direct
     gtag.js snippet is skipped so events are never duplicated. */
  gtmId: '',

  /* Google Search Console — HTML-tag verification code (the `content`
     value only). If you verify via DNS instead (recommended), leave empty. */
  googleSiteVerification: '',

  /* Public Google profiles — shown in footer/contact only when set. */
  googleBusinessUrl: '',   // e.g. https://www.google.com/maps/search/?api=1&query=Bastida+Systems
  googleReviewsUrl: '',    // e.g. your "write a review" link from Business Profile
  googleMapsUrl: '',       // e.g. https://maps.google.com/?q=Bastida+Systems+Las+Vegas

  /* Google Maps embed for the Contact page. Paste the iframe `src` URL
     from Google Maps → Share → Embed a map. Lazy-loaded; the map block
     is hidden until this is set. */
  googleMapsEmbedUrl: '',

  /* Booking — Google Calendar Appointment Scheduling link
     (e.g. https://calendar.google.com/calendar/appointments/schedules/...).
     The "Schedule a consultation" button appears only when this is set. */
  bookingUrl: '',

  /* Contact form delivery.
     - Empty (default): the form opens the visitor's email app with a
       pre-filled message to contactEmail (works today, no backend needed).
     - Set to an HTTPS endpoint (your server, Apps Script, or a form
       service): the form POSTs JSON there instead. */
  contactFormEndpoint: '',

  /* Public contact channels (already shown on the site). */
  contactEmail: 'bastidasystems@gmail.com',
  contactPhone: '+17026617149',

  /* reCAPTCHA v3 site key — only used together with contactFormEndpoint.
     The secret key always stays server-side, never here. */
  recaptchaSiteKey: ''
};
