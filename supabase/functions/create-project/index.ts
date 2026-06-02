import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type SupabaseClientAny = any;

type CreateProjectPayload = {
  name?: string;
  slug?: string | null;
  description?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = req.headers.get('Authorization');

    if (!authorization) {
      return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const payload = normalizePayload(await req.json());
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return jsonResponse({ error: 'Invalid or expired user session.' }, 401);
    }

    const actor = await getActor(adminClient, authData.user.id);
    if (!actor) {
      return jsonResponse({ error: 'Portal profile not found for current user.' }, 403);
    }

    const authorized = await canCreateProject(adminClient, actor.id, actor.platform_role);
    if (!authorized) {
      return jsonResponse({ error: 'Only a Founder or platform_admin can create projects.' }, 403);
    }

    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .insert({
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        status: 'active',
        created_by: actor.id
      })
      .select('id, name, slug, description, status, created_at')
      .single();

    if (projectError) {
      throw projectError;
    }

    const { data: projectRole, error: roleError } = await adminClient
      .from('project_roles')
      .upsert({
        project_id: project.id,
        user_id: actor.id,
        role: 'founder',
        active: true,
        invitation_status: 'active_member',
        accepted_at: new Date().toISOString(),
        created_by: actor.id
      }, { onConflict: 'project_id,user_id' })
      .select('id, project_id, user_id, role, invitation_status')
      .single();

    if (roleError) {
      throw roleError;
    }

    return jsonResponse({
      status: 'project_created',
      message: 'Project created',
      project,
      project_role: projectRole
    });
  } catch (error) {
    return jsonResponse({
      status: 'error_creating_project',
      message: 'Error creating project',
      error: error instanceof Error ? error.message : 'Unknown error.'
    }, 400);
  }
});

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function normalizePayload(payload: CreateProjectPayload) {
  const name = String(payload.name || '').trim();
  const slug = normalizeSlug(payload.slug);
  const description = String(payload.description || '').trim() || null;

  if (!name) {
    throw new Error('Project name is required.');
  }

  return {
    name,
    slug,
    description
  };
}

function normalizeSlug(value: string | null | undefined) {
  const slug = String(value || '').trim().toLowerCase();
  if (!slug) {
    return null;
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Project slug must use lowercase letters, numbers, and hyphens.');
  }

  return slug;
}

async function getActor(adminClient: SupabaseClientAny, authUserId: string) {
  const { data, error } = await adminClient
    .from('users')
    .select('id, platform_role, active')
    .eq('auth_user_id', authUserId)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function canCreateProject(adminClient: SupabaseClientAny, actorId: string, platformRole: string) {
  if (['platform_admin', 'founder'].includes(platformRole)) {
    return true;
  }

  const { data, error } = await adminClient
    .from('project_roles')
    .select('id')
    .eq('user_id', actorId)
    .eq('active', true)
    .eq('role', 'founder')
    .limit(1);

  if (error) {
    throw error;
  }

  return Array.isArray(data) && data.length > 0;
}
