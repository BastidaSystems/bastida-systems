import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const INVITE_REDIRECT_URL = 'https://bastidasystems.com/set-password.html';
const allowedRoles = new Set(['founder', 'owner', 'core_collaborator', 'contractor']);
type SupabaseClientAny = any;

type InvitePayload = {
  name?: string;
  email?: string;
  project_id?: string;
  role?: string;
  hourly_rate_usd?: number | string | null;
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

    const authorized = await canInviteForProject(adminClient, actor.id, actor.platform_role, payload.project_id);
    if (!authorized) {
      return jsonResponse({ error: 'Only a Founder or Owner can invite members for this project.' }, 403);
    }

    const project = await getProject(adminClient, payload.project_id);
    if (!project) {
      return jsonResponse({ error: 'Project not found.' }, 404);
    }

    const existingProfile = await findProfileByEmail(adminClient, payload.email);

    if (existingProfile) {
      const projectRole = await upsertProjectRole(adminClient, {
        projectId: payload.project_id,
        userId: existingProfile.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        hourlyRateUsd: payload.hourly_rate_usd,
        actorId: actor.id,
        invitationStatus: 'active_member'
      });

      return jsonResponse({
        status: 'active_member',
        message: 'Active member',
        project_role: projectRole,
        project
      });
    }

    const inviteResult = await adminClient.auth.admin.inviteUserByEmail(payload.email, {
      redirectTo: INVITE_REDIRECT_URL,
      data: {
        full_name: payload.name,
        name: payload.name
      }
    });

    if (inviteResult.error) {
      const errorRole = await recordInviteError(adminClient, {
        projectId: payload.project_id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        hourlyRateUsd: payload.hourly_rate_usd,
        actorId: actor.id,
        errorMessage: inviteResult.error.message
      });

      return jsonResponse({
        status: 'error_sending_invite',
        message: 'Error sending invite',
        error: inviteResult.error.message,
        project_role: errorRole,
        project
      }, 400);
    }

    const invitedAuthUser = inviteResult.data.user;
    if (!invitedAuthUser?.id) {
      return jsonResponse({ error: 'Supabase Auth did not return an invited user.' }, 502);
    }

    const invitedProfile = await ensureProfile(adminClient, {
      authUserId: invitedAuthUser.id,
      name: payload.name,
      email: payload.email
    });

    const projectRole = await upsertProjectRole(adminClient, {
      projectId: payload.project_id,
      userId: invitedProfile.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      hourlyRateUsd: payload.hourly_rate_usd,
      actorId: actor.id,
      invitationStatus: 'pending_acceptance'
    });

    return jsonResponse({
      status: 'invite_sent',
      message: 'Invite sent',
      project_role: projectRole,
      project
    });
  } catch (error) {
    return jsonResponse({
      status: 'error_sending_invite',
      message: 'Error sending invite',
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

function normalizePayload(payload: InvitePayload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const projectId = String(payload.project_id || '').trim();
  const role = String(payload.role || '').trim();
  const hourlyRate = payload.hourly_rate_usd === '' || payload.hourly_rate_usd === null || typeof payload.hourly_rate_usd === 'undefined'
    ? null
    : Number(payload.hourly_rate_usd);

  if (!name) {
    throw new Error('Name is required.');
  }

  if (!isValidEmail(email)) {
    throw new Error('A valid email is required.');
  }

  if (!projectId) {
    throw new Error('Project is required.');
  }

  if (!allowedRoles.has(role)) {
    throw new Error('Role is invalid.');
  }

  if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0)) {
    throw new Error('Hourly rate must be a positive number.');
  }

  return {
    name,
    email,
    project_id: projectId,
    role,
    hourly_rate_usd: hourlyRate
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

async function canInviteForProject(
  adminClient: SupabaseClientAny,
  actorId: string,
  platformRole: string,
  projectId: string
) {
  if (['platform_admin', 'founder'].includes(platformRole)) {
    return true;
  }

  const { data, error } = await adminClient
    .from('project_roles')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', actorId)
    .eq('active', true)
    .in('role', ['founder', 'owner'])
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function getProject(adminClient: SupabaseClientAny, projectId: string) {
  const { data, error } = await adminClient
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function findProfileByEmail(adminClient: SupabaseClientAny, email: string) {
  const { data, error } = await adminClient
    .from('users')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureProfile(
  adminClient: SupabaseClientAny,
  input: { authUserId: string; name: string; email: string }
) {
  const { data, error } = await adminClient
    .from('users')
    .upsert({
      auth_user_id: input.authUserId,
      email: input.email,
      full_name: input.name,
      active: true
    }, { onConflict: 'auth_user_id' })
    .select('id, email, full_name')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertProjectRole(
  adminClient: SupabaseClientAny,
  input: {
    projectId: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    hourlyRateUsd: number | null;
    actorId: string;
    invitationStatus: 'pending_acceptance' | 'active_member';
  }
) {
  const existingUserRole = await findProjectRoleByUserId(adminClient, input.projectId, input.userId);
  const existingInviteRole = await findProjectRoleByInviteEmail(adminClient, input.projectId, input.email);

  if (existingUserRole && existingInviteRole && existingUserRole.id !== existingInviteRole.id) {
    const { error } = await adminClient
      .from('project_roles')
      .delete()
      .eq('id', existingInviteRole.id);

    if (error) {
      throw error;
    }
  }

  const existingRoleId = existingUserRole?.id || existingInviteRole?.id;
  const payload = {
    project_id: input.projectId,
    user_id: input.userId,
    role: input.role,
    hourly_rate_usd: input.hourlyRateUsd,
    active: true,
    invite_email: input.email,
    invited_name: input.name,
    invited_by: input.actorId,
    invited_at: new Date().toISOString(),
    invitation_status: input.invitationStatus,
    last_invite_error: null,
    accepted_at: input.invitationStatus === 'active_member' ? new Date().toISOString() : null,
    created_by: input.actorId
  };
  const query = existingRoleId
    ? adminClient.from('project_roles').update(payload).eq('id', existingRoleId)
    : adminClient.from('project_roles').insert(payload);

  const { data, error } = await query
    .select('id, project_id, user_id, role, hourly_rate_usd, active, invite_email, invited_name, invitation_status, last_invite_error')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function findProjectRoleByUserId(adminClient: SupabaseClientAny, projectId: string, userId: string) {
  const { data, error } = await adminClient
    .from('project_roles')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function recordInviteError(
  adminClient: SupabaseClientAny,
  input: {
    projectId: string;
    name: string;
    email: string;
    role: string;
    hourlyRateUsd: number | null;
    actorId: string;
    errorMessage: string;
  }
) {
  const existing = await findProjectRoleByInviteEmail(adminClient, input.projectId, input.email);
  const payload = {
    project_id: input.projectId,
    user_id: null,
    role: input.role,
    hourly_rate_usd: input.hourlyRateUsd,
    active: false,
    invite_email: input.email,
    invited_name: input.name,
    invited_by: input.actorId,
    invited_at: new Date().toISOString(),
    invitation_status: 'error_sending_invite',
    last_invite_error: input.errorMessage,
    created_by: input.actorId
  };

  const query = existing
    ? adminClient.from('project_roles').update(payload).eq('id', existing.id)
    : adminClient.from('project_roles').insert(payload);

  const { data, error } = await query
    .select('id, project_id, user_id, role, hourly_rate_usd, active, invite_email, invited_name, invitation_status, last_invite_error')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function findProjectRoleByInviteEmail(adminClient: SupabaseClientAny, projectId: string, email: string) {
  const { data, error } = await adminClient
    .from('project_roles')
    .select('id')
    .eq('project_id', projectId)
    .eq('invite_email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
