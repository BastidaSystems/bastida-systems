-- LineOps in-app Market: Amazon affiliate fields on the public catalog.
--
-- Run this ONCE in the Supabase SQL editor of the bastidasystems.com project
-- (https://zhtrimaqyxhkisxhxiex.supabase.co). No RLS changes needed: the
-- existing "Public read active products" policy is table-level, so the new
-- columns are publicly readable as soon as they exist.
--
-- Rollback:
--   alter table public.products drop column if exists amazon_url;
--   alter table public.products drop column if exists show_in_market;

alter table public.products
  add column if not exists amazon_url text;

alter table public.products
  add column if not exists show_in_market boolean not null default false;
