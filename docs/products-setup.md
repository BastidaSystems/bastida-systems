# Bastida Systems — Products setup (Supabase)

Proyecto de producción: `https://zhtrimaqyxhkisxhxiex.supabase.co`.

## Estado verificado — 23 de septiembre de 2026

Se ejecutaron los esquemas de portal, operating system y productos en el
proyecto nuevo. El bloque aplicado omitió las empresas de ejemplo del esquema
base, fijó el `search_path` de `set_updated_at` y retiró a `PUBLIC`/`anon` el
permiso de ejecutar las funciones privilegiadas de la aplicación. El SQL
exacto quedó [guardado en Supabase](https://supabase.com/dashboard/project/zhtrimaqyxhkisxhxiex/sql/ecd7f46f-cfc7-44c0-a8b5-e417fb39e227).

Verificación: 17 tablas con RLS activo, cuatro vistas con
`security_invoker=true`, bucket `product-images` público y consulta pública
del catálogo con HTTP 200. Una prueba transaccional en el proyecto confirmó
que visitantes/clientes no pueden escribir, un founder activo puede gestionar
productos y un founder inactivo no puede escribir. La transacción se revirtió:
quedaron cero usuarios y cero productos de prueba.

Security Advisor mostró cero errores y nueve avisos: `citext` en `public`,
listado del bucket público y siete RPC del portal con `SECURITY DEFINER`
accesibles a usuarios autenticados. Esos RPC incluyen comprobaciones internas
de usuario/rol y ninguno tiene ejecución anónima. Esto no constituye una
auditoría completa de los módulos del portal.

Auth tiene `https://bastidasystems.com` como Site URL y estas cuatro URL
permitidas: `/login.html`, `/portal.html`, `/set-password.html` y
`/reset-password.html`, todas bajo `https://bastidasystems.com`.
El proyecto usa el correo predeterminado de Supabase. La página de inicio
reenvía las sesiones de invitación y recuperación a `/set-password.html`,
conservando el fragmento de autenticación; así funciona también la invitación
del dashboard, que no permite indicar `redirectTo`.

Se publicó la conexión al proyecto nuevo en el commit `e5a3801`; GitHub Pages
terminó correctamente y se verificaron los archivos servidos por el dominio.
También se comprobó en el navegador que un enlace de autenticación recibido
en la página de inicio llega a `/set-password.html`.

Con autorización de David se envió la invitación a la cuenta administradora
indicada y se asignó `founder` a su perfil. La consulta de verificación confirmó
un perfil activo y la invitación enviada. La confirmación del correo y creación
de contraseña quedan a cargo del titular de la cuenta.

Pendiente: aceptar la invitación, crear la contraseña y probar el panel con un
producto y una foto reales. No se han migrado cuentas ni datos del proyecto
anterior.

## Antes de ejecutar

Este SQL configura únicamente productos e imágenes. En un proyecto nuevo,
ejecuta primero `supabase/bastida_portal_schema.sql` y después
`supabase/bastida_operating_system_schema.sql`, cada archivo por separado.
El panel depende de `public.users`; las cuentas y datos del proyecto anterior
no se transfieren al cambiar la URL y la clave.

La cuenta que administrará la tienda debe existir en **Authentication → Users**
y tener un perfil activo en `public.users` con `platform_role = 'founder'`
(o el rol global `owner` si tu esquema lo admite). La asignación inicial del
rol corresponde al administrador de la base de datos; un usuario no puede
asignárselo desde el navegador. Un rol `owner` de un proyecto en `project_roles`
no otorga administración global de la tienda.

## SQL de productos

En **SQL Editor → New query**, pega el bloque completo y pulsa **Run**.
También reemplaza las políticas demasiado amplias del SQL anterior:
solo un founder/owner activo puede modificar productos o imágenes, incluso
cuando llama directamente a la API sin pasar por el panel.

```sql
begin;

-- Fail before making changes if the portal prerequisites are missing.
do $$
begin
  if to_regclass('public.users') is null then
    raise exception 'Falta public.users. Ejecuta primero bastida_portal_schema.sql y bastida_operating_system_schema.sql.';
  end if;
end;
$$;

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

-- Explicit grants are needed on projects without automatic Data API grants.
grant usage on schema public to anon, authenticated;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

-- 2. Visitors and signed-in customers can read active products.
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

-- 3. Enforce the admin role in the database, not only in the UI.
drop policy if exists "Authenticated manage products" on public.products;
create policy "Authenticated manage products"
  on public.products for all
  to authenticated
  using (exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ))
  with check (exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ));

-- 4. Keep updated_at fresh
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- 5. Public bucket for product photos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated upload product images" on storage.objects;
create policy "Authenticated upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ));

drop policy if exists "Authenticated update product images" on storage.objects;
create policy "Authenticated update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ))
  with check (bucket_id = 'product-images' and exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ));

drop policy if exists "Authenticated delete product images" on storage.objects;
create policy "Authenticated delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and exists (
    select 1 from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.active = true
      and u.platform_role::text in ('founder', 'owner')
  ));

commit;
```

## Verificar y publicar

```sql
select * from public.products; -- Vacío está bien.
select id, public from storage.buckets where id = 'product-images';
select platform_role, active from public.users where platform_role::text in ('founder', 'owner');
```

Configura en `supabase-config.js` la URL y la **publishable key** del mismo
proyecto. La propiedad existente `anonKey` acepta la clave `sb_publishable_…`;
no necesita una clave antigua. Publica los archivos actualizados para que
`bastidasystems.com` reciba la nueva configuración. Este archivo también
configura el login y el portal: verifica sus tablas y usuarios antes de publicar.

Inicia sesión con el administrador del proyecto nuevo y abre
`https://bastidasystems.com/admin/productos.html`. Agrega un producto con foto,
comprueba que aparece en `store.html` y que desaparece al pausarlo. La tienda
oculta la sección cuando no hay productos activos.

Comprueba además con una cuenta de cliente que la API rechaza insertar,
modificar o borrar productos e imágenes. El menú del navegador por sí solo
no es una barrera de permisos.

Referencias: [permisos de la Data API](https://supabase.com/docs/guides/api/securing-your-api),
[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
