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
    create type public.project_member_role as enum ('founder', 'owner', 'core_collaborator', 'designer', 'developer', 'contractor');
  end if;

  if exists (select 1 from pg_type where typname = 'project_member_role')
    and not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'project_member_role'
        and e.enumlabel = 'designer'
    ) then
    alter type public.project_member_role add value 'designer';
  end if;

  if exists (select 1 from pg_type where typname = 'project_member_role')
    and not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'project_member_role'
        and e.enumlabel = 'developer'
    ) then
    alter type public.project_member_role add value 'developer';
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

  if not exists (select 1 from pg_type where typname = 'project_task_status') then
    create type public.project_task_status as enum ('backlog', 'to_do', 'in_progress', 'review', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_task_priority') then
    create type public.project_task_priority as enum ('low', 'medium', 'high', 'critical');
  end if;

  if not exists (select 1 from pg_type where typname = 'time_entry_status') then
    create type public.time_entry_status as enum ('running', 'stopped', 'converted', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_document_category') then
    create type public.project_document_category as enum ('contracts', 'nda', 'invoices', 'proposals', 'business_plans', 'pitch_decks', 'design_files', 'legal');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_document_status') then
    create type public.project_document_status as enum ('active', 'archived');
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
  project_title text,
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
  responsible_user_id uuid references public.users(id) on delete set null,
  figma_url text,
  google_drive_url text,
  document_url text,
  evidence_url text,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
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
  paid_by uuid references public.users(id) on delete set null,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaborator_payment_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.collaborator_payments(id) on delete cascade,
  previous_status public.collaborator_payment_status,
  new_status public.collaborator_payment_status not null,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  note text
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.users(id) on delete set null,
  priority public.project_task_priority not null default 'medium',
  status public.project_task_status not null default 'backlog',
  due_date date,
  completed_at timestamptz,
  completed_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete set null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer generated always as (
    case
      when ended_at is null then null
      else greatest(0, floor(extract(epoch from ended_at - started_at) / 60)::integer)
    end
  ) stored,
  status public.time_entry_status not null default 'running',
  converted_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category public.project_document_category not null,
  document_url text,
  storage_path text,
  status public.project_document_status not null default 'active',
  uploaded_by uuid references public.users(id) on delete set null,
  archived_by uuid references public.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (document_url is not null or storage_path is not null)
);

alter table public.deliverables
  add column if not exists responsible_user_id uuid references public.users(id) on delete set null,
  add column if not exists figma_url text,
  add column if not exists google_drive_url text,
  add column if not exists document_url text,
  add column if not exists evidence_url text,
  add column if not exists approved_by uuid references public.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

alter table public.collaborator_payments
  add column if not exists paid_by uuid references public.users(id) on delete set null;

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
  add column if not exists project_title text,
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
comment on column public.project_roles.project_title is 'Optional project-specific professional title shown in UI without changing permission role.';
comment on table public.deliverables is 'Real project deliverables and their delivery status.';
comment on column public.deliverables.responsible_user_id is 'Project collaborator responsible for the deliverable.';
comment on column public.deliverables.figma_url is 'Optional Figma evidence URL.';
comment on column public.deliverables.google_drive_url is 'Optional Google Drive evidence URL.';
comment on column public.deliverables.document_url is 'Optional document URL.';
comment on column public.deliverables.evidence_url is 'Optional general evidence URL.';
comment on table public.collaborator_payments is 'Real collaborator payment calculations from approved hours and rates.';
comment on table public.collaborator_payment_history is 'Payment status change history for operational auditability.';
comment on column public.collaborator_payments.paid_by is 'Portal user who marked the payment as paid.';
comment on column public.work_logs.project_id is 'Optional link from legacy work logs to the operating project model.';
comment on column public.work_logs.commit_hash is 'Optional source-control commit hash for technical work logs.';
comment on column public.work_logs.work_type is 'Work category selected by the collaborator when submitting hours.';
comment on column public.work_logs.evidence_url is 'Optional external evidence link such as Figma, Drive, screenshots, or documents.';
comment on column public.work_logs.approved_hours is 'Approved payable hours after owner/founder review.';
comment on table public.project_tasks is 'Real project task records for Bastida OS task management.';
comment on column public.project_tasks.assigned_to is 'Project collaborator assigned to complete the task.';
comment on table public.time_entries is 'Live time tracking entries that can be converted into work log submissions.';
comment on column public.time_entries.duration_minutes is 'Generated stopped timer duration in minutes.';
comment on table public.project_documents is 'Project documents and contracts metadata. File storage remains external or Supabase Storage-backed.';

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
create index if not exists idx_deliverables_responsible_status on public.deliverables(responsible_user_id, status);
create index if not exists idx_collaborator_payments_project_status on public.collaborator_payments(project_id, status);
create index if not exists idx_collaborator_payments_user_status on public.collaborator_payments(user_id, status);
create index if not exists idx_collaborator_payment_history_payment_changed_at on public.collaborator_payment_history(payment_id, changed_at desc);
create index if not exists idx_work_logs_project_date on public.work_logs(project_id, work_date desc);
create index if not exists idx_work_logs_worker_status on public.work_logs(worker_user_id, status);
create index if not exists idx_work_logs_project_status on public.work_logs(project_id, status);
create index if not exists idx_project_tasks_project_status on public.project_tasks(project_id, status);
create index if not exists idx_project_tasks_assigned_status on public.project_tasks(assigned_to, status);
create index if not exists idx_project_tasks_due_date on public.project_tasks(due_date);
create index if not exists idx_time_entries_project_user_status on public.time_entries(project_id, user_id, status);
create index if not exists idx_time_entries_user_started_at on public.time_entries(user_id, started_at desc);
create index if not exists idx_project_documents_project_category on public.project_documents(project_id, category);
create index if not exists idx_project_documents_uploaded_by on public.project_documents(uploaded_by, created_at desc);

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

drop trigger if exists set_project_tasks_updated_at on public.project_tasks;
create trigger set_project_tasks_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_time_entries_updated_at on public.time_entries;
create trigger set_time_entries_updated_at
before update on public.time_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_project_documents_updated_at on public.project_documents;
create trigger set_project_documents_updated_at
before update on public.project_documents
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

create or replace function public.upsert_project_deliverable(
  p_project_id uuid,
  p_title text,
  p_description text default null,
  p_responsible_user_id uuid default null,
  p_due_date date default null,
  p_status public.deliverable_status default 'planned',
  p_figma_url text default null,
  p_google_drive_url text default null,
  p_document_url text default null,
  p_evidence_url text default null,
  p_deliverable_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_existing_project_id uuid;
  v_deliverable_id uuid;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  if p_project_id is null then
    raise exception 'Project is required.';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Deliverable title is required.';
  end if;

  if not private.can_manage_project(p_project_id) then
    raise exception 'Only a Founder or Owner can manage deliverables for this project.';
  end if;

  if p_responsible_user_id is not null and not exists (
    select 1
    from public.project_roles pr
    where pr.project_id = p_project_id
      and pr.user_id = p_responsible_user_id
      and pr.active = true
  ) then
    raise exception 'Responsible user must be an active project collaborator.';
  end if;

  if p_deliverable_id is not null then
    select d.project_id
      into v_existing_project_id
    from public.deliverables d
    where d.id = p_deliverable_id;

    if v_existing_project_id is null then
      raise exception 'Deliverable not found.';
    end if;

    if not private.can_manage_project(v_existing_project_id) then
      raise exception 'Only a Founder or Owner can manage this deliverable.';
    end if;

    update public.deliverables as d
    set project_id = p_project_id,
        title = trim(p_title),
        description = nullif(trim(coalesce(p_description, '')), ''),
        responsible_user_id = p_responsible_user_id,
        due_date = p_due_date,
        status = p_status,
        figma_url = nullif(trim(coalesce(p_figma_url, '')), ''),
        google_drive_url = nullif(trim(coalesce(p_google_drive_url, '')), ''),
        document_url = nullif(trim(coalesce(p_document_url, '')), ''),
        evidence_url = nullif(trim(coalesce(p_evidence_url, '')), ''),
        delivered_at = case
          when p_status in ('delivered', 'approved') then coalesce(d.delivered_at, now())
          when p_status = 'planned' then null
          else d.delivered_at
        end,
        approved_by = case
          when p_status = 'approved' then v_actor_id
          when d.status = 'approved' and p_status <> 'approved' then null
          else d.approved_by
        end,
        approved_at = case
          when p_status = 'approved' then coalesce(d.approved_at, now())
          when d.status = 'approved' and p_status <> 'approved' then null
          else d.approved_at
        end
    where d.id = p_deliverable_id
    returning id into v_deliverable_id;

    return v_deliverable_id;
  end if;

  insert into public.deliverables (
    project_id,
    title,
    description,
    responsible_user_id,
    due_date,
    status,
    figma_url,
    google_drive_url,
    document_url,
    evidence_url,
    delivered_at,
    approved_by,
    approved_at,
    created_by
  )
  values (
    p_project_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_responsible_user_id,
    p_due_date,
    p_status,
    nullif(trim(coalesce(p_figma_url, '')), ''),
    nullif(trim(coalesce(p_google_drive_url, '')), ''),
    nullif(trim(coalesce(p_document_url, '')), ''),
    nullif(trim(coalesce(p_evidence_url, '')), ''),
    case when p_status in ('delivered', 'approved') then now() else null end,
    case when p_status = 'approved' then v_actor_id else null end,
    case when p_status = 'approved' then now() else null end,
    v_actor_id
  )
  returning id into v_deliverable_id;

  return v_deliverable_id;
end;
$$;

create or replace function public.approve_project_deliverable(p_deliverable_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_project_id uuid;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  select d.project_id
    into v_project_id
  from public.deliverables d
  where d.id = p_deliverable_id;

  if v_project_id is null then
    raise exception 'Deliverable not found.';
  end if;

  if not private.can_manage_project(v_project_id) then
    raise exception 'Only a Founder or Owner can approve this deliverable.';
  end if;

  update public.deliverables
  set status = 'approved',
      delivered_at = coalesce(delivered_at, now()),
      approved_by = v_actor_id,
      approved_at = now()
  where id = p_deliverable_id;

  return p_deliverable_id;
end;
$$;

create or replace function public.mark_collaborator_payment_paid(
  p_project_id uuid,
  p_user_id uuid,
  p_hourly_rate_usd numeric,
  p_approved_hours numeric,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_payment_id uuid;
  v_previous_status public.collaborator_payment_status;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  if p_project_id is null then
    raise exception 'Project is required.';
  end if;

  if p_user_id is null then
    raise exception 'Collaborator is required.';
  end if;

  if p_hourly_rate_usd is null or p_hourly_rate_usd < 0 then
    raise exception 'Hourly rate must be zero or greater.';
  end if;

  if p_approved_hours is null or p_approved_hours < 0 then
    raise exception 'Approved hours must be zero or greater.';
  end if;

  if not private.can_manage_project(p_project_id) then
    raise exception 'Only a Founder or Owner can mark payments for this project.';
  end if;

  select cp.id, cp.status
    into v_payment_id, v_previous_status
  from public.collaborator_payments cp
  where cp.project_id = p_project_id
    and cp.user_id = p_user_id
    and cp.hourly_rate_usd = p_hourly_rate_usd
  order by cp.created_at desc
  limit 1;

  if v_payment_id is null then
    insert into public.collaborator_payments (
      project_id,
      user_id,
      hourly_rate_usd,
      approved_hours,
      status,
      paid_at,
      paid_by,
      notes,
      created_by
    )
    values (
      p_project_id,
      p_user_id,
      p_hourly_rate_usd,
      p_approved_hours,
      'paid',
      now(),
      v_actor_id,
      nullif(trim(coalesce(p_note, '')), ''),
      v_actor_id
    )
    returning id into v_payment_id;
  else
    update public.collaborator_payments
    set approved_hours = p_approved_hours,
        status = 'paid',
        paid_at = now(),
        paid_by = v_actor_id,
        notes = coalesce(nullif(trim(coalesce(p_note, '')), ''), notes)
    where id = v_payment_id;
  end if;

  insert into public.collaborator_payment_history (
    payment_id,
    previous_status,
    new_status,
    changed_by,
    note
  )
  values (
    v_payment_id,
    v_previous_status,
    'paid',
    v_actor_id,
    nullif(trim(coalesce(p_note, '')), '')
  );

  return v_payment_id;
end;
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

create or replace function public.assign_existing_project_collaborator(
  p_project_id uuid,
  p_user_id uuid,
  p_role public.project_member_role,
  p_project_title text default null,
  p_hourly_rate_usd numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_project_role_id uuid;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  if p_project_id is null then
    raise exception 'Project is required.';
  end if;

  if p_user_id is null then
    raise exception 'Collaborator is required.';
  end if;

  if p_hourly_rate_usd is not null and p_hourly_rate_usd < 0 then
    raise exception 'Hourly rate must be zero or greater.';
  end if;

  if not private.can_manage_project(p_project_id) then
    raise exception 'Only a Founder or Owner can assign collaborators for this project.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and u.active = true
  ) then
    raise exception 'Collaborator profile not found or inactive.';
  end if;

  if exists (
    select 1
    from public.project_roles pr
    where pr.project_id = p_project_id
      and pr.user_id = p_user_id
  ) then
    raise exception 'This collaborator is already assigned to this project.';
  end if;

  insert into public.project_roles (
    project_id,
    user_id,
    role,
    project_title,
    hourly_rate_usd,
    active,
    invitation_status,
    accepted_at,
    joined_at,
    created_by
  )
  values (
    p_project_id,
    p_user_id,
    p_role,
    nullif(trim(coalesce(p_project_title, '')), ''),
    p_hourly_rate_usd,
    true,
    'active_member',
    now(),
    now(),
    v_actor_id
  )
  returning id into v_project_role_id;

  return v_project_role_id;
end;
$$;

create or replace function public.set_project_role_title(
  p_project_id uuid,
  p_email text,
  p_project_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_project_role_id uuid;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  if p_project_id is null then
    raise exception 'Project is required.';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'Email is required.';
  end if;

  if not private.can_manage_project(p_project_id) then
    raise exception 'Only a Founder or Owner can update project titles for this project.';
  end if;

  select pr.id
    into v_project_role_id
  from public.project_roles pr
  left join public.users u on u.id = pr.user_id
  where pr.project_id = p_project_id
    and (
      lower(pr.invite_email::text) = lower(trim(p_email))
      or lower(u.email::text) = lower(trim(p_email))
    )
  order by pr.updated_at desc, pr.created_at desc
  limit 1;

  if v_project_role_id is null then
    raise exception 'Project role not found for this collaborator.';
  end if;

  update public.project_roles
  set project_title = nullif(trim(coalesce(p_project_title, '')), '')
  where id = v_project_role_id;

  return v_project_role_id;
end;
$$;

create or replace function public.set_project_role_details(
  p_project_id uuid,
  p_email text,
  p_role public.project_member_role default null,
  p_project_title text default null,
  p_hourly_rate_usd numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_project_role_id uuid;
begin
  select private.current_user_id() into v_actor_id;

  if v_actor_id is null then
    raise exception 'Authenticated portal profile not found.';
  end if;

  if p_project_id is null then
    raise exception 'Project is required.';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'Email is required.';
  end if;

  if p_hourly_rate_usd is not null and p_hourly_rate_usd < 0 then
    raise exception 'Hourly rate must be zero or greater.';
  end if;

  if not private.can_manage_project(p_project_id) then
    raise exception 'Only a Founder or Owner can update project role details for this project.';
  end if;

  select pr.id
    into v_project_role_id
  from public.project_roles pr
  left join public.users u on u.id = pr.user_id
  where pr.project_id = p_project_id
    and (
      lower(pr.invite_email::text) = lower(trim(p_email))
      or lower(u.email::text) = lower(trim(p_email))
    )
  order by pr.updated_at desc, pr.created_at desc
  limit 1;

  if v_project_role_id is null then
    raise exception 'Project role not found for this collaborator.';
  end if;

  update public.project_roles
  set role = coalesce(p_role, role),
      project_title = case
        when p_project_title is null then project_title
        else nullif(trim(p_project_title), '')
      end,
      hourly_rate_usd = coalesce(p_hourly_rate_usd, hourly_rate_usd)
  where id = v_project_role_id;

  return v_project_role_id;
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
alter table public.collaborator_payment_history enable row level security;
alter table public.project_tasks enable row level security;
alter table public.time_entries enable row level security;
alter table public.project_documents enable row level security;

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

drop policy if exists collaborator_payment_history_select_project_access on public.collaborator_payment_history;
create policy collaborator_payment_history_select_project_access
on public.collaborator_payment_history
for select
to authenticated
using (
  exists (
    select 1
    from public.collaborator_payments cp
    where cp.id = collaborator_payment_history.payment_id
      and (
        private.is_platform_admin()
        or private.is_global_founder()
        or cp.user_id = (select private.current_user_id())
        or (cp.project_id is not null and private.has_project_access(cp.project_id))
      )
  )
);

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

drop policy if exists project_tasks_select_project_access on public.project_tasks;
create policy project_tasks_select_project_access
on public.project_tasks
for select
to authenticated
using (
  private.has_project_access(project_id)
  or assigned_to = (select private.current_user_id())
);

drop policy if exists project_tasks_insert_project_manager on public.project_tasks;
create policy project_tasks_insert_project_manager
on public.project_tasks
for insert
to authenticated
with check (
  project_id is not null
  and private.can_manage_project(project_id)
);

drop policy if exists project_tasks_update_project_manager_or_assignee on public.project_tasks;
create policy project_tasks_update_project_manager_or_assignee
on public.project_tasks
for update
to authenticated
using (
  private.can_manage_project(project_id)
  or assigned_to = (select private.current_user_id())
)
with check (
  private.can_manage_project(project_id)
  or assigned_to = (select private.current_user_id())
);

drop policy if exists project_tasks_delete_project_manager on public.project_tasks;
create policy project_tasks_delete_project_manager
on public.project_tasks
for delete
to authenticated
using (private.can_manage_project(project_id));

drop policy if exists time_entries_select_owner_or_project_manager on public.time_entries;
create policy time_entries_select_owner_or_project_manager
on public.time_entries
for select
to authenticated
using (
  user_id = (select private.current_user_id())
  or private.can_manage_project(project_id)
);

drop policy if exists time_entries_insert_project_member on public.time_entries;
create policy time_entries_insert_project_member
on public.time_entries
for insert
to authenticated
with check (
  user_id = (select private.current_user_id())
  and coalesce(created_by, (select private.current_user_id())) = (select private.current_user_id())
  and private.has_project_access(project_id)
);

drop policy if exists time_entries_update_owner_or_project_manager on public.time_entries;
create policy time_entries_update_owner_or_project_manager
on public.time_entries
for update
to authenticated
using (
  user_id = (select private.current_user_id())
  or private.can_manage_project(project_id)
)
with check (
  user_id = (select private.current_user_id())
  or private.can_manage_project(project_id)
);

drop policy if exists project_documents_select_project_access on public.project_documents;
create policy project_documents_select_project_access
on public.project_documents
for select
to authenticated
using (private.has_project_access(project_id));

drop policy if exists project_documents_insert_project_member on public.project_documents;
create policy project_documents_insert_project_member
on public.project_documents
for insert
to authenticated
with check (
  private.has_project_access(project_id)
  and coalesce(uploaded_by, (select private.current_user_id())) = (select private.current_user_id())
);

drop policy if exists project_documents_update_uploader_or_project_manager on public.project_documents;
create policy project_documents_update_uploader_or_project_manager
on public.project_documents
for update
to authenticated
using (
  uploaded_by = (select private.current_user_id())
  or private.can_manage_project(project_id)
)
with check (
  uploaded_by = (select private.current_user_id())
  or private.can_manage_project(project_id)
);

drop policy if exists project_documents_delete_project_manager on public.project_documents;
create policy project_documents_delete_project_manager
on public.project_documents
for delete
to authenticated
using (private.can_manage_project(project_id));

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_global_founder() to authenticated;
grant execute on function private.has_project_access(uuid) to authenticated;
grant execute on function private.can_manage_project(uuid) to authenticated;
grant execute on function public.upsert_project_deliverable(
  uuid,
  text,
  text,
  uuid,
  date,
  public.deliverable_status,
  text,
  text,
  text,
  text,
  uuid
) to authenticated;
grant execute on function public.approve_project_deliverable(uuid) to authenticated;
grant execute on function public.mark_collaborator_payment_paid(uuid, uuid, numeric, numeric, text) to authenticated;
grant execute on function public.accept_my_project_invites() to authenticated;
grant execute on function public.assign_existing_project_collaborator(uuid, uuid, public.project_member_role, text, numeric) to authenticated;
grant execute on function public.set_project_role_title(uuid, text, text) to authenticated;
grant execute on function public.set_project_role_details(uuid, text, public.project_member_role, text, numeric) to authenticated;

grant select, insert, update, delete on
  public.projects,
  public.project_roles,
  public.deliverables,
  public.collaborator_payments,
  public.project_tasks,
  public.time_entries,
  public.project_documents
to authenticated;

grant select on public.collaborator_payment_history to authenticated;

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

    begin
      alter publication supabase_realtime add table public.collaborator_payment_history;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.project_tasks;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.time_entries;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.project_documents;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

commit;
