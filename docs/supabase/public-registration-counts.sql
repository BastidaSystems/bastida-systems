-- Public marketing totals only. No arguments, identifiers, user rows or billing data.
-- SECURITY DEFINER is intentional: auth.users must remain inaccessible to API roles.
create function public.mp_public_registration_counts()
returns jsonb
language sql
stable
security definer
set search_path = ''
set statement_timeout = '2s'
as $$
  with eligible as materialized (
    select u.id from auth.users u
    where u.deleted_at is null
      and not coalesce(u.is_anonymous, false)
      and (u.banned_until is null or u.banned_until <= now())
  )
  select pg_catalog.jsonb_build_object(
    'barbers', (select count(distinct b.owner_id)
      from public.mp_barbers b join eligible e on e.id = b.owner_id
      where not b.suspended),
    'community', (select count(*) from eligible),
    'updatedAt', now()
  );
$$;
revoke all on function public.mp_public_registration_counts() from public;
grant execute on function public.mp_public_registration_counts() to anon, authenticated, service_role;
comment on function public.mp_public_registration_counts() is
  'Public aggregate registration totals for the corporate launch window; each active non-anonymous account counted once, including barbers. Does not count paid subscriptions.';
