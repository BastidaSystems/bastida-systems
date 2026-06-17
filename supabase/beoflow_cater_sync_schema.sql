-- Incremental BEOFlow schema for Cater Vegas sync.
-- Run this in the BEOFlow Supabase SQL Editor after beoflow_client_schema.sql.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    execute $function$
      create function public.set_updated_at()
      returns trigger
      language plpgsql
      set search_path = public
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$;
    $function$;
  end if;
end $$;

alter table if exists public.beoflow_events
  add column if not exists source text,
  add column if not exists source_id text,
  add column if not exists source_url text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

create unique index if not exists idx_beoflow_events_client_source_unique
  on public.beoflow_events(client_id, source, source_id);

create table if not exists public.beoflow_providers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  provider_type text not null default 'vendor',
  contact_name text,
  email text,
  phone text,
  website text,
  city text,
  state text,
  status text not null default 'active',
  notes text,
  source text not null default 'manual',
  source_id text,
  source_url text,
  source_metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.beoflow_providers
  add column if not exists provider_type text not null default 'vendor',
  add column if not exists contact_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists status text not null default 'active',
  add column if not exists notes text,
  add column if not exists source text not null default 'manual',
  add column if not exists source_id text,
  add column if not exists source_url text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

create index if not exists idx_beoflow_providers_client_id on public.beoflow_providers(client_id);
create unique index if not exists idx_beoflow_providers_client_source_unique
  on public.beoflow_providers(client_id, source, source_id);
create index if not exists idx_beoflow_providers_client_type on public.beoflow_providers(client_id, provider_type);
create index if not exists idx_beoflow_providers_email on public.beoflow_providers(email);

drop trigger if exists set_beoflow_providers_updated_at on public.beoflow_providers;
create trigger set_beoflow_providers_updated_at
before update on public.beoflow_providers
for each row execute function public.set_updated_at();

create table if not exists public.beoflow_activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null default 'manual',
  source_table text,
  source_id text,
  activity_type text not null,
  title text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_beoflow_activity_log_client_created_at
  on public.beoflow_activity_log(client_id, created_at desc);

create unique index if not exists idx_beoflow_activity_log_source_unique
  on public.beoflow_activity_log(client_id, source, source_table, source_id, activity_type);

drop trigger if exists set_beoflow_activity_log_updated_at on public.beoflow_activity_log;
create trigger set_beoflow_activity_log_updated_at
before update on public.beoflow_activity_log
for each row execute function public.set_updated_at();

alter table public.beoflow_activity_log enable row level security;
alter table public.beoflow_providers enable row level security;

drop policy if exists beoflow_providers_select_client_access on public.beoflow_providers;
create policy beoflow_providers_select_client_access
on public.beoflow_providers
for select
to authenticated
using (private.has_beoflow_client_access(client_id));

drop policy if exists beoflow_providers_insert_manager on public.beoflow_providers;
create policy beoflow_providers_insert_manager
on public.beoflow_providers
for insert
to authenticated
with check (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

drop policy if exists beoflow_providers_update_manager on public.beoflow_providers;
create policy beoflow_providers_update_manager
on public.beoflow_providers
for update
to authenticated
using (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']))
with check (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

drop policy if exists beoflow_providers_delete_manager on public.beoflow_providers;
create policy beoflow_providers_delete_manager
on public.beoflow_providers
for delete
to authenticated
using (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

drop policy if exists beoflow_activity_log_select_client_access on public.beoflow_activity_log;
create policy beoflow_activity_log_select_client_access
on public.beoflow_activity_log
for select
to authenticated
using (private.has_beoflow_client_access(client_id));

drop policy if exists beoflow_activity_log_insert_manager on public.beoflow_activity_log;
create policy beoflow_activity_log_insert_manager
on public.beoflow_activity_log
for insert
to authenticated
with check (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

drop policy if exists beoflow_activity_log_update_manager on public.beoflow_activity_log;
create policy beoflow_activity_log_update_manager
on public.beoflow_activity_log
for update
to authenticated
using (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']))
with check (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

drop policy if exists beoflow_activity_log_delete_manager on public.beoflow_activity_log;
create policy beoflow_activity_log_delete_manager
on public.beoflow_activity_log
for delete
to authenticated
using (private.has_beoflow_client_role(client_id, array['owner', 'admin', 'manager']));

grant select, insert, update, delete on public.beoflow_activity_log to authenticated;
grant select, insert, update, delete on public.beoflow_providers to authenticated;

commit;
