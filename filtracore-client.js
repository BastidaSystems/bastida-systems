(function () {
  'use strict';

  const config = window.FILTRACORE_CLIENT_PROD_CONFIG || {};
  const missingAnonKeyValues = new Set([
    '',
    '[PEGA AQUI TU ANON PUBLIC KEY]',
    'USAR_LA_MISMA_ANON_PUBLIC_KEY_QUE_BEOFLOW_CLIENT_CONFIG',
    'PASTE_CLIENT_PROD_ANON_PUBLIC_KEY_HERE'
  ]);

  const LOCAL_WORKSPACE_DRAFT_KEY = 'filtracore.localWorkspaceDraft';

  const state = {
    supabase: null,
    user: null,
    userClients: [],
    activeClient: null,
    localWorkspaceDraft: null,
    activeSection: 'dashboard',
    authMode: 'signin',
    isRecoveryMode: false,
    mobileDrawerOpen: false
  };

  const MODULES = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Operational visibility for water filtration systems, filters, PSI readings, maintenance, alerts, and reports.'
    },
    locations: {
      index: '01',
      title: 'Locations / Properties',
      subtitle: 'Business locations and residential properties will live here once the schema is added.',
      emptyTitle: 'No locations or properties yet.',
      emptyCopy: 'Complete onboarding now, then connect this module to filtracore_locations and filtracore_properties later.'
    },
    systems: {
      index: '02',
      title: 'Systems',
      subtitle: 'Track filtration systems, configured pressure ranges, install details, and operating status.',
      emptyTitle: 'No filtration systems yet.',
      emptyCopy: 'Systems will be created after the FiltraCore database tables are available.'
    },
    filters: {
      index: '03',
      title: 'Filters',
      subtitle: 'Monitor installed filters, replacement windows, capacity, and service notes.',
      emptyTitle: 'No filters installed yet.',
      emptyCopy: 'Filters will appear here after systems and filter records are connected.'
    },
    psi: {
      index: '04',
      title: 'PSI Readings',
      subtitle: 'Capture pressure readings and calculate healthy, warning, or critical status.',
      emptyTitle: 'No PSI readings yet.',
      emptyCopy: 'Readings will appear after filtracore_psi_readings is added.'
    },
    maintenance: {
      index: '05',
      title: 'Maintenance',
      subtitle: 'Log filter changes, service events, inspections, and maintenance notes.',
      emptyTitle: 'No maintenance logs yet.',
      emptyCopy: 'Maintenance records will appear after filtracore_maintenance_logs is added.'
    },
    alerts: {
      index: '06',
      title: 'Alerts',
      subtitle: 'Review low pressure, overdue maintenance, filter replacement, and system alerts.',
      emptyTitle: 'No alerts yet.',
      emptyCopy: 'Alerts will appear after the alert rules and filtracore_alerts table are connected.'
    },
    reports: {
      index: '07',
      title: 'Reports',
      subtitle: 'Prepare client-ready operational and compliance reporting.',
      emptyTitle: 'No reports yet.',
      emptyCopy: 'Reports will appear after systems, readings, maintenance, and alerts have activity.'
    },
    settings: {
      index: '08',
      title: 'Settings',
      subtitle: 'Workspace setup, Client-prod access, and schema connection status.'
    }
  };

  const els = {};

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
      if (element) {
        element.hidden = element !== view;
      }
    });
  }

  function showAlert(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('app-alert-success', type === 'success');
    element.hidden = !message;
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
    setBusy(els.authSubmit, false, 'Create account');

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    state.user = data.user || null;
    showAlert(els.authMessage, 'Account created. Check your email if confirmation is required.', 'success');
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
    setBusy(els.authSubmit, false, 'Sign in');

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    state.user = data.user || null;
    await routeAfterAuth();
  }

  async function signOut() {
    const client = initializeSupabase();
    if (client) {
      await client.auth.signOut();
    }

    state.user = null;
    state.userClients = [];
    state.activeClient = null;
    state.localWorkspaceDraft = null;
    localStorage.removeItem(config.activeClientStorageKey);
    localStorage.removeItem(config.activeWorkspaceStorageKey);
    renderAuthView();
  }

  async function loadUserClients() {
    const client = initializeSupabase();
    if (!client || !state.user) return [];

    const { data: memberships, error: membershipError } = await client
      .from('client_users')
      .select('client_id, role, status')
      .eq('user_id', state.user.id)
      .eq('status', 'active');

    if (membershipError || !memberships || memberships.length === 0) {
      state.userClients = [];
      return state.userClients;
    }

    const clientIds = memberships.map(membership => membership.client_id).filter(Boolean);
    if (clientIds.length === 0) {
      state.userClients = [];
      return state.userClients;
    }

    const { data: products, error: productError } = await client
      .from('client_products')
      .select('client_id, product_key, status')
      .in('client_id', clientIds)
      .eq('product_key', config.productKey)
      .eq('status', 'active');

    if (productError || !products || products.length === 0) {
      state.userClients = [];
      return state.userClients;
    }

    const allowedClientIds = new Set(products.map(product => product.client_id));
    const allowedMemberships = memberships.filter(membership => allowedClientIds.has(membership.client_id));

    const { data: clients, error: clientsError } = await client
      .from('clients')
      .select('id, name, legal_name, status')
      .in('id', Array.from(allowedClientIds))
      .eq('status', 'active');

    if (clientsError) {
      state.userClients = [];
      return state.userClients;
    }

    state.userClients = (clients || []).map(clientRecord => {
      const membership = allowedMemberships.find(item => item.client_id === clientRecord.id);
      return {
        ...clientRecord,
        role: membership ? membership.role : 'member'
      };
    });

    return state.userClients;
  }

  function setActiveClient(clientId) {
    const client = state.userClients.find(item => item.id === clientId);
    if (!client) return null;

    state.activeClient = client;
    localStorage.setItem(config.activeClientStorageKey, client.id);
    renderWorkspace();
    return client;
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

  async function routeAfterAuth() {
    if (!state.user) {
      renderAuthView();
      return;
    }

    const clients = await loadUserClients();
    const savedClientId = localStorage.getItem(config.activeClientStorageKey);

    if (savedClientId && clients.some(client => client.id === savedClientId)) {
      setActiveClient(savedClientId);
      return;
    }

    if (clients.length === 1) {
      setActiveClient(clients[0].id);
      return;
    }

    if (clients.length > 1) {
      renderClientSelector();
      return;
    }

    renderOnboarding();
  }

  function renderAuthView() {
    showOnly(els.authView);
    state.authMode = state.authMode || 'signin';
    state.isRecoveryMode = false;
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
      ? 'Use Client-prod auth now. FiltraCore data tables will be connected in the next phase.'
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

  async function sendPasswordReset(event) {
    event.preventDefault();
    const client = initializeSupabase();
    if (!client) return;

    setBusy(els.resetSubmit, true, 'Sending...');
    const { error } = await client.auth.resetPasswordForEmail(els.resetEmail.value.trim(), {
      redirectTo: getAuthRedirectUrl()
    });
    setBusy(els.resetSubmit, false, 'Send reset email');

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    showAlert(els.authMessage, 'Password reset email requested. Redirect handling is prepared for Supabase.', 'success');
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
    setBusy(els.updatePasswordSubmit, false, 'Update password');

    if (error) {
      showAlert(els.authMessage, error.message);
      return;
    }

    showAlert(els.authMessage, 'Password updated. You can continue to FiltraCore.', 'success');
    await routeAfterAuth();
  }

  function renderClientSelector() {
    showOnly(els.clientSelectorView);
    els.clientList.innerHTML = '';

    if (state.userClients.length === 0) {
      els.clientList.innerHTML = '<div class="empty-state"><h4>No FiltraCore clients available.</h4><p>Client-prod did not return an active client with product_key filtracore for this user.</p></div>';
      return;
    }

    state.userClients.forEach(client => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-option';
      button.innerHTML = `
        <span>
          <strong>${escapeHtml(client.name || client.legal_name || 'Client')}</strong>
          <span>${escapeHtml(client.role || 'member')}</span>
        </span>
        <span>Select</span>
      `;
      button.addEventListener('click', () => setActiveClient(client.id));
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

  function submitOnboarding(event) {
    event.preventDefault();
    const mode = getSelectedSetupMode();
    const draft = mode === 'business'
      ? {
        mode,
        companyName: els.businessCompanyName.value.trim(),
        industry: els.businessIndustry.value,
        locationName: els.businessLocationName.value.trim(),
        firstSystemName: els.businessSystemName.value.trim()
      }
      : {
        mode,
        propertyName: els.homePropertyName.value.trim(),
        propertyType: els.homePropertyType.value,
        firstSystemName: els.homeSystemName.value.trim()
      };

    const requiredValues = mode === 'business'
      ? [draft.companyName, draft.locationName, draft.firstSystemName]
      : [draft.propertyName, draft.firstSystemName];

    if (requiredValues.some(value => !value)) {
      showAlert(els.onboardingMessage, 'Complete the required setup fields before continuing.');
      return;
    }

    state.localWorkspaceDraft = {
      ...draft,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_WORKSPACE_DRAFT_KEY, JSON.stringify(state.localWorkspaceDraft));
    localStorage.setItem(config.activeWorkspaceStorageKey, 'local-shell');

    if (!state.activeClient) {
      state.activeClient = {
        id: 'local-shell',
        name: mode === 'business' ? draft.companyName : draft.propertyName,
        role: 'owner'
      };
    }

    renderWorkspace();
  }

  function renderWorkspace() {
    showOnly(els.workspaceView);
    renderShellChrome();
    renderSections();
    switchSection(state.activeSection || 'dashboard');
  }

  function renderShellChrome() {
    const clientName = state.activeClient ? state.activeClient.name : 'Workspace shell';
    const userEmail = state.user ? state.user.email : 'Local shell';
    const draft = state.localWorkspaceDraft || readLocalDraft();
    const mode = draft ? draft.mode : null;

    els.sidebarClientName.textContent = clientName || 'Workspace shell';
    els.sidebarUserEmail.textContent = userEmail || 'Signed in';
    els.workspaceModePill.textContent = mode ? `${capitalize(mode)} mode` : 'Schema pending';
  }

  function renderSections() {
    Object.keys(MODULES).forEach(section => {
      if (section === 'dashboard') return;
      const element = document.getElementById(`section-${section}`);
      if (!element) return;
      element.innerHTML = section === 'settings' ? renderSettingsSection() : renderModuleSection(section);
    });
  }

  function renderModuleSection(section) {
    const module = MODULES[section];
    return `
      <div class="module-view-header">
        <div>
          <span class="module-index">${module.index}</span>
          <h3>${escapeHtml(module.title)}</h3>
          <p>${escapeHtml(module.subtitle)}</p>
        </div>
        <span class="status-pill">Empty</span>
      </div>
      <div class="empty-state">
        <h4>${escapeHtml(module.emptyTitle)}</h4>
        <p>${escapeHtml(module.emptyCopy)}</p>
      </div>
    `;
  }

  function renderSettingsSection() {
    const draft = state.localWorkspaceDraft || readLocalDraft();
    const mode = draft ? capitalize(draft.mode) : 'Not selected';
    const clientName = state.activeClient ? state.activeClient.name : 'Not connected';
    return `
      <div class="module-view-header">
        <div>
          <span class="module-index">${MODULES.settings.index}</span>
          <h3>${MODULES.settings.title}</h3>
          <p>${MODULES.settings.subtitle}</p>
        </div>
        <span class="status-pill">Client-prod</span>
      </div>
      <div class="settings-grid">
        <article class="settings-card">
          <h3>Workspace</h3>
          <dl>
            <div>
              <dt>Mode</dt>
              <dd>${escapeHtml(mode)}</dd>
            </div>
            <div>
              <dt>Active client</dt>
              <dd>${escapeHtml(clientName || 'Not connected')}</dd>
            </div>
            <div>
              <dt>Product key</dt>
              <dd>${escapeHtml(config.productKey || 'filtracore')}</dd>
            </div>
          </dl>
        </article>
        <article class="settings-card">
          <h3>Database status</h3>
          <dl>
            <div>
              <dt>FiltraCore tables</dt>
              <dd>Pending</dd>
            </div>
            <div>
              <dt>Writes</dt>
              <dd>Disabled in this shell</dd>
            </div>
            <div>
              <dt>Auth</dt>
              <dd>Supabase Client-prod public anon key</dd>
            </div>
          </dl>
        </article>
      </div>
    `;
  }

  function switchSection(section) {
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
    els.workspaceKicker.textContent = state.activeSection === 'dashboard' ? 'App shell' : 'Module shell';
    closeMobileMenu();
  }

  function readLocalDraft() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_WORKSPACE_DRAFT_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function startLocalPreview() {
    state.user = {
      id: 'local-shell',
      email: 'Local shell'
    };
    state.activeClient = null;
    state.localWorkspaceDraft = readLocalDraft();

    if (state.localWorkspaceDraft) {
      state.activeClient = {
        id: 'local-shell',
        name: state.localWorkspaceDraft.companyName || state.localWorkspaceDraft.propertyName || 'Workspace shell',
        role: 'owner'
      };
      renderWorkspace();
      return;
    }

    renderOnboarding();
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
    if (els.mobileMenuButton) {
      els.mobileMenuButton.setAttribute('aria-expanded', 'false');
    }
    if (els.sidebarBackdrop) {
      els.sidebarBackdrop.hidden = true;
    }
  }

  function getPsiStatus(psi, min, max) {
    if (psi == null) return 'unknown';
    const value = Number(psi);
    const minValue = Number(min);
    const maxValue = Number(max);
    const safeMin = Number.isFinite(minValue) ? minValue : 50;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 70;
    const criticalMin = Math.max(0, safeMin - 16);

    if (!Number.isFinite(value)) return 'unknown';
    if (value <= criticalMin) return 'critical';
    if (value < safeMin) return 'warning';
    if (value <= safeMax) return 'healthy';
    return 'warning';
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
      if (state.authMode === 'signup') {
        signUp(event);
      } else {
        signIn(event);
      }
    });

    els.forgotPasswordButton.addEventListener('click', renderPasswordResetRequest);
    els.backToSignInButton.addEventListener('click', () => {
      state.authMode = 'signin';
      syncAuthMode();
    });
    els.passwordResetRequestForm.addEventListener('submit', sendPasswordReset);
    els.passwordRecoveryForm.addEventListener('submit', updatePassword);
    els.localPreviewButton.addEventListener('click', startLocalPreview);
    els.startLocalOnboardingButton.addEventListener('click', renderOnboarding);
    els.onboardingForm.addEventListener('submit', submitOnboarding);
    els.mobileMenuButton.addEventListener('click', toggleMobileMenu);
    els.sidebarBackdrop.addEventListener('click', closeMobileMenu);
    els.signOutButton.addEventListener('click', signOut);

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

    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    if (isLocal) {
      document.body.classList.add('is-local-preview');
      els.localPreviewButton.hidden = false;
    }

    const client = initializeSupabase();
    if (!client) return;

    client.auth.onAuthStateChange(async (event, session) => {
      state.user = session ? session.user : null;
      if (event === 'PASSWORD_RECOVERY') {
        renderPasswordRecovery();
        return;
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
    getPsiStatus
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
