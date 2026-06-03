const ENABLE_DEMO_DATA = false;

const config = window.BEOFLOW_CLIENT_PROD_CONFIG || {};
const missingAnonKeyValues = new Set([
  '',
  '[PEGA AQUÍ TU ANON PUBLIC KEY]',
  'PASTE_CLIENT_PROD_ANON_PUBLIC_KEY_HERE'
]);

const state = {
  supabase: null,
  user: null,
  profile: null,
  userClients: [],
  activeClient: null,
  authMode: 'signin',
  isRecoveryMode: false,
  passwordUpdatePending: false,
  loading: false
};

const els = {};

function cacheElements() {
  [
    'auth-view',
    'auth-title',
    'auth-subtitle',
    'session-loading-view',
    'workspace-view',
    'config-alert',
    'auth-message',
    'auth-tabs',
    'auth-form',
    'auth-full-name',
    'auth-email',
    'auth-password',
    'auth-submit',
    'forgot-password-button',
    'password-reset-request-form',
    'reset-email',
    'reset-submit',
    'back-to-sign-in-button',
    'password-recovery-form',
    'new-password',
    'confirm-new-password',
    'update-password-submit',
    'full-name-field',
    'show-sign-in',
    'show-sign-up',
    'workspace-title',
    'workspace-subtitle',
    'workspace-message',
    'onboarding-view',
    'client-selector-view',
    'dashboard-view',
    'client-form',
    'client-name',
    'client-type',
    'client-city',
    'client-state',
    'client-timezone',
    'create-client-button',
    'client-list',
    'dashboard-title',
    'dashboard-description',
    'switch-client-button',
    'sign-out-button'
  ].forEach(id => {
    els[id] = document.getElementById(id);
  });
}

function isMissingClientProdKey() {
  return !config.anonKey || missingAnonKeyValues.has(String(config.anonKey).trim());
}

function getProductionRedirectUrl() {
  return config.productionRedirectUrl || 'https://bastidasystems.com/beoflow-app.html';
}

function getAuthRedirectUrl() {
  const redirectOverride = new URLSearchParams(window.location.search).get('auth_redirect');
  if (redirectOverride === 'local') {
    return config.localRedirectUrl || window.location.href;
  }

  if (redirectOverride === 'production') {
    return getProductionRedirectUrl();
  }

  if (config.authRedirectMode === 'production') {
    return getProductionRedirectUrl();
  }

  const hostname = window.location.hostname || '';
  if (hostname.includes('localhost') || hostname === '127.0.0.1') {
    return config.localRedirectUrl || window.location.href;
  }

  return getProductionRedirectUrl();
}

function getEmailActionRedirectUrl() {
  const redirectOverride = new URLSearchParams(window.location.search).get('auth_redirect');
  if (redirectOverride === 'local') {
    return config.localRedirectUrl || window.location.href;
  }

  return getProductionRedirectUrl();
}

function getCombinedAuthParam(name) {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return searchParams.get(name) || hashParams.get(name);
}

function sanitizeAuthUrlPart(value) {
  if (!value) return '';

  const prefix = value.startsWith('#') ? '#' : value.startsWith('?') ? '?' : '';
  const params = new URLSearchParams(value.replace(/^[#?]/, ''));
  [
    'access_token',
    'refresh_token',
    'token',
    'token_hash',
    'code',
    'provider_token',
    'provider_refresh_token'
  ].forEach(key => {
    if (params.has(key)) params.set(key, '[redacted]');
  });

  const sanitized = params.toString();
  return sanitized ? `${prefix}${sanitized}` : prefix;
}

function getAuthUrlState() {
  const type = getCombinedAuthParam('type');
  const accessToken = getCombinedAuthParam('access_token');
  const refreshToken = getCombinedAuthParam('refresh_token');
  const code = getCombinedAuthParam('code');
  const error = getCombinedAuthParam('error');
  const errorDescription = getCombinedAuthParam('error_description');
  const hasTokenParams = Boolean(accessToken || refreshToken);
  const hasCode = Boolean(code);
  const hasError = Boolean(error || errorDescription);
  const hasAuthParams = Boolean(type || hasTokenParams || hasCode || hasError);
  const isRecovery = type === 'recovery' || (!type && (hasTokenParams || hasCode));

  return {
    type,
    accessToken,
    refreshToken,
    code,
    error,
    errorDescription,
    hasTokenParams,
    hasCode,
    hasError,
    hasAuthParams,
    isRecovery
  };
}

function logAuthUrlState() {
  console.log('[Beoflow Auth] URL hash/search detected', {
    hash: sanitizeAuthUrlPart(window.location.hash),
    search: sanitizeAuthUrlPart(window.location.search)
  });
}

function cleanAuthUrl() {
  if (!window.history?.replaceState) return;
  if (!window.location.search && !window.location.hash) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function showAlert(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('app-alert-success', type === 'success');
}

function clearAlerts() {
  showAlert(els['auth-message'], '');
  showAlert(els['workspace-message'], '');
}

function setLoading(isLoading) {
  state.loading = isLoading;
  [
    els['auth-submit'],
    els['reset-submit'],
    els['update-password-submit'],
    els['create-client-button'],
    els['sign-out-button'],
    els['switch-client-button']
  ].forEach(button => {
    if (button) button.disabled = isLoading;
  });
}

function formatClientType(value) {
  return String(value || 'client')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function hideWorkspaceSections() {
  els['onboarding-view'].hidden = true;
  els['client-selector-view'].hidden = true;
  els['dashboard-view'].hidden = true;
}

function renderLoadingSession() {
  els['session-loading-view'].hidden = false;
  els['auth-view'].hidden = true;
  els['workspace-view'].hidden = true;
}

function setAuthCopy(title, subtitle) {
  if (els['auth-title']) els['auth-title'].textContent = title;
  if (els['auth-subtitle']) els['auth-subtitle'].textContent = subtitle;
}

function renderAuthView() {
  state.isRecoveryMode = false;
  setAuthCopy(
    'Kitchen operations workspace',
    'Sign in or create an account to manage your restaurant, events, recipes, inventory, staff, and reports.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  els['auth-tabs'].hidden = false;
  els['auth-form'].hidden = false;
  els['forgot-password-button'].hidden = false;
  els['password-reset-request-form'].hidden = true;
  els['password-recovery-form'].hidden = true;
  els['full-name-field'].hidden = state.authMode !== 'signup';
  els['auth-submit'].textContent = state.authMode === 'signup' ? 'Create account' : 'Sign in';
  els['show-sign-in'].classList.toggle('is-active', state.authMode === 'signin');
  els['show-sign-up'].classList.toggle('is-active', state.authMode === 'signup');
}

function renderResetRequestView() {
  state.isRecoveryMode = false;
  setAuthCopy(
    'Reset your password',
    'Send a secure reset email to your Beoflow account address.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  els['auth-tabs'].hidden = true;
  els['auth-form'].hidden = true;
  els['forgot-password-button'].hidden = true;
  els['password-recovery-form'].hidden = true;
  els['password-reset-request-form'].hidden = false;
  els['reset-email'].value = els['auth-email'].value.trim();
}

function renderPasswordRecoveryView() {
  state.isRecoveryMode = true;
  setAuthCopy(
    'Reset your password',
    'Choose a new password for your Beoflow account.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  els['auth-tabs'].hidden = true;
  els['auth-form'].hidden = true;
  els['forgot-password-button'].hidden = true;
  els['password-reset-request-form'].hidden = true;
  els['password-recovery-form'].hidden = false;
  showAlert(els['auth-message'], 'Reset password. Enter and confirm your new password.', 'success');
}

function renderConfigState() {
  if (!isMissingClientProdKey()) {
    showAlert(els['config-alert'], '');
    return;
  }

  showAlert(
    els['config-alert'],
    'Client-prod anon public key is missing. Add it to beoflow-client-config.js to enable sign up and login.'
  );
}

function renderWorkspaceFrame() {
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = true;
  els['workspace-view'].hidden = false;
  const activeName = state.activeClient?.name || 'Beoflow';
  els['workspace-title'].textContent = activeName;
  els['workspace-subtitle'].textContent = state.activeClient
    ? `${formatClientType(state.activeClient.client_type)} workspace`
    : 'Create or select a restaurant to start using Beoflow.';
  els['switch-client-button'].hidden = state.userClients.length < 2;
}

function renderOnboarding() {
  renderWorkspaceFrame();
  hideWorkspaceSections();
  els['onboarding-view'].hidden = false;
}

function renderClientSelector() {
  renderWorkspaceFrame();
  hideWorkspaceSections();
  els['client-selector-view'].hidden = false;
  els['client-list'].innerHTML = '';

  state.userClients.forEach(client => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'client-option';
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(formatClientType(client.client_type))} • ${escapeHtml(client.member_role || 'member')}</span>
      </span>
      <span>Open</span>
    `;
    button.addEventListener('click', () => {
      setActiveClient(client);
      renderDashboard();
    });
    els['client-list'].appendChild(button);
  });
}

function renderDashboard() {
  const activeClient = requireActiveClient();
  if (!activeClient) return;

  renderWorkspaceFrame();
  hideWorkspaceSections();
  els['dashboard-view'].hidden = false;
  els['dashboard-title'].textContent = state.activeClient.name;
  els['dashboard-description'].textContent = `${state.activeClient.name} is ready. Add real events, recipes, inventory, staff, and reports when operations begin.`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function initializeSupabase() {
  if (state.supabase) return state.supabase;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    showAlert(els['config-alert'], 'Supabase client library failed to load.');
    return null;
  }

  if (!config.url || isMissingClientProdKey()) {
    renderConfigState();
    return null;
  }

  state.supabase = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });

  state.supabase.auth.onAuthStateChange((event, session) => {
    handleAuthStateChange(event, session);
  });

  return state.supabase;
}

async function handleAuthUrlCallback(supabase, authUrlState = getAuthUrlState()) {
  if (!authUrlState.hasAuthParams) return false;

  logAuthUrlState();

  if (authUrlState.hasError) {
    cleanAuthUrl();
    renderAuthView();
    showAlert(
      els['auth-message'],
      authUrlState.errorDescription || authUrlState.error || 'Authentication link could not be processed.'
    );
    return true;
  }

  if (authUrlState.isRecovery) {
    state.isRecoveryMode = true;
    renderPasswordRecoveryView();
  }

  if (authUrlState.code && typeof supabase.auth.exchangeCodeForSession === 'function') {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authUrlState.code);
    if (error) {
      cleanAuthUrl();
      state.isRecoveryMode = false;
      renderAuthView();
      showAlert(els['auth-message'], error.message || 'Unable to process the reset password link.');
      return true;
    }

    state.user = data.session?.user || data.user || state.user;
  }

  if (
    authUrlState.accessToken
    && authUrlState.refreshToken
    && typeof supabase.auth.setSession === 'function'
  ) {
    const { data, error } = await supabase.auth.setSession({
      access_token: authUrlState.accessToken,
      refresh_token: authUrlState.refreshToken
    });

    if (error) {
      cleanAuthUrl();
      state.isRecoveryMode = false;
      renderAuthView();
      showAlert(els['auth-message'], error.message || 'Unable to process the reset password link.');
      return true;
    }

    state.user = data.session?.user || data.user || state.user;
  }

  cleanAuthUrl();

  if (authUrlState.isRecovery) {
    renderPasswordRecoveryView();
    return true;
  }

  return false;
}

async function handleAuthStateChange(event, session) {
  console.log('[Beoflow Auth] Auth event:', event);

  if (event === 'PASSWORD_RECOVERY') {
    state.user = session?.user || null;
    renderPasswordRecoveryView();
    return;
  }

  if (event === 'SIGNED_OUT') {
    resetSessionState();
    renderAuthView();
    return;
  }

  if (event === 'USER_UPDATED' && state.passwordUpdatePending) {
    state.passwordUpdatePending = false;
    state.isRecoveryMode = false;
  }

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    if (!session?.user || state.isRecoveryMode) return;
    await refreshAuthenticatedState(session.user);
  }
}

async function signUp(email, password, fullName) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || ''
      },
      emailRedirectTo: getEmailActionRedirectUrl()
    }
  });

  if (error) throw error;

  if (data.session?.user) {
    await syncProfileFromUser(data.user, fullName);
  }

  if (data.session?.user) {
    await refreshAuthenticatedState(data.session.user);
  } else {
    showAlert(els['auth-message'], 'Check your email to confirm your account. After confirmation, return to Beoflow to continue.', 'success');
    state.authMode = 'signin';
    renderAuthView();
  }

  return data;
}

async function signIn(email, password) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await refreshAuthenticatedState(data.user);
  return data;
}

async function signOut() {
  const supabase = initializeSupabase();
  if (!supabase) return;

  await supabase.auth.signOut();
  resetSessionState();
  renderAuthView();
}

async function sendPasswordResetEmail(email) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getEmailActionRedirectUrl()
  });

  if (error) throw error;
}

async function updatePassword(newPassword, confirmPassword) {
  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  state.passwordUpdatePending = true;
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    state.passwordUpdatePending = false;
    throw error;
  }

  state.passwordUpdatePending = false;
  state.isRecoveryMode = false;
  cleanAuthUrl();
  if (data.user) {
    await refreshAuthenticatedState(data.user);
    showAlert(els['workspace-message'], 'Password updated successfully.', 'success');
  } else {
    state.authMode = 'signin';
    renderAuthView();
    showAlert(els['auth-message'], 'Password updated successfully. Sign in with your new password.', 'success');
  }

  return data;
}

async function getCurrentUser() {
  const supabase = initializeSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  state.user = data.user || null;
  return state.user;
}

async function loadCurrentUserProfile() {
  if (!state.user) return null;
  const supabase = initializeSupabase();
  if (!supabase) return null;

  const byId = await supabase
    .from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .maybeSingle();

  if (!byId.error) {
    state.profile = byId.data || null;
    return state.profile;
  }

  const byUserId = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', state.user.id)
    .maybeSingle();

  state.profile = byUserId.error ? null : byUserId.data || null;
  return state.profile;
}

async function loadUserClients() {
  if (!state.user) return [];
  const supabase = initializeSupabase();
  if (!supabase) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from('client_users')
    .select('client_id, role, status')
    .eq('user_id', state.user.id)
    .eq('status', 'active');

  if (membershipError) throw membershipError;

  const clientIds = [...new Set((memberships || []).map(row => row.client_id).filter(Boolean))];
  if (clientIds.length === 0) {
    state.userClients = [];
    return state.userClients;
  }

  const { data: products, error: productsError } = await supabase
    .from('client_products')
    .select('client_id, product_key, status')
    .in('client_id', clientIds)
    .eq('product_key', config.productKey || 'beoflow')
    .eq('status', 'active');

  if (productsError) throw productsError;

  const beoflowClientIds = new Set((products || []).map(row => row.client_id));
  const allowedClientIds = clientIds.filter(id => beoflowClientIds.has(id));

  if (allowedClientIds.length === 0) {
    state.userClients = [];
    return state.userClients;
  }

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, client_type, status, created_at, updated_at')
    .in('id', allowedClientIds)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (clientsError) throw clientsError;

  const membershipByClientId = new Map((memberships || []).map(row => [row.client_id, row]));

  state.userClients = (clients || []).map(client => ({
    ...client,
    member_role: membershipByClientId.get(client.id)?.role || 'member'
  }));

  return state.userClients;
}

async function createBeoflowClient(clientInput) {
  if (!state.user) throw new Error('Sign in before creating a restaurant.');
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const clientPayload = {
    name: clientInput.name,
    client_type: clientInput.clientType,
    status: 'active',
    created_by: state.user.id
  };

  const optionalPayload = {
    ...clientPayload,
    city: clientInput.city || null,
    state: clientInput.state || null,
    timezone: clientInput.timezone || null
  };

  let insertResult = await supabase
    .from('clients')
    .insert(optionalPayload)
    .select('id, name, client_type, status, created_at, updated_at')
    .single();

  if (insertResult.error && String(insertResult.error.message || '').toLowerCase().includes('column')) {
    insertResult = await supabase
      .from('clients')
      .insert(clientPayload)
      .select('id, name, client_type, status, created_at, updated_at')
      .single();
  }

  if (insertResult.error) throw insertResult.error;

  const client = insertResult.data;

  const { error: membershipError } = await supabase
    .from('client_users')
    .insert({
      client_id: client.id,
      user_id: state.user.id,
      role: 'owner',
      status: 'active'
    });

  if (membershipError) throw membershipError;

  const { error: productError } = await supabase
    .from('client_products')
    .insert({
      client_id: client.id,
      product_key: config.productKey || 'beoflow',
      status: 'active'
    });

  if (productError) throw productError;

  await loadUserClients();
  setActiveClient(state.userClients.find(row => row.id === client.id) || client);
  renderDashboard();
  return client;
}

function setActiveClient(client) {
  state.activeClient = client || null;

  if (state.activeClient?.id) {
    localStorage.setItem(config.activeClientStorageKey || 'beoflow.activeClientId', state.activeClient.id);
  } else {
    localStorage.removeItem(config.activeClientStorageKey || 'beoflow.activeClientId');
  }

  return state.activeClient;
}

function requireActiveClient() {
  if (state.activeClient) return state.activeClient;

  if (state.userClients.length === 0) {
    renderOnboarding();
    return null;
  }

  const storedClientId = localStorage.getItem(config.activeClientStorageKey || 'beoflow.activeClientId');
  const storedClient = state.userClients.find(client => client.id === storedClientId);
  setActiveClient(storedClient || state.userClients[0]);
  return state.activeClient;
}

function resetSessionState() {
  state.user = null;
  state.profile = null;
  state.userClients = [];
  state.activeClient = null;
  localStorage.removeItem(config.activeClientStorageKey || 'beoflow.activeClientId');
}

async function syncProfileFromUser(user, fullName = '') {
  const supabase = initializeSupabase();
  if (!supabase || !user) return null;

  const profilePayload = {
    id: user.id,
    email: user.email,
    full_name: fullName || user.user_metadata?.full_name || user.email
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  return error ? null : profilePayload;
}

async function refreshAuthenticatedState(user) {
  if (!user) {
    resetSessionState();
    renderAuthView();
    return;
  }

  setLoading(true);
  clearAlerts();

  try {
    state.user = user;
    await loadCurrentUserProfile();
    await loadUserClients();

    if (state.userClients.length === 0) {
      setActiveClient(null);
      renderOnboarding();
      return;
    }

    if (state.userClients.length === 1) {
      setActiveClient(state.userClients[0]);
      renderDashboard();
      return;
    }

    const storedClientId = localStorage.getItem(config.activeClientStorageKey || 'beoflow.activeClientId');
    const storedClient = state.userClients.find(client => client.id === storedClientId);

    if (storedClient) {
      setActiveClient(storedClient);
      renderDashboard();
    } else {
      renderClientSelector();
    }
  } catch (error) {
    renderWorkspaceFrame();
    hideWorkspaceSections();
    showAlert(els['workspace-message'], error.message || 'Unable to load your Beoflow workspace.');
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  els['show-sign-in'].addEventListener('click', () => {
    state.authMode = 'signin';
    state.isRecoveryMode = false;
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['show-sign-up'].addEventListener('click', () => {
    state.authMode = 'signup';
    state.isRecoveryMode = false;
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['auth-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);

    const email = els['auth-email'].value.trim();
    const password = els['auth-password'].value;
    const fullName = els['auth-full-name'].value.trim();

    try {
      if (state.authMode === 'signup') {
        els['auth-submit'].textContent = 'Creating account';
        await signUp(email, password, fullName);
      } else {
        els['auth-submit'].textContent = 'Signing in';
        await signIn(email, password);
      }
    } catch (error) {
      showAlert(els['auth-message'], error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
      if (!state.user) renderAuthView();
      renderConfigState();
    }
  });

  els['forgot-password-button'].addEventListener('click', () => {
    clearAlerts();
    renderResetRequestView();
    renderConfigState();
  });

  els['back-to-sign-in-button'].addEventListener('click', () => {
    state.authMode = 'signin';
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['password-reset-request-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);
    els['reset-submit'].textContent = 'Sending reset email';

    try {
      const email = els['reset-email'].value.trim();
      await sendPasswordResetEmail(email);
      state.authMode = 'signin';
      renderAuthView();
      showAlert(els['auth-message'], 'Password reset email sent. Check your inbox.', 'success');
    } catch (error) {
      showAlert(els['auth-message'], error.message || 'Unable to send password reset email.');
      renderResetRequestView();
    } finally {
      els['reset-submit'].textContent = 'Send reset email';
      setLoading(false);
      renderConfigState();
    }
  });

  els['password-recovery-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);
    els['update-password-submit'].textContent = 'Updating password';

    try {
      await updatePassword(els['new-password'].value, els['confirm-new-password'].value);
    } catch (error) {
      renderPasswordRecoveryView();
      showAlert(els['auth-message'], error.message || 'Unable to update password.');
    } finally {
      els['update-password-submit'].textContent = 'Update password';
      els['new-password'].value = '';
      els['confirm-new-password'].value = '';
      setLoading(false);
    }
  });

  els['client-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);

    try {
      const name = els['client-name'].value.trim();
      if (!name) throw new Error('Restaurant / Operation Name is required.');

      await createBeoflowClient({
        name,
        clientType: els['client-type'].value,
        city: els['client-city'].value.trim(),
        state: els['client-state'].value.trim(),
        timezone: els['client-timezone'].value.trim()
      });
    } catch (error) {
      showAlert(els['workspace-message'], error.message || 'Unable to create restaurant.');
    } finally {
      setLoading(false);
    }
  });

  els['switch-client-button'].addEventListener('click', () => {
    if (state.userClients.length > 1) renderClientSelector();
  });

  els['sign-out-button'].addEventListener('click', () => {
    signOut();
  });
}

async function boot() {
  cacheElements();
  bindEvents();
  renderLoadingSession();

  const supabase = initializeSupabase();
  if (!supabase) {
    renderAuthView();
    renderConfigState();
    return;
  }

  const authUrlState = getAuthUrlState();
  const handledAuthCallback = await handleAuthUrlCallback(supabase, authUrlState);
  if (handledAuthCallback) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    renderAuthView();
    showAlert(els['auth-message'], error.message || 'Unable to load session.');
    return;
  }

  if (data.session?.user && !state.isRecoveryMode) {
    await refreshAuthenticatedState(data.session.user);
    return;
  }

  if (!state.isRecoveryMode) renderAuthView();
}

document.addEventListener('DOMContentLoaded', boot);

window.BeoflowClientApp = {
  initializeSupabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getAuthRedirectUrl,
  getEmailActionRedirectUrl,
  getAuthUrlState,
  handleAuthUrlCallback,
  handleAuthStateChange,
  loadCurrentUserProfile,
  loadUserClients,
  createBeoflowClient,
  sendPasswordResetEmail,
  updatePassword,
  setActiveClient,
  requireActiveClient,
  state
};
