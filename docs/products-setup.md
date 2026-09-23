# Bastida Systems — Products setup (Supabase)

Run this once in the Supabase dashboard: **SQL Editor → New query → paste → Run**.
Takes 2 minutes. Afterwards the store admin (`admin/productos.html`) works and
`store.html` shows the products automatically.

> The admin page only opens for logged-in users whose `platform_role` is
> `founder` or `owner` (same roles the portal already uses).

```sql
-- 1. Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  image_url text not null default '',
  stripe_link text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- 2. Public can read active products (the store page uses the anon key)
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  using (active = true);

-- 3. Logged-in users can manage (the admin UI additionally requires
--    founder/owner role, checked against the existing users table)
drop policy if exists "Authenticated manage products" on public.products;
create policy "Authenticated manage products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Keep updated_at fresh
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- 5. Public bucket for product photos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated upload product images" on storage.objects;
create policy "Authenticated upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated update product images" on storage.objects;
create policy "Authenticated update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete product images" on storage.objects;
create policy "Authenticated delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');
```

## Verify

```sql
select * from public.products;  -- empty is fine
```

Then open `https://bastidasystems.com/admin/productos.html`, log in, and add
the first product. It appears on `store.html` immediately.
