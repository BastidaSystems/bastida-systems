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
    activeAssetsTab: 'locations',
    activeWorkTab: 'psi',
    assetSearch: {
      locations: '',
      systems: '',
      filters: ''
    },
    authMode: 'signin',
    mobileDrawerOpen: false,
    editing: null,
    records: createEmptyRecords(),
    importPreview: createEmptyImportPreview(),
    importReview: createEmptyImportReview()
  };

  const MODULES = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'A focused operational snapshot for the active FiltraCore workspace.'
    },
    assets: {
      index: '01',
      title: 'Assets',
      subtitle: 'Manage locations, systems, and filters from one workspace.'
    },
    work: {
      index: '02',
      title: 'Work',
      subtitle: 'Record PSI readings, maintenance activity, and alert resolution.'
    },
    reports: {
      index: '04',
      title: 'Reports',
      subtitle: 'Reports will use the same workspace data once report generation is added.'
    },
    import: {
      index: '03',
      title: 'Import',
      subtitle: 'Preview CSV inventory files before creating locations, systems, and filters.'
    },
    settings: {
      index: '05',
      title: 'Settings',
      subtitle: 'Client, workspace, auth, and product connection details.'
    }
  };

  const LOCATION_TYPE_OPTIONS = [
    ['kitchen', 'Kitchen'],
    ['restaurant', 'Restaurant'],
    ['bar', 'Bar'],
    ['coffee_shop', 'Coffee shop'],
    ['food_court', 'Food court'],
    ['hotel_area', 'Hotel area'],
    ['casino_area', 'Casino area'],
    ['maintenance_room', 'Maintenance room'],
    ['residential_unit', 'Residential unit'],
    ['commercial_unit', 'Commercial unit'],
    ['other', 'Other']
  ];

  const PROPERTY_TYPE_OPTIONS = [
    ['house', 'House'],
    ['apartment', 'Apartment'],
    ['rental_property', 'Rental Property'],
    ['multi_family', 'Multi-family'],
    ['other', 'Other']
  ];

  const SYSTEM_TYPE_OPTIONS = [
    ['whole_house_filter', 'Whole house filter'],
    ['ro_system', 'RO system'],
    ['ice_machine_filter', 'Ice machine filter'],
    ['beverage_filter', 'Beverage filter'],
    ['coffee_machine_filter', 'Coffee machine filter'],
    ['dishwashing_filtration', 'Dishwashing filtration'],
    ['main_water_line', 'Main water line'],
    ['drinking_water_station', 'Drinking water station'],
    ['other', 'Other']
  ];

  const FILTER_TYPE_OPTIONS = [
    ['sediment', 'Sediment'],
    ['carbon', 'Carbon'],
    ['ro_membrane', 'RO membrane'],
    ['post_carbon', 'Post carbon'],
    ['scale_inhibitor', 'Scale inhibitor'],
    ['uv', 'UV'],
    ['other', 'Other']
  ];

  const MAINTENANCE_TYPE_OPTIONS = [
    ['filter_replacement', 'Filter replacement'],
    ['inspection', 'Inspection'],
    ['cleaning', 'Cleaning'],
    ['psi_check', 'PSI check'],
    ['repair', 'Repair'],
    ['other', 'Other']
  ];

  const IMPORT_COLUMNS = [
    { key: 'venue', source: 'Venue', target: 'filtracore_locations.name' },
    { key: 'machine', source: 'Machine', target: 'filtracore_systems.name' },
    { key: 'sku', source: 'ReOrder#', target: 'filtracore_filters.sku' },
    { key: 'filterName', source: 'Filter Type', target: 'filtracore_filters.filter_name' },
    { key: 'filterQuantity', source: 'Filter Amount', target: 'filtracore_filters.filter_quantity' }
  ];

  const IMPORT_HEADER_ALIASES = {
    venue: 'venue',
    location: 'venue',
    machine: 'machine',
    equipment: 'machine',
    system: 'machine',
    reorder: 'sku',
    reorderid: 'sku',
    reorderno: 'sku',
    reordernumber: 'sku',
    sku: 'sku',
    filtertype: 'filterName',
    filtername: 'filterName',
    filter: 'filterName',
    filteramount: 'filterQuantity',
    filterquantity: 'filterQuantity',
    quantity: 'filterQuantity',
    amount: 'filterQuantity'
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

  function createEmptyImportPreview() {
    return {
      status: 'idle',
      fileName: '',
      rows: [],
      locations: [],
      systems: [],
      filters: [],
      groups: [],
      detected: {
        locations: 0,
        systems: 0,
        filters: 0
      },
      validations: [],
      warnings: [],
      duplicates: [],
      quantityConflicts: [],
      errors: []
    };
  }

  function createEmptyImportReview() {
    return {
      status: 'idle',
      confirmations: {
        createRecords: false
      },
      resolutions: {},
      isImporting: false,
      summary: null,
      error: ''
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
      'onboarding-change-client-button',
      'onboarding-sign-out-button',
      'onboarding-submit',
      'workspace-view',
      'workspace-header',
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
      showAlert(els.authMessage, 'Account created. Confirm your email, then sign in to finish your FiltraCore setup.', 'success');
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
    state.importPreview = createEmptyImportPreview();
    localStorage.removeItem(config.activeClientStorageKey);
    localStorage.removeItem(config.activeWorkspaceStorageKey);
    renderAuthView();
  }

  async function changeClientFromOnboarding() {
    localStorage.removeItem(config.activeClientStorageKey);
    localStorage.removeItem(config.activeWorkspaceStorageKey);
    state.activeClient = null;
    state.workspaces = [];
    state.activeWorkspace = null;
    state.records = createEmptyRecords();
    state.importPreview = createEmptyImportPreview();

    if (!state.user) {
      renderAuthView();
      return;
    }

    try {
      if (state.userClients.length === 0) {
        await loadUserClients();
      }

      const message = state.userClients.length <= 1
        ? 'Client selection was cleared. Select this client again, or sign out to use another account.'
        : 'Client selection was cleared. Choose another FiltraCore client.';
      renderClientSelector(message);
    } catch (error) {
      renderClientSelector(error.message || 'Client selection was cleared, but clients could not be reloaded.');
    }
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
      .select('id, name, legal_name, client_type, status, lifecycle_state, created_at')
      .in('id', clientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (!primary.error) return primary.data || [];

    if (!String(primary.error.message || '').toLowerCase().includes('column')) {
      throw primary.error;
    }

    const lifecycleFallback = await client
      .from('clients')
      .select('id, name, status, lifecycle_state, created_at')
      .in('id', clientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (!lifecycleFallback.error) return lifecycleFallback.data || [];

    if (!isMissingColumnError(lifecycleFallback.error)) {
      throw lifecycleFallback.error;
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

  async function createPersonalClientForOnboarding() {
    if (!state.user) throw new Error('Sign in before starting FiltraCore setup.');
    const client = initializeSupabase();
    if (!client) throw new Error('Client-prod is not configured.');

    const name = userDisplayName() || organizationNameFromEmail() || 'My FiltraCore Workspace';
    const clientPayload = {
      name,
      client_type: 'business',
      status: 'active',
      lifecycle_state: 'pending_onboarding',
      created_by: state.user.id
    };

    let insertResult = await client
      .from('clients')
      .insert(clientPayload)
      .select('id, name, legal_name, client_type, status, lifecycle_state, created_at')
      .single();

    if (insertResult.error && isMissingColumnError(insertResult.error)) {
      const fallbackPayload = { ...clientPayload };
      delete fallbackPayload.client_type;
      delete fallbackPayload.lifecycle_state;

      const lifecyclePayload = { ...clientPayload };
      delete lifecyclePayload.client_type;
      insertResult = await client
        .from('clients')
        .insert(lifecyclePayload)
        .select('id, name, status, lifecycle_state, created_at')
        .single();

      if (insertResult.error && isMissingColumnError(insertResult.error)) {
        insertResult = await client
          .from('clients')
          .insert(fallbackPayload)
          .select('id, name, status, created_at')
          .single();
      }
    }

    if (insertResult.error) throw insertResult.error;

    const newClient = insertResult.data;
    const { error: membershipError } = await client
      .from('client_users')
      .insert({
        client_id: newClient.id,
        user_id: state.user.id,
        role: 'owner',
        status: 'active'
      });

    if (membershipError) throw membershipError;

    const { error: productError } = await client
      .from('client_products')
      .insert({
        client_id: newClient.id,
        product_key: config.productKey || 'filtracore',
        status: 'active'
      });

    if (productError) throw productError;

    await loadUserClients();
    return state.userClients.find(row => row.id === newClient.id) || {
      ...newClient,
      role: 'owner',
      member_role: 'owner',
      product_enabled: true,
      product_status: 'active'
    };
  }

  async function activatePendingClientLifecycle(clientId) {
    if (!clientId) return null;

    const client = initializeSupabase();
    const { data, error } = await client
      .from('clients')
      .update({ lifecycle_state: 'active' })
      .eq('id', clientId)
      .eq('lifecycle_state', 'pending_onboarding')
      .select('id, lifecycle_state')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      state.userClients = state.userClients.map(clientRecord => (
        clientRecord.id === data.id
          ? { ...clientRecord, ...data }
          : clientRecord
      ));

      if (state.activeClient?.id === data.id) {
        state.activeClient = { ...state.activeClient, ...data };
      }
    }

    return data;
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
    state.importPreview = createEmptyImportPreview();
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
    state.importPreview = createEmptyImportPreview();
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

      if (clients.length === 0) {
        const clientRecord = await createPersonalClientForOnboarding();
        await setActiveClient(clientRecord);
        return;
      }

      renderClientSelector();
    } catch (error) {
      if (state.user) {
        renderClientSelector(error.message || 'Could not start FiltraCore setup. Try again or contact support.');
        return;
      }
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
    await activatePendingClientLifecycle(clientId);
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

  async function insertRowFlexible(table, payload, optionalColumns) {
    try {
      return await insertRow(table, payload);
    } catch (error) {
      if (!isMissingColumnError(error) || !optionalColumns.length) throw error;
      const fallbackPayload = { ...payload };
      optionalColumns.forEach(column => {
        delete fallbackPayload[column];
      });
      return insertRow(table, fallbackPayload);
    }
  }

  function isMissingColumnError(error) {
    const text = `${error.code || ''} ${error.message || ''} ${error.details || ''}`.toLowerCase();
    return text.includes('pgrst204') || text.includes('column') || text.includes('could not find');
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

  async function updateRowsFlexible(table, payload, matcher, optionalColumns) {
    try {
      return await updateRows(table, payload, matcher);
    } catch (error) {
      if (!isMissingColumnError(error) || !optionalColumns.length) throw error;
      const fallbackPayload = { ...payload };
      optionalColumns.forEach(column => {
        delete fallbackPayload[column];
      });
      return updateRows(table, fallbackPayload, matcher);
    }
  }

  async function deleteRows(table, matcher) {
    const client = initializeSupabase();
    let query = client.from(table).delete();
    Object.entries(matcher).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { error } = await query;
    if (error) throw error;
  }

  function activeRecordMatcher(id) {
    const workspace = requireActiveWorkspace();
    return {
      id,
      client_id: state.activeClient.id,
      workspace_id: workspace.id
    };
  }

  async function createPlace(form) {
    requireOwnerAdmin('Only owner/admin users can create locations or properties.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();

    if (workspace.mode === 'business') {
      const payload = {
        client_id: state.activeClient.id,
        workspace_id: workspace.id,
        company_id: state.records.companies[0]?.id || null,
        name: stringValue(data, 'name'),
        location_type: stringValue(data, 'location_type') || null,
        address: stringValue(data, 'address') || null,
        building: stringValue(data, 'building') || null,
        floor: stringValue(data, 'floor') || null,
        zone: stringValue(data, 'zone') || null
      };

      if (!payload.name) throw new Error('Location name is required.');
      await insertRowFlexible('filtracore_locations', payload, ['location_type']);
      return;
    }

    const payload = {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      name: stringValue(data, 'name'),
      property_type: stringValue(data, 'property_type') || null,
      address: stringValue(data, 'address') || null,
      zone: stringValue(data, 'zone') || null
    };

    if (!payload.name) throw new Error('Property name is required.');
    await insertRowFlexible('filtracore_properties', payload, ['zone']);
  }

  async function updatePlace(form, recordId) {
    requireOwnerAdmin('Only owner/admin users can edit locations or properties.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();

    if (workspace.mode === 'business') {
      const payload = {
        company_id: state.records.companies[0]?.id || null,
        name: stringValue(data, 'name'),
        location_type: stringValue(data, 'location_type') || null,
        address: stringValue(data, 'address') || null,
        building: stringValue(data, 'building') || null,
        floor: stringValue(data, 'floor') || null,
        zone: stringValue(data, 'zone') || null
      };

      if (!payload.name) throw new Error('Location name is required.');
      await updateRowsFlexible('filtracore_locations', payload, activeRecordMatcher(recordId), ['location_type']);
      return;
    }

    const payload = {
      name: stringValue(data, 'name'),
      property_type: stringValue(data, 'property_type') || null,
      address: stringValue(data, 'address') || null,
      zone: stringValue(data, 'zone') || null
    };

    if (!payload.name) throw new Error('Property name is required.');
    await updateRowsFlexible('filtracore_properties', payload, activeRecordMatcher(recordId), ['zone']);
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
      asset_reference: stringValue(data, 'asset_reference') || null,
      model: stringValue(data, 'model') || null,
      serial_number: stringValue(data, 'serial_number') || null,
      equipment_photo_url: stringValue(data, 'equipment_photo_url') || null,
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
      if (!payload.location_id) throw new Error('Select a location before creating a system.');
    } else {
      payload.property_id = stringValue(data, 'property_id') || null;
      if (!payload.property_id) throw new Error('Select a property before creating a system.');
    }

    await insertRow('filtracore_systems', payload);
  }

  async function updateSystem(form, recordId) {
    requireOwnerAdmin('Only owner/admin users can edit systems.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const payload = {
      name: stringValue(data, 'name'),
      system_type: stringValue(data, 'system_type') || null,
      brand: stringValue(data, 'brand') || null,
      asset_reference: stringValue(data, 'asset_reference') || null,
      model: stringValue(data, 'model') || null,
      serial_number: stringValue(data, 'serial_number') || null,
      equipment_photo_url: stringValue(data, 'equipment_photo_url') || null,
      psi_min: numberOrNull(data.get('psi_min')),
      psi_max: numberOrNull(data.get('psi_max'))
    };

    if (!payload.name) throw new Error('System name is required.');
    if (payload.psi_min == null || payload.psi_max == null) throw new Error('PSI min and max are required.');
    if (payload.psi_max < payload.psi_min) throw new Error('PSI max must be greater than or equal to PSI min.');

    if (workspace.mode === 'business') {
      payload.location_id = stringValue(data, 'location_id') || null;
      payload.property_id = null;
      if (!payload.location_id) throw new Error('Select a location before saving a system.');
    } else {
      payload.property_id = stringValue(data, 'property_id') || null;
      payload.location_id = null;
      if (!payload.property_id) throw new Error('Select a property before saving a system.');
    }

    await updateRows('filtracore_systems', payload, activeRecordMatcher(recordId));
  }

  async function createFilter(form) {
    requireOwnerAdmin('Only owner/admin users can create filters.');
    const data = new FormData(form);
    const workspace = requireActiveWorkspace();
    const rawFilterQuantity = integerOrNull(data.get('filter_quantity'));
    const filterQuantity = rawFilterQuantity == null ? 1 : rawFilterQuantity;
    const payload = {
      client_id: state.activeClient.id,
      workspace_id: workspace.id,
      system_id: stringValue(data, 'system_id'),
      filter_name: stringValue(data, 'filter_name'),
      filter_type: stringValue(data, 'filter_type') || null,
      filter_quantity: filterQuantity,
      filter_photo_url: stringValue(data, 'filter_photo_url') || null,
      sku: stringValue(data, 'sku') || null,
      installed_at: stringValue(data, 'installed_at') || null,
      due_date: stringValue(data, 'due_date') || null,
      life_months: integerOrNull(data.get('life_months')),
      status: 'active'
    };

    if (!payload.system_id) throw new Error('Select a system before creating a filter.');
    if (!payload.filter_name) throw new Error('Filter name is required.');
    if (payload.filter_quantity < 1) throw new Error('Filter amount must be at least 1.');

    await insertRowFlexible('filtracore_filters', payload, ['filter_type']);
  }

  async function updateFilter(form, recordId) {
    requireOwnerAdmin('Only owner/admin users can edit filters.');
    const data = new FormData(form);
    const rawFilterQuantity = integerOrNull(data.get('filter_quantity'));
    const filterQuantity = rawFilterQuantity == null ? 1 : rawFilterQuantity;
    const payload = {
      system_id: stringValue(data, 'system_id'),
      filter_name: stringValue(data, 'filter_name'),
      filter_type: stringValue(data, 'filter_type') || null,
      filter_quantity: filterQuantity,
      filter_photo_url: stringValue(data, 'filter_photo_url') || null,
      sku: stringValue(data, 'sku') || null,
      installed_at: stringValue(data, 'installed_at') || null,
      due_date: stringValue(data, 'due_date') || null,
      life_months: integerOrNull(data.get('life_months')),
      status: stringValue(data, 'status') || 'active'
    };

    if (!payload.system_id) throw new Error('Select a system before saving a filter.');
    if (!payload.filter_name) throw new Error('Filter name is required.');
    if (payload.filter_quantity < 1) throw new Error('Filter amount must be at least 1.');

    await updateRowsFlexible('filtracore_filters', payload, activeRecordMatcher(recordId), ['filter_type']);
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
      client_id: state.activeClient.id,
      workspace_id: requireActiveWorkspace().id
    });
  }

  async function archiveFilter(filterId) {
    requireOwnerAdmin('Only owner/admin users can archive filters.');
    if (!window.confirm('Archive this filter? It will remain in history but stop appearing as an active filter.')) return;
    await updateRows('filtracore_filters', { status: 'archived' }, activeRecordMatcher(filterId));
    clearEditingIfMatches('filter', filterId);
    await refreshWorkspace();
  }

  async function removeRecord(recordType, recordId) {
    const configByType = {
      location: {
        table: 'filtracore_locations',
        label: 'location',
        permission: () => requireOwnerAdmin('Only owner/admin users can remove locations.')
      },
      property: {
        table: 'filtracore_properties',
        label: 'property',
        permission: () => requireOwnerAdmin('Only owner/admin users can remove properties.')
      },
      system: {
        table: 'filtracore_systems',
        label: 'system / equipment',
        permission: () => requireOwnerAdmin('Only owner/admin users can remove systems.')
      },
      psi: {
        table: 'filtracore_psi_readings',
        label: 'PSI reading',
        permission: () => requireRole(['owner', 'admin', 'tech'], 'Only owner/admin/tech users can remove PSI readings.')
      }
    };
    const item = configByType[recordType];
    if (!item) throw new Error('Unsupported remove action.');
    item.permission();
    if (!window.confirm(`Remove this ${item.label}? This cannot be undone.`)) return;
    await deleteRows(item.table, activeRecordMatcher(recordId));
    clearEditingIfMatches(recordType, recordId);
    await refreshWorkspace();
  }

  async function handleWorkspaceSubmit(event) {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();
    const action = form.dataset.action;
    const button = form.querySelector('button[type="submit"]');
    const editType = form.dataset.editType;
    const editId = form.dataset.editId;

    try {
      setBusy(button, true, 'Saving...');
      if (action === 'create-place') {
        if (editType === 'location' || editType === 'property') await updatePlace(form, editId);
        else await createPlace(form);
      }
      if (action === 'create-system') {
        if (editType === 'system') await updateSystem(form, editId);
        else await createSystem(form);
      }
      if (action === 'create-filter') {
        if (editType === 'filter') await updateFilter(form, editId);
        else await createFilter(form);
      }
      if (action === 'create-psi-reading') await createPsiReading(form);
      if (action === 'create-maintenance-log') await createMaintenanceLog(form);
      state.editing = null;
      form.reset();
      await refreshWorkspace();
    } catch (error) {
      showWorkspaceMessage(error.message || 'Could not save record.');
    } finally {
      setBusy(button, false);
    }
  }

  async function handleWorkspaceClick(event) {
    const editButton = event.target.closest('[data-edit-record]');
    if (editButton) {
      event.preventDefault();
      startEditing(editButton.dataset.editRecord, editButton.dataset.recordId);
      return;
    }

    const cancelButton = event.target.closest('[data-cancel-edit]');
    if (cancelButton) {
      event.preventDefault();
      cancelEditing();
      return;
    }

    const moduleTabButton = event.target.closest('[data-module-tab][data-tab]');
    if (moduleTabButton) {
      event.preventDefault();
      if (moduleTabButton.dataset.moduleTab === 'assets') {
        state.activeAssetsTab = normalizeAssetsTab(moduleTabButton.dataset.tab);
        state.activeSection = 'assets';
      }
      if (moduleTabButton.dataset.moduleTab === 'work') {
        state.activeWorkTab = normalizeWorkTab(moduleTabButton.dataset.tab);
        state.activeSection = 'work';
      }
      renderSections();
      switchSection(state.activeSection, false);
      return;
    }

    const focusFormButton = event.target.closest('[data-focus-active-form]');
    if (focusFormButton) {
      event.preventDefault();
      focusActiveModuleForm();
      return;
    }

    const removeButton = event.target.closest('[data-remove-record]');
    if (removeButton) {
      event.preventDefault();
      try {
        setBusy(removeButton, true, 'Removing...');
        await removeRecord(removeButton.dataset.removeRecord, removeButton.dataset.recordId);
      } catch (error) {
        showWorkspaceMessage(error.message || 'Could not remove record.');
      } finally {
        setBusy(removeButton, false);
      }
      return;
    }

    const archiveButton = event.target.closest('[data-archive-filter]');
    if (archiveButton) {
      event.preventDefault();
      try {
        setBusy(archiveButton, true, 'Archiving...');
        await archiveFilter(archiveButton.dataset.archiveFilter);
      } catch (error) {
        showWorkspaceMessage(error.message || 'Could not archive filter.');
      } finally {
        setBusy(archiveButton, false);
      }
      return;
    }

    const clearImportButton = event.target.closest('[data-clear-import-preview]');
    if (clearImportButton) {
      event.preventDefault();
      state.importPreview = createEmptyImportPreview();
      state.importReview = createEmptyImportReview();
      renderSections();
      switchSection('import', false);
      return;
    }

    const openImportReviewButton = event.target.closest('[data-open-import-review]');
    if (openImportReviewButton) {
      event.preventDefault();
      state.importReview = {
        ...createEmptyImportReview(),
        status: 'review'
      };
      renderSections();
      switchSection('import', false);
      return;
    }

    const closeImportReviewButton = event.target.closest('[data-close-import-review]');
    if (closeImportReviewButton) {
      event.preventDefault();
      state.importReview = {
        ...state.importReview,
        status: 'idle'
      };
      renderSections();
      switchSection('import', false);
      return;
    }

    const conflictResolutionButton = event.target.closest('[data-resolve-import-conflict]');
    if (conflictResolutionButton) {
      event.preventDefault();
      setImportConflictResolution(conflictResolutionButton.dataset.conflictId, {
        type: conflictResolutionButton.dataset.resolveImportConflict,
        quantity: integerOrNull(conflictResolutionButton.dataset.quantity)
      });
      renderSections();
      switchSection('import', false);
      return;
    }

    const confirmImportButton = event.target.closest('[data-confirm-import]');
    if (confirmImportButton) {
      event.preventDefault();
      if (state.importReview.isImporting || !canConfirmImport(state.importPreview)) return;
      await executeReviewedImport(confirmImportButton);
      return;
    }

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

  async function handleWorkspaceChange(event) {
    const importConfirmationInput = event.target.closest('[data-import-confirmation]');
    if (importConfirmationInput) {
      state.importReview = {
        ...state.importReview,
        confirmations: {
          ...state.importReview.confirmations,
          createRecords: Boolean(importConfirmationInput.checked)
        }
      };
      renderSections();
      switchSection('import', false);
      return;
    }

    const customQuantityInput = event.target.closest('[data-import-conflict-custom]');
    if (customQuantityInput) {
      const quantity = integerOrNull(customQuantityInput.value);
      setImportConflictResolution(customQuantityInput.dataset.conflictId, {
        type: 'custom',
        quantity
      });
      renderSections();
      switchSection('import', false);
      return;
    }

    const fileInput = event.target.closest('[data-csv-import-file]');
    if (!fileInput) return;

    const file = fileInput.files?.[0];
    if (!file) return;

    state.importPreview = {
      ...createEmptyImportPreview(),
      status: 'reading',
      fileName: file.name
    };
    state.importReview = createEmptyImportReview();
    renderSections();
    switchSection('import', false);

    try {
      validateCsvFile(file);
      const csvText = await readCsvFile(file);
      state.importPreview = {
        ...state.importPreview,
        status: 'parsing'
      };
      renderSections();
      switchSection('import', false);
      state.importPreview = buildImportPreview(csvText, file.name);
    } catch (error) {
      state.importPreview = {
        ...createEmptyImportPreview(),
        status: 'error',
        fileName: file.name,
        errors: [error.message || 'Could not read the CSV file.']
      };
    }

    renderSections();
    switchSection('import', false);
  }

  function handleWorkspaceInput(event) {
    const searchInput = event.target.closest('[data-asset-search]');
    if (!searchInput) return;

    const tab = normalizeAssetsTab(searchInput.dataset.assetSearch);
    state.assetSearch = {
      ...state.assetSearch,
      [tab]: searchInput.value
    };
    renderSections();
    switchSection('assets', false);

    const restoredInput = document.querySelector(`[data-asset-search="${tab}"]`);
    if (restoredInput) {
      restoredInput.focus();
      const cursorPosition = restoredInput.value.length;
      restoredInput.setSelectionRange(cursorPosition, cursorPosition);
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
          <h4>Setup could not start automatically.</h4>
          <p>Sign out and sign in again. If this keeps happening, the Client-prod onboarding policy needs to be updated.</p>
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
      if (key === 'assets') section.innerHTML = renderAssetsSection();
      if (key === 'work') section.innerHTML = renderWorkSection();
      if (key === 'import') section.innerHTML = renderImportSection();
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
        ${metricCard(stats.placeCardLabel, String(stats.placeCount), stats.placeCount === 0 ? stats.placeEmptyText : 'Workspace places')}
        ${metricCard('Systems', String(stats.totalSystems), stats.totalSystems === 0 ? 'Add your first filtration system' : 'Filtration systems in scope')}
        ${metricCard('Filters', String(stats.totalFilters), stats.totalFilters === 0 ? 'Add your first filter' : 'Installed filter records')}
        ${metricCard('Open Alerts', String(stats.openAlerts), stats.openAlerts === 0 ? 'No alerts yet.' : 'Needs review')}
        ${metricCard('Filters Due Soon', String(stats.dueSoonFilters), 'Due within 30 days')}
        ${metricCard('Latest PSI', stats.latestPsiText, stats.latestPsiSubtext)}
      </div>
      <div class="dashboard-panels dashboard-panels-simple">
        <article class="dashboard-list">
          <div class="panel-heading">
            <h3>Alerts</h3>
            <span>${state.records.alerts.length} open</span>
          </div>
          ${renderAlertList(state.records.alerts.slice(0, 5), false)}
        </article>
        <article class="dashboard-list">
          <div class="panel-heading">
            <h3>Upcoming Maintenance</h3>
            <span>Next 30 days</span>
          </div>
          ${renderUpcomingMaintenanceList()}
        </article>
      </div>
    `;
  }

  function renderAssetsSection() {
    const workspace = state.activeWorkspace;
    const isBusiness = workspace?.mode === 'business';
    const placeCount = isBusiness ? state.records.locations.length : state.records.properties.length;
    const activeTab = normalizeAssetsTab(state.activeAssetsTab);

    return `
      ${renderSectionHeader('assets', `${placeCount} places | ${state.records.systems.length} systems | ${state.records.filters.length} filters`)}
      ${renderModuleTabs('assets', activeTab, [
        ['locations', isBusiness ? 'Locations' : 'Properties'],
        ['systems', 'Systems'],
        ['filters', 'Filters']
      ])}
      ${activeTab === 'locations' ? renderLocationsSection() : ''}
      ${activeTab === 'systems' ? renderSystemsSection() : ''}
      ${activeTab === 'filters' ? renderFiltersSection() : ''}
    `;
  }

  function renderWorkSection() {
    const activeTab = normalizeWorkTab(state.activeWorkTab);
    return `
      ${renderSectionHeader('work', `${state.records.psiReadings.length} readings | ${state.records.maintenanceLogs.length} logs | ${state.records.alerts.length} alerts`)}
      ${renderModuleTabs('work', activeTab, [
        ['psi', 'PSI Readings'],
        ['maintenance', 'Maintenance'],
        ['alerts', 'Alerts']
      ])}
      ${activeTab === 'psi' ? renderPsiSection() : ''}
      ${activeTab === 'maintenance' ? renderMaintenanceSection() : ''}
      ${activeTab === 'alerts' ? renderAlertsSection() : ''}
    `;
  }

  function renderModuleTabs(moduleName, activeTab, tabs) {
    const label = `${MODULES[moduleName]?.title || 'Module'} tabs`;
    return `
      <div class="module-tabs" role="tablist" aria-label="${escapeHtml(label)}">
        ${tabs.map(([tab, labelText]) => `
          <button
            type="button"
            class="module-tab${tab === activeTab ? ' is-active' : ''}"
            data-module-tab="${escapeHtml(moduleName)}"
            data-tab="${escapeHtml(tab)}"
            role="tab"
            aria-selected="${tab === activeTab ? 'true' : 'false'}"
          >${escapeHtml(labelText)}</button>
        `).join('')}
      </div>
    `;
  }

  function normalizeAssetsTab(tab) {
    return ['locations', 'systems', 'filters'].includes(tab) ? tab : 'locations';
  }

  function normalizeWorkTab(tab) {
    return ['psi', 'maintenance', 'alerts'].includes(tab) ? tab : 'psi';
  }

  function renderAssetToolbar(tab, searchLabel, actionLabel) {
    const value = state.assetSearch[tab] || '';
    return `
      <div class="module-toolbar">
        <label class="module-search">
          <span>${escapeHtml(searchLabel)}</span>
          <input type="search" value="${escapeHtml(value)}" placeholder="Search" data-asset-search="${escapeHtml(tab)}" autocomplete="off">
        </label>
        <button type="button" class="secondary-action compact-action" data-focus-active-form>${escapeHtml(actionLabel)}</button>
      </div>
    `;
  }

  function filterRecords(records, searchTerm, fields) {
    const normalizedTerm = canonicalSearchValue(searchTerm);
    if (!normalizedTerm) return records;
    return records.filter(record => fields.some(field => canonicalSearchValue(field(record)).includes(normalizedTerm)));
  }

  function canonicalSearchValue(value) {
    return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function renderLocationsSection() {
    const workspace = state.activeWorkspace;
    const isBusiness = workspace?.mode === 'business';
    const tab = 'locations';
    const searchTerm = state.assetSearch[tab] || '';
    const locations = filterRecords(state.records.locations, searchTerm, [
      location => location.name,
      location => location.address,
      location => location.building,
      location => location.floor,
      location => location.zone,
      location => optionLabel(LOCATION_TYPE_OPTIONS, location.location_type, 'Location')
    ]);
    const properties = filterRecords(state.records.properties, searchTerm, [
      property => property.name,
      property => property.address,
      property => property.zone,
      property => optionLabel(PROPERTY_TYPE_OPTIONS, property.property_type, 'Property')
    ]);
    return `
      ${renderAssetToolbar(tab, isBusiness ? 'Search locations' : 'Search properties', isBusiness ? 'Add location' : 'Add property')}
      <div class="module-grid">
        ${renderPlaceForm(isBusiness)}
        <div class="record-panel">
          <h4>${isBusiness ? 'Locations' : 'Properties'}</h4>
          ${isBusiness ? renderLocationList(locations, Boolean(searchTerm)) : renderPropertyList(properties, Boolean(searchTerm))}
        </div>
      </div>
    `;
  }

  function renderPlaceForm(isBusiness) {
    if (isBusiness) {
      const record = editingRecord('location', state.records.locations);
      return `
        <form class="module-form" data-action="create-place"${editFormAttributes('location', record)}>
          <h4>${record ? 'Edit location' : state.records.locations.length ? 'Add location' : 'Add your first location'}</h4>
          <label class="form-field">
            <span>Location Name</span>
            <input name="name" required placeholder="Location name" value="${escapeHtml(record?.name || '')}">
          </label>
          <label class="form-field">
            <span>Location Type</span>
            <select name="location_type">
              ${selectOptions(LOCATION_TYPE_OPTIONS, record?.location_type || '', 'Select type')}
            </select>
          </label>
          <div class="form-grid">
            <label class="form-field">
              <span>Address</span>
              <input name="address" placeholder="Address" value="${escapeHtml(record?.address || '')}">
            </label>
            <label class="form-field">
              <span>Building</span>
              <input name="building" placeholder="Building" value="${escapeHtml(record?.building || '')}">
            </label>
            <label class="form-field">
              <span>Floor</span>
              <input name="floor" placeholder="Floor" value="${escapeHtml(record?.floor || '')}">
            </label>
            <label class="form-field">
              <span>Zone</span>
              <input name="zone" placeholder="Zone or area" value="${escapeHtml(record?.zone || '')}">
            </label>
          </div>
          <button type="submit" class="primary-action">${record ? 'Save changes' : 'Save location'}</button>
          ${editActions(record)}
        </form>
      `;
    }

    const record = editingRecord('property', state.records.properties);
    return `
      <form class="module-form" data-action="create-place"${editFormAttributes('property', record)}>
        <h4>${record ? 'Edit property' : state.records.properties.length ? 'Add property' : 'Add your first property'}</h4>
        <label class="form-field">
          <span>Property Name</span>
          <input name="name" required placeholder="Property or home name" value="${escapeHtml(record?.name || '')}">
        </label>
        <label class="form-field">
          <span>Property Type</span>
          <select name="property_type">
            ${selectOptions(PROPERTY_TYPE_OPTIONS, record?.property_type || '', 'Select type')}
          </select>
        </label>
        <div class="form-grid">
          <label class="form-field">
            <span>Address Optional</span>
            <input name="address" placeholder="Address" value="${escapeHtml(record?.address || '')}">
          </label>
          <label class="form-field">
            <span>Zone / Area Optional</span>
            <input name="zone" placeholder="Zone or area" value="${escapeHtml(record?.zone || '')}">
          </label>
        </div>
        <button type="submit" class="primary-action">${record ? 'Save changes' : 'Save property'}</button>
        ${editActions(record)}
      </form>
    `;
  }

  function renderSystemsSection() {
    const record = editingRecord('system', state.records.systems);
    const searchTerm = state.assetSearch.systems || '';
    const systems = filterRecords(state.records.systems, searchTerm, [
      system => system.name,
      system => system.status,
      system => optionLabel(SYSTEM_TYPE_OPTIONS, system.system_type, 'System'),
      system => system.asset_reference,
      system => system.brand,
      system => system.model,
      system => system.serial_number,
      system => system.location_id ? locationName(system.location_id) : '',
      system => system.property_id ? propertyName(system.property_id) : ''
    ]);
    return `
      ${renderAssetToolbar('systems', 'Search systems', 'Add system')}
      <div class="module-grid">
        <form class="module-form" data-action="create-system"${editFormAttributes('system', record)}>
          <h4>${record ? 'Edit system / equipment' : 'Create system / equipment'}</h4>
          <label class="form-field">
            <span>Equipment / Machine Name</span>
            <input name="name" required placeholder="Machine or system name" value="${escapeHtml(record?.name || '')}">
          </label>
          ${renderSystemParentField(record)}
          <div class="form-grid">
            <label class="form-field">
              <span>System Type</span>
              <select name="system_type">
                ${selectOptions(SYSTEM_TYPE_OPTIONS, record?.system_type || '', 'Select type')}
              </select>
            </label>
            <label class="form-field">
              <span>Brand</span>
              <input name="brand" placeholder="Brand" value="${escapeHtml(record?.brand || '')}">
            </label>
            <label class="form-field">
              <span>Reference / Model</span>
              <input name="asset_reference" placeholder="Rootdef, asset ID, or reference" value="${escapeHtml(record?.asset_reference || '')}">
            </label>
            <label class="form-field">
              <span>Model</span>
              <input name="model" placeholder="Model" value="${escapeHtml(record?.model || '')}">
            </label>
            <label class="form-field">
              <span>Serial number</span>
              <input name="serial_number" placeholder="Serial number" value="${escapeHtml(record?.serial_number || '')}">
            </label>
            <label class="form-field">
              <span>Equipment photo URL</span>
              <input type="url" name="equipment_photo_url" placeholder="https://..." value="${escapeHtml(record?.equipment_photo_url || '')}">
            </label>
            <label class="form-field">
              <span>PSI Min</span>
              <input type="number" name="psi_min" step="0.01" required placeholder="50" value="${escapeHtml(record?.psi_min ?? '')}">
            </label>
            <label class="form-field">
              <span>PSI Max</span>
              <input type="number" name="psi_max" step="0.01" required placeholder="70" value="${escapeHtml(record?.psi_max ?? '')}">
            </label>
          </div>
          <button type="submit" class="primary-action">${record ? 'Save changes' : 'Create system / equipment'}</button>
          ${editActions(record)}
        </form>
        <div class="record-panel">
          <h4>Systems / Equipment</h4>
          ${renderSystemList(systems, Boolean(searchTerm))}
        </div>
      </div>
    `;
  }

  function renderFiltersSection() {
    const record = editingRecord('filter', state.records.filters);
    const searchTerm = state.assetSearch.filters || '';
    const filters = filterRecords(state.records.filters, searchTerm, [
      filter => filter.filter_name,
      filter => filter.status,
      filter => filter.sku,
      filter => filter.filter_type ? optionLabel(FILTER_TYPE_OPTIONS, filter.filter_type, 'Filter') : '',
      filter => filter.system_id ? systemName(filter.system_id) : ''
    ]);
    return `
      ${renderAssetToolbar('filters', 'Search filters', 'Add filter')}
      <div class="module-grid">
        <form class="module-form" data-action="create-filter"${editFormAttributes('filter', record)}>
          <h4>${record ? 'Edit filter' : 'Create filter'}</h4>
          ${renderSystemSelectField('system_id', true, record?.system_id || '')}
          <label class="form-field">
            <span>Filter type/name</span>
            <input name="filter_name" required placeholder="Filter type/name" value="${escapeHtml(record?.filter_name || '')}">
          </label>
          <div class="form-grid">
            <label class="form-field">
              <span>Filter Type</span>
              <select name="filter_type">
                ${selectOptions(FILTER_TYPE_OPTIONS, record?.filter_type || '', 'Select type')}
              </select>
            </label>
            <label class="form-field">
              <span>SKU</span>
              <input name="sku" placeholder="SKU" value="${escapeHtml(record?.sku || '')}">
            </label>
            <label class="form-field">
              <span>Installed Date</span>
              <input type="date" name="installed_at" value="${escapeHtml(record?.installed_at || '')}">
            </label>
            <label class="form-field">
              <span>Due Date</span>
              <input type="date" name="due_date" value="${escapeHtml(record?.due_date || '')}">
            </label>
            <label class="form-field">
              <span>Life Months</span>
              <input type="number" name="life_months" min="0" step="1" value="${escapeHtml(record?.life_months ?? '')}">
            </label>
            <label class="form-field">
              <span>Filter amount</span>
              <input type="number" name="filter_quantity" min="1" step="1" placeholder="1" value="${escapeHtml(record?.filter_quantity ?? record?.filter_amount ?? '')}">
            </label>
            <label class="form-field">
              <span>Status</span>
              <select name="status">
                ${selectOptions([
                  ['active', 'Active'],
                  ['inactive', 'Inactive'],
                  ['replaced', 'Replaced'],
                  ['archived', 'Archived']
                ], record?.status || 'active')}
              </select>
            </label>
            <label class="form-field form-field-wide">
              <span>Filter photo URL</span>
              <input type="url" name="filter_photo_url" placeholder="https://..." value="${escapeHtml(record?.filter_photo_url || '')}">
            </label>
          </div>
          <button type="submit" class="primary-action">${record ? 'Save changes' : 'Create filter'}</button>
          ${editActions(record)}
        </form>
        <div class="record-panel">
          <h4>Filters</h4>
          ${renderFilterList(filters, Boolean(searchTerm))}
        </div>
      </div>
    `;
  }

  function renderPsiSection() {
    return `
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
      <div class="module-grid">
        <form class="module-form" data-action="create-maintenance-log">
          <h4>Create maintenance log</h4>
          ${renderSystemSelectField('system_id', true)}
          ${renderFilterSelectField('filter_id', false)}
          <div class="form-grid">
            <label class="form-field">
              <span>Maintenance Type</span>
              <select name="type">
                ${selectOptions(MAINTENANCE_TYPE_OPTIONS, '', 'Select type')}
              </select>
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

  function renderImportSection() {
    const preview = state.importPreview || createEmptyImportPreview();

    return `
      ${renderImportWorkflowHeader(preview)}
      ${renderImportStepIndicator(preview)}
      <div class="import-workflow" aria-live="polite">
        ${state.importReview.status === 'review' ? renderImportReview(preview) : renderImportPreview(preview)}
      </div>
    `;
  }

  function renderImportWorkflowHeader(preview) {
    const readyToImport = state.importReview.status === 'review'
      && !state.importReview.summary
      && !preview.errors.length
      && !hasUnresolvedImportConflicts(preview);
    const label = state.importReview.summary ? 'Complete' : readyToImport ? 'Ready to import' : 'Preview only';
    const tone = readyToImport || state.importReview.summary ? 'active' : 'unknown';
    return `
      <div class="import-workflow-header">
        <div>
          <h3>Import Inventory</h3>
          <p>Upload a CSV, review the summary, resolve issues, and import when ready.</p>
        </div>
        <span class="status-badge status-${escapeHtml(tone)}">${escapeHtml(label)}</span>
      </div>
    `;
  }

  function renderImportPreview(preview) {
    if (preview.status === 'reading' || preview.status === 'parsing') {
      return renderImportLoadingState(preview.status);
    }

    if (!preview.fileName && !preview.errors.length) {
      return renderImportUploadCard(preview);
    }

    return renderImportPreviewSummary(preview);
  }

  function renderImportUploadCard(preview) {
    return `
      <section class="record-panel import-primary-card import-upload-panel" aria-labelledby="import-upload-title">
        <div class="import-card-heading">
          <div>
            <h4 id="import-upload-title">Installed Filters</h4>
            <p>Upload a sheet with locations, machines, filter SKUs, filter types, and quantities.</p>
          </div>
        </div>
        <label class="import-dropzone">
          <span>CSV file</span>
          <strong>${preview.fileName ? escapeHtml(preview.fileName) : 'Choose Installed Filters CSV'}</strong>
          <small>Required columns: Venue, Machine, ReOrder#, Filter Type, Filter Amount</small>
          <input type="file" accept=".csv,text/csv" data-csv-import-file aria-label="Upload installed filters CSV">
        </label>
      </section>
    `;
  }

  function renderImportPreviewSummary(preview) {
    return `
      <section class="record-panel import-primary-card">
        <div class="import-card-heading">
          <div>
            <h4>CSV Summary</h4>
            <p>${escapeHtml(preview.fileName || 'Selected file')}</p>
          </div>
          <button type="button" class="secondary-action compact-action" data-clear-import-preview>Clear</button>
        </div>
        ${preview.errors.length ? renderImportNoticeList('Errors', preview.errors, 'error') : `
          <div class="import-simple-summary">
            <div>
              <span>Rows detected</span>
              <strong>${escapeHtml(preview.rows.length)}</strong>
            </div>
            <div>
              <span>Ready to create</span>
              <strong>${escapeHtml(preview.detected.locations)} Locations</strong>
              <strong>${escapeHtml(preview.detected.systems)} Systems</strong>
              <strong>${escapeHtml(preview.detected.filters)} Filters</strong>
            </div>
            <div>
              <span>Needs review</span>
              <strong>${escapeHtml(preview.warnings.length)} Issues</strong>
            </div>
            <div>
              <span>Skipped duplicates</span>
              <strong>${escapeHtml(preview.duplicates.length)} Duplicates</strong>
            </div>
          </div>
          <p class="import-summary-note">No records will be saved until you confirm the import.</p>
        `}
        ${preview.errors.length ? '' : `
          <div class="import-primary-actions">
            <button type="button" class="primary-action" data-open-import-review>${preview.warnings.length ? `Review ${preview.warnings.length} issues` : 'Review Import'}</button>
          </div>
        `}
        ${renderImportAdvancedDetails(preview)}
      </section>
    `;
  }

  function renderImportAdvancedDetails(preview) {
    return `
      <div class="import-advanced-details">
        <details>
          <summary>Show details</summary>
          <div class="import-detail-stack">
            <details>
              <summary>Column mapping</summary>
              ${renderImportColumnMapping()}
            </details>
            <details>
              <summary>Validation details</summary>
              ${renderImportValidationMessages(preview) || emptyState('No validation messages', 'Upload a CSV to see validation details.')}
            </details>
            <details>
              <summary>Duplicate details (${escapeHtml(preview.duplicates.length)})</summary>
              ${renderImportNoticeList('Duplicates skipped', preview.duplicates, 'duplicate') || emptyState('No duplicates', 'No duplicate records were detected.')}
            </details>
            <details>
              <summary>View grouped preview</summary>
              ${renderGroupedImportPreview(preview)}
            </details>
          </div>
        </details>
      </div>
    `;
  }

  function renderImportColumnMapping() {
    const items = [
      ['Venue', 'Location'],
      ['Machine', 'System'],
      ['ReOrder#', 'SKU'],
      ['Filter Type', 'Filter Type'],
      ['Filter Amount', 'Quantity']
    ];
    return `
      <div class="import-mapping-grid" aria-label="CSV column mapping">
        ${items.map(([source, target]) => `
          <div class="import-mapping-item">
            <span>${escapeHtml(source)}</span>
            <strong>${escapeHtml(target)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderImportReview(preview) {
    if (state.importReview.summary) {
      return `
        <section class="record-panel import-primary-card import-review-screen" aria-label="Import summary">
          ${renderImportFinalSummary()}
        </section>
      `;
    }

    if (!preview.rows.length || preview.errors.length) return renderImportPreviewSummary(preview);

    const importPlan = buildReviewedImportPlan(preview);
    return `
      <section class="record-panel import-primary-card import-review-screen" aria-label="Review import">
        <div class="import-card-heading">
          <div>
            <h4>Review Import</h4>
            <p>${hasUnresolvedImportConflicts(preview) ? `${preview.warnings.length} issues need review before import.` : 'Ready for final confirmation.'}</p>
          </div>
          <button type="button" class="secondary-action compact-action" data-close-import-review${state.importReview.isImporting ? ' disabled' : ''}>Back</button>
        </div>
        <div class="import-summary-grid import-review-summary">
          ${metricCard('Locations', String(preview.detected.locations), 'Detected')}
          ${metricCard('Systems', String(preview.detected.systems), 'Detected')}
          ${metricCard('Filters', String(preview.detected.filters), 'Detected')}
          ${metricCard('Issues', String(preview.warnings.length), preview.warnings.length ? 'Needs review' : 'None')}
        </div>
        ${renderImportConflictResolution(preview)}
        ${renderImportConfirmCard(preview, importPlan)}
        ${renderImportReviewDetails(importPlan, preview)}
      </section>
    `;
  }

  function renderImportStepIndicator(preview) {
    const activeStep = currentImportStep(preview);
    const steps = [
      ['upload', 'Upload CSV'],
      ['preview', 'Preview Import'],
      ['review', 'Review Import'],
      ['confirm', 'Confirm Import'],
      ['summary', 'Import Summary']
    ];
    const activeIndex = steps.findIndex(([step]) => step === activeStep);

    return `
      <div class="import-stepper" aria-label="Import progress">
        ${steps.map(([step, label], index) => `
          <span class="import-step${index === activeIndex ? ' is-active' : ''}${index < activeIndex ? ' is-complete' : ''}">
            <span>${escapeHtml(String(index + 1))}</span>
            ${escapeHtml(label)}
          </span>
        `).join('')}
      </div>
    `;
  }

  function currentImportStep(preview) {
    if (state.importReview.summary) return 'summary';
    if (state.importReview.status === 'review') {
      if (state.importReview.confirmations.createRecords || state.importReview.isImporting) return 'confirm';
      return 'review';
    }
    if (preview.rows.length || preview.errors.length || preview.status === 'reading' || preview.status === 'parsing') return 'preview';
    return 'upload';
  }

  function renderImportReviewEntities(importPlan) {
    return `
      <div class="import-review-entities">
        ${renderImportEntityTable('Locations to create', importPlan.locations, [
          ['name', 'Location'],
          ['sourceRows', 'Rows']
        ])}
        ${renderImportEntityTable('Systems to create', importPlan.systems, [
          ['locationName', 'Location'],
          ['name', 'System'],
          ['sourceRows', 'Rows']
        ])}
        ${renderImportEntityTable('Filters to create', importPlan.filters, [
          ['locationName', 'Location'],
          ['systemName', 'System'],
          ['sku', 'SKU'],
          ['filterName', 'Filter'],
          ['filterQuantity', 'Qty'],
          ['sourceRows', 'Rows']
        ])}
      </div>
    `;
  }

  function renderImportReviewDetails(importPlan, preview) {
    return `
      <div class="import-review-details">
        <details>
          <summary>Locations to create (${escapeHtml(importPlan.locations.length)})</summary>
          ${renderImportEntityTable('Locations to create', importPlan.locations, [
            ['name', 'Location'],
            ['sourceRows', 'Rows']
          ])}
        </details>
        <details>
          <summary>Systems to create (${escapeHtml(importPlan.systems.length)})</summary>
          ${renderImportEntityTable('Systems to create', importPlan.systems, [
            ['locationName', 'Location'],
            ['name', 'System'],
            ['sourceRows', 'Rows']
          ])}
        </details>
        <details>
          <summary>Filters to create (${escapeHtml(importPlan.filters.length)})</summary>
          ${renderImportEntityTable('Filters to create', importPlan.filters, [
            ['locationName', 'Location'],
            ['systemName', 'System'],
            ['sku', 'SKU'],
            ['filterName', 'Filter'],
            ['filterQuantity', 'Qty'],
            ['sourceRows', 'Rows']
          ])}
        </details>
        <details>
          <summary>Duplicates skipped (${escapeHtml(preview.duplicates.length)})</summary>
          ${renderImportNoticeList('Duplicates skipped', preview.duplicates, 'duplicate') || emptyState('No duplicates', 'No duplicate records were detected.')}
        </details>
      </div>
    `;
  }

  function renderImportConfirmCard(preview, importPlan) {
    const hasUnresolvedConflicts = hasUnresolvedImportConflicts(preview);
    const canConfirm = canConfirmImport(preview);
    const messages = getImportPreflightMessages(preview).filter(item => item.type === 'error');
    return `
      <section class="import-confirm-card" aria-label="Confirm import">
        <div>
          <span>${hasUnresolvedConflicts ? 'Resolve issues first' : 'Ready to import'}</span>
          <h5>${hasUnresolvedConflicts ? 'Resolve issues to continue' : 'Ready to import'}</h5>
        </div>
        <div class="import-confirm-summary">
          <div>
            <span>Will create</span>
            <strong>${escapeHtml(importPlan.locations.length)} Locations</strong>
            <strong>${escapeHtml(importPlan.systems.length)} Systems</strong>
            <strong>${escapeHtml(importPlan.filters.length)} Filters</strong>
          </div>
          <div>
            <span>Will skip</span>
            <strong>${escapeHtml(preview.duplicates.length)} Duplicates</strong>
            <strong>${escapeHtml(importPlan.manualReview.length)} Manual review</strong>
          </div>
        </div>
        <label class="import-confirmation-check">
          <input type="checkbox" data-import-confirmation${state.importReview.confirmations.createRecords ? ' checked' : ''}${state.importReview.isImporting ? ' disabled' : ''}>
          <span>I understand this will create records in Supabase.</span>
        </label>
        ${messages.length ? `
          <div class="import-preflight-list">
            ${messages.map(item => `
              <div class="import-preflight-item import-preflight-${escapeHtml(item.type)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <button type="button" class="primary-action" data-confirm-import${canConfirm ? '' : ' disabled'}>${state.importReview.isImporting ? 'Importing...' : 'Confirm Import'}</button>
      </section>
    `;
  }

  function renderImportConflictResolution(preview) {
    if (!preview.quantityConflicts.length) return '';
    return `
      <section class="import-conflict-section" aria-label="Quantity conflicts">
        <div class="import-conflict-heading">
          <h5>${escapeHtml(preview.quantityConflicts.length)} issues need review</h5>
          <p>Choose a quantity or mark the item for manual review.</p>
        </div>
        <div class="import-conflict-list">
          ${preview.quantityConflicts.map(conflict => renderImportConflictCard(conflict)).join('')}
        </div>
      </section>
    `;
  }

  function renderImportConflictCard(conflict) {
    const resolution = state.importReview.resolutions[conflict.id];
    const isManual = resolution?.type === 'manual';
    const customValue = resolution?.type === 'custom' && resolution.quantity ? resolution.quantity : '';
    return `
      <article class="import-conflict-card${resolution ? ' is-resolved' : ''}">
        <div class="import-conflict-meta">
          <div><span>Location</span><strong>${escapeHtml(conflict.locationName)}</strong></div>
          <div><span>System</span><strong>${escapeHtml(conflict.systemName)}</strong></div>
          <div><span>SKU</span><strong>${escapeHtml(conflict.sku)}</strong></div>
          <div><span>Filter</span><strong>${escapeHtml(conflict.filterName)}</strong></div>
        </div>
        <div class="import-conflict-quantities">
          <strong>Quantities found</strong>
          <ul>
            ${conflict.entries.map(entry => `<li>Row ${escapeHtml(entry.row)}: ${escapeHtml(entry.quantity)}</li>`).join('')}
          </ul>
        </div>
        <div class="import-conflict-actions">
          ${conflict.quantities.map(quantity => `
            <button type="button" class="secondary-action compact-action${resolution?.type === 'quantity' && resolution.quantity === quantity ? ' is-selected' : ''}" data-resolve-import-conflict="quantity" data-conflict-id="${escapeHtml(conflict.id)}" data-quantity="${escapeHtml(quantity)}"${state.importReview.isImporting ? ' disabled' : ''}>Use quantity ${escapeHtml(quantity)}</button>
          `).join('')}
          <label class="import-custom-quantity">
            <span>Custom quantity</span>
            <input type="number" min="1" step="1" value="${escapeHtml(customValue)}" data-import-conflict-custom data-conflict-id="${escapeHtml(conflict.id)}"${state.importReview.isImporting ? ' disabled' : ''}>
          </label>
          <button type="button" class="secondary-action compact-action${isManual ? ' is-selected' : ''}" data-resolve-import-conflict="manual" data-conflict-id="${escapeHtml(conflict.id)}"${state.importReview.isImporting ? ' disabled' : ''}>Mark for manual review</button>
        </div>
        <p class="import-conflict-resolution">${escapeHtml(importConflictResolutionText(resolution))}</p>
      </article>
    `;
  }

  function renderImportReviewNotices(preview) {
    return `
      <div class="import-review-notices">
        ${renderImportNoticeList('Duplicate notices', preview.duplicates, 'duplicate')}
        ${renderImportNoticeList('Warning notices', preview.warnings, 'warning')}
      </div>
    `;
  }

  function renderImportReadyState(preview) {
    const hasUnresolvedConflicts = hasUnresolvedImportConflicts(preview);
    const hasSummary = Boolean(state.importReview.summary);
    const canConfirm = canConfirmImport(preview);
    const warningStatus = hasUnresolvedConflicts
      ? `Warnings pending: ${preview.warnings.length}`
      : `Warnings resolved: ${preview.warnings.length}`;
    return `
      <div class="import-ready-panel${hasSummary || canConfirm ? ' is-ready' : hasUnresolvedConflicts ? ' is-blocked' : ''}">
        <div>
          <strong>${state.importReview.isImporting ? 'Importing records' : hasSummary ? 'Import complete' : hasUnresolvedConflicts ? 'Resolve conflicts to continue' : 'Ready for import'}</strong>
          <p>Locations: ${escapeHtml(preview.detected.locations)} | Systems: ${escapeHtml(preview.detected.systems)} | Filters: ${escapeHtml(preview.detected.filters)} | ${escapeHtml(warningStatus)}</p>
        </div>
        <button type="button" class="primary-action" data-confirm-import${canConfirm ? '' : ' disabled'}>${state.importReview.isImporting ? 'Importing...' : hasSummary ? 'Import complete' : 'Confirm Import'}</button>
      </div>
    `;
  }

  function renderImportExecutionGate(preview) {
    const messages = getImportPreflightMessages(preview);
    return `
      <div class="import-execution-gate">
        <div class="import-gate-heading">
          <span>Supabase write</span>
          <strong>Confirm before creating records</strong>
        </div>
        <label class="import-confirmation-check">
          <input type="checkbox" data-import-confirmation${state.importReview.confirmations.createRecords ? ' checked' : ''}${state.importReview.isImporting ? ' disabled' : ''}>
          <span>I understand this will create records in Supabase.</span>
        </label>
        ${messages.length ? `
          <div class="import-preflight-list">
            ${messages.map(item => `
              <div class="import-preflight-item import-preflight-${escapeHtml(item.type)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderImportFinalSummary() {
    const summary = state.importReview.summary;
    if (!summary) return '';
    return `
      <section class="import-final-summary" aria-label="Final import summary">
        <div class="import-conflict-heading">
          <h5>Import complete</h5>
          <p>${escapeHtml(summary.finishedAt ? `Completed ${summary.finishedAt}` : 'Import finished.')}</p>
        </div>
        <div class="import-complete-grid">
          <div>
            <span>Created</span>
            <strong>${escapeHtml(summary.locationsCreated.length)} Locations</strong>
            <strong>${escapeHtml(summary.systemsCreated.length)} Systems</strong>
            <strong>${escapeHtml(summary.filtersCreated.length)} Filters</strong>
          </div>
          <div>
            <span>Skipped</span>
            <strong>${escapeHtml(summary.existingDuplicatesSkipped.length + summary.csvDuplicatesSkipped.length)} Duplicates</strong>
            <strong>${escapeHtml(summary.manualReviewSkipped.length)} Manual review</strong>
          </div>
          <div>
            <span>Errors</span>
            <strong>${escapeHtml(summary.errors.length)}</strong>
          </div>
        </div>
        <details class="import-summary-detail">
          <summary>View import details</summary>
          ${renderImportSummaryDetail('Created locations', summary.locationsCreated)}
          ${renderImportSummaryDetail('Created systems', summary.systemsCreated)}
          ${renderImportSummaryDetail('Created filters', summary.filtersCreated)}
          ${renderImportSummaryDetail('Existing duplicates skipped', summary.existingDuplicatesSkipped)}
          ${renderImportSummaryDetail('Manual review items skipped', summary.manualReviewSkipped)}
          ${renderImportSummaryDetail('Errors', summary.errors)}
        </details>
        <div class="import-primary-actions">
          <button type="button" class="secondary-action compact-action" data-module-tab="assets" data-tab="filters">View Data</button>
          <button type="button" class="secondary-action compact-action" data-clear-import-preview>Import another CSV</button>
        </div>
      </section>
    `;
  }

  function renderImportSummaryDetail(title, items) {
    if (!items.length) return '';
    return `
      <details class="import-summary-detail">
        <summary>${escapeHtml(title)} (${escapeHtml(items.length)})</summary>
        <ul>
          ${items.map(item => `<li>${escapeHtml(importSummaryItemText(item))}</li>`).join('')}
        </ul>
      </details>
    `;
  }

  function renderImportLoadingState(status) {
    const title = status === 'parsing' ? 'Parsing CSV' : 'Reading file';
    const copy = status === 'parsing'
      ? 'Validating columns, rows, duplicates, warnings, and grouped inventory preview.'
      : 'Loading the selected CSV in the browser. No records are being saved.';
    return `
      <div class="import-loading-state" role="status">
        <span class="import-spinner" aria-hidden="true"></span>
        <div>
          <h5>${escapeHtml(title)}</h5>
          <p>${escapeHtml(copy)}</p>
        </div>
      </div>
    `;
  }

  function renderImportEmptyGuide() {
    return `
      <div class="import-empty-guide">
        <article>
          <strong>Expected CSV</strong>
          <span>Venue, Machine, ReOrder#, Filter Type, Filter Amount</span>
        </article>
        <article>
          <strong>Preview output</strong>
          <span>Location -> System -> Filter, with validation messages before any import action exists.</span>
        </article>
      </div>
    `;
  }

  function renderImportValidationMessages(preview) {
    if (!preview.validations.length) return '';
    return `
      <div class="import-validation-list" aria-label="CSV validation messages">
        ${preview.validations.map(item => `
          <div class="import-validation-item import-validation-${escapeHtml(item.type || 'info')}">
            <strong>${escapeHtml(item.label || 'Validation')}</strong>
            <span>${escapeHtml(item.message || '')}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderGroupedImportPreview(preview) {
    if (preview.errors.length && !preview.groups.length) {
      return emptyState('No preview rows available', 'Fix the CSV validation errors and upload the file again.');
    }

    if (!preview.groups.length) {
      return emptyState('No valid filters detected', 'Rows with missing required values or invalid quantities are excluded from the grouped preview.');
    }

    return `
      <div class="import-grouped-preview" aria-label="Grouped CSV preview">
        ${preview.groups.map(location => `
          <article class="import-location-group">
            <div class="import-group-header">
              <div>
                <span>Location</span>
                <strong>${escapeHtml(location.name)}</strong>
              </div>
              <small>${escapeHtml(location.systems.length)} systems</small>
            </div>
            <div class="import-system-list">
              ${location.systems.map(system => `
                <section class="import-system-group">
                  <div class="import-system-header">
                    <div>
                      <span>System</span>
                      <strong>${escapeHtml(system.name)}</strong>
                    </div>
                    <small>${escapeHtml(system.filters.length)} filters</small>
                  </div>
                  <div class="import-filter-list">
                    ${system.filters.map(filter => `
                      <div class="import-filter-row">
                        <div>
                          <strong>${escapeHtml(filter.filterName)}</strong>
                          <span>SKU ${escapeHtml(filter.sku)}</span>
                        </div>
                        <div class="import-filter-meta">
                          <span>Qty ${escapeHtml(filter.filterQuantity)}</span>
                          <span>Rows ${escapeHtml(filter.sourceRows.join(', '))}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </section>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderImportNoticeList(title, notices, type) {
    if (!notices.length) return '';
    const visibleNotices = notices.slice(0, 3);
    const hiddenNotices = notices.slice(3);
    return `
      <div class="import-notice-list import-notice-${escapeHtml(type)}">
        <div class="import-notice-heading">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(notices.length)}</span>
        </div>
        <ul>
          ${visibleNotices.map(notice => `<li>${escapeHtml(importNoticeText(notice))}</li>`).join('')}
        </ul>
        ${hiddenNotices.length ? `
          <details class="import-notice-detail">
            <summary>Show ${escapeHtml(hiddenNotices.length)} more</summary>
            <ul>
              ${hiddenNotices.map(notice => `<li>${escapeHtml(importNoticeText(notice))}</li>`).join('')}
            </ul>
          </details>
        ` : ''}
      </div>
    `;
  }

  function importNoticeText(notice) {
    if (typeof notice === 'string') return notice;
    const rows = notice.rows?.length ? ` Rows: ${notice.rows.join(', ')}.` : '';
    return `${notice.message || ''}${rows}`;
  }

  function renderImportEntityTable(title, items, columns) {
    if (!items.length) return `
      <article class="import-preview-section">
        <h5>${escapeHtml(title)}</h5>
        ${emptyState('Nothing new detected', 'Existing records and invalid rows are skipped in this preview.')}
      </article>
    `;

    return `
      <article class="import-preview-section">
        <h5>${escapeHtml(title)}</h5>
        <div class="import-table-wrap">
          <table class="import-table">
            <thead>
              <tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  ${columns.map(([key]) => `<td>${escapeHtml(formatImportCellValue(item[key]))}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </article>
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

  function buildImportPreview(csvText, fileName = '') {
    const preview = createEmptyImportPreview();
    preview.fileName = fileName;
    preview.status = 'ready';

    const csvRows = parseCsv(csvText).filter(row => row.some(value => cleanImportValue(value)));
    if (!csvRows.length) {
      preview.status = 'error';
      preview.errors.push('The CSV file is empty.');
      preview.validations.push({ type: 'error', label: 'File content', message: 'The CSV file has no readable rows.' });
      return preview;
    }

    const header = csvRows[0];
    const columnIndexes = mapImportColumns(header);
    const missingColumns = IMPORT_COLUMNS.filter(column => columnIndexes[column.key] == null);
    if (missingColumns.length) {
      preview.status = 'error';
      preview.errors.push(`Missing required columns: ${missingColumns.map(column => column.source).join(', ')}.`);
      preview.validations.push({ type: 'error', label: 'Required columns', message: `Missing ${missingColumns.map(column => column.source).join(', ')}.` });
      return preview;
    }
    preview.validations.push({ type: 'success', label: 'Required columns', message: 'All required CSV columns were detected.' });

    const dataRows = csvRows.slice(1);
    if (!dataRows.length) {
      preview.status = 'error';
      preview.errors.push('The CSV has headers but no inventory rows.');
      preview.validations.push({ type: 'error', label: 'Inventory rows', message: 'The file only contains headers.' });
      return preview;
    }
    preview.validations.push({ type: 'success', label: 'Inventory rows', message: `${dataRows.length} data rows found.` });

    preview.rows = dataRows.map((values, index) => normalizeImportRow(values, columnIndexes, index + 2));
    preview.rows.forEach(row => {
      if (row.missingFields.length) {
        preview.warnings.push({
          message: `Row ${row.lineNumber} is missing ${row.missingFields.join(', ')}.`,
          rows: [row.lineNumber]
        });
      }
      if (row.invalidQuantity) {
        preview.warnings.push({
          message: `Row ${row.lineNumber} has an invalid Filter Amount. Use a positive whole number.`,
          rows: [row.lineNumber]
        });
      }
    });

    const validRows = preview.rows.filter(row => row.isValid);
    const invalidRows = preview.rows.length - validRows.length;
    if (invalidRows) {
      preview.validations.push({ type: 'warning', label: 'Skipped rows', message: `${invalidRows} rows have missing fields or invalid quantities.` });
    }
    if (!validRows.length) {
      preview.status = 'error';
      preview.errors.push('No valid rows are ready to preview. Fix the warnings and upload the CSV again.');
      preview.validations.push({ type: 'error', label: 'Valid rows', message: 'No rows passed validation.' });
      return preview;
    }
    preview.validations.push({ type: 'success', label: 'Valid rows', message: `${validRows.length} rows are available for preview.` });

    if (state.activeWorkspace?.mode && state.activeWorkspace.mode !== 'business') {
      preview.warnings.push('This CSV maps Venue to filtracore_locations, which is intended for business workspaces. Home workspaces use properties.');
    }

    preview.groups = buildImportPreviewGroups(validRows);
    preview.detected = {
      locations: preview.groups.length,
      systems: preview.groups.reduce((total, location) => total + location.systems.length, 0),
      filters: preview.groups.reduce((total, location) => total + location.systems.reduce((systemTotal, system) => systemTotal + system.filters.length, 0), 0)
    };
    collectImportLocations(preview, validRows);
    collectImportSystems(preview, validRows);
    collectImportFilters(preview, validRows);
    preview.quantityConflicts = collectImportQuantityConflicts(validRows);
    return preview;
  }

  function validateCsvFile(file) {
    const name = String(file?.name || '');
    const type = String(file?.type || '');
    if (!name.toLowerCase().endsWith('.csv') && type && type !== 'text/csv' && type !== 'application/vnd.ms-excel') {
      throw new Error('Upload a CSV file with a .csv extension.');
    }
    if (file?.size === 0) {
      throw new Error('The selected CSV file is empty.');
    }
  }

  function buildImportPreviewGroups(rows) {
    const locationMap = new Map();

    rows.forEach(row => {
      const locationKey = canonicalImportKey(row.venue);
      const systemKey = canonicalImportKey(row.machine);
      const filterKey = `${canonicalImportKey(row.sku)}|${canonicalImportKey(row.filterName)}`;

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          name: row.venue,
          systems: [],
          systemMap: new Map()
        });
      }

      const location = locationMap.get(locationKey);
      if (!location.systemMap.has(systemKey)) {
        const system = {
          name: row.machine,
          filters: [],
          filterMap: new Map()
        };
        location.systemMap.set(systemKey, system);
        location.systems.push(system);
      }

      const system = location.systemMap.get(systemKey);
      if (!system.filterMap.has(filterKey)) {
        const filter = {
          sku: row.sku,
          filterName: row.filterName,
          filterQuantity: row.filterQuantity,
          sourceRows: []
        };
        system.filterMap.set(filterKey, filter);
        system.filters.push(filter);
      }

      system.filterMap.get(filterKey).sourceRows.push(row.lineNumber);
    });

    return Array.from(locationMap.values()).map(location => ({
      name: location.name,
      systems: location.systems.map(system => ({
        name: system.name,
        filters: system.filters.map(filter => ({
          sku: filter.sku,
          filterName: filter.filterName,
          filterQuantity: filter.filterQuantity,
          sourceRows: filter.sourceRows
        }))
      }))
    }));
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const content = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];

      if (inQuotes) {
        if (char === '"' && content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    if (field !== '' || row.length) {
      row.push(field);
      rows.push(row);
    }

    return rows;
  }

  function readCsvFile(file) {
    if (typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
      reader.readAsText(file);
    });
  }

  function mapImportColumns(headerRow) {
    return headerRow.reduce((columns, label, index) => {
      const normalized = normalizeImportHeader(label);
      const key = IMPORT_HEADER_ALIASES[normalized];
      if (key && columns[key] == null) columns[key] = index;
      return columns;
    }, {});
  }

  function normalizeImportRow(values, columnIndexes, lineNumber) {
    const row = {
      lineNumber,
      venue: cleanImportValue(values[columnIndexes.venue]),
      machine: cleanImportValue(values[columnIndexes.machine]),
      sku: cleanImportValue(values[columnIndexes.sku]),
      filterName: cleanImportValue(values[columnIndexes.filterName]),
      filterQuantity: parseImportQuantity(cleanImportValue(values[columnIndexes.filterQuantity])),
      rawFilterQuantity: cleanImportValue(values[columnIndexes.filterQuantity]),
      missingFields: [],
      invalidQuantity: false,
      isValid: true
    };

    if (!row.venue) row.missingFields.push('Venue');
    if (!row.machine) row.missingFields.push('Machine');
    if (!row.sku) row.missingFields.push('ReOrder#');
    if (!row.filterName) row.missingFields.push('Filter Type');
    if (row.rawFilterQuantity && (row.filterQuantity == null || row.filterQuantity < 1)) row.invalidQuantity = true;
    if (!row.rawFilterQuantity) row.missingFields.push('Filter Amount');
    row.isValid = row.missingFields.length === 0 && !row.invalidQuantity;
    return row;
  }

  function collectImportLocations(preview, rows) {
    const existingLocations = new Map(state.records.locations.map(location => [
      canonicalImportKey(location.name),
      location
    ]));
    const locationMap = new Map();

    rows.forEach(row => {
      const key = canonicalImportKey(row.venue);
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          name: row.venue,
          sourceRows: []
        });
      }
      locationMap.get(key).sourceRows.push(row.lineNumber);
    });

    locationMap.forEach((location, key) => {
      if (location.sourceRows.length > 1) {
        preview.duplicates.push({
          message: `Venue "${location.name}" appears more than once in the CSV. Preview keeps one location.`,
          rows: location.sourceRows
        });
      }
      if (existingLocations.has(key)) {
        preview.duplicates.push({
          message: `Location "${location.name}" already exists in this workspace and will not be created again.`,
          rows: location.sourceRows
        });
        return;
      }
      preview.locations.push(location);
    });
  }

  function collectImportSystems(preview, rows) {
    const existingLocationNameById = new Map(state.records.locations.map(location => [
      location.id,
      canonicalImportKey(location.name)
    ]));
    const existingSystemKeys = new Set(state.records.systems.map(system => {
      const locationKey = system.location_id ? existingLocationNameById.get(system.location_id) : '';
      return locationKey ? `${locationKey}|${canonicalImportKey(system.name)}` : '';
    }).filter(Boolean));
    const systemMap = new Map();

    rows.forEach(row => {
      const key = `${canonicalImportKey(row.venue)}|${canonicalImportKey(row.machine)}`;
      if (!systemMap.has(key)) {
        systemMap.set(key, {
          name: row.machine,
          locationName: row.venue,
          sourceRows: []
        });
      }
      systemMap.get(key).sourceRows.push(row.lineNumber);
    });

    systemMap.forEach((system, key) => {
      if (system.sourceRows.length > 1) {
        preview.duplicates.push({
          message: `Machine "${system.name}" at "${system.locationName}" appears in multiple rows. Preview keeps one system and attaches the filters to it.`,
          rows: system.sourceRows
        });
      }
      if (existingSystemKeys.has(key)) {
        preview.duplicates.push({
          message: `System "${system.name}" already exists at "${system.locationName}" and will not be created again.`,
          rows: system.sourceRows
        });
        return;
      }
      preview.systems.push(system);
    });
  }

  function collectImportFilters(preview, rows) {
    const existingLocationNameById = new Map(state.records.locations.map(location => [
      location.id,
      canonicalImportKey(location.name)
    ]));
    const existingSystemKeyById = new Map(state.records.systems.map(system => {
      const locationKey = system.location_id ? existingLocationNameById.get(system.location_id) : '';
      return [
        system.id,
        locationKey ? `${locationKey}|${canonicalImportKey(system.name)}` : ''
      ];
    }));
    const existingFilterKeys = new Set(state.records.filters.map(filter => {
      const systemKey = existingSystemKeyById.get(filter.system_id);
      if (!systemKey) return '';
      return `${systemKey}|${canonicalImportKey(filter.sku)}|${canonicalImportKey(filter.filter_name)}`;
    }).filter(Boolean));
    const filterMap = new Map();

    rows.forEach(row => {
      const systemKey = `${canonicalImportKey(row.venue)}|${canonicalImportKey(row.machine)}`;
      const filterKey = `${systemKey}|${canonicalImportKey(row.sku)}|${canonicalImportKey(row.filterName)}`;
      const existingPreview = filterMap.get(filterKey);

      if (existingPreview) {
        existingPreview.sourceRows.push(row.lineNumber);
        preview.duplicates.push({
          message: `Filter "${row.filterName}" with SKU "${row.sku}" appears more than once for "${row.machine}". Preview keeps one filter.`,
          rows: existingPreview.sourceRows
        });
        if (existingPreview.filterQuantity !== row.filterQuantity) {
          preview.warnings.push({
            message: `Filter "${row.filterName}" has conflicting quantities in the CSV.`,
            rows: existingPreview.sourceRows
          });
        }
        return;
      }

      if (existingFilterKeys.has(filterKey)) {
        preview.duplicates.push({
          message: `Filter "${row.filterName}" with SKU "${row.sku}" already exists for "${row.machine}" and will not be created again.`,
          rows: [row.lineNumber]
        });
        return;
      }

      const item = {
        sku: row.sku,
        filterName: row.filterName,
        filterQuantity: row.filterQuantity,
        systemName: row.machine,
        locationName: row.venue,
        sourceRows: [row.lineNumber]
      };
      filterMap.set(filterKey, item);
      preview.filters.push(item);
    });
  }

  function collectImportQuantityConflicts(rows) {
    const filterMap = new Map();

    rows.forEach(row => {
      const key = [
        canonicalImportKey(row.venue),
        canonicalImportKey(row.machine),
        canonicalImportKey(row.sku),
        canonicalImportKey(row.filterName)
      ].join('|');

      if (!filterMap.has(key)) {
        filterMap.set(key, {
          id: key,
          locationName: row.venue,
          systemName: row.machine,
          sku: row.sku,
          filterName: row.filterName,
          entries: [],
          quantitySet: new Set()
        });
      }

      const item = filterMap.get(key);
      item.entries.push({
        row: row.lineNumber,
        quantity: row.filterQuantity
      });
      item.quantitySet.add(row.filterQuantity);
    });

    return Array.from(filterMap.values())
      .filter(item => item.quantitySet.size > 1)
      .map(item => ({
        id: item.id,
        locationName: item.locationName,
        systemName: item.systemName,
        sku: item.sku,
        filterName: item.filterName,
        entries: item.entries,
        quantities: Array.from(item.quantitySet).sort((a, b) => b - a)
      }));
  }

  function setImportConflictResolution(conflictId, resolution) {
    if (!conflictId) return;
    const nextResolutions = { ...state.importReview.resolutions };
    const summary = state.importReview.summary;
    if (resolution.type === 'custom' && (!resolution.quantity || resolution.quantity < 1)) {
      delete nextResolutions[conflictId];
    } else {
      nextResolutions[conflictId] = resolution;
    }
    state.importReview = {
      ...state.importReview,
      resolutions: nextResolutions,
      summary: null,
      error: summary ? '' : state.importReview.error
    };
  }

  function hasUnresolvedImportConflicts(preview) {
    return preview.quantityConflicts.some(conflict => !state.importReview.resolutions[conflict.id]);
  }

  function importConflictResolutionText(resolution) {
    if (!resolution) return 'Unresolved';
    if (resolution.type === 'manual') return 'Marked for manual review';
    if (resolution.type === 'custom') return `Custom quantity ${resolution.quantity} selected`;
    return `Quantity ${resolution.quantity} selected`;
  }

  function buildReviewedImportPlan(preview) {
    const locationMap = new Map();
    const systemMap = new Map();
    const filters = [];
    const manualReview = [];

    preview.filters.forEach(filter => {
      const conflictId = importFilterConflictId(filter);
      const resolution = state.importReview.resolutions[conflictId];
      if (resolution?.type === 'manual') {
        manualReview.push({
          type: 'filter',
          locationName: filter.locationName,
          systemName: filter.systemName,
          sku: filter.sku,
          filterName: filter.filterName,
          sourceRows: filter.sourceRows,
          reason: 'Manual review'
        });
        return;
      }

      const filterQuantity = resolution?.type === 'quantity' || resolution?.type === 'custom'
        ? resolution.quantity
        : filter.filterQuantity;
      const item = {
        ...filter,
        filterQuantity
      };
      filters.push(item);

      const locationKey = canonicalImportKey(item.locationName);
      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          name: item.locationName,
          sourceRows: []
        });
      }
      locationMap.get(locationKey).sourceRows.push(...item.sourceRows);

      const systemKey = `${locationKey}|${canonicalImportKey(item.systemName)}`;
      if (!systemMap.has(systemKey)) {
        systemMap.set(systemKey, {
          name: item.systemName,
          locationName: item.locationName,
          sourceRows: []
        });
      }
      systemMap.get(systemKey).sourceRows.push(...item.sourceRows);
    });

    return {
      locations: Array.from(locationMap.values()).map(item => ({
        ...item,
        sourceRows: uniqueSortedNumbers(item.sourceRows)
      })),
      systems: Array.from(systemMap.values()).map(item => ({
        ...item,
        sourceRows: uniqueSortedNumbers(item.sourceRows)
      })),
      filters,
      manualReview
    };
  }

  function importFilterConflictId(filter) {
    return [
      canonicalImportKey(filter.locationName),
      canonicalImportKey(filter.systemName),
      canonicalImportKey(filter.sku),
      canonicalImportKey(filter.filterName)
    ].join('|');
  }

  function uniqueSortedNumbers(values) {
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }

  function getImportPreflightMessages(preview) {
    const messages = [];
    if (!state.activeClient?.id) {
      messages.push({ type: 'error', label: 'Active client', message: 'Select an active client before importing.' });
    }
    if (!state.activeWorkspace?.id) {
      messages.push({ type: 'error', label: 'Workspace', message: 'Select a FiltraCore workspace before importing.' });
    } else if (state.activeWorkspace.mode !== 'business') {
      messages.push({ type: 'error', label: 'Workspace mode', message: 'CSV business imports require a business workspace.' });
    }
    if (!getImportCompany()) {
      messages.push({ type: 'error', label: 'Company', message: 'Create or select a company record for this workspace before importing.' });
    } else if (!hasStratCompany()) {
      messages.push({ type: 'warning', label: 'Company', message: 'A company exists, but STRAT was not found. The import will use the first workspace company.' });
    }
    if (hasUnresolvedImportConflicts(preview)) {
      messages.push({ type: 'error', label: 'Conflicts', message: 'Resolve every quantity conflict before confirming import.' });
    }
    if (preview.errors.length) {
      messages.push({ type: 'error', label: 'Preview errors', message: 'Fix CSV validation errors before importing.' });
    }
    return messages;
  }

  function getImportCompany() {
    return state.records.companies.find(company => canonicalImportKey(company.name) === 'strat')
      || state.records.companies[0]
      || null;
  }

  function hasStratCompany() {
    return state.records.companies.some(company => canonicalImportKey(company.name) === 'strat');
  }

  function canConfirmImport(preview) {
    if (state.importReview.isImporting) return false;
    if (state.importReview.summary) return false;
    if (!state.importReview.confirmations.createRecords) return false;
    return getImportPreflightMessages(preview).every(item => item.type !== 'error');
  }

  async function executeReviewedImport() {
    const preview = state.importPreview;
    if (!canConfirmImport(preview)) return;
    requireOwnerAdmin('Only owner/admin users can import records.');

    state.importReview = {
      ...state.importReview,
      isImporting: true,
      summary: null,
      error: ''
    };
    renderSections();
    switchSection('import', false);

    let summary;
    try {
      summary = await runReviewedImport(preview);
      state.importReview = {
        ...state.importReview,
        status: 'review',
        isImporting: false,
        summary,
        error: ''
      };
      await refreshWorkspace();
      switchSection('import', false);
    } catch (error) {
      summary = createImportSummary(preview);
      summary.errors.push({
        type: 'import',
        message: error.message || 'Import failed before records could be created.'
      });
      state.importReview = {
        ...state.importReview,
        status: 'review',
        isImporting: false,
        summary,
        error: error.message || 'Import failed.'
      };
      renderSections();
      switchSection('import', false);
    }
  }

  async function runReviewedImport(preview) {
    const client = initializeSupabase();
    const workspace = requireActiveWorkspace();
    const clientId = state.activeClient?.id;
    if (!clientId) throw new Error('Active client is required before importing.');
    if (workspace.mode !== 'business') throw new Error('Import requires a business workspace.');

    const [companies, existingLocations, existingSystems, existingFilters] = await Promise.all([
      selectWorkspaceRows(client, 'filtracore_companies', clientId, workspace.id, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_locations', clientId, workspace.id, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_systems', clientId, workspace.id, 'created_at'),
      selectWorkspaceRows(client, 'filtracore_filters', clientId, workspace.id, 'created_at')
    ]);
    const company = companies.find(item => canonicalImportKey(item.name) === 'strat') || companies[0];
    if (!company) throw new Error('A company record is required before importing business locations.');

    const plan = buildReviewedImportPlan(preview);
    const summary = createImportSummary(preview, plan);
    const locationByName = new Map();
    const systemByKey = new Map();
    const filterKeys = new Set();

    existingLocations.forEach(location => {
      locationByName.set(canonicalImportKey(location.name), location);
    });
    existingSystems.forEach(system => {
      if (!system.location_id) return;
      systemByKey.set(`${system.location_id}|${canonicalImportKey(system.name)}`, system);
    });
    existingFilters.forEach(filter => {
      if (!filter.system_id) return;
      filterKeys.add(`${filter.system_id}|${canonicalImportKey(filter.sku)}|${canonicalImportKey(filter.filter_name)}`);
    });

    for (const location of plan.locations) {
      const locationKey = canonicalImportKey(location.name);
      if (locationByName.has(locationKey)) {
        summary.existingDuplicatesSkipped.push({
          type: 'location',
          name: location.name,
          sourceRows: location.sourceRows,
          reason: 'Location already exists'
        });
        continue;
      }

      try {
        const inserted = await insertRow('filtracore_locations', {
          client_id: clientId,
          workspace_id: workspace.id,
          company_id: company.id,
          name: location.name
        });
        locationByName.set(locationKey, inserted);
        summary.locationsCreated.push({
          type: 'location',
          id: inserted.id,
          name: inserted.name,
          sourceRows: location.sourceRows
        });
      } catch (error) {
        summary.errors.push({
          type: 'location',
          name: location.name,
          sourceRows: location.sourceRows,
          message: error.message || 'Could not create location.'
        });
      }
    }

    for (const system of plan.systems) {
      const location = locationByName.get(canonicalImportKey(system.locationName));
      if (!location?.id) {
        summary.errors.push({
          type: 'system',
          name: system.name,
          locationName: system.locationName,
          sourceRows: system.sourceRows,
          message: 'System skipped because its location was not available.'
        });
        continue;
      }

      const systemKey = `${location.id}|${canonicalImportKey(system.name)}`;
      if (systemByKey.has(systemKey)) {
        summary.existingDuplicatesSkipped.push({
          type: 'system',
          name: system.name,
          locationName: system.locationName,
          sourceRows: system.sourceRows,
          reason: 'System already exists'
        });
        continue;
      }

      try {
        const inserted = await insertRow('filtracore_systems', {
          client_id: clientId,
          workspace_id: workspace.id,
          location_id: location.id,
          property_id: null,
          name: system.name,
          status: 'unknown'
        });
        systemByKey.set(systemKey, inserted);
        summary.systemsCreated.push({
          type: 'system',
          id: inserted.id,
          name: inserted.name,
          locationName: system.locationName,
          sourceRows: system.sourceRows
        });
      } catch (error) {
        summary.errors.push({
          type: 'system',
          name: system.name,
          locationName: system.locationName,
          sourceRows: system.sourceRows,
          message: error.message || 'Could not create system.'
        });
      }
    }

    for (const filter of plan.filters) {
      const location = locationByName.get(canonicalImportKey(filter.locationName));
      const system = location ? systemByKey.get(`${location.id}|${canonicalImportKey(filter.systemName)}`) : null;
      if (!system?.id) {
        summary.errors.push({
          type: 'filter',
          filterName: filter.filterName,
          sku: filter.sku,
          systemName: filter.systemName,
          locationName: filter.locationName,
          sourceRows: filter.sourceRows,
          message: 'Filter skipped because its system was not available.'
        });
        continue;
      }

      const filterKey = `${system.id}|${canonicalImportKey(filter.sku)}|${canonicalImportKey(filter.filterName)}`;
      if (filterKeys.has(filterKey)) {
        summary.existingDuplicatesSkipped.push({
          type: 'filter',
          filterName: filter.filterName,
          sku: filter.sku,
          systemName: filter.systemName,
          locationName: filter.locationName,
          sourceRows: filter.sourceRows,
          reason: 'Filter already exists'
        });
        continue;
      }

      try {
        const inserted = await insertRow('filtracore_filters', {
          client_id: clientId,
          workspace_id: workspace.id,
          system_id: system.id,
          filter_name: filter.filterName,
          sku: filter.sku,
          filter_quantity: filter.filterQuantity,
          status: 'active'
        });
        filterKeys.add(filterKey);
        summary.filtersCreated.push({
          type: 'filter',
          id: inserted.id,
          filterName: inserted.filter_name,
          sku: inserted.sku,
          systemName: filter.systemName,
          locationName: filter.locationName,
          filterQuantity: inserted.filter_quantity,
          sourceRows: filter.sourceRows
        });
      } catch (error) {
        summary.errors.push({
          type: 'filter',
          filterName: filter.filterName,
          sku: filter.sku,
          systemName: filter.systemName,
          locationName: filter.locationName,
          sourceRows: filter.sourceRows,
          message: error.message || 'Could not create filter.'
        });
      }
    }

    summary.finishedAt = new Date().toLocaleString();
    return summary;
  }

  function createImportSummary(preview, plan = buildReviewedImportPlan(preview)) {
    return {
      locationsCreated: [],
      systemsCreated: [],
      filtersCreated: [],
      existingDuplicatesSkipped: [],
      csvDuplicatesSkipped: getCsvDuplicateNotices(preview),
      manualReviewSkipped: plan.manualReview,
      errors: [],
      finishedAt: ''
    };
  }

  function getCsvDuplicateNotices(preview) {
    return preview.duplicates
      .filter(notice => {
        const text = importNoticeText(notice).toLowerCase();
        return !text.includes('already exists');
      })
      .map(notice => ({
        type: 'csv-duplicate',
        message: importNoticeText(notice),
        sourceRows: notice.rows || []
      }));
  }

  function importSummaryItemText(item) {
    if (item.message && item.type === 'csv-duplicate') return item.message;
    const rowText = item.sourceRows?.length ? ` Rows: ${item.sourceRows.join(', ')}.` : '';
    const reasonText = item.reason ? ` ${item.reason}.` : '';
    const errorText = item.message && item.type !== 'csv-duplicate' ? ` ${item.message}` : '';
    if (item.type === 'location') return `Location ${item.name || '--'}.${rowText}${reasonText}${errorText}`;
    if (item.type === 'system') return `System ${item.name || '--'} at ${item.locationName || '--'}.${rowText}${reasonText}${errorText}`;
    if (item.type === 'filter') return `Filter ${item.filterName || '--'} SKU ${item.sku || '--'} at ${item.locationName || '--'} / ${item.systemName || '--'}.${item.filterQuantity ? ` Qty ${item.filterQuantity}.` : ''}${rowText}${reasonText}${errorText}`;
    return `${item.message || item.reason || 'Import item'}${rowText}`;
  }

  function normalizeImportHeader(value) {
    return String(value || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function cleanImportValue(value) {
    return String(value == null ? '' : value).trim();
  }

  function parseImportQuantity(value) {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
  }

  function canonicalImportKey(value) {
    return cleanImportValue(value).toLowerCase().replace(/\s+/g, ' ');
  }

  function formatImportCellValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    return value == null || value === '' ? '--' : value;
  }

  function importPreviewDescription(preview) {
    if (preview.status === 'reading') return `Reading ${preview.fileName}.`;
    if (preview.status === 'parsing') return `Parsing ${preview.fileName}.`;
    if (preview.fileName && preview.errors.length) return `Validation issues found in ${preview.fileName}.`;
    if (preview.fileName) return `Preview generated from ${preview.fileName}.`;
    return 'No CSV selected yet.';
  }

  function previewStatusText(preview) {
    if (preview.status === 'reading') return 'Reading file';
    if (preview.status === 'parsing') return 'Parsing CSV';
    if (preview.errors.length) return 'Needs review';
    return preview.rows.length ? `${preview.rows.length} rows parsed` : 'Preview only';
  }

  function previewStatusTone(preview) {
    if (preview.status === 'reading' || preview.status === 'parsing') return 'unknown';
    if (preview.errors.length) return 'warning';
    return preview.rows.length ? 'active' : 'unknown';
  }

  function previewStatusLabel(preview) {
    if (preview.status === 'reading') return 'Reading';
    if (preview.status === 'parsing') return 'Parsing';
    if (preview.errors.length) return 'Review';
    return preview.rows.length ? 'Ready' : 'Waiting';
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
    const soon = addDaysIso(30);
    const isBusiness = state.activeWorkspace?.mode === 'business';
    const placeCount = isBusiness ? state.records.locations.length : state.records.properties.length;
    const overdueFilters = filters.filter(filter => filter.due_date && filter.due_date < today && filter.status !== 'replaced').length;
    const dueSoonFilters = filters.filter(filter => {
      return filter.due_date
        && filter.due_date >= today
        && filter.due_date <= soon
        && filter.status !== 'replaced';
    }).length;

    return {
      placeLabel: isBusiness ? 'Total Locations' : 'Total Properties',
      placeCardLabel: isBusiness ? 'Locations' : 'Properties',
      placeCount,
      placeEmptyText: isBusiness ? 'Add your first location' : 'Add your first property',
      groupHeading: isBusiness ? 'Systems by location' : 'Systems by property',
      totalSystems: systems.length,
      healthySystems: systems.filter(system => system.status === 'healthy').length,
      warningSystems: systems.filter(system => system.status === 'warning').length,
      criticalSystems: systems.filter(system => system.status === 'critical').length,
      totalFilters: filters.length,
      dueSoonFilters,
      overdueFilters,
      latestPsiText: latest ? `${latest.psi} PSI` : '--',
      latestPsiSubtext: latest ? `${statusText(latest.status)} - ${formatDateTime(latest.reading_at)}` : 'Record your first PSI reading',
      openAlerts: state.records.alerts.length,
      maintenanceLogs: state.records.maintenanceLogs.length,
      reports: state.records.reports.length
    };
  }

  function renderSystemParentField(record) {
    if (state.activeWorkspace?.mode === 'business') {
      return `
        <label class="form-field">
          <span>Assign to Location</span>
          <select name="location_id" required>
            <option value="">Select location</option>
            ${state.records.locations.map(location => `<option value="${escapeHtml(location.id)}"${record?.location_id === location.id ? ' selected' : ''}>${escapeHtml(location.name)}</option>`).join('')}
          </select>
        </label>
      `;
    }

    return `
      <label class="form-field">
          <span>Assign to Property</span>
          <select name="property_id" required>
            <option value="">Select property</option>
          ${state.records.properties.map(property => `<option value="${escapeHtml(property.id)}"${record?.property_id === property.id ? ' selected' : ''}>${escapeHtml(property.name)}</option>`).join('')}
        </select>
      </label>
    `;
  }

  function renderSystemSelectField(name, required, selectedId = '') {
    return `
      <label class="form-field">
        <span>System / Equipment</span>
        <select name="${escapeHtml(name)}"${required ? ' required' : ''}>
          <option value="">Select system / equipment</option>
          ${state.records.systems.map(system => `<option value="${escapeHtml(system.id)}"${selectedId === system.id ? ' selected' : ''}>${escapeHtml(system.name)}</option>`).join('')}
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

  function renderGroupedSystems() {
    const isBusiness = state.activeWorkspace?.mode === 'business';
    const places = isBusiness ? state.records.locations : state.records.properties;
    const placeKey = isBusiness ? 'location_id' : 'property_id';
    const placeEmptyTitle = isBusiness ? 'Add your first location' : 'Add your first property';

    if (!places.length && !state.records.systems.length) {
      return emptyState(placeEmptyTitle, 'Create the first place, then assign filtration systems to it.');
    }

    if (!state.records.systems.length) {
      return emptyState('Add your first filtration system', 'Create a system to begin tracking filters and PSI readings.');
    }

    const placeGroups = places.map(place => ({
      id: place.id,
      name: place.name,
      systems: state.records.systems.filter(system => system[placeKey] === place.id)
    }));
    const unassigned = state.records.systems.filter(system => !system[placeKey]);
    if (unassigned.length) {
      placeGroups.push({ id: 'unassigned', name: 'Unassigned systems', systems: unassigned });
    }

    return `
      <div class="group-list">
        ${placeGroups.map(group => `
          <article class="group-card">
            <div class="group-heading">
              <strong>${escapeHtml(group.name)}</strong>
              <span>${group.systems.length} systems</span>
            </div>
            ${group.systems.length ? renderSystemList(group.systems) : emptyState('Add your first filtration system', 'Assign a system to this place.')}
          </article>
        `).join('')}
      </div>
    `;
  }

  function recordActions(markup) {
    return `<div class="inline-actions record-actions">${markup}</div>`;
  }

  function editButton(recordType, recordId) {
    return `<button type="button" class="secondary-action compact-action" data-edit-record="${escapeHtml(recordType)}" data-record-id="${escapeHtml(recordId)}">Edit</button>`;
  }

  function removeButton(recordType, recordId, label = 'Remove') {
    return `<button type="button" class="secondary-action compact-action danger-action" data-remove-record="${escapeHtml(recordType)}" data-record-id="${escapeHtml(recordId)}">${escapeHtml(label)}</button>`;
  }

  function renderLocationList(locations = state.records.locations, isFiltered = false) {
    if (!state.records.locations.length) return emptyState('Add your first location', 'Create a location before assigning filtration systems.');
    if (!locations.length && isFiltered) return emptyState('No matching locations', 'Try another search term.');
    return `
      <div class="record-list">
        ${locations.map(location => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(location.name)}</strong>
              <span class="status-badge status-unknown">${escapeHtml(optionLabel(LOCATION_TYPE_OPTIONS, location.location_type, 'Location'))}</span>
            </div>
            <div class="record-meta">
              ${location.address ? `<span>${escapeHtml(location.address)}</span>` : ''}
              ${location.building ? `<span>${escapeHtml(location.building)}</span>` : ''}
              ${location.floor ? `<span>Floor ${escapeHtml(location.floor)}</span>` : ''}
              ${location.zone ? `<span>${escapeHtml(location.zone)}</span>` : ''}
            </div>
            ${recordActions(`${editButton('location', location.id)}${removeButton('location', location.id)}`)}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPropertyList(properties = state.records.properties, isFiltered = false) {
    if (!state.records.properties.length) return emptyState('Add your first property', 'Create a property before assigning filtration systems.');
    if (!properties.length && isFiltered) return emptyState('No matching properties', 'Try another search term.');
    return `
      <div class="record-list">
        ${properties.map(property => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(property.name)}</strong>
              <span class="status-badge status-unknown">${escapeHtml(optionLabel(PROPERTY_TYPE_OPTIONS, property.property_type, 'Property'))}</span>
            </div>
            <div class="record-meta">
              ${property.address ? `<span>${escapeHtml(property.address)}</span>` : ''}
              ${property.zone ? `<span>${escapeHtml(property.zone)}</span>` : ''}
            </div>
            ${recordActions(`${editButton('property', property.id)}${removeButton('property', property.id)}`)}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderSystemList(systems, isFiltered = false) {
    if (!state.records.systems.length) return emptyState('Add your first filtration system', 'Create a system to begin tracking filters and PSI readings.');
    if (!systems.length && isFiltered) return emptyState('No matching systems', 'Try another search term.');
    return `
      <div class="record-list">
        ${systems.map(system => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(system.name)}</strong>
              ${statusBadge(system.status || 'unknown')}
            </div>
            <div class="record-meta">
              <span>${escapeHtml(optionLabel(SYSTEM_TYPE_OPTIONS, system.system_type, 'System'))}</span>
              <span>PSI ${valueOrDash(system.psi_min)}-${valueOrDash(system.psi_max)}</span>
              ${system.asset_reference ? `<span>Reference ${escapeHtml(system.asset_reference)}</span>` : ''}
              ${system.brand ? `<span>Brand ${escapeHtml(system.brand)}</span>` : ''}
              ${system.model ? `<span>Model ${escapeHtml(system.model)}</span>` : ''}
              ${system.serial_number ? `<span>Serial ${escapeHtml(system.serial_number)}</span>` : ''}
              ${system.location_id ? `<span>${escapeHtml(locationName(system.location_id))}</span>` : ''}
              ${system.property_id ? `<span>${escapeHtml(propertyName(system.property_id))}</span>` : ''}
            </div>
            ${renderPhotoPreview(system.equipment_photo_url, 'Equipment photo')}
            ${recordActions(`${editButton('system', system.id)}${removeButton('system', system.id)}`)}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderFilterList(filters, isFiltered = false) {
    if (!state.records.filters.length) return emptyState('Add your first filter', 'Create a filter record for a system.');
    if (!filters.length && isFiltered) return emptyState('No matching filters', 'Try another search term.');
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
              ${filter.filter_type ? `<span>${escapeHtml(optionLabel(FILTER_TYPE_OPTIONS, filter.filter_type, 'Filter'))}</span>` : ''}
              ${filterQuantityLabel(filter)}
              ${filter.sku ? `<span>SKU ${escapeHtml(filter.sku)}</span>` : ''}
              ${filter.installed_at ? `<span>Installed ${formatDate(filter.installed_at)}</span>` : ''}
              ${filter.due_date ? `<span>Due ${formatDate(filter.due_date)}</span>` : ''}
            </div>
            ${renderPhotoPreview(filter.filter_photo_url, 'Filter photo')}
            ${recordActions(`
              ${editButton('filter', filter.id)}
              ${filter.status === 'archived' ? '' : `<button type="button" class="secondary-action compact-action danger-action" data-archive-filter="${escapeHtml(filter.id)}">Archive</button>`}
            `)}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPsiList(readings) {
    if (!readings.length) return emptyState('Record your first PSI reading', 'Capture PSI from a configured system.');
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
            ${recordActions(removeButton('psi', reading.id))}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderMaintenanceList(logs) {
    if (!logs.length) return emptyState('Add your first maintenance log', 'Create a log when service work is performed.');
    return `
      <div class="record-list">
        ${logs.map(log => `
          <article class="record-item">
            <div class="record-item-header">
              <strong>${escapeHtml(optionLabel(MAINTENANCE_TYPE_OPTIONS, log.type, 'Maintenance'))}</strong>
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
            ${includeActions ? `<div class="inline-actions record-actions"><button type="button" class="secondary-action compact-action" data-resolve-alert="${escapeHtml(alert.id)}">Resolve alert</button></div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderUpcomingMaintenanceList() {
    const items = getUpcomingMaintenanceItems(5);
    if (!items.length) return emptyState('No upcoming maintenance', 'Filters due soon will appear here.');
    return `
      <div class="record-list">
        ${items.map(filter => {
          const isOverdue = filter.due_date && filter.due_date < todayIso();
          return `
            <article class="record-item">
              <div class="record-item-header">
                <strong>${escapeHtml(filter.filter_name)}</strong>
                ${statusBadge(isOverdue ? 'critical' : 'warning')}
              </div>
              <div class="record-meta">
                <span>${escapeHtml(systemName(filter.system_id))}</span>
                ${filter.sku ? `<span>SKU ${escapeHtml(filter.sku)}</span>` : ''}
                <span>Due ${formatDate(filter.due_date)}</span>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function getUpcomingMaintenanceItems(limit = 5) {
    const soon = addDaysIso(30);
    return state.records.filters
      .filter(filter => {
        const status = String(filter.status || '').toLowerCase();
        return filter.due_date
          && filter.due_date <= soon
          && status !== 'replaced'
          && status !== 'archived';
      })
      .sort((first, second) => String(first.due_date).localeCompare(String(second.due_date)))
      .slice(0, limit);
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

  function renderPhotoPreview(url, label) {
    if (!isValidWebUrl(url)) return '';
    return `
      <a class="record-photo-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
        <img class="record-photo-thumb" src="${escapeHtml(url)}" alt="" onerror="this.hidden=true">
        <span>${escapeHtml(label)}</span>
      </a>
    `;
  }

  function filterQuantityLabel(filter) {
    const quantity = filter.filter_quantity ?? filter.filter_amount;
    return quantity == null ? '' : `<span>Amount ${escapeHtml(quantity)}</span>`;
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

  function normalizeSection(section) {
    if (['locations', 'systems', 'filters'].includes(section)) {
      state.activeAssetsTab = normalizeAssetsTab(section);
      return 'assets';
    }
    if (['psi', 'maintenance', 'alerts'].includes(section)) {
      state.activeWorkTab = normalizeWorkTab(section);
      return 'work';
    }
    return MODULES[section] ? section : 'dashboard';
  }

  function switchSection(section, shouldCloseMenu = true) {
    const normalizedSection = normalizeSection(section);
    const module = MODULES[normalizedSection] || MODULES.dashboard;
    state.activeSection = normalizedSection;

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
    if (els.workspaceHeader) {
      els.workspaceHeader.hidden = state.activeSection === 'import';
    }
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

  function focusActiveModuleForm() {
    const active = document.querySelector('.app-section.is-active');
    const form = active?.querySelector('form.module-form');
    if (!form) return;
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const firstField = form.querySelector('input, select, textarea, button');
    if (firstField) firstField.focus();
  }

  function startEditing(recordType, recordId) {
    state.editing = { type: recordType, id: recordId };
    const section = sectionForRecordType(recordType);
    if (section) state.activeSection = section;
    renderSections();
    switchSection(state.activeSection || 'dashboard', false);
    const activeForm = document.querySelector('.app-section.is-active form[data-edit-id]');
    if (activeForm) activeForm.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function cancelEditing() {
    state.editing = null;
    renderSections();
    switchSection(state.activeSection || 'dashboard', false);
  }

  function clearEditingIfMatches(recordType, recordId) {
    if (state.editing?.type === recordType && state.editing.id === recordId) {
      state.editing = null;
    }
  }

  function sectionForRecordType(recordType) {
    if (recordType === 'location' || recordType === 'property') {
      state.activeAssetsTab = 'locations';
      return 'assets';
    }
    if (recordType === 'system') {
      state.activeAssetsTab = 'systems';
      return 'assets';
    }
    if (recordType === 'filter') {
      state.activeAssetsTab = 'filters';
      return 'assets';
    }
    if (recordType === 'psi') {
      state.activeWorkTab = 'psi';
      return 'work';
    }
    return null;
  }

  function editingRecord(recordType, records) {
    return state.editing?.type === recordType ? findById(records, state.editing.id) : null;
  }

  function editFormAttributes(recordType, record) {
    return record ? ` data-edit-type="${escapeHtml(recordType)}" data-edit-id="${escapeHtml(record.id)}"` : '';
  }

  function editActions(record) {
    if (!record) return '';
    return `
      <div class="form-edit-actions">
        <button type="button" class="secondary-action compact-action" data-cancel-edit>Cancel edit</button>
      </div>
    `;
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
    els.onboardingChangeClientButton.addEventListener('click', changeClientFromOnboarding);
    els.onboardingSignOutButton.addEventListener('click', signOut);
    els.mobileMenuButton.addEventListener('click', toggleMobileMenu);
    els.sidebarBackdrop.addEventListener('click', closeMobileMenu);
    els.signOutButton.addEventListener('click', signOut);
    els.workspaceView.addEventListener('submit', handleWorkspaceSubmit);
    els.workspaceView.addEventListener('click', handleWorkspaceClick);
    els.workspaceView.addEventListener('input', handleWorkspaceInput);
    els.workspaceView.addEventListener('change', handleWorkspaceChange);
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

  function userDisplayName() {
    return String(state.user?.user_metadata?.full_name || state.user?.user_metadata?.name || '').trim();
  }

  function organizationNameFromEmail() {
    const email = String(state.user?.email || '').trim();
    const localPart = email.split('@')[0] || '';
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => capitalize(part))
      .join(' ');
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

  function addDaysIso(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
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

  function selectOptions(options, selectedValue, placeholder) {
    const selected = String(selectedValue || '');
    const placeholderMarkup = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '';
    return placeholderMarkup + options.map(([value, label]) => `
      <option value="${escapeHtml(value)}"${selected === value ? ' selected' : ''}>${escapeHtml(label)}</option>
    `).join('');
  }

  function optionLabel(options, value, fallback) {
    if (!value) return fallback;
    const match = options.find(([optionValue]) => optionValue === value);
    return match ? match[1] : statusText(value);
  }

  function isValidWebUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (error) {
      return false;
    }
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
    createPlace,
    createSystem,
    createFilter,
    createPsiReading,
    createMaintenanceLog,
    resolveAlert,
    getPsiStatus,
    parseCsv,
    buildImportPreview
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
