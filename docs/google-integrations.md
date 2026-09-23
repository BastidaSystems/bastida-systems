# Bastida Systems — Google integrations guide

How to connect bastidasystems.com to Google services, step by step. No secret
credentials live in this repo: public IDs go in `site-config.js` (copied from
`site-config.example.js`). Features whose value is empty stay disabled and the
site never shows broken buttons.

> Note: the site is **static** (plain HTML/CSS/JS on GitHub Pages, no build
> step). That is why configuration lives in `site-config.js` instead of
> `NEXT_PUBLIC_*` environment variables. If the site ever moves to a
> build-based host (Netlify, Vercel, Cloudflare Pages), the same values can be
> provided as env vars and injected into `site-config.js` at build time —
> see `.env.example` for the mapping.

---

## 1. Google Analytics 4

**What it gives you:** users, sessions, country/city (approximate), device,
desktop vs mobile, browser, most-visited pages, session duration, traffic
sources, and conversions.

**Setup:**
1. Go to [analytics.google.com](https://analytics.google.com) → Admin → Create Property.
2. Platform: **Web**. Website URL: `https://bastidasystems.com`. Name it "Bastida Systems".
3. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
4. In `site-config.js`, set `gaMeasurementId: 'G-XXXXXXXXXX'`.

**How it works in the code:** `analytics.js` loads `gtag.js` only when the ID
is present. If you also set `gtmId` (below), the direct `gtag.js` snippet is
**skipped** and everything runs through Tag Manager — events are never sent
twice.

The production Measurement ID is configured once in `site-config.js`;
`gtmId` remains empty. `.env.example` is documentation only, not runtime
configuration for this static site.

**Coverage and duplicate protection:** all 24 standalone HTML pages load
`site-config.js` followed by the shared `analytics.js`, including nested pages,
client apps, and login/portal pages. `header.html` is a fragment and must not
load analytics. `/privacy/` and `reset-password.html` are redirects: only their
destination pages load analytics, avoiding a second pageview for one visit.
The loader has a per-document initialization guard, reuses an existing
transport script, and registers click listeners only once. Normal navigation
loads a new document and sends its automatic `page_view` through `config`.
There is no additional manual `page_view` sender or custom History API listener.
If enhanced measurement is enabled in GA4, review its history-change settings
there; the site uses hash navigation for sections, not a client-side router.

**Verification before/after publishing:**
- There is no package manager, TypeScript, lint command, or production build.
  Files are served directly by GitHub Pages. Check JavaScript syntax with
  `node --check analytics.js` and `node --check site-config.js`.
- In the browser Network panel, verify one `gtag/js?id=...` request using the
  configured ID per document. `window.bsAnalyticsMode` must be `ga4`, and
  `window.dataLayer` must contain one `config` command with that ID.
- Navigate across root and nested pages, check the console, and confirm one
  initial `page_view` per document. Re-executing `analytics.js` must not add a
  script, configuration command, or click listener.
- Test an incoming URL with `utm_source`, `utm_medium`, and `utm_campaign`,
  plus an external referrer. Those campaign values and the referrer must be
  present in the outgoing pageview. Other query parameters and hashes are
  omitted from `page_location` / `page_referrer` to avoid sending auth codes.
- A working local tag is separate from a production deployment. After deploying,
  confirm the published configuration and use Tag Assistant and GA4
  Realtime/DebugView to verify actual ingestion; syntax checks or a network
  request alone do not establish that data is visible in the GA4 property.

**Local validation completed (2026-09-22):** syntax checks passed; standalone
ESLint recommended rules reported 0 errors and 0 warnings for `analytics.js`
and `site-config.js`. Chromium loaded the real Google library with HTTP 200
on all 24 documents and both redirect destinations, with one loader request,
one configuration command and one initial pageview per visit. Navigation from
Home to About, campaign/referrer preservation, auth-parameter filtering,
repeated loader execution and a single click listener passed. Collection
requests were intercepted locally so these checks did not send test events to
the property. No new JavaScript or console errors were found; an existing
missing-resource 404 on `RODRIGO WEB.html` was reproduced against the unchanged
baseline. HTML comparison confirmed that only script tags were added, with no
visual markup changes. Typecheck and production build are not applicable to
this repository. Deployment and GA4 Realtime/DebugView remain unverified.

References: [Google tag setup](https://developers.google.com/tag-platform/gtagjs)
and [automatic pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views).

**Events already wired** (via `data-track` attributes on buttons/links, plus
the contact form):
`click_contact, click_email, click_phone, click_project, click_product,
click_get_quote, click_github, click_linkedin, form_started, form_submitted,
form_success, form_error`.
In GA4 mark the ones you care about (e.g. `form_success`, `click_get_quote`)
as **conversions**: Admin → Events → toggle "Mark as conversion".

**Privacy review pending before publication:** the existing `privacy.html`
mentions browser storage and technical information but does not explicitly
describe GA4 or its analytics cookies. There is no consent banner, CMP, or
Consent Mode implementation. Review the notice and applicable consent needs
before publishing; this integration does not add a banner or change legal copy.
GA4 collects standard device, session, page and referral metadata and may set
analytics cookies. The direct integration filters page/referrer query parameters
to campaign identifiers and removes fragments. Do not put personal data into
campaign values, tracked link text/URLs, or custom event parameters. Review
enhanced measurement and data-redaction settings in the GA4 property as well.

---

## 2. Google Tag Manager

**What it gives you:** manage GA4, conversion tags, marketing pixels and
campaigns without touching code again.

**Setup:**
1. Go to [tagmanager.google.com](https://tagmanager.google.com) → Create Account.
   Container name: `bastidasystems.com`, target platform: **Web**.
2. Copy the **Container ID** (`GTM-XXXXXXX`).
3. In `site-config.js`, set `gtmId: 'GTM-XXXXXXX'`.
4. Inside GTM, add your GA4 Configuration tag with the Measurement ID from
   section 1. The site pushes all `bsTrack` events to `dataLayer`, so in GTM
   create triggers of type **Custom Event** with the event names listed above.

**No-duplicate rule:** when `gtmId` is set, `analytics.js` does NOT load
`gtag.js` directly. Use GA4 directly **or** GTM — never both IDs at once for
the same property, or you will double-count.

---

## 3. Google Search Console

**What it gives you:** how the site appears in Google Search, indexing status,
and which queries bring visitors.

**Setup (recommended — DNS):**
1. Go to [search.google.com/search-console](https://search.google.com/search-console) → Add property → **Domain** → enter `bastidasystems.com`.
2. Add the TXT record Google shows you at your domain's DNS provider.
3. Click Verify. Then submit `https://bastidasystems.com/sitemap.xml` under
   Sitemaps.

**Alternative (HTML tag):** choose the "URL prefix" property, copy the
`content` value, and set `googleSiteVerification` in `site-config.js` — the
site renders the `<meta name="google-site-verification">` tag automatically.
(If you use DNS verification, leave it empty.)

The repo already includes `robots.txt` and `sitemap.xml` at the domain root,
canonical URLs on every public page, and `noindex` on internal pages
(portal, admin, login, password pages, client apps).

---

## 4. Google Business Profile

**What it gives you:** the business listing on Google Search and Maps, reviews,
and local visibility in Las Vegas.

**Setup:**
1. Go to [business.google.com](https://business.google.com) → Add your business.
   Use the real business name, category, and service area. Do **not** publish
   a home address unless you have a commercial location.
2. After verification, open your profile → **Share** to copy:
   - the business profile link → `googleBusinessUrl`
   - "Ask for reviews" link → `googleReviewsUrl`
   - the Maps link → `googleMapsUrl`
3. Set the three values in `site-config.js`. The footer and Contact page show
   "Google Business / Reviews / Maps" links only when these are set — nothing
   appears while they are empty.

---

## 5. Google Maps (Contact page)

**Setup:**
1. On Google Maps, search your business → **Share → Embed a map** → copy the
   iframe `src` URL.
2. Set `googleMapsEmbedUrl` in `site-config.js`.

The map block on `contact.html` is **lazy-loaded** (the iframe only loads when
scrolled into view) and stays hidden until the URL is set, so it never hurts
Core Web Vitals or shows an empty frame. No API key is needed for the basic
embed. Never show a private/home address — only a commercial location once you
have one.

---

## 6. Google Calendar — "Schedule a consultation"

**Setup:**
1. In Google Calendar → ⚙ Settings → **Appointment schedules** → create one
   (e.g. "Free 30-min consultation"), set availability and buffers.
2. Copy the public booking link
   (`https://calendar.google.com/calendar/appointments/schedules/...`).
3. Set `bookingUrl` in `site-config.js`.

A discreet **"Schedule a consultation"** button appears on the Contact page
(and only there) when the URL is set. While empty, no button is rendered —
never a broken link.

---

## 7. Contact form → Gmail / Google Workspace

**Current state:** `contact.html` has a real form (name, email, company,
phone optional, service, project type, budget optional, message) with
validation, loading/success/error states, a honeypot field and rate limiting.
With no backend configured, submitting opens the visitor's email app with a
pre-filled message to `bastidasystems@gmail.com` — this works today.

**To receive submissions directly in Gmail/Workspace (recommended, free):**
1. Create a Google Apps Script bound to a Google Sheet (or use the Gmail API):
   - The script exposes a Web App URL (`doPost`) that reads the JSON fields
     (`name, email, company, phone, service, projectType, budget, message,
     language, page`), appends a row to the sheet, and/or forwards an email
     to `bastidasystems@gmail.com`.
   - Deploy as **Web app** → execute as "Me", access "Anyone".
2. Set `contactFormEndpoint` in `site-config.js` to that Web App URL (HTTPS).
3. The form will POST JSON there instead of using the mailto fallback.

**Security rules already enforced:** no passwords, no OAuth secrets, no
private API keys in the frontend — the endpoint URL is the only value, and it
is public by design. Validate and sanitize everything again server-side.

---

## 8. reCAPTCHA (spam protection)

The default form flow (mailto fallback) does not need CAPTCHA: honeypot +
rate limiting already filter basic bots.

**If you enable `contactFormEndpoint` and spam becomes a problem:**
1. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) →
   create a **v3** key for `bastidasystems.com`.
2. Put the **site key** in `site-config.js` as `recaptchaSiteKey`.
3. Keep the **secret key** on your server (Apps Script Properties / server
   env) and verify the `recaptchaToken` the form sends with each submission.

reCAPTCHA v3 is invisible — no checkbox, no friction. The secret key must
never be committed to this repo.

---

## 9. Google Drive (future file uploads)

**Status:** architecture prepared, not enabled. The contact form does not
accept files today, and nothing in the repo has access to the company's
Drive — that is intentional.

**When you want clients to send briefs/PDFs/images:**
1. Do NOT make any Drive folder public and do NOT embed service-account keys
   in the frontend.
2. The safe pattern is: form → your backend/Apps Script endpoint (section 7)
   → the server uploads to Drive with a service account (server-side only)
   and returns a file ID.
3. Only then add a file input to the form (UI hook point is documented in
   `contact-form.js`); the server must enforce type/size limits and virus
   scanning policy.

---

## 10. Google Login ("Continue with Google")

**Status:** not added, by design. The site already has a client portal
(`login.html` → `portal.html`, powered by Supabase Auth with email/password).

**When a client portal / dashboard justifies it:**
1. In [Google Cloud Console](https://console.cloud.google.com) create OAuth
   credentials (Web application) for `https://bastidasystems.com`.
2. Add the **Client ID** (public) to the frontend config; the **client
   secret** stays server-side.
3. Supabase Auth supports "Sign in with Google" natively — enabling it in
   the Supabase dashboard is the cleanest path (no custom OAuth code), and
   the existing `supabase-config.js` pattern already fits.

Do not add a Login button to the public homepage until the portal exists as a
real product surface.

---

## 11. Variable reference

| Variable (site-config.js) | Service | Public? |
|---|---|---|
| `gaMeasurementId` | Analytics 4 | Yes (page source) |
| `gtmId` | Tag Manager | Yes (page source) |
| `googleSiteVerification` | Search Console | Yes (meta tag) |
| `googleBusinessUrl` / `googleReviewsUrl` / `googleMapsUrl` | Business Profile | Yes (links) |
| `googleMapsEmbedUrl` | Maps embed | Yes (iframe) |
| `bookingUrl` | Calendar appointments | Yes (link) |
| `contactFormEndpoint` | Form delivery | Yes (URL only) |
| `contactEmail` / `contactPhone` | Contact channels | Yes (displayed) |
| `recaptchaSiteKey` | reCAPTCHA v3 | Yes (site key) |

`.env.example` in the repo root maps each of these to its future
`NEXT_PUBLIC_*` / server env var name for a build-based host.
