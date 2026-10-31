# BarberLink launch registration totals

The corporate popup calls `public.mp_public_registration_counts()` on the production BarberLink Supabase project. It refreshes on load, reopening, returning to a visible tab, and once a minute while the dialog is visible. Requests are deduplicated and throttled to one per ten seconds with an eight-second timeout.

- Community: distinct non-anonymous auth accounts that are neither deleted nor currently banned. Includes barbers.
- Barbers: distinct owners of non-suspended barber profiles with an eligible account.
- These are registration totals, not paid subscriptions or founder awards. Paying again does not increment either count.
- No invented fallback: before the first successful response an em dash is shown. After failures the last successful values and their timestamp remain visible.
- The old `barberlink-launch.json` is an archived snapshot and is no longer fetched by the popup.

The SQL in `docs/supabase/public-registration-counts.sql` was applied as migration `20261031201446_public_registration_counts`. This function intentionally exposes a fixed, parameterless aggregate. Its SECURITY DEFINER body has an empty search path, a two-second statement timeout, no dynamic SQL, no writes, and returns only `barbers`, `community`, `updatedAt`. API roles retain no SELECT on `auth.users`. The public executable-function advisor warning is intentional for this reviewed aggregate; private records and billing permissions are unchanged.

Verification: anonymous SQL role and unauthenticated REST with the publishable client key both returned 3 barbers and 7 community accounts on 2026-10-31. Browser preview confirmed the totals render from the cross-origin API. No accounts, subscriptions or payments were created to test the counter.
