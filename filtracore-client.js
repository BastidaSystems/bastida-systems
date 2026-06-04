(function () {
  'use strict';

  const config = window.FILTRACORE_CLIENT_PROD_CONFIG || {};
  const missingAnonKeyValues = new Set([
    '',
    '[PEGA AQUI TU ANON PUBLIC KEY]',
    'USAR_LA_MISMA_ANON_PUBLIC_KEY_QUE_BEOFLOW_CLIENT_CONFIG',
    'PASTE_CLIENT_PROD_ANON_PUBLIC_KEY_HERE'
  ]);

  const state = {
    supabase: null,
    user: null,
    userClients: [],
    activeClient: null,
    workspaces: [],
    activeWorkspace: null,
    activeSection: 'dashboard',
    authMode: 'signin',
    mobileDrawerOpen: false,
    records: createEmptyRecords()
  };

  const MODULES = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Live Client-prod visibility for systems, filters, PSI readings, maintenance, alerts, and reports.'
    },
    locations: {
      index: '01',
      title: 'Locations / Properties',
      subtitle: 'Business locations and residential properties attached to the active workspace.'
    },
    systems: {
      index: '02',
      title: 'Systems',
      subtitle: 'Create and monitor filtration systems, configured PSI ranges, and operating status.'
    },
    filters: {
      index: '03',
      title: 'Filters',
      subtitle: 'Track installed filters, due dates, lifecycle, and status.'
    },
    psi: {
      index: '04',
      title: 'PSI Readings',
      subtitle: 'Capture pressure readings, calculate status, update systems, and create alerts.'
    },
    maintenance: {
      index: '05',
      title: 'Maintenance',
      subtitle: 'Log service work, filter changes, technician notes, and pressure corrections.'
    },
    alerts: {
      index: '06',
      title: 'Alerts',
      subtitle: 'Review open warning and critical items, then resolve them when handled.'
    },
    reports: {
      index: '07',
      title: 'Reports',
      subtitle: 'Reports will use the same workspace data once report generation is added.'
    },
    settings: {
      index: '08',
      title: 'Settings',
      subtitle: 'Client, workspace, auth, and product connection details.'
    }
  };

  const els = {};

  function createEmptyRecords() {
    return {
      companies: [],
      properties: [],
      locations: [],
      systems: [],
      filters: [],
      psiReadings: [],
      maintenanceLogs: [],
      alerts: [],
      reports: []
    };
  }

  function cacheElements() {
    [
      'session-loading-view',
      'auth-view',
      'auth-title',
      'auth-subtitle',
      'auth-tabs',
      'show-sign-in',
      'show-sign-up',
      'auth-form',
      'auth-full-name',
      'auth-email',
      'auth-password',
      'auth-confirm-password',
      'auth-submit',
      'full-name-field',
      'confirm-password-field',
      'config-alert',
      'auth-message',
      'forgot-password-button',
      'local-preview-button',
      'password-reset-request-form',
      'reset-email',
      'reset-submit',
      'back-to-sign-in-button',
      'password-recovery-form',
      'new-password',
      'confirm-new-password',
      'update-password-submit',
      'client-selector-view',
      'client-list',
      'start-local-onboarding-button',
      'onboarding-view',
      'onboarding-form',
      'onboarding-message',
      'business-fields',
      'home-fields',
      'business-company-name',
      'business-industry',
      'business-location-name',
      'business-system-name',
      'home-property-name',
      'home-property-type',
      'home-system-name',
      'onboarding-submit',
      'workspace-view',
      'workspace-title',
      'workspace-subtitle',
      'workspace-kicker',
      'workspace-mode-pill',
      'active-workspace-select',
      'refresh-workspace-button',
      'sidebar',
      'sidebar-client-name',
      'sidebar-user-email',
      'mobile-menu-button',
      'sidebar-backdrop',
      'sign-out-button'
    ].forEach(id => {
      els[toCamelCase(id)] = document.getElementById(id);
    });

    els.navItems = Array.from(document.querySelectorAll('[data-section]'));
    els.setupCards = Array.from(document.querySelectorAll('[data-mode-card]'));
    els.passwordToggles = Array.from(document.querySelectorAll('[data-password-toggle]'));
    els.sections = Array.from(document.querySelectorAll('.app-section'));
  }

  function toCamelCase(value) {
    return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  function showOnly(view) {
    [
      els.sessionLoadingView,
      els.authView,
      els.clientSelectorView,
      els.onboardingView,
      els.workspaceView
    ].forEach(element => {
      if (element) element.hidden = element !== view;
    });
  }

  function showAlert(element, message, type) {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('app-alert-success', type === 'success');
    element.hidden = !message;
  }

  function showError(message) {
    showAlert(els.authMessage, message);
    showAlert(els.onboardingMessage, message);
  }

  function clearAuthAlerts() {
    showAlert(els.configAlert, '');
    showAlert(els.authMessage, '');
  }

  function hasUsableConfig() {
    return Boolean(config.url && config.anonKey && !missingAnonKeyValues.has(config.anonKey));
  }

  function getAuthRedirectUrl() {
    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    return isLocal ? config.localRedirectUrl : config.productionRedirectUrl;
  }

  function initializeSupabase() {
    if (state.supabase) return state.supabase;

    if (!hasUsableConfig()) {
      showOnly(els.authView);
      showAlert(els.configAlert, 'FiltraCore Supabase config is missing the Client-prod public anon key.');
      return null;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      showOnly(els.authView);
      showAlert(els.configAlert, 'Supabase client library is not available.');
      return null;
    }

    state.supabase = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    return state.supabase;
  }

  async function getCurrentUser() {
    const client = initializeSupabase();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();
    if (error) {
      state.user = null;
      return null;
    }

    state.user = data.user || null;
    return state.user;
  }

  async function signUp(event) {
    if (event) event.preventDefault();
    const client = initializeSupabase();
    if (!client) return;

    const email = els.authEmail.value.trim();
    const password = els.authPassword.value;
    const confirmPassword = els.authConfirmPassword.value;
    const fullName = els.authFullName.value.trim();

    clearAuthAlerts();

    if (password.length < 8) {
      showAlert(els.authMessage, 'Create account passwords must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert(els.authMessage, 'Passwords do not match.');
      return;
    }

    setBusy(els.authSubmit, true, 'Creating account...');
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          full_name: fullName,
          product_key: config.productKey
        }
      }
    });
    setBusy(els.authSubmit, false);

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    state.user = data.user || null;
    if (!data.session) {
      showAlert(els.authMessage, 'Account created. Confirm your email, then sign in to access a Client-prod client.', 'success');
      return;
    }

    await routeAfterAuth();
  }

  async function signIn(event) {
    if (event) event.preventDefault();
    const client = initializeSupabase();
    if (!client) return;

    clearAuthAlerts();
    setBusy(els.authSubmit, true, 'Signing in...');
    const { data, error } = await client.auth.signInWithPassword({
      email: els.authEmail.value.trim(),
      password: els.authPassword.value
    });
    setBusy(els.authSubmit, false);

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    state.user = data.user || null;
    await routeAfterAuth();
  }

  async function signOut() {
    const client = initializeSupabase();
    if (client) await client.auth.signOut();

    state.user = null;
    state.userClients = [];
    state.activeClient = null;
    state.workspaces = [];
    state.activeWorkspace = null;
    state.records = createEmptyRecords();
    localStorage.removeItem(config.activeClientStorageKey);
    localStorage.removeItem(config.activeWorkspaceStorageKey);
    renderAuthView();
  }

  async function sendPasswordReset(event) {
    event.preventDefault();
    const client = initializeSupabase();
    if (!client) return;

    setBusy(els.resetSubmit, true, 'Sending...');
    const { error } = await client.auth.resetPasswordForEmail(els.resetEmail.value.trim(), {
      redirectTo: getAuthRedirectUrl()
    });
    setBusy(els.resetSubmit, false);

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    showAlert(els.authMessage, 'Password reset email requested. Follow the link to return to FiltraCore.', 'success');
  }

  async function updatePassword(event) {
    event.preventDefault();
    const client = initializeSupabase();
    if (!client) return;

    const password = els.newPassword.value;
    const confirmPassword = els.confirmNewPassword.value;
    if (password.length < 8) {
      showAlert(els.authMessage, 'New password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert(els.authMessage, 'Passwords do not match.');
      return;
    }

    setBusy(els.updatePasswordSubmit, true, 'Updating...');
    const { error } = await client.auth.updateUser({ password });
    setBusy(els.updatePasswordSubmit, false);

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    showAlert(els.authMessage, 'Password updated. Continue to FiltraCore.', 'success');
    await routeAfterAuth();
  }

  async function loadUserClients() {
    const client = initializeSupabase();
    if (!client || !state.user) return [];

    const { data: memberships, error: membershipError } = await client
      .from('client_users')
      .select('client_id, role, status')
      .eq('user_id', state.user.id)
      .eq('status', 'active');

    if (membershipError) throw membershipError;

    const activeMemberships = memberships || [];
    const clientIds = [...new Set(activeMemberships.map(row => row.client_id).filter(Boolean))];
    if (clientIds.length === 0) {
      state.userClients = [];
      return state.userClients;
    }

    const products = await selectFiltraCoreProducts(clientIds);
    const productByClientId = new Map(products.map(row => [row.client_id, row]));
    const clients = await selectClientsByIds(clientIds);
    const membershipByClientId = new Map(activeMemberships.map(row => [row.client_id, row]));

    state.userClients = clients.map(clientRecord => {
      const membership = membershipByClientId.get(clientRecord.id) || {};
      const product = productByClientId.get(clientRecord.id);
      return {
        ...clientRecord,
        role: membership.role || 'viewer',
        member_role: membership.role || 'viewer',
        product_enabled: Boolean(product && product.status === 'active'),
        product_status: product ? product.status : null
      };
    });

    return state.userClients;
  }

  async function selectFiltraCoreProducts(clientIds) {
    const client = initializeSupabase();
    if (!client || clientIds.length === 0) return [];

    const { data, error } = await client
      .from('client_products')
      .select('client_id, product_key, status')
      .in('client_id', clientIds)
      .eq('product_key', config.productKey || 'filtracore');

    if (error) throw error;
    return data || [];
  }

  async function selectClientsByIds(clientIds) {
    const client = initializeSupabase();
    const primary = await client
      .from('clients')
      .select('id, name, legal_name, client_type, status, created_at')
      .in('id', clientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (!primary.error) return primary.data || [];

    if (!String(primary.error.message || '').toLowerCase().includes('column')) {
      throw primary.error;
    }

    const fallback = await client
      .from('clients')
      .select('id, name, status, created_at')
      .in('id', clientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }

  async function ensureFiltraCoreProduct(clientRecord) {
    if (!clientRecord || clientRecord.product_enabled) return clientRecord;
    if (!canManageClient(clientRecord)) return clientRecord;

    const client = initializeSupabase();
    const { data: existing, error: existingError } = await client
      .from('client_products')
      .select('client_id, product_key, status')
      .eq('client_id', clientRecord.id)
      .eq('product_key', config.productKey || 'filtracore')
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      if (existing.status !== 'active') {
        const { error: updateError } = await client
          .from('client_products')
          .update({ status: 'active' })
          .eq('client_id', clientRecord.id)
          .eq('product_key', config.productKey || 'filtracore');
        if (updateError) throw updateError;
      }
      clientRecord.product_enabled = true;
      clientRecord.product_status = 'active';
      return clientRecord;
    }

    const { error } = await client
      .from('client_products')
      .insert({
        client_id: clientRecord.id,
        product_key: config.productKey || 'filtracore',
        status: 'active'
      });

    if (error) throw error;
    clientRecord.product_enabled = true;
    clientRecord.product_status = 'active';
    return clientRecord;
  }

  async function setActiveClient(clientOrId) {
    const clientId = typeof clientOrId === 'string' ? clientOrId : clientOrId?.id;
    const clientRecord = state.userClients.find(row => row.id === clientId) || clientOrId;
    if (!clientRecord || !clientRecord.id) return null;

    try {
      await ensureFiltraCoreProduct(clientRecord);
    } catch (error) {
      if (!clientRecord.product_enabled) {
        renderClientSelector(`Could not enable FiltraCore for this client: ${error.message}`);
        return null;
      }
    }

    state.activeClient = clientRecord;
    state.activeWorkspace = null;
    state.records = createEmptyRecords();
    localStorage.setItem(config.activeClientStorageKey, clientRecord.id);
    await loadWorkspaces();
    await routeAfterClientSelected();
    return state.activeClient;
  }

  async function loadWorkspaces() {
    if (!state.activeClient) {
      state.workspaces = [];
      return [];
    }

    const client = initializeSupabase();
    const { data, error } = await client
      .from('filtracore_workspaces')
      .select('*')
      .eq('client_id', state.activeClient.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    state.workspaces = data || [];
    return state.workspaces;
  }

  async function setActiveWorkspace(workspaceOrId) {
    const workspaceId = typeof workspaceOrId === 'string' ? workspaceOrId : workspaceOrId?.id;
    const workspace = state.workspaces.find(row => row.id === workspaceId) || workspaceOrId;
    if (!workspace || !workspace.id) return null;

    state.activeWorkspace = workspace;
    localStorage.setItem(config.activeWorkspaceStorageKey, workspace.id);
    await loadWorkspaceData();
    renderWorkspace();
    return state.activeWorkspace;
  }

  async function routeAfterClientSelected() {
    if (!state.activeClient) {
      renderClientSelector();
      return;
    }

    if (!state.activeClient.product_enabled && !canManageClient(state.activeClient)) {
      renderClientSelector('FiltraCore is not enabled for this client. Ask an owner/admin to enable the product.');
      return;
    }

    if (state.workspaces.length === 0) {
      renderOnboarding();
      return;
    }

    const savedWorkspaceId = localStorage.getItem(config.activeWorkspaceStorageKey);
    const savedWorkspace = state.workspaces.find(row => row.id === savedWorkspaceId);
    await setActiveWorkspace(savedWorkspace || state.workspaces[0]);
  }

  async function routeAfterAuth() {
    if (!state.user) {
      renderAuthView();
      return;
    }

    try {
      const clients = await loadUserClients();
      const savedClientId = localStorage.getItem(config.activeClientStorageKey);

      if (savedClientId && clients.some(client => client.id === savedClientId)) {
        await setActiveClient(savedClientId);
        return;
      }

      if (clients.length === 1) {
        await setActiveClient(clients[0]);
        return;
      }

      renderClientSelector();
    } catch (error) {
      renderAuthView();
      showAlert(els.authMessage, error.message || 'Could not load Client-prod access.');
    }
  }

  async function loadWorkspaceData() {
    if (!state.activeClient || !state.activeWorkspace) {
      state.records = createEmptyRecords();
      return state.records;
    }

    const client = initializeSupabase();
    const clientId = state.activeClient.id;
    const workspaceId = state.activeWorkspace.id;

    const [
      companies,
      properties,
      locations,
      systems,
      filters,
      psiReadings,
      maintenanceLogs,
      alerts,
      reports
    ] = await Promise.all([
      selectWorkspaceRows(client, 'filtracore_companies', clientId, workspaceId, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_properties', clientId, workspaceId, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_locations', clientId, workspaceId, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_systems', clientId, workspaceId, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_filters', clientId, workspaceId, 'due_date'),
      selectWorkspaceRows(client, 'filtracore_psi_readings', clientId, workspaceId, 'reading_at', false),
      selectWorkspaceRows(client, 'filtracore_maintenance_logs', clientId, workspaceId, 'performed_at', false),
      selectOpenAlerts(client, clientId, workspaceId),
      selectWorkspaceRows(client, 'filtracore_reports', clientId, workspaceId, 'created_at', false)
    ]);

    state.records = {
      companies,
      properties,
      locations,
      systems,
      filters,
      psiReadings,
      maintenanceLogs,
      alerts,
      reports
    };

    return state.records;
  }

  async function selectWorkspaceRows(client, table, clientId, workspaceId, orderColumn, ascending = true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('client_id', clientId)
      .eq('workspace_id', workspaceId)
      .order(orderColumn, { ascending });

    if (error) throw error;
    return data || [];
  }

  async function selectOpenAlerts(client, clientId, workspaceId) {
    const { data, error } = await client
      .from('filtracore_alerts')
      .select('*')
      .eq('client_id', clientId)
      .eq('workspace_id', workspaceId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function submitOnboarding(event) {
    event.preventDefault();
    if (!state.activeClient) {
      showAlert(els.onboardingMessage, 'Select a Client-prod client before onboarding.');
      return;
    }

    const mode = getSelectedSetupMode();
    const draft = readOnboardingInput(mode);
    const requiredValues = mode === 'business'
      ? [draft.companyName, draft.locationName, draft.firstSystemName]
      : [draft.propertyName, draft.firstSystemName];

    if (requiredValues.some(value => !value)) {
      showAlert(els.onboardingMessage, 'Complete the required setup fields before continuing.');
      return;
    }

    try {
      setBusy(els.onboardingSubmit, true, 'Creating workspace...');
      await createWorkspaceFromOnboarding(mode, draft);
      setBusy(els.onboardingSubmit, false);
      await loadWorkspaces();
      await setActiveWorkspace(state.workspaces[state.workspaces.length - 1]);
    } catch (error) {
      setBusy(els.onboardingSubmit, false);
      showAlert(els.onboardingMessage, error.message || 'Could not create FiltraCore workspace.');
    }
  }

  function readOnboardingInput(mode) {
    if (mode === 'business') {
      return {
        companyName: els.businessCompanyName.value.trim(),
        industry: els.businessIndustry.value,
        locationName: els.businessLocationName.value.trim(),
        firstSystemName: els.businessSystemName.value.trim()
      };
    }

    return {
      propertyName: els.homePropertyName.value.trim(),
      propertyType: els.homePropertyType.value,
      firstSystemName: els.homeSystemName.value.trim()
    };
  }

  async function createWorkspaceFromOnboarding(mode, input) {
    const client = initializeSupabase();
    const clientId = state.activeClient.id;
    const workspaceName = mode === 'business' ? input.companyName : input.propertyName;

    const workspace = await insertRow('filtracore_workspaces', {
      client_id: clientId,
      mode,
      name: workspaceName,
      created_by: state.user.id
    });

    if (mode === 'business') {
      const company = await insertRow('filtracore_companies', {
        client_id: clientId,
        workspace_id: workspace.id,
        name: input.companyName,
        industry: input.industry
      });

      const location = await insertRow('filtracore_locations', {
        client_id: clientId,
        workspace_id: workspace.id,
        company_id: company.id,
        name: input.locationName
      });

      await insertRow('filtracore_systems', {
        client_id: clientId,
        workspace_id: workspace.id,
        location_id: location.id,
        name: input.firstSystemName,
        status: 'unknown'
      });
    } else {
      const property = await insertRow('filtracore_properties', {
        client_id: clientId,
        workspace_id: workspace.id,
        name: input.propertyName,
        property_type: input.propertyType
      });

      await insertRow('filtracore_systems', {
        client_id: clientId,
        workspace_id: workspace.id,
        property_id: property.id,
        name: input.firstSystemName,
        status: 'unknown'
      });
    }

    await client.from('filtracore_workspaces').select('id').eq('id', workspace.id).single();
    return workspace;
  }

  async function insertRow(table, payload) {
    const client = initializeSupabase();
    const { data, error } = await client
      .from(table)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function updateRows(table, payload, matcher) {
    const client = initializeSupabase();
    let query = client.from(table).update(payload);
    Object.entries(matcher).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query.select('*');
    if (error) throw error;
    return data || [];
  }

  async function createSystem(form) {
    requireOwnerAdmin('Only owner/admin users can create systems.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const mode = workspace.mode;
    const payload = {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      name: stringValue(data, 'name'),
      system_type: stringValue(data, 'system_type') || null,
      brand: stringValue(data, 'brand') || null,
      model: stringValue(data, 'model') || null,
      serial_number: stringValue(data, 'serial_number') || null,
      install_date: stringValue(data, 'install_date') || null,
      psi_min: numberOrNull(data.get('psi_min')),
      psi_max: numberOrNull(data.get('psi_max')),
      status: 'unknown'
    };

    if (!payload.name) throw new Error('System name is required.');
    if (payload.psi_min == null || payload.psi_max == null) throw new Error('PSI min and max are required.');
    if (payload.psi_max < payload.psi_min) throw new Error('PSI max must be greater than or equal to PSI min.');

    if (mode === 'business') {
      payload.location_id = stringValue(data, 'location_id') || null;
    } else {
      payload.property_id = stringValue(data, 'property_id') || null;
    }

    await insertRow('filtracore_systems', payload);
  }

  async function createFilter(form) {
    requireOwnerAdmin('Only owner/admin users can create filters.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const payload = {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      system_id: stringValue(data, 'system_id'),
      filter_name: stringValue(data, 'filter_name'),
      sku: stringValue(data, 'sku') || null,
      installed_at: stringValue(data, 'installed_at') || null,
      due_date: stringValue(data, 'due_date') || null,
      life_months: integerOrNull(data.get('life_months')),
      status: stringValue(data, 'status') || 'active'
    };

    if (!payload.system_id) throw new Error('Select a system before creating a filter.');
    if (!payload.filter_name) throw new Error('Filter name is required.');

    await insertRow('filtracore_filters', payload);
  }

  async function createPsiReading(form) {
    requireRole(['owner', 'admin', 'tech'], 'Only owner/admin/tech users can create PSI readings.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const systemId = stringValue(data, 'system_id');
    const system = findById(state.records.systems, systemId);
    if (!system) throw new Error('Select a system before saving a PSI reading.');
    if (system.psi_min == null || system.psi_max == null) throw new Error('Set PSI min and max on this system before recording PSI.');

    const psi = numberOrNull(data.get('psi'));
    if (psi == null) throw new Error('PSI value is required.');

    const status = getPsiStatus(psi, system.psi_min, system.psi_max);
    const filterId = stringValue(data, 'filter_id') || null;

    await insertRow('filtracore_psi_readings', {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      system_id: system.id,
      filter_id: filterId,
      psi,
      status,
      notes: stringValue(data, 'notes') || null,
      created_by: state.user.id
    });

    await updateRows('filtracore_systems', { status }, { id: system.id, client_id: state.activeClient.id });

    if (status === 'warning' || status === 'critical') {
      await insertRow('filtracore_alerts', {
        client_id: state.activeClient.id,
        workspace_id: workspace.id,
        system_id: system.id,
        filter_id: filterId,
        severity: status,
        title: `${capitalize(status)} PSI reading`,
        message: `${system.name} recorded ${psi} PSI outside the configured ${system.psi_min}-${system.psi_max} range.`
      });
    }
  }

  async function createMaintenanceLog(form) {
    requireRole(['owner', 'admin', 'tech'], 'Only owner/admin/tech users can create maintenance logs.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const systemId = stringValue(data, 'system_id');
    if (!systemId) throw new Error('Select a system before saving maintenance.');

    await insertRow('filtracore_maintenance_logs', {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      system_id: systemId,
      filter_id: stringValue(data, 'filter_id') || null,
      type: stringValue(data, 'type') || null,
      technician_name: stringValue(data, 'technician_name') || null,
      previous_psi: numberOrNull(data.get('previous_psi')),
      corrected_psi: numberOrNull(data.get('corrected_psi')),
      notes: stringValue(data, 'notes') || null,
      created_by: state.user.id
    });
  }

  async function resolveAlert(alertId) {
    requireRole(['owner', 'admin', 'tech'], 'Only owner/admin/tech users can resolve alerts.');
    await updateRows('filtracore_alerts', { resolved_at: new Date().toISOString() }, {
      id: alertId,
      client_id: state.activeClient.id
    });
  }

  async function handleWorkspaceSubmit(event) {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();
    const action = form.dataset.action;
    const button = form.querySelector('button[type="submit"]');

    try {
      setBusy(button, true, 'Saving...');
      if (action === 'create-system') await createSystem(form);
      if (action === 'create-filter') await createFilter(form);
      if (action === 'create-psi-reading') await createPsiReading(form);
      if (action === 'create-maintenance-log') await createMaintenanceLog(form);
      form.reset();
      await refreshWorkspace();
    } catch (error) {
      showWorkspaceMessage(error.message || 'Could not save record.');
    } finally {
      setBusy(button, false);
    }
  }

  async function handleWorkspaceClick(event) {
    const resolveButton = event.target.closest('[data-resolve-alert]');
    if (!resolveButton) return;
    event.preventDefault();
    try {
      setBusy(resolveButton, true, 'Resolving...');
      await resolveAlert(resolveButton.dataset.resolveAlert);
      await refreshWorkspace();
    } catch (error) {
      showWorkspaceMessage(error.message || 'Could not resolve alert.');
    } finally {
      setBusy(resolveButton, false);
    }
  }

  async function refreshWorkspace() {
    if (!state.activeWorkspace) return;
    await loadWorkspaceData();
    renderWorkspace();
  }

  function renderAuthView() {
    showOnly(els.authView);
    state.authMode = state.authMode || 'signin';
    clearAuthAlerts();
    syncAuthMode();
  }

  function syncAuthMode() {
    const isSignup = state.authMode === 'signup';
    els.showSignIn.classList.toggle('is-active', !isSignup);
    els.showSignUp.classList.toggle('is-active', isSignup);
    els.fullNameField.hidden = !isSignup;
    els.confirmPasswordField.hidden = !isSignup;
    els.authConfirmPassword.disabled = !isSignup;
    els.authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';
    els.authSubmit.textContent = isSignup ? 'Create account' : 'Sign in';
    els.authTitle.textContent = isSignup ? 'Create your FiltraCore account' : 'Water system operations workspace';
    els.authSubtitle.textContent = isSignup
      ? 'Use Supabase Auth, then connect to an existing Client-prod client.'
      : 'Sign in or create an account to manage filtration systems, filters, PSI readings, maintenance, alerts, and reports.';
    els.authForm.hidden = false;
    els.forgotPasswordButton.hidden = isSignup;
    els.passwordResetRequestForm.hidden = true;
    els.passwordRecoveryForm.hidden = true;
  }

  function renderPasswordResetRequest() {
    clearAuthAlerts();
    els.authForm.hidden = true;
    els.forgotPasswordButton.hidden = true;
    els.passwordResetRequestForm.hidden = false;
    els.passwordRecoveryForm.hidden = true;
    els.resetEmail.value = els.authEmail.value.trim();
  }

  function renderPasswordRecovery() {
    showOnly(els.authView);
    clearAuthAlerts();
    els.authForm.hidden = true;
    els.forgotPasswordButton.hidden = true;
    els.passwordResetRequestForm.hidden = true;
    els.passwordRecoveryForm.hidden = false;
  }

  function renderClientSelector(message) {
    showOnly(els.clientSelectorView);
    els.clientList.innerHTML = '';

    if (message) {
      const alert = document.createElement('div');
      alert.className = 'app-alert';
      alert.textContent = message;
      els.clientList.appendChild(alert);
    }

    if (state.userClients.length === 0) {
      els.clientList.insertAdjacentHTML('beforeend', `
        <div class="empty-state">
          <h4>No Client-prod clients available.</h4>
          <p>Your user is not an active member of any client. Add this user to client_users first, then return to FiltraCore.</p>
        </div>
      `);
      return;
    }

    state.userClients.forEach(clientRecord => {
      const canEnable = canManageClient(clientRecord);
      const status = clientRecord.product_enabled ? 'FiltraCore enabled' : canEnable ? 'Will enable FiltraCore' : 'Needs owner/admin';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-option';
      button.innerHTML = `
        <span>
          <strong>${escapeHtml(clientName(clientRecord))}</strong>
          <span>${escapeHtml(clientRecord.role || 'viewer')} - ${escapeHtml(status)}</span>
        </span>
        <span>Select</span>
      `;
      button.addEventListener('click', () => setActiveClient(clientRecord));
      els.clientList.appendChild(button);
    });
  }

  function renderOnboarding() {
    showOnly(els.onboardingView);
    showAlert(els.onboardingMessage, '');
    updateOnboardingMode(getSelectedSetupMode());
  }

  function getSelectedSetupMode() {
    const checked = document.querySelector('input[name="setup-mode"]:checked');
    return checked ? checked.value : 'business';
  }

  function updateOnboardingMode(mode) {
    els.setupCards.forEach(card => {
      card.classList.toggle('is-selected', card.dataset.modeCard === mode);
    });
    els.businessFields.hidden = mode !== 'business';
    els.homeFields.hidden = mode !== 'home';
  }

  function renderWorkspace() {
    showOnly(els.workspaceView);
    renderShellChrome();
    renderSections();
    switchSection(state.activeSection || 'dashboard', false);
  }

  function renderShellChrome() {
    const clientLabel = state.activeClient ? clientName(state.activeClient) : 'No client';
    const userEmail = state.user ? state.user.email : 'Signed out';
    const workspace = state.activeWorkspace;

    els.sidebarClientName.textContent = clientLabel;
    els.sidebarUserEmail.textContent = userEmail || 'Signed in';
    els.workspaceModePill.textContent = workspace ? `${capitalize(workspace.mode)} mode` : 'No workspace';

    if (els.activeWorkspaceSelect) {
      els.activeWorkspaceSelect.hidden = state.workspaces.length <= 1;
      els.activeWorkspaceSelect.innerHTML = state.workspaces.map(item => `
        <option value="${escapeHtml(item.id)}"${workspace && item.id === workspace.id ? ' selected' : ''}>${escapeHtml(item.name)}</option>
      `).join('');
    }
  }

  function renderSections() {
    els.sections.forEach(section => {
      const key = section.id.replace('section-', '');
      if (key === 'dashboard') section.innerHTML = renderDashboardSection();
      if (key === 'locations') section.innerHTML = renderLocationsSection();
      if (key === 'systems') section.innerHTML = renderSystemsSection();
      if (key === 'filters') section.innerHTML = renderFiltersSection();
      if (key === 'psi') section.innerHTML = renderPsiSection();
      if (key === 'maintenance') section.innerHTML = renderMaintenanceSection();
      if (key === 'alerts') section.innerHTML = renderAlertsSection();
      if (key === 'reports') section.innerHTML = renderReportsSection();
      if (key === 'settings') section.innerHTML = renderSettingsSection();
    });
  }

  function renderSectionHeader(key, statusText) {
    const module = MODULES[key];
    return `
      <div class="module-view-header">
        <div>
          <span class="module-index">${escapeHtml(module.index || '00')}</span>
          <h3>${escapeHtml(module.title)}</h3>
          <p>${escapeHtml(module.subtitle)}</p>
        </div>
        <span class="status-pill">${escapeHtml(statusText || 'Live')}</span>
      </div>
    `;
  }

  function renderDashboardSection() {
    const stats = getDashboardStats();
    return `
      <div class="metric-grid">
        ${metricCard('System Health', `${stats.healthySystems}/${stats.totalSystems}`, `${stats.warningSystems} warning - ${stats.criticalSystems} critical`)}
        ${metricCard('Filter Status', String(stats.totalFilters), `${stats.overdueFilters} overdue filters`)}
        ${metricCard('Latest PSI', stats.latestPsiText, stats.latestPsiSubtext)}
        ${metricCard('Maintenance Logs', String(stats.maintenanceLogs), 'Total logs in this workspace')}
        ${metricCard('Open Alerts', String(stats.openAlerts), stats.openAlerts === 0 ? 'No alerts yet.' : 'Needs review')}
        ${metricCard('Reports', String(stats.reports), stats.reports === 0 ? 'No reports yet.' : 'Reports available')}
      </div>
      <div class="dashboard-lists">
        <article class="dashboard-list">
          <h4>Recent PSI readings</h4>
          ${renderPsiList(state.records.psiReadings.slice(0, 5))}
        </article>
        <article class="dashboard-list">
          <h4>Open alerts</h4>
          ${renderAlertList(state.records.alerts.slice(0, 5), false)}
        </article>
      </div>
      <div class="dashboard-panels">
        <article class="panel-card">
          <div class="panel-heading">
            <h3>Filtration systems</h3>
            <span>${stats.totalSystems} total</span>
          </div>
          ${renderSystemList(state.records.systems.slice(0, 5))}
        </article>
        <article class="panel-card">
          <div class="panel-heading">
            <h3>PSI logic</h3>
            <span>Live helper</span>
          </div>
          <div class="psi-scale" aria-label="PSI status logic">
            <span class="critical">Critical low</span>
            <span class="warning">Warning</span>
            <span class="healthy">Healthy range</span>
            <span class="warning">High warning</span>
          </div>
          <p class="panel-copy">Healthy means PSI is inside the configured range, including values close to max. Low PSI becomes warning or critical. Values over max become warning for high pressure.</p>
        </article>
      </div>
    `;
  }

  function renderLocationsSection() {
    const workspace = state.activeWorkspace;
    const isBusiness = workspace?.mode === 'business';
    return `
      ${renderSectionHeader('locations', isBusiness ? `${state.records.locations.length} locations` : `${state.records.properties.length} properties`)}
      <div class="record-panel">
        <h4>${isBusiness ? 'Business locations' : 'Home properties'}</h4>
        ${isBusiness ? renderLocationList() : renderPropertyList()}
      </div>
    `;
  }

  function renderSystemsSection() {
    return `
      ${renderSectionHeader('systems', `${state.records.systems.length} systems`)}
      <div class="module-grid">
        <form class="module-form" data-action="create-system">
          <h4>Create system</h4>
          <label class="form-field">
            <span>Name</span>
            <input name="name" required placeholder="System name">
          </label>
          ${renderSystemParentField()}
          <div class="form-grid">
            <label class="form-field">
              <span>Type</span>
              <input name="system_type" placeholder="RO, carbon, softener">
            </label>
            <label class="form-field">
              <span>Brand</span>
              <input name="brand" placeholder="Brand">
            </label>
            <label class="form-field">
              <span>Model</span>
              <input name="model" placeholder="Model">
            </label>
            <label class="form-field">
              <span>Serial Number</span>
              <input name="serial_number" placeholder="Serial number">
            </label>
            <label class="form-field">
              <span>Install Date</span>
              <input type="date" name="install_date">
            </label>
            <span></span>
            <label class="form-field">
              <span>PSI Min</span>
              <input type="number" name="psi_min" step="0.01" required placeholder="50">
            </label>
            <label class="form-field">
              <span>PSI Max</span>
              <input type="number" name="psi_max" step="0.01" required placeholder="70">
            </label>
          </div>
          <button type="submit" class="primary-action">Create system</button>
        </form>
        <div class="record-panel">
          <h4>Systems</h4>
          ${renderSystemList(state.records.systems)}
        </div>
      </div>
    `;
  }

  function renderFiltersSection() {
    return `
      ${renderSectionHeader('filters', `${state.records.filters.length} filters`)}
      <div class="module-grid">
        <form class="module-form" data-action="create-filter">
          <h4>Create filter</h4>
          ${renderSystemSelectField('system_id', true)}
          <label class="form-field">
            <span>Filter Name</span>
            <input name="filter_name" required placeholder="Filter name">
          </label>
          <div class="form-grid">
            <label class="form-field">
              <span>SKU</span>
              <input name="sku" placeholder="SKU">
            </label>
            <label class="form-field">
              <span>Status</span>
              <select name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="replaced">Replaced</option>
              </select>
            </label>
            <label class="form-field">
              <span>Installed At</span>
              <input type="date" name="installed_at">
            </label>
            <label class="form-field">
              <span>Due Date</span>
              <input type="date" name="due_date">
            </label>
            <label class="form-field">
              <span>Life Months</span>
              <input type="number" name="life_months" min="0" step="1">
            </label>
          </div>
          <button type="submit" class="primary-action">Create filter</button>
        </form>
        <div class="record-panel">
          <h4>Filters</h4>
          ${renderFilterList(state.records.filters)}
        </div>
      </div>
    `;
  }

  function renderPsiSection() {
    return `
      ${renderSectionHeader('psi', `${state.records.psiReadings.length} readings`)}
      <div class="module-grid">
        <form class="module-form" data-action="create-psi-reading">
          <h4>Create PSI reading</h4>
          ${renderSystemSelectField('system_id', true)}
          ${renderFilterSelectField('filter_id', false)}
          <label class="form-field">
            <span>PSI</span>
            <input type="number" name="psi" step="0.01" required placeholder="PSI value">
          </label>
          <label class="form-field form-field-wide">
            <span>Notes</span>
            <textarea name="notes" placeholder="Optional notes"></textarea>
          </label>
          <button type="submit" class="primary-action">Save PSI reading</button>
          <p class="muted-note">Saving a warning or critical reading also creates an open alert and updates system status.</p>
        </form>
        <div class="record-panel">
          <h4>Latest readings</h4>
          ${renderPsiList(state.records.psiReadings)}
        </div>
      </div>
    `;
  }

  function renderMaintenanceSection() {
    return `
      ${renderSectionHeader('maintenance', `${state.records.maintenanceLogs.length} logs`)}
      <div class="module-grid">
        <form class="module-form" data-action="create-maintenance-log">
          <h4>Create maintenance log</h4>
          ${renderSystemSelectField('system_id', true)}
          ${renderFilterSelectField('filter_id', false)}
          <div class="form-grid">
            <label class="form-field">
              <span>Type</span>
              <input name="type" placeholder="Inspection, replacement, service">
            </label>
            <label class="form-field">
              <span>Technician</span>
              <input name="technician_name" placeholder="Technician name">
            </label>
            <label class="form-field">
              <span>Previous PSI</span>
              <input type="number" name="previous_psi" step="0.01">
            </label>
            <label class="form-field">
              <span>Corrected PSI</span>
              <input type="number" name="corrected_psi" step="0.01">
            </label>
          </div>
          <label class="form-field form-field-wide">
            <span>Notes</span>
            <textarea name="notes" placeholder="Maintenance notes"></textarea>
          </label>
          <button type="submit" class="primary-action">Create maintenance log</button>
        </form>
        <div class="record-panel">
          <h4>Maintenance logs</h4>
          ${renderMaintenanceList(state.records.maintenanceLogs)}
        </div>
      </div>
    `;
  }

  function renderAlertsSection() {
    return `
      ${renderSectionHeader('alerts', `${state.records.alerts.length} open`)}
      <div class="record-panel">
        <h4>Open alerts</h4>
        ${renderAlertList(state.records.alerts, true)}
      </div>
    `;
  }

  function renderReportsSection() {
    return `
      ${renderSectionHeader('reports', `${state.records.reports.length} reports`)}
      <div class="record-panel">
        <h4>Reports</h4>
        ${state.records.reports.length ? renderReportList(state.records.reports) : emptyState('No reports yet.', 'Reports will appear after report generation is connected.')}
      </div>
    `;
  }

  function renderSettingsSection() {
    const workspace = state.activeWorkspace;
    return `
      ${renderSectionHeader('settings', 'Client-prod')}
      <div class="settings-grid">
        <article class="settings-card">
          <h3>Workspace</h3>
          <dl>
            <div><dt>Mode</dt><dd>${escapeHtml(workspace ? capitalize(workspace.mode) : 'Not selected')}</dd></div>
            <div><dt>Workspace</dt><dd>${escapeHtml(workspace?.name || 'Not selected')}</dd></div>
            <div><dt>Active client</dt><dd>${escapeHtml(state.activeClient ? clientName(state.activeClient) : 'Not connected')}</dd></div>
            <div><dt>Product key</dt><dd>${escapeHtml(config.productKey || 'filtracore')}</dd></div>
          </dl>
        </article>
        <article class="settings-card">
          <h3>Access</h3>
          <dl>
            <div><dt>User</dt><dd>${escapeHtml(state.user?.email || 'Signed out')}</dd></div>
            <div><dt>Role</dt><dd>${escapeHtml(state.activeClient?.role || 'viewer')}</dd></div>
            <div><dt>FiltraCore product</dt><dd>${state.activeClient?.product_enabled ? 'Enabled' : 'Not enabled'}</dd></div>
            <div><dt>Writes</dt><dd>${canManageData() ? 'Owner/admin' : hasRole(['tech']) ? 'Tech limited' : 'Read only'}</dd></div>
          </dl>
        </article>
      </div>
    `;
  }

  function metricCard(label, value, copy) {
    return `
      <article class="metric-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p>${escapeHtml(copy)}</p>
      </article>
    `;
  }

  function getDashboardStats() {
    const systems = state.records.systems;
    const filters = state.records.filters;
    const latest = state.records.psiReadings[0];
    const today = todayIso();
    const overdueFilters = filters.filter(filter => filter.due_date && filter.due_date < today && filter.status !== 'replaced').length;

    return {
      totalSystems: systems.length,
      healthySystems: systems.filter(system => system.status === 'healthy').length,
      warningSystems: systems.filter(system => system.status === 'warning').length,
      criticalSystems: systems.filter(system => system.status === 'critical').length,
      totalFilters: filters.length,
      overdueFilters,
      latestPsiText: latest ? `${latest.psi} PSI` : '--',
      latestPsiSubtext: latest ? `${statusText(latest.status)} - ${formatDateTime(latest.reading_at)}` : 'No PSI readings yet.',
      openAlerts: state.records.alerts.length,
      maintenanceLogs: state.records.maintenanceLogs.length,
      reports: state.records.reports.length
    };
  }

  function renderSystemParentField() {
    if (state.activeWorkspace?.mode === 'business') {
      return `
        <label class="form-field">
          <span>Location</span>
          <select name="location_id">
            ${state.records.locations.map(location => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)}</option>`).join('')}
          </select>
        </label>
      `;
    }

    return `
      <label class="form-field">
        <span>Property</span>
        <select name="property_id">
          ${state.records.properties.map(property => `<option value="${escapeHtml(property.id)}">${escapeHtml(property.name)}</option>`).join('')}
        </select>
      </label>
    `;
  }

  function renderSystemSelectField(name, required) {
    return `
      <label class="form-field">
        <span>System</span>
        <select name="${escapeHtml(name)}"${required ? ' required' : ''}>
          <option value="">Select system</option>
          ${state.records.systems.map(system => `<option value="${escapeHtml(system.id)}">${escapeHtml(system.name)}</option>`).join('')}
        </select>
      </label>
    `;
  }

  function renderFilterSelectField(name, required) {
    return `
      <label class="form-field">
        <span>Filter optional</span>
        <select name="${escapeHtml(name)}"${required ? ' required' : ''}>
          <option value="">No filter</option>
          ${state.records.filters.map(filter => `<option value="${escapeHtml(filter.id)}">${escapeHtml(filter.filter_name)}${filter.system_id ? ` - ${escapeHtml(systemName(filter.system_id))}` : ''}</option>`).join('')}
        </select>
      </label>
    `;
  }

  function renderLocationList() {
    if (!state.records.locations.length) return emptyState('No locations or properties yet.', 'Create locations during onboarding or future location management.');
    return `
      <div class="record-list">
        ${state.records.locations.map(location => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(location.name)}</strong>
              <span class="status-badge status-unknown">Location</span>
            </div>
            <div class="record-meta">
              ${location.address ? `<span>${escapeHtml(location.address)}</span>` : ''}
              ${location.building ? `<span>${escapeHtml(location.building)}</span>` : ''}
              ${location.zone ? `<span>${escapeHtml(location.zone)}</span>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPropertyList() {
    if (!state.records.properties.length) return emptyState('No locations or properties yet.', 'Create a property during onboarding or future property management.');
    return `
      <div class="record-list">
        ${state.records.properties.map(property => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(property.name)}</strong>
              <span class="status-badge status-unknown">${escapeHtml(property.property_type || 'Property')}</span>
            </div>
            <div class="record-meta">
              ${property.address ? `<span>${escapeHtml(property.address)}</span>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderSystemList(systems) {
    if (!systems.length) return emptyState('No filtration systems yet.', 'Create a system to begin tracking filters and PSI readings.');
    return `
      <div class="record-list">
        ${systems.map(system => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(system.name)}</strong>
              ${statusBadge(system.status || 'unknown')}
            </div>
            <div class="record-meta">
              <span>${escapeHtml(system.system_type || 'System')}</span>
              <span>PSI ${valueOrDash(system.psi_min)}-${valueOrDash(system.psi_max)}</span>
              ${system.location_id ? `<span>${escapeHtml(locationName(system.location_id))}</span>` : ''}
              ${system.property_id ? `<span>${escapeHtml(propertyName(system.property_id))}</span>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderFilterList(filters) {
    if (!filters.length) return emptyState('No filters installed yet.', 'Create a filter record for a system.');
    return `
      <div class="record-list">
        ${filters.map(filter => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(filter.filter_name)}</strong>
              ${statusBadge(filter.status || 'active')}
            </div>
            <div class="record-meta">
              <span>${escapeHtml(systemName(filter.system_id))}</span>
              ${filter.sku ? `<span>SKU ${escapeHtml(filter.sku)}</span>` : ''}
              ${filter.installed_at ? `<span>Installed ${formatDate(filter.installed_at)}</span>` : ''}
              ${filter.due_date ? `<span>Due ${formatDate(filter.due_date)}</span>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPsiList(readings) {
    if (!readings.length) return emptyState('No PSI readings yet.', 'Create a PSI reading from a system.');
    return `
      <div class="record-list">
        ${readings.map(reading => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(reading.psi)} PSI</strong>
              ${statusBadge(reading.status || 'unknown')}
            </div>
            <div class="record-meta">
              <span>${escapeHtml(systemName(reading.system_id))}</span>
              ${reading.filter_id ? `<span>${escapeHtml(filterName(reading.filter_id))}</span>` : ''}
              <span>${formatDateTime(reading.reading_at)}</span>
            </div>
            ${reading.notes ? `<p>${escapeHtml(reading.notes)}</p>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderMaintenanceList(logs) {
    if (!logs.length) return emptyState('No maintenance logs yet.', 'Create a log when service work is performed.');
    return `
      <div class="record-list">
        ${logs.map(log => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(log.type || 'Maintenance')}</strong>
              <span class="status-badge status-active">${formatDate(log.performed_at)}</span>
            </div>
            <div class="record-meta">
              <span>${escapeHtml(systemName(log.system_id))}</span>
              ${log.filter_id ? `<span>${escapeHtml(filterName(log.filter_id))}</span>` : ''}
              ${log.technician_name ? `<span>${escapeHtml(log.technician_name)}</span>` : ''}
              ${log.corrected_psi != null ? `<span>Corrected ${escapeHtml(log.corrected_psi)} PSI</span>` : ''}
            </div>
            ${log.notes ? `<p>${escapeHtml(log.notes)}</p>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderAlertList(alerts, includeActions) {
    if (!alerts.length) return emptyState('No alerts yet.', 'Warning and critical PSI readings will create open alerts.');
    return `
      <div class="record-list">
        ${alerts.map(alert => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(alert.title)}</strong>
              ${statusBadge(alert.severity || 'open')}
            </div>
            <div class="record-meta">
              ${alert.system_id ? `<span>${escapeHtml(systemName(alert.system_id))}</span>` : ''}
              ${alert.filter_id ? `<span>${escapeHtml(filterName(alert.filter_id))}</span>` : ''}
              <span>${formatDateTime(alert.created_at)}</span>
            </div>
            ${alert.message ? `<p>${escapeHtml(alert.message)}</p>` : ''}
            ${includeActions ? `<div class="inline-actions"><button type="button" class="secondary-action compact-action" data-resolve-alert="${escapeHtml(alert.id)}">Resolve</button></div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderReportList(reports) {
    return `
      <div class="record-list">
        ${reports.map(report => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(report.report_type)}</strong>
              <span class="status-badge status-unknown">${formatDate(report.created_at)}</span>
            </div>
            <div class="record-meta">
              ${report.period_start ? `<span>${formatDate(report.period_start)}</span>` : ''}
              ${report.period_end ? `<span>${formatDate(report.period_end)}</span>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function emptyState(title, copy) {
    return `
      <div class="empty-state">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function statusBadge(status) {
    const normalized = String(status || 'unknown').toLowerCase();
    return `<span class="status-badge status-${escapeHtml(normalized)}">${escapeHtml(statusText(normalized))}</span>`;
  }

  function switchSection(section, shouldCloseMenu = true) {
    const module = MODULES[section] || MODULES.dashboard;
    state.activeSection = MODULES[section] ? section : 'dashboard';

    els.navItems.forEach(item => {
      item.classList.toggle('is-active', item.dataset.section === state.activeSection);
    });

    els.sections.forEach(sectionElement => {
      const isActive = sectionElement.id === `section-${state.activeSection}`;
      sectionElement.hidden = !isActive;
      sectionElement.classList.toggle('is-active', isActive);
    });

    els.workspaceTitle.textContent = module.title;
    els.workspaceSubtitle.textContent = module.subtitle;
    els.workspaceKicker.textContent = state.activeSection === 'dashboard' ? 'Live workspace' : 'Module';
    if (shouldCloseMenu) closeMobileMenu();
  }

  function showWorkspaceMessage(message) {
    const active = document.querySelector('.app-section.is-active');
    if (!active) return;
    let alert = active.querySelector('.workspace-message');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'app-alert workspace-message';
      active.prepend(alert);
    }
    alert.textContent = message;
    alert.hidden = false;
  }

  function requireActiveWorkspace() {
    if (!state.activeClient || !state.activeWorkspace) {
      throw new Error('Select a client and workspace first.');
    }
    return state.activeWorkspace;
  }

  function canManageClient(clientRecord) {
    return ['owner', 'admin'].includes(String(clientRecord?.role || clientRecord?.member_role || '').toLowerCase());
  }

  function canManageData() {
    return canManageClient(state.activeClient);
  }

  function hasRole(roles) {
    const role = String(state.activeClient?.role || state.activeClient?.member_role || '').toLowerCase();
    return roles.includes(role);
  }

  function requireOwnerAdmin(message) {
    if (!canManageData()) throw new Error(message);
  }

  function requireRole(roles, message) {
    if (!hasRole(roles)) throw new Error(message);
  }

  function getPsiStatus(psi, min, max) {
    if (psi == null) return 'unknown';
    const criticalMin = Math.max(0, min - 16);
    if (psi <= criticalMin) return 'critical';
    if (psi < min) return 'warning';
    if (psi <= max) return 'healthy';
    return 'warning';
  }

  function setBusy(button, isBusy, busyText) {
    if (!button) return;
    if (isBusy) {
      button.dataset.idleText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
      return;
    }

    button.textContent = button.dataset.idleText || button.textContent;
    button.disabled = false;
  }

  function bindEvents() {
    els.authTabs.addEventListener('click', event => {
      const button = event.target.closest('[data-auth-mode]');
      if (!button) return;
      state.authMode = button.dataset.authMode;
      clearAuthAlerts();
      syncAuthMode();
    });

    els.authForm.addEventListener('submit', event => {
      if (state.authMode === 'signup') signUp(event);
      else signIn(event);
    });

    els.forgotPasswordButton.addEventListener('click', renderPasswordResetRequest);
    els.backToSignInButton.addEventListener('click', () => {
      state.authMode = 'signin';
      syncAuthMode();
    });
    els.passwordResetRequestForm.addEventListener('submit', sendPasswordReset);
    els.passwordRecoveryForm.addEventListener('submit', updatePassword);
    els.onboardingForm.addEventListener('submit', submitOnboarding);
    els.mobileMenuButton.addEventListener('click', toggleMobileMenu);
    els.sidebarBackdrop.addEventListener('click', closeMobileMenu);
    els.signOutButton.addEventListener('click', signOut);
    els.workspaceView.addEventListener('submit', handleWorkspaceSubmit);
    els.workspaceView.addEventListener('click', handleWorkspaceClick);
    els.refreshWorkspaceButton.addEventListener('click', refreshWorkspace);

    els.activeWorkspaceSelect.addEventListener('change', event => {
      setActiveWorkspace(event.target.value).catch(error => showWorkspaceMessage(error.message));
    });

    els.setupCards.forEach(card => {
      card.addEventListener('click', () => updateOnboardingMode(card.dataset.modeCard));
    });

    document.querySelectorAll('input[name="setup-mode"]').forEach(input => {
      input.addEventListener('change', event => updateOnboardingMode(event.target.value));
    });

    els.navItems.forEach(item => {
      item.addEventListener('click', () => switchSection(item.dataset.section));
    });

    els.passwordToggles.forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.target);
        if (!input) return;
        const shouldShow = input.type === 'password';
        input.type = shouldShow ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(shouldShow));
        button.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMobileMenu();
    });
  }

  function toggleMobileMenu() {
    state.mobileDrawerOpen = !state.mobileDrawerOpen;
    document.body.classList.toggle('mobile-menu-open', state.mobileDrawerOpen);
    els.mobileMenuButton.setAttribute('aria-expanded', String(state.mobileDrawerOpen));
    els.sidebarBackdrop.hidden = !state.mobileDrawerOpen;
  }

  function closeMobileMenu() {
    state.mobileDrawerOpen = false;
    document.body.classList.remove('mobile-menu-open');
    if (els.mobileMenuButton) els.mobileMenuButton.setAttribute('aria-expanded', 'false');
    if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = true;
  }

  function clientName(clientRecord) {
    return clientRecord?.name || clientRecord?.legal_name || 'Client';
  }

  function systemName(id) {
    return findById(state.records.systems, id)?.name || 'System';
  }

  function filterName(id) {
    return findById(state.records.filters, id)?.filter_name || 'Filter';
  }

  function locationName(id) {
    return findById(state.records.locations, id)?.name || 'Location';
  }

  function propertyName(id) {
    return findById(state.records.properties, id)?.name || 'Property';
  }

  function findById(records, id) {
    return records.find(record => record.id === id);
  }

  function stringValue(data, name) {
    return String(data.get(name) || '').trim();
  }

  function numberOrNull(value) {
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function integerOrNull(value) {
    const parsed = numberOrNull(value);
    return parsed == null ? null : Math.trunc(parsed);
  }

  function valueOrDash(value) {
    return value == null || value === '' ? '--' : value;
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return '--';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '--';
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function statusText(value) {
    return String(value || 'unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  async function boot() {
    cacheElements();
    bindEvents();

    const client = initializeSupabase();
    if (!client) return;

    client.auth.onAuthStateChange(async (event, session) => {
      state.user = session ? session.user : null;
      if (event === 'PASSWORD_RECOVERY') {
        renderPasswordRecovery();
        return;
      }
      if (event === 'SIGNED_OUT') {
        renderAuthView();
      }
    });

    await getCurrentUser();
    await routeAfterAuth();
  }

  window.FiltraCoreClient = {
    initializeSupabase,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getAuthRedirectUrl,
    loadUserClients,
    setActiveClient,
    loadWorkspaces,
    setActiveWorkspace,
    createSystem,
    createFilter,
    createPsiReading,
    createMaintenanceLog,
    resolveAlert,
    getPsiStatus
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
