-- Bastida Systems Operating System schema extension.
-- Run after supabase/bastida_portal_schema.sql.
-- This file creates no demo data and inserts no users, projects, hours, deliverables, or payments.

begin;

do $$
begin
  if exists (select 1 from pg_type where typname = 'platform_role')
    and not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'platform_role'
        and e.enumlabel = 'founder'
    ) then
    alter type public.platform_role add value 'founder';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('active', 'paused', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_member_role') then
    create type public.project_member_role as enum ('founder', 'owner', 'core_collaborator', 'contractor');
  end if;

  if not exists (select 1 from pg_type where typname = 'deliverable_status') then
    create type public.deliverable_status as enum ('planned', 'in_progress', 'delivered', 'approved', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'collaborator_payment_status') then
    create type public.collaborator_payment_status as enum ('draft', 'pending_approval', 'approved', 'paid', 'void');
  end if;

  if not exists (select 1 from pg_type where typname = 'member_invitation_status') then
    create type public.member_invitation_status as enum ('invite_sent', 'pending_acceptance', 'active_member', 'error_sending_invite');
  end if;

  if exists (select 1 from pg_type where typname = 'work_log_status')
    and not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'work_log_status'
        and e.enumlabel = 'pending_approval'
    ) then
    alter type public.work_log_status add value 'pending_approval';
  end if;

  if exists (select 1 from pg_type where typname = 'work_log_status')
    and not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'work_log_status'
        and e.enumlabel = 'rejected'
    ) then
    alter type public.work_log_status add value 'rejected';
  end if;
end $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  status public.project_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_roles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role public.project_member_role not null,
  hourly_rate_usd numeric(12, 2) check (hourly_rate_usd is null or hourly_rate_usd >= 0),
  active boolean not null default true,
  invite_email citext,
  invited_name text,
  invited_by uuid references public.users(id) on delete set null,
  invited_at timestamptz,
  invitation_status public.member_invitation_status not null default 'active_member',
  last_invite_error text,
  accepted_at timestamptz,
  joined_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  storage_path text,
  status public.deliverable_status not null default 'planned',
  due_date date,
  delivered_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaborator_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  hourly_rate_usd numeric(12, 2) not null check (hourly_rate_usd >= 0),
  approved_hours numeric(10, 2) not null check (approved_hours >= 0),
  total_usd numeric(12, 2) generated always as (round(hourly_rate_usd * approved_hours, 2)) stored,
  status public.collaborator_payment_status not null default 'draft',
  paid_at timestamptz,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_logs
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists commit_hash text,
  add column if not exists work_type text,
  add column if not exists evidence_url text,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by uuid references public.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid references public.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists approved_hours numeric(10, 2) check (approved_hours is null or approved_hours >= 0);

alter table public.work_logs
  alter column company_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_logs_hours_used_max_24'
  ) then
    alter table public.work_logs
      add constraint work_logs_hours_used_max_24
      check (hours_used <= 24)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_logs_approved_hours_not_above_hours'
  ) then
    alter table public.work_logs
      add constraint work_logs_approved_hours_not_above_hours
      check (approved_hours is null or approved_hours <= hours_used)
      not valid;
  end if;
end $$;

alter table public.project_roles
  alter column user_id drop not null,
  add column if not exists invite_email citext,
  add column if not exists invited_name text,
  add column if not exists invited_by uuid references public.users(id) on delete set null,
  add column if not exists invited_at timestamptz,
  add column if not exists invitation_status public.member_invitation_status not null default 'active_member',
  add column if not exists last_invite_error text,
  add column if not exists accepted_at timestamptz;

comment on table public.projects is 'Real Bastida Systems projects. Empty until created from real business records.';
comment on table public.project_roles is 'Project-specific user roles. One user can have different roles across different projects.';
comment on column public.project_roles.invitation_status is 'Invitation lifecycle for dashboard-invited project members.';
comment on table public.deliverables is 'Real project deliverables and their delivery status.';
comment on table public.collaborator_payments is 'Real collaborator payment calculations from approved hours and rates.';
comment on column public.work_logs.project_id is 'Optional link from legacy work logs to the operating project model.';
comment on column public.work_logs.commit_hash is 'Optional source-control commit hash for technical work logs.';
comment on column public.work_logs.work_type is 'Work category selected by the collaborator when submitting hours.';
comment on column public.work_logs.evidence_url is 'Optional external evidence link such as Figma, Drive, screenshots, or documents.';
comment on column public.work_logs.approved_hours is 'Approved payable hours after owner/founder review.';

create index if not exists idx_projects_company_status on public.projects(company_id, status);
create index if not exists idx_projects_status_updated_at on public.projects(status, updated_at desc);
create index if not exists idx_project_roles_project_active on public.project_roles(project_id, active);
create index if not exists idx_project_roles_user_active on public.project_roles(user_id, active);
create index if not exists idx_project_roles_invitation_status on public.project_roles(project_id, invitation_status);
create unique index if not exists idx_project_roles_project_invite_email_unique
  on public.project_roles(project_id, invite_email)
  where invite_email is not null;
create index if not exists idx_deliverables_project_status on public.deliverables(project_id, status);
create index if not exists idx_deliverables_due_date on public.deliverables(due_date);
create index if not exists idx_collaborator_payments_project_status on public.collaborator_payments(project_id, status);
create index if not exists idx_collaborator_payments_user_status on public.collaborator_payments(user_id, status);
create index if not exists idx_work_logs_project_date on public.work_logs(project_id, work_date desc);
create index if not exists idx_work_logs_worker_status on public.work_logs(worker_user_id, status);
create index if not exists idx_work_logs_project_status on public.work_logs(project_id, status);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_roles_updated_at on public.project_roles;
create trigger set_project_roles_updated_at
before update on public.project_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_deliverables_updated_at on public.deliverables;
create trigger set_deliverables_updated_at
before update on public.deliverables
for each row execute function public.set_updated_at();

drop trigger if exists set_collaborator_payments_updated_at on public.collaborator_payments;
create trigger set_collaborator_payments_updated_at
before update on public.collaborator_payments
for each row execute function public.set_updated_at();

create or replace function private.is_global_founder()
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
      and u.platform_role::text = 'founder'
      and u.active = true
  );
$$;

create or replace function private.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_platform_admin()
    or private.is_global_founder()
    or exists (
      select 1
      from public.project_roles pr
      join public.users u on u.id = pr.user_id
      where pr.project_id = p_project_id
        and pr.active = true
        and u.active = true
        and u.auth_user_id = (select auth.uid())
    );
$$;

create or replace function private.can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_platform_admin()
    or private.is_global_founder()
    or exists (
      select 1
      from public.project_roles pr
      join public.users u on u.id = pr.user_id
      where pr.project_id = p_project_id
        and pr.active = true
        and pr.role in ('founder', 'owner')
        and u.active = true
        and u.auth_user_id = (select auth.uid())
    );
$$;

create or replace function public.accept_my_project_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_updated_count integer;
begin
  select private.current_user_id() into v_user_id;

  if v_user_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  update public.project_roles pr
  set invitation_status = 'active_member',
      accepted_at = coalesce(pr.accepted_at, now()),
      active = true,
      updated_at = now()
  where pr.user_id = v_user_id
    and pr.invitation_status in ('invite_sent', 'pending_acceptance');

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

create or replace view public.project_operating_summary
with (security_invoker = true)
as
select
  p.id as project_id,
  p.name,
  p.slug,
  p.status,
  (
    select count(distinct pr.user_id)::integer
    from public.project_roles pr
    where pr.project_id = p.id
      and pr.active = true
      and pr.user_id is not null
  ) as collaborator_count,
  (
    select count(*)::integer
    from public.deliverables d
    where d.project_id = p.id
  ) as deliverable_count,
  (
    select count(*)::integer
    from public.work_logs wl
    where wl.project_id = p.id
  ) as work_log_count,
  coalesce((
    select sum(wl.approved_hours)
    from public.work_logs wl
    where wl.project_id = p.id
      and wl.status::text = 'approved'
  ), 0)::numeric as approved_or_completed_hours,
  coalesce((
    select sum(wl.approved_hours * coalesce(pr.hourly_rate_usd, 0))
    from public.work_logs wl
    left join public.project_roles pr
      on pr.project_id = wl.project_id
      and pr.user_id = wl.worker_user_id
      and pr.active = true
    where wl.project_id = p.id
      and wl.status::text = 'approved'
  ), 0)::numeric as payable_total_usd,
  p.updated_at
from public.projects p;

alter table public.projects enable row level security;
alter table public.project_roles enable row level security;
alter table public.deliverables enable row level security;
alter table public.collaborator_payments enable row level security;

drop policy if exists users_select_project_peers on public.users;
create policy users_select_project_peers
on public.users
for select
to authenticated
using (
  exists (
    select 1
    from public.project_roles own_role
    join public.project_roles peer_role on peer_role.project_id = own_role.project_id
    where own_role.user_id = (select private.current_user_id())
      and own_role.active = true
      and peer_role.active = true
      and peer_role.user_id = public.users.id
  )
);

drop policy if exists users_select_global_founder on public.users;
create policy users_select_global_founder
on public.users
for select
to authenticated
using (private.is_global_founder());

drop policy if exists projects_select_project_access on public.projects;
create policy projects_select_project_access
on public.projects
for select
to authenticated
using (private.has_project_access(id));

drop policy if exists projects_insert_platform_admin on public.projects;
create policy projects_insert_platform_admin
on public.projects
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists projects_update_platform_admin on public.projects;
create policy projects_update_platform_admin
on public.projects
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists projects_delete_platform_admin on public.projects;
create policy projects_delete_platform_admin
on public.projects
for delete
to authenticated
using (private.is_platform_admin());

drop policy if exists project_roles_select_project_access on public.project_roles;
create policy project_roles_select_project_access
on public.project_roles
for select
to authenticated
using (private.has_project_access(project_id));

drop policy if exists project_roles_insert_platform_admin on public.project_roles;
create policy project_roles_insert_platform_admin
on public.project_roles
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists project_roles_update_platform_admin on public.project_roles;
create policy project_roles_update_platform_admin
on public.project_roles
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists project_roles_delete_platform_admin on public.project_roles;
create policy project_roles_delete_platform_admin
on public.project_roles
for delete
to authenticated
using (private.is_platform_admin());

drop policy if exists deliverables_select_project_access on public.deliverables;
create policy deliverables_select_project_access
on public.deliverables
for select
to authenticated
using (private.has_project_access(project_id));

drop policy if exists deliverables_insert_platform_admin on public.deliverables;
create policy deliverables_insert_platform_admin
on public.deliverables
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists deliverables_update_platform_admin on public.deliverables;
create policy deliverables_update_platform_admin
on public.deliverables
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists deliverables_delete_platform_admin on public.deliverables;
create policy deliverables_delete_platform_admin
on public.deliverables
for delete
to authenticated
using (private.is_platform_admin());

drop policy if exists collaborator_payments_select_project_access on public.collaborator_payments;
create policy collaborator_payments_select_project_access
on public.collaborator_payments
for select
to authenticated
using (
  private.is_platform_admin()
  or user_id = (select private.current_user_id())
  or (project_id is not null and private.has_project_access(project_id))
);

drop policy if exists collaborator_payments_insert_platform_admin on public.collaborator_payments;
create policy collaborator_payments_insert_platform_admin
on public.collaborator_payments
for insert
to authenticated
with check (private.is_platform_admin());

drop policy if exists collaborator_payments_update_platform_admin on public.collaborator_payments;
create policy collaborator_payments_update_platform_admin
on public.collaborator_payments
for update
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists collaborator_payments_delete_platform_admin on public.collaborator_payments;
create policy collaborator_payments_delete_platform_admin
on public.collaborator_payments
for delete
to authenticated
using (private.is_platform_admin());

drop policy if exists work_logs_select_company_access on public.work_logs;
drop policy if exists work_logs_select_company_or_project_access on public.work_logs;
drop policy if exists work_logs_select_operating_access on public.work_logs;
create policy work_logs_select_company_or_project_access
on public.work_logs
for select
to authenticated
using (
  private.is_platform_admin()
  or private.is_global_founder()
  or worker_user_id = (select private.current_user_id())
  or (project_id is not null and private.can_manage_project(project_id))
);

drop policy if exists work_logs_insert_platform_admin on public.work_logs;
drop policy if exists work_logs_insert_project_member on public.work_logs;
create policy work_logs_insert_project_member
on public.work_logs
for insert
to authenticated
with check (
  project_id is not null
  and private.has_project_access(project_id)
  and worker_user_id = (select private.current_user_id())
  and coalesce(created_by, (select private.current_user_id())) = (select private.current_user_id())
  and status::text = 'pending_approval'
  and hours_used > 0
  and hours_used <= 24
);

drop policy if exists work_logs_update_platform_admin on public.work_logs;
drop policy if exists work_logs_update_project_manager on public.work_logs;
create policy work_logs_update_project_manager
on public.work_logs
for update
to authenticated
using (
  project_id is not null
  and private.can_manage_project(project_id)
)
with check (
  project_id is not null
  and private.can_manage_project(project_id)
);

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_global_founder() to authenticated;
grant execute on function private.has_project_access(uuid) to authenticated;
grant execute on function private.can_manage_project(uuid) to authenticated;
grant execute on function public.accept_my_project_invites() to authenticated;

grant select, insert, update, delete on
  public.projects,
  public.project_roles,
  public.deliverables,
  public.collaborator_payments
to authenticated;

grant select on public.project_operating_summary to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.projects;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.project_roles;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.deliverables;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.collaborator_payments;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

commit;
