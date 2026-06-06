-- Beoflow Client-prod RLS recursion fix.
-- Run this in the Client-prod Supabase SQL Editor.
-- It replaces recursive client policies without creating demo data.

begin;

create schema if not exists private;

create or replace function private.has_client_access(p_client_id uuid)
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
  );
$$;

create or replace function private.can_manage_client(p_client_id uuid)
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
      and cu.role::text in ('owner', 'admin', 'manager')
  )
  or exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.created_by = (select auth.uid())
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.has_client_access(uuid) to authenticated;
grant execute on function private.can_manage_client(uuid) to authenticated;

create index if not exists idx_clients_created_by_status
  on public.clients(created_by, status);

create index if not exists idx_client_users_user_status
  on public.client_users(user_id, status);

create index if not exists idx_client_users_client_status
  on public.client_users(client_id, status);

create index if not exists idx_client_products_client_product_status
  on public.client_products(client_id, product_key, status);

alter table public.clients enable row level security;
alter table public.client_users enable row level security;
alter table public.client_products enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('clients', 'client_users', 'client_products')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy clients_select_member_or_creator
on public.clients
for select
to authenticated
using (
  created_by = (select auth.uid())
  or private.has_client_access(id)
);

create policy clients_insert_creator
on public.clients
for insert
to authenticated
with check (
  created_by = (select auth.uid())
);

create policy clients_update_manager
on public.clients
for update
to authenticated
using (private.can_manage_client(id))
with check (private.can_manage_client(id));

create policy clients_delete_manager
on public.clients
for delete
to authenticated
using (private.can_manage_client(id));

create policy client_users_select_client_members
on public.client_users
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_client_access(client_id)
);

create policy client_users_insert_self_or_manager
on public.client_users
for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and private.can_manage_client(client_id)
  )
  or private.can_manage_client(client_id)
);

create policy client_users_update_manager
on public.client_users
for update
to authenticated
using (private.can_manage_client(client_id))
with check (private.can_manage_client(client_id));

create policy client_users_delete_manager
on public.client_users
for delete
to authenticated
using (private.can_manage_client(client_id));

create policy client_products_select_client_access
on public.client_products
for select
to authenticated
using (private.has_client_access(client_id));

create policy client_products_insert_manager
on public.client_products
for insert
to authenticated
with check (private.can_manage_client(client_id));

create policy client_products_update_manager
on public.client_products
for update
to authenticated
using (private.can_manage_client(client_id))
with check (private.can_manage_client(client_id));

create policy client_products_delete_manager
on public.client_products
for delete
to authenticated
using (private.can_manage_client(client_id));

grant select, insert, update, delete on
  public.clients,
  public.client_users,
  public.client_products
to authenticated;

commit;
