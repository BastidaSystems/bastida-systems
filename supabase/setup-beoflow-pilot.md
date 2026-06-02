# Bastida Systems Portal: BEOFlow Production Pilot

This guide takes the current `portal.html` prototype into a real Supabase-backed pilot for BEOFlow.

## Architecture

- Parent business: Bastida Systems
- Pilot company: BEOFlow
- Platform admin: David Bastida
- Company owner: Rodrigo Ramirez
- Auth: Supabase Auth email/password
- Database: Supabase Postgres with Row Level Security
- Payments: manual transfer first, Stripe-ready later
- Frontend key policy: use only the Supabase URL and anon/publishable key in browser code

Do not put the `service_role` key in `portal.html`, GitHub Pages, browser JavaScript, or any client-side file.

## What The SQL Creates

Tables:

- `public.users`
- `public.companies`
- `public.company_users`
- `public.hour_packages`
- `public.work_logs`
- `public.payments`
- `public.receipts`
- `public.reports`

Private helper schema:

- `private.current_user_id()`
- `private.is_platform_admin()`
- `private.has_company_access(company_id)`

Dashboard functions:

- `public.total_hours_purchased(company_id)`
- `public.total_hours_used(company_id)`
- `public.remaining_hours(company_id)`

Dashboard views:

- `public.company_dashboard`
- `public.monthly_usage`
- `public.payment_summary`

Admin RPC functions:

- `public.admin_record_manual_payment(...)`
- `public.admin_register_work_log(...)`
- `public.admin_create_report(...)`

Triggers:

- Auto-create `public.users` profile after a new `auth.users` record is created.
- Auto-update `updated_at` on every table.

## Step 1: Create Supabase Project

1. Go to `https://supabase.com`.
2. Create a new project, for example `bastida-systems-portal`.
3. Save these values from Project Settings > API:
   - Project URL
   - anon / publishable key
4. Do not use the service role key in frontend code.

## Step 2: Configure Auth

1. Go to Authentication > Providers.
2. Make sure Email is enabled.
3. For the pilot, decide whether email confirmation is required:
   - Easier pilot: create users manually and auto-confirm them.
   - More formal flow: send invite emails and let users set passwords.
4. Add your production domain and local dev URL in Authentication > URL Configuration when ready.

## Step 3: Execute SQL

1. Open Supabase SQL Editor.
2. Paste and run:

   `supabase/bastida_portal_schema.sql`

3. Confirm that the SQL created:
   - tables
   - views
   - functions
   - RLS policies
   - BEOFlow company row

## Step 4: Create Auth Users

In Supabase Dashboard > Authentication > Users, create:

- David Bastida
  - Email example: `david@bastidasystems.com`
  - Temporary password: set manually or send invite

- Rodrigo Ramirez
  - Email example: `rodrigo@beoflow.com`
  - Temporary password: set manually or send invite

The `on_auth_user_created` trigger will automatically create matching rows in `public.users`.

## Step 5: Assign Roles

After both users exist, run this in SQL Editor. Change emails if needed:

```sql
update public.users
set full_name = 'David Bastida',
    platform_role = 'platform_admin',
    active = true
where email = 'david@bastidasystems.com';

update public.users
set full_name = 'Rodrigo Ramirez',
    platform_role = 'client_user',
    active = true
where email = 'rodrigo@beoflow.com';

insert into public.company_users (company_id, user_id, role, active)
select c.id, u.id, 'owner', true
from public.companies c
join public.users u on u.email = 'rodrigo@beoflow.com'
where c.slug = 'beoflow'
on conflict (company_id, user_id) do update
set role = 'owner',
    active = true,
    updated_at = now();
```

Expected result:

- David can view and manage all companies.
- Rodrigo can view only BEOFlow.
- Rodrigo cannot insert/update payments, hour packages, work logs, receipts, reports, or users.

## Step 6: Configure Auth URLs

In Supabase Dashboard > Authentication > URL Configuration:

Site URL:

```text
https://bastidasystems.com
```

Allowed Redirect URLs:

```text
https://bastidasystems.com/login.html
https://bastidasystems.com/portal.html
https://bastidasystems.com/set-password.html
https://bastidasystems.com/reset-password.html
```

For invitations, use this redirect:

```text
https://bastidasystems.com/set-password.html
```

If an older invitation points to a local URL, resend the invitation after saving these settings.

## Step 7: Connect frontend config

In `supabase-config.js`, replace the placeholder config:

```js
window.BASTIDA_SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_OR_PUBLISHABLE_KEY'
};
```

Then replace the current localStorage placeholder data flow with Supabase queries from:

`supabase/supabase-js-v2-examples.js`

Recommended production change:

- Use `supabase.auth.signInWithPassword()` for real login.
- Use `supabase.auth.updateUser({ password })` on `set-password.html` after an invitation session is detected.
- Load dashboard data from `company_dashboard`.
- Load details from `hour_packages`, `work_logs`, `payments`, `receipts`, `reports`.

## Step 8: Pilot Test With BEOFlow

Use this exact test flow:

1. David logs in.
2. David records a manual payment for BEOFlow:
   - hours: `2`
   - amount: `190`
   - method: `manual_transfer`
   - reference: transfer confirmation
3. David registers work:
   - title: `Homepage design polish`
   - hours: `1.25`
   - category: `Design`
4. Rodrigo logs in.
5. Rodrigo should see only:
   - BEOFlow
   - `2` hours purchased
   - `1.25` hours used
   - `0.75` hours remaining
   - payment history
   - work history
   - receipt/report metadata
6. Rodrigo should not be able to create payments or work logs. If he tries, Supabase should return an RLS/function permission error.

## Step 9: Realtime Updates

The SQL attempts to add these tables to the `supabase_realtime` publication:

- `hour_packages`
- `work_logs`
- `payments`
- `receipts`
- `reports`

If Realtime is not enabled in the dashboard, enable it for the tables you want to subscribe to. For this pilot, simple dashboard refresh after insert is enough; Realtime can be added after the core flow works.

## Production Notes

- Keep financial writes admin-only.
- Treat manual transfer reference numbers as sensitive enough to avoid showing unnecessary details to owners.
- Use Supabase Storage for actual PDF files later.
- Use Edge Functions only when you need server-side secrets, payment webhooks, or Stripe.
- Add Stripe later by storing `stripe_payment_intent_id` or `stripe_checkout_session_id` in `payments.reference_number`.
- Generate TypeScript types later with Supabase CLI if this moves beyond static HTML.

## Official References Used

- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase Auth/passwords: `https://supabase.com/docs/guides/auth/passwords`
- Supabase auth triggers pattern: `https://supabase.com/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A/`
- supabase-js install/CDN: `https://supabase.com/docs/reference/javascript/installing`
- Supabase Realtime Postgres changes: `https://supabase.com/docs/guides/realtime/postgres-changes`
