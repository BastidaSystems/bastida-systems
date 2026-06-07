-- Beoflow Client-prod schema.
-- Run this in the Client-prod Supabase SQL Editor after the shared clients tables exist.
-- Creates Beoflow module tables with no demo recipes, ingredients, subrecipes, or prices.

begin;

create extension if not exists pgcrypto;

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.has_beoflow_client_access(p_client_id uuid)
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
      and cp.product_key = 'beoflow'
      and coalesce(cp.status::text, 'active') = 'active'
  );
$$;

create or replace function private.has_beoflow_client_role(
  p_client_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_beoflow_client_access(p_client_id)
    and exists (
      select 1
      from public.client_users cu
      where cu.client_id = p_client_id
        and cu.user_id = (select auth.uid())
        and coalesce(cu.status::text, 'active') = 'active'
        and cu.role::text = any(p_roles)
    );
$$;

grant execute on function private.has_beoflow_client_access(uuid) to authenticated;
grant execute on function private.has_beoflow_client_role(uuid, text[]) to authenticated;

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

alter table if exists public.clients
  add column if not exists beoflow_waste_percentage numeric(12, 4) not null default 0.1,
  add column if not exists beoflow_food_factor numeric(12, 4) not null default 1;

create table if not exists public.beoflow_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  event_type text,
  event_date date,
  start_time time,
  end_time time,
  guest_count integer check (guest_count is null or guest_count >= 0),
  location text,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beoflow_menu_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  recipe_id uuid,
  recipe_name text,
  category text,
  description text,
  price numeric(12, 2) check (price is null or price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or sale_price >= 0),
  recipe_cost numeric(12, 4),
  suggested_sale_price numeric(12, 4),
  cost_percentage numeric(12, 4),
  margin_percentage numeric(12, 4),
  profit numeric(12, 4),
  price_cost_ratio numeric(12, 4),
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.beoflow_menu_items
  add column if not exists recipe_id uuid,
  add column if not exists recipe_name text,
  add column if not exists sale_price numeric(12, 2),
  add column if not exists recipe_cost numeric(12, 4),
  add column if not exists suggested_sale_price numeric(12, 4),
  add column if not exists cost_percentage numeric(12, 4),
  add column if not exists margin_percentage numeric(12, 4),
  add column if not exists profit numeric(12, 4),
  add column if not exists price_cost_ratio numeric(12, 4),
  add column if not exists notes text;

create table if not exists public.beoflow_inventory_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  item_code text,
  name text not null,
  inventory_type text not null default 'raw_ingredient',
  source_subrecipe_id uuid,
  category text,
  brand text,
  base_unit text,
  unit text,
  package_quantity numeric(12, 4),
  package_unit text,
  package_price numeric(12, 4),
  current_stock numeric(12, 3) not null default 0,
  minimum_stock numeric(12, 3) not null default 0,
  cost_per_unit numeric(12, 6) not null default 0,
  supplier text,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.beoflow_inventory_items
  add column if not exists item_code text,
  add column if not exists inventory_type text not null default 'raw_ingredient',
  add column if not exists source_subrecipe_id uuid,
  add column if not exists brand text,
  add column if not exists base_unit text,
  add column if not exists unit text,
  add column if not exists package_quantity numeric(12, 4),
  add column if not exists package_unit text,
  add column if not exists package_price numeric(12, 4),
  add column if not exists current_stock numeric(12, 3) not null default 0,
  add column if not exists minimum_stock numeric(12, 3) not null default 0,
  add column if not exists cost_per_unit numeric(12, 6) not null default 0,
  add column if not exists supplier text,
  add column if not exists notes text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'beoflow_inventory_items'
      and column_name = 'quantity'
  ) then
    update public.beoflow_inventory_items
    set current_stock = coalesce(current_stock, quantity)
    where current_stock = 0 and quantity is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'beoflow_inventory_items'
      and column_name = 'par_level'
  ) then
    update public.beoflow_inventory_items
    set minimum_stock = coalesce(minimum_stock, par_level)
    where minimum_stock = 0 and par_level is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'beoflow_inventory_items'
      and column_name = 'vendor'
  ) then
    update public.beoflow_inventory_items
    set supplier = coalesce(supplier, vendor)
    where supplier is null and vendor is not null;
  end if;

  update public.beoflow_inventory_items
  set base_unit = coalesce(base_unit, unit)
  where base_unit is null and unit is not null;

  update public.beoflow_inventory_items
  set package_quantity = 1
  where package_quantity is null and cost_per_unit > 0;

  update public.beoflow_inventory_items
  set package_price = cost_per_unit
  where package_price is null and cost_per_unit > 0;

  update public.beoflow_inventory_items
  set item_code = upper('ITEM-' || substr(id::text, 1, 8))
  where item_code is null or btrim(item_code) = '';
end $$;

create table if not exists public.beoflow_recipes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  category text,
  recipe_number text,
  pax numeric(12, 3),
  yield_quantity numeric(12, 3),
  yield_unit text,
  portion_count numeric(12, 3),
  prep_time text,
  cook_time text,
  procedure text,
  instructions text,
  notes text,
  responsible text,
  photo_url text,
  ingredients jsonb not null default '[]'::jsonb,
  total_cost numeric(12, 4) not null default 0,
  total_ingredient_cost numeric(12, 4) not null default 0,
  waste_percentage numeric(12, 4) not null default 0.1,
  waste_cost numeric(12, 4) not null default 0,
  unit_cost_total numeric(12, 4) not null default 0,
  food_factor numeric(12, 4) not null default 1,
  food_factor_total numeric(12, 4) not null default 0,
  suggested_sale_price numeric(12, 4) not null default 0,
  manual_sale_price numeric(12, 4),
  final_sale_price numeric(12, 4),
  cost_percentage numeric(12, 4),
  margin_percentage numeric(12, 4),
  profit numeric(12, 4),
  price_cost_ratio numeric(12, 4),
  cost_per_yield_unit numeric(12, 4),
  cost_per_portion numeric(12, 4),
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.beoflow_recipes
  add column if not exists recipe_number text,
  add column if not exists pax numeric(12, 3),
  add column if not exists yield_unit text,
  add column if not exists portion_count numeric(12, 3),
  add column if not exists prep_time text,
  add column if not exists cook_time text,
  add column if not exists procedure text,
  add column if not exists instructions text,
  add column if not exists notes text,
  add column if not exists responsible text,
  add column if not exists photo_url text,
  add column if not exists ingredients jsonb not null default '[]'::jsonb,
  add column if not exists total_cost numeric(12, 4) not null default 0,
  add column if not exists total_ingredient_cost numeric(12, 4) not null default 0,
  add column if not exists waste_percentage numeric(12, 4) not null default 0.1,
  add column if not exists waste_cost numeric(12, 4) not null default 0,
  add column if not exists unit_cost_total numeric(12, 4) not null default 0,
  add column if not exists food_factor numeric(12, 4) not null default 1,
  add column if not exists food_factor_total numeric(12, 4) not null default 0,
  add column if not exists suggested_sale_price numeric(12, 4) not null default 0,
  add column if not exists manual_sale_price numeric(12, 4),
  add column if not exists final_sale_price numeric(12, 4),
  add column if not exists cost_percentage numeric(12, 4),
  add column if not exists margin_percentage numeric(12, 4),
  add column if not exists profit numeric(12, 4),
  add column if not exists price_cost_ratio numeric(12, 4),
  add column if not exists cost_per_yield_unit numeric(12, 4),
  add column if not exists cost_per_portion numeric(12, 4);

do $$
declare
  ingredient_data_type text;
begin
  select data_type
  into ingredient_data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'beoflow_recipes'
    and column_name = 'ingredients';

  if ingredient_data_type is not null and ingredient_data_type <> 'jsonb' then
    alter table public.beoflow_recipes
      alter column ingredients drop default,
      alter column ingredients type jsonb using (
        case
          when ingredients is null or btrim(ingredients::text) = '' then '[]'::jsonb
          else jsonb_build_array(jsonb_build_object(
            'itemType', 'inventory',
            'inventoryItemId', '',
            'ingredientName', ingredients::text,
            'quantity', 0,
            'unit', '',
            'packagePrice', 0,
            'packageQuantity', 1,
            'lineCost', 0,
            'validationStatus', 'legacy'
          ))
        end
      ),
      alter column ingredients set default '[]'::jsonb,
      alter column ingredients set not null;
  end if;

  update public.beoflow_recipes
  set procedure = coalesce(procedure, instructions)
  where procedure is null and instructions is not null;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'beoflow_menu_items'
      and constraint_name = 'beoflow_menu_items_recipe_id_fkey'
  ) then
    alter table public.beoflow_menu_items
      add constraint beoflow_menu_items_recipe_id_fkey
      foreign key (recipe_id) references public.beoflow_recipes(id) on delete set null;
  end if;
end $$;

create table if not exists public.beoflow_subrecipes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  category text,
  recipe_number text,
  yield_quantity numeric(12, 3),
  yield_unit text,
  photo_url text,
  procedure text,
  notes text,
  ingredients jsonb not null default '[]'::jsonb,
  total_cost numeric(12, 4) not null default 0,
  total_ingredient_cost numeric(12, 4) not null default 0,
  waste_percentage numeric(12, 4) not null default 0.1,
  waste_cost numeric(12, 4) not null default 0,
  unit_cost_total numeric(12, 4) not null default 0,
  food_factor numeric(12, 4) not null default 1,
  food_factor_total numeric(12, 4) not null default 0,
  suggested_sale_price numeric(12, 4) not null default 0,
  final_sale_price numeric(12, 4),
  cost_percentage numeric(12, 4),
  margin_percentage numeric(12, 4),
  profit numeric(12, 4),
  price_cost_ratio numeric(12, 4),
  cost_per_yield_unit numeric(12, 4),
  cost_per_portion numeric(12, 4),
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.beoflow_subrecipes
  add column if not exists photo_url text;

create table if not exists public.beoflow_production_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  production_date date,
  shift text,
  assigned_to text,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beoflow_staff (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_beoflow_events_client_id on public.beoflow_events(client_id);
create index if not exists idx_beoflow_menu_items_client_id on public.beoflow_menu_items(client_id);
create index if not exists idx_beoflow_menu_items_recipe_id on public.beoflow_menu_items(client_id, recipe_id);
create index if not exists idx_beoflow_inventory_items_client_id on public.beoflow_inventory_items(client_id);
create index if not exists idx_beoflow_inventory_items_name on public.beoflow_inventory_items(client_id, name);
create index if not exists idx_beoflow_inventory_items_type on public.beoflow_inventory_items(client_id, inventory_type);
create index if not exists idx_beoflow_inventory_items_source_subrecipe_id on public.beoflow_inventory_items(source_subrecipe_id);
create index if not exists idx_beoflow_inventory_items_client_lower_name
  on public.beoflow_inventory_items(client_id, lower(name));
create unique index if not exists idx_beoflow_inventory_items_client_code_unique
  on public.beoflow_inventory_items(client_id, upper(item_code))
  where status <> 'archived' and item_code is not null and btrim(item_code) <> '';
create unique index if not exists idx_beoflow_inventory_items_subrecipe_source_unique
  on public.beoflow_inventory_items(client_id, source_subrecipe_id)
  where status <> 'archived' and inventory_type = 'subrecipe' and source_subrecipe_id is not null;
create index if not exists idx_beoflow_recipes_client_id on public.beoflow_recipes(client_id);
create index if not exists idx_beoflow_recipes_ingredients on public.beoflow_recipes using gin (ingredients);
create index if not exists idx_beoflow_subrecipes_client_id on public.beoflow_subrecipes(client_id);
create index if not exists idx_beoflow_subrecipes_ingredients on public.beoflow_subrecipes using gin (ingredients);
create index if not exists idx_beoflow_production_logs_client_id on public.beoflow_production_logs(client_id);
create index if not exists idx_beoflow_staff_client_id on public.beoflow_staff(client_id);

drop trigger if exists set_beoflow_events_updated_at on public.beoflow_events;
create trigger set_beoflow_events_updated_at
before update on public.beoflow_events
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_menu_items_updated_at on public.beoflow_menu_items;
create trigger set_beoflow_menu_items_updated_at
before update on public.beoflow_menu_items
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_inventory_items_updated_at on public.beoflow_inventory_items;
create trigger set_beoflow_inventory_items_updated_at
before update on public.beoflow_inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_recipes_updated_at on public.beoflow_recipes;
create trigger set_beoflow_recipes_updated_at
before update on public.beoflow_recipes
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_subrecipes_updated_at on public.beoflow_subrecipes;
create trigger set_beoflow_subrecipes_updated_at
before update on public.beoflow_subrecipes
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_production_logs_updated_at on public.beoflow_production_logs;
create trigger set_beoflow_production_logs_updated_at
before update on public.beoflow_production_logs
for each row execute function public.set_updated_at();

drop trigger if exists set_beoflow_staff_updated_at on public.beoflow_staff;
create trigger set_beoflow_staff_updated_at
before update on public.beoflow_staff
for each row execute function public.set_updated_at();

alter table public.beoflow_events enable row level security;
alter table public.beoflow_menu_items enable row level security;
alter table public.beoflow_inventory_items enable row level security;
alter table public.beoflow_recipes enable row level security;
alter table public.beoflow_subrecipes enable row level security;
alter table public.beoflow_production_logs enable row level security;
alter table public.beoflow_staff enable row level security;

do $$
declare
  table_name text;
  policy_record record;
  module_tables text[] := array[
    'beoflow_events',
    'beoflow_menu_items',
    'beoflow_inventory_items',
    'beoflow_recipes',
    'beoflow_subrecipes',
    'beoflow_production_logs',
    'beoflow_staff'
  ];
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(module_tables)
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;

  foreach table_name in array module_tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.has_beoflow_client_access(client_id))',
      table_name || '_select_client_access',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_beoflow_client_role(client_id, array[''owner'', ''admin'', ''manager'']))',
      table_name || '_insert_manager',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_beoflow_client_role(client_id, array[''owner'', ''admin'', ''manager''])) with check (private.has_beoflow_client_role(client_id, array[''owner'', ''admin'', ''manager'']))',
      table_name || '_update_manager',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.has_beoflow_client_role(client_id, array[''owner'', ''admin'', ''manager'']))',
      table_name || '_delete_manager',
      table_name
    );
  end loop;
end $$;

grant select, insert, update, delete on
  public.beoflow_events,
  public.beoflow_menu_items,
  public.beoflow_inventory_items,
  public.beoflow_recipes,
  public.beoflow_subrecipes,
  public.beoflow_production_logs,
  public.beoflow_staff
to authenticated;

commit;
