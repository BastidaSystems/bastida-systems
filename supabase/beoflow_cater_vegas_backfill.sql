-- Backfill Cater Vegas admin data into BEOFlow module tables when both schemas
-- live in the same Supabase project. Safe to run more than once.
-- If Cater Vegas Admin is in a separate Supabase project, use the beoflow Edge
-- Function sync instead of this backfill.

begin;

do $$
declare
  v_client_id uuid;
begin
  select c.id
    into v_client_id
  from public.clients c
  where lower(c.name) = lower('Cater Vegas')
  limit 1;

  if v_client_id is null then
    raise notice 'Cater Vegas client was not found in public.clients. Run register_cater_vegas_beoflow_contact.sql first.';
    return;
  end if;

  if to_regclass('public.cater_events') is not null then
    execute $sql$
      insert into public.beoflow_events (
        client_id,
        name,
        event_type,
        event_date,
        guest_count,
        location,
        status,
        notes,
        source,
        source_id,
        source_metadata,
        last_synced_at,
        created_at,
        updated_at
      )
      select
        $1,
        coalesce(nullif(ce.title, ''), 'Cater Vegas event #' || ce.id),
        nullif(ce.event_type, ''),
        ce.event_date,
        ce.guest_count,
        nullif(ce.venue_name, ''),
        coalesce(nullif(ce.status, ''), 'active'),
        concat_ws(
          E'\n',
          nullif(ce.notes, ''),
          case when nullif(ce.budget_label, '') is not null then 'Budget: ' || ce.budget_label end,
          case when nullif(ce.menu_style, '') is not null then 'Menu: ' || ce.menu_style end
        ),
        'cater-vegas',
        ce.id::text,
        jsonb_strip_nulls(jsonb_build_object(
          'cater_event_id', ce.id,
          'cater_workspace_id', ce.workspace_id,
          'budget', ce.budget,
          'budget_label', ce.budget_label,
          'services', ce.services,
          'plan', ce.plan,
          'cater_updated_at', ce.updated_at
        )),
        now(),
        coalesce(ce.created_at, now()),
        coalesce(ce.updated_at, now())
      from public.cater_events ce
      where ce.workspace_id = 'cater-vegas'
      on conflict (client_id, source, source_id) do update set
        name = excluded.name,
        event_type = excluded.event_type,
        event_date = excluded.event_date,
        guest_count = excluded.guest_count,
        location = excluded.location,
        status = excluded.status,
        notes = excluded.notes,
        source_metadata = excluded.source_metadata,
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at
    $sql$ using v_client_id;
  else
    raise notice 'public.cater_events was not found. Skipping event backfill.';
  end if;

  if to_regclass('public.cater_providers') is not null then
    execute $sql$
      insert into public.beoflow_providers (
        client_id,
        name,
        provider_type,
        contact_name,
        email,
        phone,
        website,
        city,
        state,
        status,
        service_category,
        coverage_zone,
        availability,
        base_prices,
        license_insurance,
        public_visible,
        workspace_slug,
        notes,
        source,
        source_id,
        source_metadata,
        last_synced_at,
        created_at,
        updated_at
      )
      select
        $1,
        coalesce(nullif(cp.provider_name, ''), 'Cater Vegas provider #' || cp.id),
        coalesce(nullif(cp.provider_type, ''), 'vendor'),
        nullif(cp.contact_name, ''),
        nullif(cp.email, ''),
        nullif(cp.phone, ''),
        nullif(cp.website, ''),
        nullif(cp.city, ''),
        nullif(cp.state, ''),
        coalesce(nullif(cp.status, ''), 'active'),
        coalesce(nullif(to_jsonb(cp)->>'service_category', ''), nullif(cp.provider_type, '')),
        nullif(to_jsonb(cp)->>'coverage_zone', ''),
        nullif(to_jsonb(cp)->>'availability', ''),
        nullif(to_jsonb(cp)->>'base_prices', ''),
        nullif(to_jsonb(cp)->>'license_insurance', ''),
        coalesce(nullif(to_jsonb(cp)->>'public_visible', '')::boolean, false),
        cp.workspace_id,
        nullif(cp.notes, ''),
        'cater-vegas',
        cp.id::text,
        jsonb_strip_nulls(jsonb_build_object(
          'cater_provider_id', cp.id,
          'cater_workspace_id', cp.workspace_id,
          'cater_created_by', cp.created_by,
          'cater_updated_at', cp.updated_at
        )),
        now(),
        coalesce(cp.created_at, now()),
        coalesce(cp.updated_at, now())
      from public.cater_providers cp
      where cp.workspace_id = 'cater-vegas'
      on conflict (client_id, source, source_id) do update set
        name = excluded.name,
        provider_type = excluded.provider_type,
        contact_name = excluded.contact_name,
        email = excluded.email,
        phone = excluded.phone,
        website = excluded.website,
        city = excluded.city,
        state = excluded.state,
        status = excluded.status,
        service_category = excluded.service_category,
        coverage_zone = excluded.coverage_zone,
        availability = excluded.availability,
        base_prices = excluded.base_prices,
        license_insurance = excluded.license_insurance,
        public_visible = excluded.public_visible,
        workspace_slug = excluded.workspace_slug,
        notes = excluded.notes,
        source_metadata = excluded.source_metadata,
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at
    $sql$ using v_client_id;
  else
    raise notice 'public.cater_providers was not found. Skipping provider backfill.';
  end if;

  insert into public.beoflow_activity_log (
    client_id,
    source,
    source_table,
    source_id,
    activity_type,
    title,
    summary,
    metadata,
    status
  )
  select
    v_client_id,
    'cater-vegas',
    'cater_events',
    e.source_id,
    'event_synced',
    'Synced event: ' || e.name,
    'Cater Vegas event synced into BEOFlow.',
    jsonb_build_object('beoflow_event_id', e.id, 'source_metadata', e.source_metadata),
    'active'
  from public.beoflow_events e
  where e.client_id = v_client_id
    and e.source = 'cater-vegas'
    and e.source_id is not null
  on conflict (client_id, source, source_table, source_id, activity_type) do update set
    title = excluded.title,
    summary = excluded.summary,
    metadata = excluded.metadata,
    status = excluded.status,
    updated_at = now();

  insert into public.beoflow_activity_log (
    client_id,
    source,
    source_table,
    source_id,
    activity_type,
    title,
    summary,
    metadata,
    status
  )
  select
    v_client_id,
    'cater-vegas',
    'cater_providers',
    p.source_id,
    'provider_synced',
    'Synced provider: ' || p.name,
    'Cater Vegas provider synced into BEOFlow.',
    jsonb_build_object('beoflow_provider_id', p.id, 'source_metadata', p.source_metadata),
    'active'
  from public.beoflow_providers p
  where p.client_id = v_client_id
    and p.source = 'cater-vegas'
    and p.source_id is not null
  on conflict (client_id, source, source_table, source_id, activity_type) do update set
    title = excluded.title,
    summary = excluded.summary,
    metadata = excluded.metadata,
    status = excluded.status,
    updated_at = now();
end $$;

commit;
