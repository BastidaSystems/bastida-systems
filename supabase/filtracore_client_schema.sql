-- FiltraCore Client-prod MVP schema.
-- Run manually in the Client-prod Supabase SQL Editor when ready.
-- This file creates no demo data, no users, and does not modify Render or app keys.

begin;

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

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

create or replace function private.has_filtracore_client_access(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_users cu
    where cu.client_id = p_client_id
      and cu.user_id = (select auth.uid())
      and coalesce(cu.status::text, 'active') = 'active'
  )
  and exists (
    select 1
    from public.client_products cp
    where cp.client_id = p_client_id
      and cp.product_key = 'filtracore'
      and coalesce(cp.status::text, 'active') = 'active'
  );
$$;

create or replace function private.has_filtracore_client_role(
  p_client_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_filtracore_client_access(p_client_id)
    and exists (
      select 1
      from public.client_users cu
      where cu.client_id = p_client_id
        and cu.user_id = (select auth.uid())
        and coalesce(cu.status::text, 'active') = 'active'
        and cu.role::text = any(p_roles)
    );
$$;

grant usage on schema private to authenticated;
grant execute on function private.has_filtracore_client_access(uuid) to authenticated;
grant execute on function private.has_filtracore_client_role(uuid, text[]) to authenticated;

create table if not exists public.filtracore_workspaces (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  mode text not null check (mode in ('business', 'home')),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  name text not null,
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_properties (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  name text not null,
  address text,
  property_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  company_id uuid references public.filtracore_companies(id) on delete set null,
  name text not null,
  address text,
  building text,
  floor text,
  zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_systems (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  location_id uuid references public.filtracore_locations(id) on delete set null,
  property_id uuid references public.filtracore_properties(id) on delete set null,
  name text not null,
  system_type text,
  brand text,
  model text,
  serial_number text,
  install_date date,
  psi_min numeric,
  psi_max numeric,
  status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_filters (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  system_id uuid not null references public.filtracore_systems(id) on delete cascade,
  filter_name text not null,
  sku text,
  installed_at date,
  due_date date,
  life_months int,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filtracore_psi_readings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  system_id uuid not null references public.filtracore_systems(id) on delete cascade,
  filter_id uuid references public.filtracore_filters(id) on delete set null,
  psi numeric not null,
  status text,
  reading_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.filtracore_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  system_id uuid not null references public.filtracore_systems(id) on delete cascade,
  filter_id uuid references public.filtracore_filters(id) on delete set null,
  type text,
  performed_at timestamptz not null default now(),
  technician_name text,
  previous_psi numeric,
  corrected_psi numeric,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.filtracore_alerts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  system_id uuid references public.filtracore_systems(id) on delete set null,
  filter_id uuid references public.filtracore_filters(id) on delete set null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.filtracore_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.filtracore_workspaces(id) on delete cascade,
  report_type text not null,
  period_start date,
  period_end date,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.filtracore_workspaces is 'FiltraCore Business or Home workspace scoped to one Client-prod client.';
comment on table public.filtracore_companies is 'Business-mode company or organization metadata for a FiltraCore workspace.';
comment on table public.filtracore_properties is 'Home-mode property metadata for a FiltraCore workspace.';
comment on table public.filtracore_locations is 'Business-mode physical locations, buildings, floors, and zones.';
comment on table public.filtracore_systems is 'Water filtration systems with configured PSI ranges and system metadata.';
comment on table public.filtracore_filters is 'Installed filters and lifecycle dates linked to filtration systems.';
comment on table public.filtracore_psi_readings is 'PSI readings and computed status history linked to systems and optional filters.';
comment on table public.filtracore_maintenance_logs is 'Maintenance and service history linked to systems and optional filters.';
comment on table public.filtracore_alerts is 'FiltraCore alert records scoped to workspaces, systems, and optional filters.';
comment on table public.filtracore_reports is 'Generated FiltraCore report payloads scoped to workspaces.';

create index if not exists idx_filtracore_client_users_user_status
  on public.client_users(user_id, status);
create index if not exists idx_filtracore_client_users_client_status_role
  on public.client_users(client_id, status, role);
create index if not exists idx_filtracore_client_products_client_product_status
  on public.client_products(client_id, product_key, status);

create index if not exists idx_filtracore_workspaces_client_id
  on public.filtracore_workspaces(client_id);
create index if not exists idx_filtracore_workspaces_client_mode
  on public.filtracore_workspaces(client_id, mode);

create index if not exists idx_filtracore_companies_client_id
  on public.filtracore_companies(client_id);
create index if not exists idx_filtracore_companies_workspace_id
  on public.filtracore_companies(workspace_id);

create index if not exists idx_filtracore_properties_client_id
  on public.filtracore_properties(client_id);
create index if not exists idx_filtracore_properties_workspace_id
  on public.filtracore_properties(workspace_id);

create index if not exists idx_filtracore_locations_client_id
  on public.filtracore_locations(client_id);
create index if not exists idx_filtracore_locations_workspace_id
  on public.filtracore_locations(workspace_id);
create index if not exists idx_filtracore_locations_company_id
  on public.filtracore_locations(company_id);

create index if not exists idx_filtracore_systems_client_id
  on public.filtracore_systems(client_id);
create index if not exists idx_filtracore_systems_workspace_id
  on public.filtracore_systems(workspace_id);
create index if not exists idx_filtracore_systems_location_id
  on public.filtracore_systems(location_id);
create index if not exists idx_filtracore_systems_property_id
  on public.filtracore_systems(property_id);
create index if not exists idx_filtracore_systems_status
  on public.filtracore_systems(status);

create index if not exists idx_filtracore_filters_client_id
  on public.filtracore_filters(client_id);
create index if not exists idx_filtracore_filters_workspace_id
  on public.filtracore_filters(workspace_id);
create index if not exists idx_filtracore_filters_system_id
  on public.filtracore_filters(system_id);
create index if not exists idx_filtracore_filters_due_date
  on public.filtracore_filters(due_date);
create index if not exists idx_filtracore_filters_status
  on public.filtracore_filters(status);

create index if not exists idx_filtracore_psi_readings_client_id
  on public.filtracore_psi_readings(client_id);
create index if not exists idx_filtracore_psi_readings_workspace_id
  on public.filtracore_psi_readings(workspace_id);
create index if not exists idx_filtracore_psi_readings_system_id
  on public.filtracore_psi_readings(system_id);
create index if not exists idx_filtracore_psi_readings_filter_id
  on public.filtracore_psi_readings(filter_id);
create index if not exists idx_filtracore_psi_readings_reading_at
  on public.filtracore_psi_readings(reading_at desc);
create index if not exists idx_filtracore_psi_readings_status
  on public.filtracore_psi_readings(status);

create index if not exists idx_filtracore_maintenance_logs_client_id
  on public.filtracore_maintenance_logs(client_id);
create index if not exists idx_filtracore_maintenance_logs_workspace_id
  on public.filtracore_maintenance_logs(workspace_id);
create index if not exists idx_filtracore_maintenance_logs_system_id
  on public.filtracore_maintenance_logs(system_id);
create index if not exists idx_filtracore_maintenance_logs_filter_id
  on public.filtracore_maintenance_logs(filter_id);
create index if not exists idx_filtracore_maintenance_logs_performed_at
  on public.filtracore_maintenance_logs(performed_at desc);

create index if not exists idx_filtracore_alerts_client_id
  on public.filtracore_alerts(client_id);
create index if not exists idx_filtracore_alerts_workspace_id
  on public.filtracore_alerts(workspace_id);
create index if not exists idx_filtracore_alerts_system_id
  on public.filtracore_alerts(system_id);
create index if not exists idx_filtracore_alerts_filter_id
  on public.filtracore_alerts(filter_id);
create index if not exists idx_filtracore_alerts_severity
  on public.filtracore_alerts(severity);
create index if not exists idx_filtracore_alerts_created_at
  on public.filtracore_alerts(created_at desc);
create index if not exists idx_filtracore_alerts_open
  on public.filtracore_alerts(client_id, workspace_id, severity, created_at desc)
  where resolved_at is null;

create index if not exists idx_filtracore_reports_client_id
  on public.filtracore_reports(client_id);
create index if not exists idx_filtracore_reports_workspace_id
  on public.filtracore_reports(workspace_id);
create index if not exists idx_filtracore_reports_period
  on public.filtracore_reports(period_start, period_end);
create index if not exists idx_filtracore_reports_type
  on public.filtracore_reports(report_type);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'filtracore_workspaces',
    'filtracore_companies',
    'filtracore_properties',
    'filtracore_locations',
    'filtracore_systems',
    'filtracore_filters'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
  end loop;
end $$;

alter table public.filtracore_workspaces enable row level security;
alter table public.filtracore_companies enable row level security;
alter table public.filtracore_properties enable row level security;
alter table public.filtracore_locations enable row level security;
alter table public.filtracore_systems enable row level security;
alter table public.filtracore_filters enable row level security;
alter table public.filtracore_psi_readings enable row level security;
alter table public.filtracore_maintenance_logs enable row level security;
alter table public.filtracore_alerts enable row level security;
alter table public.filtracore_reports enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'filtracore_workspaces',
    'filtracore_companies',
    'filtracore_properties',
    'filtracore_locations',
    'filtracore_systems',
    'filtracore_filters',
    'filtracore_psi_readings',
    'filtracore_maintenance_logs',
    'filtracore_alerts',
    'filtracore_reports'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_client_access', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_owner_admin', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_owner_admin', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_owner_admin', table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using (private.has_filtracore_client_access(client_id))',
      table_name || '_select_client_access',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_filtracore_client_role(client_id, array[''owner'', ''admin'']))',
      table_name || '_insert_owner_admin',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_filtracore_client_role(client_id, array[''owner'', ''admin''])) with check (private.has_filtracore_client_role(client_id, array[''owner'', ''admin'']))',
      table_name || '_update_owner_admin',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.has_filtracore_client_role(client_id, array[''owner'', ''admin'']))',
      table_name || '_delete_owner_admin',
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'filtracore_psi_readings',
    'filtracore_maintenance_logs',
    'filtracore_alerts'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_tech', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_tech', table_name);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_filtracore_client_role(client_id, array[''tech'']))',
      table_name || '_insert_tech',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_filtracore_client_role(client_id, array[''tech''])) with check (private.has_filtracore_client_role(client_id, array[''tech'']))',
      table_name || '_update_tech',
      table_name
    );
  end loop;
end $$;

revoke all on
  public.filtracore_workspaces,
  public.filtracore_companies,
  public.filtracore_properties,
  public.filtracore_locations,
  public.filtracore_systems,
  public.filtracore_filters,
  public.filtracore_psi_readings,
  public.filtracore_maintenance_logs,
  public.filtracore_alerts,
  public.filtracore_reports
from anon;

grant select, insert, update, delete on
  public.filtracore_workspaces,
  public.filtracore_companies,
  public.filtracore_properties,
  public.filtracore_locations,
  public.filtracore_systems,
  public.filtracore_filters,
  public.filtracore_psi_readings,
  public.filtracore_maintenance_logs,
  public.filtracore_alerts,
  public.filtracore_reports
to authenticated;

commit;
