-- Register Cater Vegas in Beoflow's internal client brain.
-- Run this in the BEOFlow Supabase SQL Editor after beoflow_client_schema.sql.
-- This records Rod as a client contact and grants owner login access when his auth user exists.

begin;

do $$
declare
  v_client_id uuid;
  v_bastida_user_id uuid;
  v_rod_user_id uuid;
  v_product_key text;
begin
  select c.id
    into v_client_id
  from public.clients c
  where lower(c.name) = lower('Cater Vegas')
  limit 1;

  if v_client_id is null then
    insert into public.clients (name, client_type, status)
    values ('Cater Vegas', 'catering', 'active')
    returning id into v_client_id;
  else
    update public.clients
       set client_type = coalesce(nullif(client_type, ''), 'catering'),
           status = 'active',
           updated_at = now()
     where id = v_client_id;
  end if;

  foreach v_product_key in array array['beoflow', 'cater-vegas'] loop
    update public.client_products
       set status = 'active',
           updated_at = now()
     where client_id = v_client_id
       and product_key = v_product_key;

    if not found then
      insert into public.client_products (client_id, product_key, status)
      values (v_client_id, v_product_key, 'active');
    end if;
  end loop;

  select u.id
    into v_bastida_user_id
  from auth.users u
  where lower(u.email) in (
    lower('bastidasystems@gmail.com'),
    lower('david@bastidasystems.com')
  )
  order by u.created_at desc
  limit 1;

  if v_bastida_user_id is not null then
    update public.client_users
       set role = 'owner',
           status = 'active',
           updated_at = now()
     where client_id = v_client_id
       and user_id = v_bastida_user_id;

    if not found then
      insert into public.client_users (client_id, user_id, role, status)
      values (v_client_id, v_bastida_user_id, 'owner', 'active');
    end if;
  else
    raise notice 'BastidaSystems Beoflow auth user was not found. Create/sign in with that account, then run this SQL again to attach owner access.';
  end if;

  select u.id
    into v_rod_user_id
  from auth.users u
  where lower(u.email) = lower('exmarquesado@gmail.com')
  order by u.created_at desc
  limit 1;

  if v_rod_user_id is not null then
    update public.client_users
       set role = 'owner',
           status = 'active',
           updated_at = now()
     where client_id = v_client_id
       and user_id = v_rod_user_id;

    if not found then
      insert into public.client_users (client_id, user_id, role, status)
      values (v_client_id, v_rod_user_id, 'owner', 'active');
    end if;
  else
    raise notice 'Rod Beoflow auth user exmarquesado@gmail.com was not found. Sign in with that account, then run this SQL again to attach owner access.';
  end if;

  update public.beoflow_client_contacts
     set full_name = 'Rodrigo Marquesado',
         contact_type = 'primary',
         role = 'Cater Vegas Admin / Primary Contact',
         phone = null,
         status = 'active',
         notes = 'Cater Vegas owner/admin. Beoflow owner access is granted when the auth user exists.',
         updated_at = now()
   where client_id = v_client_id
     and lower(email) = lower('exmarquesado@gmail.com');

  if not found then
    insert into public.beoflow_client_contacts (
      client_id,
      full_name,
      contact_type,
      role,
      email,
      status,
      notes,
      created_by
    )
    values (
      v_client_id,
      'Rodrigo Marquesado',
      'primary',
      'Cater Vegas Admin / Primary Contact',
      'exmarquesado@gmail.com',
      'active',
      'Cater Vegas owner/admin. Beoflow owner access is granted when the auth user exists.',
      coalesce(v_rod_user_id, v_bastida_user_id)
    );
  end if;
end $$;

commit;
