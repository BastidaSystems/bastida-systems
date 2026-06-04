-- FiltraCore equipment fields migration.
-- Run manually in the Client-prod Supabase SQL Editor when ready.
-- Adds fields for real equipment/filter capture from venue-machine sheets.
-- This file creates no demo data, no users, and does not modify RLS policies.

begin;

alter table public.filtracore_systems
  add column if not exists asset_reference text,
  add column if not exists equipment_photo_url text;

alter table public.filtracore_filters
  add column if not exists filter_quantity integer default 1,
  add column if not exists filter_photo_url text;

alter table public.filtracore_filters
  alter column filter_quantity set default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'filtracore_filters_filter_quantity_check'
      and conrelid = 'public.filtracore_filters'::regclass
  ) then
    alter table public.filtracore_filters
      add constraint filtracore_filters_filter_quantity_check
      check (filter_quantity >= 1);
  end if;
end $$;

create index if not exists filtracore_systems_asset_reference_idx
  on public.filtracore_systems (asset_reference);

create index if not exists filtracore_filters_filter_quantity_idx
  on public.filtracore_filters (filter_quantity);

commit;
