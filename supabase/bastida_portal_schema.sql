-- Bastida Systems Client Portal / BEOFlow pilot
-- Production-ready Supabase schema for a multi-tenant hours, payments, work-log, and reports portal.
-- Run this in Supabase SQL Editor as the project owner/postgres role.
-- Never expose the service_role key in portal.html or any browser code.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_role') then
    create type public.platform_role as enum ('platform_admin', 'client_user');
  end if;

  if not exists (select 1 from pg_type where typname = 'company_status') then
    create type public.company_status as enum ('active', 'prospect', 'paused', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'company_member_role') then
    create type public.company_member_role as enum ('owner', 'collaborator', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'hour_package_status') then
    create type public.hour_package_status as enum ('pending', 'active', 'exhausted', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('manual_transfer', 'zelle', 'cash', 'check', 'stripe_card', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'void');
  end if;

  if not exists (select 1 from pg_type where typname = 'work_log_status') then
    create type public.work_log_status as enum ('draft', 'in_progress', 'completed', 'approved', 'void');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_type') then
    create type public.report_type as enum ('monthly', 'project', 'hour_usage', 'work_completed', 'custom');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('draft', 'published', 'archived');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  platform_role public.platform_role not null default 'client_user',
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  legal_name text,
  status public.company_status not null default 'active',
  website_url text,
  logo_url text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.company_member_role not null default 'owner',
  active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.hour_packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  hours_purchased numeric(10, 2) not null check (hours_purchased > 0),
  amount_usd numeric(12, 2) not null check (amount_usd >= 0),
  status public.hour_package_status not null default 'pending',
  purchased_at timestamptz not null default now(),
  activated_at timestamptz,
  purchased_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  hour_package_id uuid references public.hour_packages(id) on delete set null,
  amount_usd numeric(12, 2) not null check (amount_usd >= 0),
  currency text not null default 'USD',
  method public.payment_method not null default 'manual_transfer',
  status public.payment_status not null default 'pending',
  reference_number text,
  paid_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  work_date date not null default current_date,
  hours_used numeric(10, 2) not null check (hours_used > 0),
  is_billable boolean not null default true,
  category text,
  status public.work_log_status not null default 'completed',
  worker_user_id uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  attachment_urls text[] not null default '{}'::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  receipt_number text not null unique,
  amount_usd numeric(12, 2) not null check (amount_usd >= 0),
  storage_path text,
  issued_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_type public.report_type not null default 'monthly',
  report_month date,
  title text not null,
  summary text,
  storage_path text,
  status public.report_status not null default 'published',
  generated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Portal profiles linked one-to-one to Supabase Auth users.';
comment on table public.company_users is 'Tenant permission bridge between portal users and company dashboards.';
comment on table public.hour_packages is 'Purchased blocks of Bastida Systems work hours scoped to one company.';
comment on table public.work_logs is 'Billable or non-billable work history entries scoped to one company.';
comment on table public.payments is 'Payment ledger. Manual transfer first, Stripe-ready later.';
comment on table public.receipts is 'Receipt metadata and optional Supabase Storage paths.';
comment on table public.reports is 'Monthly, project, hour usage, and work completed reports scoped to one company.';

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_platform_role on public.users(platform_role);
create index if not exists idx_companies_slug on public.companies(slug);
create index if not exists idx_company_users_user_active on public.company_users(user_id, active);
create index if not exists idx_company_users_company_active on public.company_users(company_id, active);
create index if not exists idx_hour_packages_company_status on public.hour_packages(company_id, status);
create index if not exists idx_payments_company_status_paid_at on public.payments(company_id, status, paid_at desc);
create index if not exists idx_work_logs_company_work_date on public.work_logs(company_id, work_date desc);
create index if not exists idx_receipts_company_issued_at on public.receipts(company_id, issued_at desc);
create index if not exists idx_reports_company_month on public.reports(company_id, report_month desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_company_users_updated_at on public.company_users;
create trigger set_company_users_updated_at
before update on public.company_users
for each row execute function public.set_updated_at();

drop trigger if exists set_hour_packages_updated_at on public.hour_packages;
create trigger set_hour_packages_updated_at
before update on public.hour_packages
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_work_logs_updated_at on public.work_logs;
create trigger set_work_logs_updated_at
before update on public.work_logs
for each row execute function public.set_updated_at();

drop trigger if exists set_receipts_updated_at on public.receipts;
create trigger set_receipts_updated_at
before update on public.receipts
for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (auth_user_id, email, full_name)
  values (
    new.id,
    lower(new.email)::citext,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = (select auth.uid())
    and u.active = true
  limit 1;
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.platform_role = 'platform_admin'
      and u.active = true
  );
$$;

create or replace function private.has_company_access(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_platform_admin()
    or exists (
      select 1
      from public.company_users cu
      join public.users u on u.id = cu.user_id
      where cu.company_id = p_company_id
        and cu.active = true
        and u.active = true
        and u.auth_user_id = (select auth.uid())
    );
$$;

create or replace function public.total_hours_purchased(p_company_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(hp.hours_purchased), 0)::numeric
  from public.hour_packages hp
  where hp.company_id = p_company_id
    and hp.status in ('active', 'exhausted');
$$;

create or replace function public.total_hours_used(p_company_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(wl.hours_used), 0)::numeric
  from public.work_logs wl
  where wl.company_id = p_company_id
    and wl.is_billable = true
    and wl.status <> 'void';
$$;

create or replace function public.remaining_hours(p_company_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select greatest(public.total_hours_purchased(p_company_id) - public.total_hours_used(p_company_id), 0)::numeric;
$$;

create or replace function public.admin_record_manual_payment(
  p_company_id uuid,
  p_hours numeric,
  p_amount_usd numeric,
  p_payment_method public.payment_method default 'manual_transfer',
  p_payment_reference text default null,
  p_notes text default null,
  p_paid_at timestamptz default now()
)
returns table(hour_package_id uuid, payment_id uuid, receipt_id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_company_slug text;
  v_hour_package_id uuid;
  v_payment_id uuid;
  v_receipt_id uuid;
  v_receipt_number text;
begin
  if not private.is_platform_admin() then
    raise exception 'Only platform_admin can record payments.';
  end if;

  if p_hours <= 0 then
    raise exception 'p_hours must be greater than zero.';
  end if;

  if p_amount_usd < 0 then
    raise exception 'p_amount_usd cannot be negative.';
  end if;

  select private.current_user_id() into v_actor_id;
  select c.slug into v_company_slug
  from public.companies c
  where c.id = p_company_id;

  if v_company_slug is null then
    raise exception 'Company not found.';
  end if;

  insert into public.hour_packages (
    company_id,
    hours_purchased,
    amount_usd,
    status,
    purchased_at,
    activated_at,
    purchased_by,
    created_by,
    notes
  )
  values (
    p_company_id,
    p_hours,
    p_amount_usd,
    'active',
    coalesce(p_paid_at, now()),
    coalesce(p_paid_at, now()),
    v_actor_id,
    v_actor_id,
    p_notes
  )
  returning id into v_hour_package_id;

  insert into public.payments (
    company_id,
    hour_package_id,
    amount_usd,
    method,
    status,
    reference_number,
    paid_at,
    created_by,
    notes
  )
  values (
    p_company_id,
    v_hour_package_id,
    p_amount_usd,
    p_payment_method,
    'paid',
    p_payment_reference,
    coalesce(p_paid_at, now()),
    v_actor_id,
    p_notes
  )
  returning id into v_payment_id;

  v_receipt_number :=
    'BS-' ||
    upper(left(regexp_replace(v_company_slug, '[^a-zA-Z0-9]', '', 'g'), 8)) ||
    '-' ||
    to_char(coalesce(p_paid_at, now()), 'YYYYMMDD') ||
    '-' ||
    upper(left(v_payment_id::text, 8));

  insert into public.receipts (
    company_id,
    payment_id,
    receipt_number,
    amount_usd,
    issued_at,
    created_by
  )
  values (
    p_company_id,
    v_payment_id,
    v_receipt_number,
    p_amount_usd,
    coalesce(p_paid_at, now()),
    v_actor_id
  )
  returning id into v_receipt_id;

  return query select v_hour_package_id, v_payment_id, v_receipt_id;
end;
$$;

create or replace function public.admin_register_work_log(
  p_company_id uuid,
  p_title text,
  p_description text,
  p_hours numeric,
  p_work_date date default current_date,
  p_category text default 'Design',
  p_notes text default null,
  p_status public.work_log_status default 'completed'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_work_log_id uuid;
begin
  if not private.is_platform_admin() then
    raise exception 'Only platform_admin can register work logs.';
  end if;

  if p_hours <= 0 then
    raise exception 'p_hours must be greater than zero.';
  end if;

  select private.current_user_id() into v_actor_id;

  if not exists (select 1 from public.companies c where c.id = p_company_id) then
    raise exception 'Company not found.';
  end if;

  insert into public.work_logs (
    company_id,
    title,
    description,
    work_date,
    hours_used,
    category,
    status,
    worker_user_id,
    created_by,
    notes
  )
  values (
    p_company_id,
    p_title,
    p_description,
    coalesce(p_work_date, current_date),
    p_hours,
    p_category,
    p_status,
    v_actor_id,
    v_actor_id,
    p_notes
  )
  returning id into v_work_log_id;

  return v_work_log_id;
end;
$$;

create or replace function public.admin_create_report(
  p_company_id uuid,
  p_report_type public.report_type,
  p_title text,
  p_summary text default null,
  p_report_month date default null,
  p_storage_path text default null,
  p_status public.report_status default 'published'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_report_id uuid;
begin
  if not private.is_platform_admin() then
    raise exception 'Only platform_admin can create reports.';
  end if;

  select private.current_user_id() into v_actor_id;

  if not exists (select 1 from public.companies c where c.id = p_company_id) then
    raise exception 'Company not found.';
  end if;

  insert into public.reports (
    company_id,
    report_type,
    report_month,
    title,
    summary,
    storage_path,
    status,
    generated_by
  )
  values (
    p_company_id,
    p_report_type,
    p_report_month,
    p_title,
    p_summary,
    p_storage_path,
    p_status,
    v_actor_id
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.hour_packages enable row level security;
alter table public.work_logs enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.reports enable row level security;

drop policy if exists users_select_self_or_platform_admin on public.users;
create policy users_select_self_or_platform_admin
on public.users
for select
to authenticated
using (id = private.current_user_id() or private.is_platform_admin());

drop policy if exists users_insert_platform_admin on public.users;
create policy users_insert_platform_admin
on public.users
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists users_update_platform_admin on public.users;
create policy users_update_platform_admin
on public.users
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists companies_select_assigned_or_platform_admin on public.companies;
create policy companies_select_assigned_or_platform_admin
on public.companies
for select
to authenticated
using (private.has_company_access(id));

drop policy if exists companies_insert_platform_admin on public.companies;
create policy companies_insert_platform_admin
on public.companies
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists companies_update_platform_admin on public.companies;
create policy companies_update_platform_admin
on public.companies
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists company_users_select_own_or_platform_admin on public.company_users;
create policy company_users_select_own_or_platform_admin
on public.company_users
for select
to authenticated
using (user_id = private.current_user_id() or private.is_platform_admin());

drop policy if exists company_users_insert_platform_admin on public.company_users;
create policy company_users_insert_platform_admin
on public.company_users
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists company_users_update_platform_admin on public.company_users;
create policy company_users_update_platform_admin
on public.company_users
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists company_users_delete_platform_admin on public.company_users;
create policy company_users_delete_platform_admin
on public.company_users
for delete
to authenticated
using (private.is_platform_admin());

drop policy if exists hour_packages_select_company_access on public.hour_packages;
create policy hour_packages_select_company_access
on public.hour_packages
for select
to authenticated
using (private.has_company_access(company_id));

drop policy if exists hour_packages_insert_platform_admin on public.hour_packages;
create policy hour_packages_insert_platform_admin
on public.hour_packages
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists hour_packages_update_platform_admin on public.hour_packages;
create policy hour_packages_update_platform_admin
on public.hour_packages
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists work_logs_select_company_access on public.work_logs;
create policy work_logs_select_company_access
on public.work_logs
for select
to authenticated
using (private.has_company_access(company_id));

drop policy if exists work_logs_insert_platform_admin on public.work_logs;
create policy work_logs_insert_platform_admin
on public.work_logs
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists work_logs_update_platform_admin on public.work_logs;
create policy work_logs_update_platform_admin
on public.work_logs
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists payments_select_company_access on public.payments;
create policy payments_select_company_access
on public.payments
for select
to authenticated
using (private.has_company_access(company_id));

drop policy if exists payments_insert_platform_admin on public.payments;
create policy payments_insert_platform_admin
on public.payments
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists payments_update_platform_admin on public.payments;
create policy payments_update_platform_admin
on public.payments
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists receipts_select_company_access on public.receipts;
create policy receipts_select_company_access
on public.receipts
for select
to authenticated
using (private.has_company_access(company_id));

drop policy if exists receipts_insert_platform_admin on public.receipts;
create policy receipts_insert_platform_admin
on public.receipts
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists receipts_update_platform_admin on public.receipts;
create policy receipts_update_platform_admin
on public.receipts
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists reports_select_company_access on public.reports;
create policy reports_select_company_access
on public.reports
for select
to authenticated
using (private.has_company_access(company_id));

drop policy if exists reports_insert_platform_admin on public.reports;
create policy reports_insert_platform_admin
on public.reports
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists reports_update_platform_admin on public.reports;
create policy reports_update_platform_admin
on public.reports
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

create or replace view public.company_dashboard
with (security_invoker = true)
as
select
  c.id as company_id,
  c.slug,
  c.name,
  c.legal_name,
  c.status,
  c.website_url,
  c.logo_url,
  public.total_hours_purchased(c.id) as total_hours_purchased,
  public.total_hours_used(c.id) as total_hours_used,
  public.remaining_hours(c.id) as remaining_hours,
  coalesce((
    select sum(p.amount_usd)
    from public.payments p
    where p.company_id = c.id
      and p.status = 'paid'
  ), 0)::numeric as total_paid_usd,
  coalesce((
    select sum(p.amount_usd)
    from public.payments p
    where p.company_id = c.id
      and p.status = 'pending'
  ), 0)::numeric as pending_payment_usd,
  (
    select max(wl.work_date)
    from public.work_logs wl
    where wl.company_id = c.id
      and wl.status <> 'void'
  ) as last_work_date,
  c.updated_at
from public.companies c
where c.status <> 'archived';

create or replace view public.monthly_usage
with (security_invoker = true)
as
select
  wl.company_id,
  c.slug,
  c.name as company_name,
  date_trunc('month', wl.work_date)::date as usage_month,
  count(*)::integer as work_log_count,
  coalesce(sum(wl.hours_used) filter (where wl.is_billable = true and wl.status <> 'void'), 0)::numeric as billable_hours_used,
  coalesce(sum(wl.hours_used) filter (where wl.status = 'void'), 0)::numeric as void_hours
from public.work_logs wl
join public.companies c on c.id = wl.company_id
group by wl.company_id, c.slug, c.name, date_trunc('month', wl.work_date)::date;

create or replace view public.payment_summary
with (security_invoker = true)
as
select
  p.company_id,
  c.slug,
  c.name as company_name,
  date_trunc('month', coalesce(p.paid_at, p.created_at))::date as payment_month,
  p.status,
  p.method,
  count(*)::integer as payment_count,
  coalesce(sum(p.amount_usd), 0)::numeric as amount_usd
from public.payments p
join public.companies c on c.id = p.company_id
group by p.company_id, c.slug, c.name, date_trunc('month', coalesce(p.paid_at, p.created_at))::date, p.status, p.method;

revoke all on all tables in schema public from anon;
revoke all on all functions in schema private from anon;
revoke all on all functions in schema private from authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

-- The private schema is not part of Supabase's exposed API schemas.
-- Authenticated can execute these helpers so RLS policies can evaluate them.
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_company_access(uuid) to authenticated;

grant select, insert, update, delete on
  public.users,
  public.companies,
  public.company_users,
  public.hour_packages,
  public.work_logs,
  public.payments,
  public.receipts,
  public.reports
to authenticated;

grant select on
  public.company_dashboard,
  public.monthly_usage,
  public.payment_summary
to authenticated;

revoke execute on function public.total_hours_purchased(uuid) from public, anon;
revoke execute on function public.total_hours_used(uuid) from public, anon;
revoke execute on function public.remaining_hours(uuid) from public, anon;
revoke execute on function public.admin_record_manual_payment(uuid, numeric, numeric, public.payment_method, text, text, timestamptz) from public, anon;
revoke execute on function public.admin_register_work_log(uuid, text, text, numeric, date, text, text, public.work_log_status) from public, anon;
revoke execute on function public.admin_create_report(uuid, public.report_type, text, text, date, text, public.report_status) from public, anon;

grant execute on function public.total_hours_purchased(uuid) to authenticated;
grant execute on function public.total_hours_used(uuid) to authenticated;
grant execute on function public.remaining_hours(uuid) to authenticated;
grant execute on function public.admin_record_manual_payment(uuid, numeric, numeric, public.payment_method, text, text, timestamptz) to authenticated;
grant execute on function public.admin_register_work_log(uuid, text, text, numeric, date, text, text, public.work_log_status) to authenticated;
grant execute on function public.admin_create_report(uuid, public.report_type, text, text, date, text, public.report_status) to authenticated;

insert into public.companies (slug, name, legal_name, status, website_url, notes)
values
  ('beoflow', 'BEOFlow', 'BEOFlow', 'active', 'beoflow.html', 'Pilot client for Bastida Systems hour-package portal.'),
  ('filtracore', 'FiltraCore', 'FiltraCore', 'prospect', 'filtracore.html', 'Future Bastida Systems client/company dashboard.'),
  ('cocofilms', 'CocoFilms', 'CocoFilms', 'prospect', null, 'Future Bastida Systems client/company dashboard.'),
  ('bastida-travel', 'Bastida Travel', 'Bastida Travel', 'prospect', null, 'Future Bastida Systems client/company dashboard.'),
  ('la-apertura', 'La Apertura', 'La Apertura', 'prospect', null, 'Future Bastida Systems client/company dashboard.')
on conflict (slug) do update
set name = excluded.name,
    legal_name = excluded.legal_name,
    website_url = excluded.website_url,
    notes = excluded.notes,
    updated_at = now();

-- Optional Postgres Changes realtime publication.
-- If Supabase Realtime is enabled, these additions let the portal refresh dashboards on data changes.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.hour_packages;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.work_logs;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.payments;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.receipts;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.reports;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

commit;

-- Run this assignment block only after David and Rodrigo exist in Authentication > Users.
-- Replace emails if needed, then execute in SQL Editor.
--
-- update public.users
-- set full_name = 'David Bastida',
--     platform_role = 'platform_admin',
--     active = true
-- where email = 'david@bastidasystems.com';
--
-- update public.users
-- set full_name = 'Rodrigo Ramirez',
--     platform_role = 'client_user',
--     active = true
-- where email = 'rodrigo@beoflow.com';
--
-- insert into public.company_users (company_id, user_id, role, active)
-- select c.id, u.id, 'owner', true
-- from public.companies c
-- join public.users u on u.email = 'rodrigo@beoflow.com'
-- where c.slug = 'beoflow'
-- on conflict (company_id, user_id) do update
-- set role = 'owner',
--     active = true,
--     updated_at = now();
