# Bastida Systems — Performance budget

Targets for bastidasystems.com (static site on GitHub Pages). Check quarterly
with PageSpeed Insights on mobile + desktop.

## Budgets

| Metric | Target |
|---|---|
| Largest Contentful Paint (mobile) | ≤ 2.5 s |
| Cumulative Layout Shift | ≤ 0.1 |
| Total Blocking Time (mobile) | ≤ 200 ms |
| Total page weight (homepage) | ≤ 1.5 MB |
| Largest single image (content) | ≤ 300 KB |
| Largest hero/background video | ≤ 7 MB |

## Rules that protect the budget

- Every `<img>` must carry `width` and `height` (prevents layout shift).
  68 images were sized in the 2026-09-23 pass.
- New images: prefer WebP/AVIF, compress before committing.
- New videos: keep under 7 MB; the three heaviest in-use videos
  (`main-printing-loop.mp4` 9.2 MB, `hero-printer-loop.mp4` 6.8 MB,
  `BG_BS.mp4` 5.5 MB) are candidates for re-encoding.
- No render-blocking third-party scripts on public pages. Analytics loads
  only when `site-config.js` has an ID, and never twice (GA4 *or* GTM).
- Tailwind Play CDN is still used by some pages — it is the heaviest
  render-blocking dependency on the site. Replacing it with compiled CSS
  is the single biggest possible performance win (see report §12).

## Monitoring

- Google Search Console → Core Web Vitals report (once the property is verified).
- GA4 (when configured) → page timings per route.
- Manual: PageSpeed Insights after any change that adds media or scripts.

## Known backlog (not fixed in this pass)

- `IMGS REALES/` (~800 MB) and duplicate images across `img/`, `IMG/`,
  `pdf startup/` are unreferenced weight in the repo. Do not delete without
  Rodrigo's approval — tracked as recommendation P0 in the final report.
