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
  activeSection: 'dashboard',
  moduleRecords: {},
  moduleCounts: {},
  reportsData: null,
  modalSection: null,
  editingRecord: null,
  authMode: 'signin',
  isRecoveryMode: false,
  passwordUpdatePending: false,
  loading: false
};

const MODULE_SECTIONS = {
  events: {
    title: 'Events',
    subtitle: 'Plan catering events, service days, banquets, and production schedules.',
    emptyTitle: 'No events yet.',
    emptyCopy: 'Create your first event to start planning service operations.',
    action: 'New Event',
    singular: 'event',
    plural: 'events',
    table: 'beoflow_events',
    index: '01',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['event_type', 'event_date', 'start_time', 'guest_count', 'location'],
    detailFields: ['end_time', 'notes'],
    fields: [
      { name: 'name', label: 'Event Name', type: 'text', required: true },
      { name: 'event_type', label: 'Event Type', type: 'text' },
      { name: 'event_date', label: 'Event Date', type: 'date' },
      { name: 'start_time', label: 'Start Time', type: 'time' },
      { name: 'end_time', label: 'End Time', type: 'time' },
      { name: 'guest_count', label: 'Guest Count', type: 'number', min: '0', step: '1' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  menu: {
    title: 'Menu',
    subtitle: 'Build menus for restaurants, events, and recurring service operations.',
    emptyTitle: 'No menu items yet.',
    emptyCopy: 'Add your first menu item to organize offerings.',
    action: 'Add Menu Item',
    singular: 'menu item',
    plural: 'menu items',
    table: 'beoflow_menu_items',
    index: '02',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['category', 'price'],
    detailFields: ['description'],
    fields: [
      { name: 'name', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      { name: 'price', label: 'Price', type: 'number', min: '0', step: '0.01' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' }
    ]
  },
  recipes: {
    title: 'Recipes',
    subtitle: 'Standardize recipes, ingredients, procedures, and consistency.',
    emptyTitle: 'No recipes yet.',
    emptyCopy: 'Add your first recipe to begin building your recipe library.',
    action: 'Add Recipe',
    singular: 'recipe',
    plural: 'recipes',
    table: 'beoflow_recipes',
    index: '03',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['category', 'yield_quantity', 'prep_time', 'cook_time'],
    detailFields: ['ingredients', 'procedure', 'notes'],
    fields: [
      { name: 'name', label: 'Recipe Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'yield_quantity', label: 'Yield Quantity', type: 'text' },
      { name: 'prep_time', label: 'Prep Time', type: 'text' },
      { name: 'cook_time', label: 'Cook Time', type: 'text' },
      { name: 'ingredients', label: 'Ingredients', type: 'textarea', wide: true },
      { name: 'procedure', label: 'Procedure', type: 'textarea', wide: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' }
    ]
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Track ingredients, supplies, stock levels, and usage.',
    emptyTitle: 'No inventory items yet.',
    emptyCopy: 'Add your first item to start tracking stock.',
    action: 'Add Inventory Item',
    singular: 'inventory item',
    plural: 'inventory items',
    table: 'beoflow_inventory_items',
    index: '04',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['category', 'quantity', 'unit', 'par_level', 'vendor'],
    detailFields: ['cost_per_unit', 'notes'],
    fields: [
      { name: 'name', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'unit', label: 'Unit', type: 'text' },
      { name: 'quantity', label: 'Quantity', type: 'number', step: '0.01' },
      { name: 'par_level', label: 'Par Level', type: 'number', step: '0.01' },
      { name: 'cost_per_unit', label: 'Cost Per Unit', type: 'number', min: '0', step: '0.01' },
      { name: 'vendor', label: 'Vendor', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  production: {
    title: 'Production',
    subtitle: 'Organize prep tasks, production logs, and kitchen execution.',
    emptyTitle: 'No production records yet.',
    emptyCopy: 'Start a production log when operations begin.',
    action: 'New Production Log',
    singular: 'production log',
    plural: 'production logs',
    table: 'beoflow_production_logs',
    index: '05',
    titleField: 'title',
    badgeField: 'status',
    metaFields: ['production_date', 'shift', 'assigned_to'],
    detailFields: ['notes'],
    fields: [
      { name: 'title', label: 'Log Title', type: 'text', required: true },
      { name: 'production_date', label: 'Production Date', type: 'date' },
      { name: 'shift', label: 'Shift', type: 'text' },
      { name: 'assigned_to', label: 'Assigned To', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  staff: {
    title: 'Staff',
    subtitle: 'Manage team members, roles, schedules, and responsibilities.',
    emptyTitle: 'No staff members yet.',
    emptyCopy: 'Add your first staff member or invite a user.',
    action: 'Add Staff Member',
    singular: 'staff member',
    plural: 'staff members',
    table: 'beoflow_staff',
    index: '06',
    titleField: 'full_name',
    badgeField: 'status',
    metaFields: ['role', 'email', 'phone'],
    detailFields: ['notes'],
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  reports: {
    title: 'Reports',
    subtitle: 'View operational insights once Beoflow has activity.',
    emptyTitle: 'No reports yet.',
    emptyCopy: 'Reports will appear after events, inventory, and production activity.',
    action: 'View Reports',
    singular: 'report',
    plural: 'reports',
    table: null,
    index: '07'
  }
};

const DATA_SECTIONS = Object.keys(MODULE_SECTIONS).filter(section => MODULE_SECTIONS[section].table);

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
    'auth-confirm-password',
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
    'confirm-password-field',
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
    'module-view',
    'module-title',
    'module-subtitle',
    'module-count-badge',
    'module-header-action-button',
    'module-empty-state',
    'module-empty-icon',
    'module-empty-title',
    'module-empty-copy',
    'module-action-button',
    'module-record-list',
    'module-toast',
    'module-modal',
    'module-modal-title',
    'module-modal-subtitle',
    'module-modal-close',
    'module-form-message',
    'module-form',
    'module-form-fields',
    'module-cancel-button',
    'module-save-button',
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
  showAlert(els['module-form-message'], '');
}

function setLoading(isLoading) {
  state.loading = isLoading;
  [
    els['auth-submit'],
    els['reset-submit'],
    els['update-password-submit'],
    els['create-client-button'],
    els['module-action-button'],
    els['module-header-action-button'],
    els['module-save-button'],
    els['module-cancel-button'],
    els['module-modal-close'],
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

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatRecordValue(fieldName, value) {
  if (value === null || value === undefined || value === '') return '';

  if (fieldName === 'price' || fieldName === 'cost_per_unit') {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return numberValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });
    }
  }

  if (fieldName === 'guest_count') {
    return `${value} guests`;
  }

  if (fieldName === 'par_level') {
    return `Par ${value}`;
  }

  if (fieldName === 'prep_time' || fieldName === 'cook_time') {
    return String(value);
  }

  if (fieldName.endsWith('_date') || fieldName === 'event_date') {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  if (fieldName === 'status') {
    return formatLabel(value);
  }

  return String(value);
}

function getRecordTitle(section, record) {
  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) return 'Record';
  return record?.[moduleConfig.titleField] || moduleConfig.title;
}

function getActiveClientId() {
  return requireActiveClient()?.id || null;
}

function requireSupabaseClient() {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');
  return supabase;
}

function requireSignedInUserId() {
  if (!state.user?.id) throw new Error('Sign in before managing Beoflow records.');
  return state.user.id;
}

function getModuleConfig(section) {
  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) throw new Error('Unknown Beoflow module.');
  return moduleConfig;
}

function withActiveRecordFilter(query) {
  return query.neq('status', 'archived');
}

function normalizePayloadValue(field, value) {
  if (value === '') return null;
  if (field.type === 'number') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return value;
}

function isLowStock(record) {
  const quantity = Number(record?.quantity);
  const parLevel = Number(record?.par_level);
  return Number.isFinite(quantity) && Number.isFinite(parLevel) && quantity <= parLevel;
}

async function countTableRecords(table) {
  const clientId = getActiveClientId();
  if (!clientId) return 0;

  const { count, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
  );

  if (error) throw error;
  return count || 0;
}

async function loadDashboardCounts() {
  const counts = {};

  await Promise.all(DATA_SECTIONS.map(async section => {
    counts[section] = await countTableRecords(MODULE_SECTIONS[section].table);
  }));

  const reportSourceTotal = DATA_SECTIONS.reduce((total, section) => total + (counts[section] || 0), 0);
  counts.reports = reportSourceTotal;
  state.moduleCounts = counts;
  return counts;
}

async function loadModuleData(section) {
  const moduleConfig = getModuleConfig(section);
  if (section === 'reports') return loadReportsData();

  const clientId = getActiveClientId();
  if (!clientId) return [];

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(moduleConfig.table)
      .select('*')
      .eq('client_id', clientId)
  ).order('created_at', { ascending: false });

  if (error) throw error;

  state.moduleRecords[section] = data || [];
  state.moduleCounts[section] = state.moduleRecords[section].length;
  return state.moduleRecords[section];
}

async function loadReportsData() {
  const clientId = getActiveClientId();
  if (!clientId) return null;

  const counts = await loadDashboardCounts();
  const { data: inventoryRows, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.inventory.table)
      .select('id, quantity, par_level')
      .eq('client_id', clientId)
  );

  if (error) throw error;

  const lowStockItems = (inventoryRows || []).filter(isLowStock).length;
  state.reportsData = {
    total_staff: counts.staff || 0,
    total_menu_items: counts.menu || 0,
    total_recipes: counts.recipes || 0,
    total_inventory_items: counts.inventory || 0,
    total_events: counts.events || 0,
    total_production_logs: counts.production || 0,
    low_stock_items: lowStockItems
  };
  return state.reportsData;
}

async function createRecord(table, payload) {
  const clientId = getActiveClientId();
  if (!clientId) throw new Error('Open a restaurant workspace before creating records.');

  const userId = requireSignedInUserId();
  const { data, error } = await requireSupabaseClient()
    .from(table)
    .insert({
      ...payload,
      client_id: clientId,
      created_by: userId
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function updateRecord(table, id, payload) {
  const clientId = getActiveClientId();
  if (!clientId) throw new Error('Open a restaurant workspace before updating records.');

  const { data, error } = await requireSupabaseClient()
    .from(table)
    .update(payload)
    .eq('id', id)
    .eq('client_id', clientId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function deleteOrArchiveRecord(table, id) {
  return updateRecord(table, id, { status: 'archived' });
}

function updateDashboardCards(counts = state.moduleCounts) {
  document.querySelectorAll('[data-count-section]').forEach(element => {
    const section = element.dataset.countSection;
    element.textContent = String(counts[section] || 0);
  });
}

function hideWorkspaceSections() {
  els['onboarding-view'].hidden = true;
  els['client-selector-view'].hidden = true;
  els['dashboard-view'].hidden = true;
  els['module-view'].hidden = true;
}

function setActiveSidebarSection(section) {
  state.activeSection = section;

  document.querySelectorAll('.sidebar-link[data-section], .module-card[data-section]').forEach(control => {
    const isActive = control.dataset.section === section;
    control.classList.toggle('is-active', isActive);

    if (control.classList.contains('sidebar-link')) {
      if (isActive) {
        control.setAttribute('aria-current', 'page');
      } else {
        control.removeAttribute('aria-current');
      }
    }
  });
}

function showModuleToast(message = 'This module is ready for the next build.') {
  const toast = els['module-toast'];
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showModuleToast.timeoutId);
  showModuleToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function showToast(message) {
  showModuleToast(message);
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

function setPasswordToggleState(button, input, isVisible) {
  input.type = isVisible ? 'text' : 'password';
  button.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(isVisible));
  const eyeIcon = button.querySelector('.password-icon-eye');
  const eyeOffIcon = button.querySelector('.password-icon-eye-off');
  if (eyeIcon) eyeIcon.hidden = isVisible;
  if (eyeOffIcon) eyeOffIcon.hidden = !isVisible;
}

function resetPasswordVisibility() {
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    const input = document.getElementById(button.dataset.target);
    if (input) setPasswordToggleState(button, input, false);
  });
}

function configureAuthPasswordFields() {
  const isSignup = state.authMode === 'signup';
  els['confirm-password-field'].hidden = !isSignup;
  els['auth-confirm-password'].disabled = !isSignup;
  els['auth-confirm-password'].required = isSignup;
  if (isSignup) {
    els['auth-password'].removeAttribute('minlength');
    els['auth-confirm-password'].removeAttribute('minlength');
  } else {
    els['auth-password'].setAttribute('minlength', '6');
    els['auth-confirm-password'].setAttribute('minlength', '8');
  }
  els['auth-password'].placeholder = isSignup ? 'Minimum 8 characters' : 'Minimum 6 characters';
  els['auth-password'].autocomplete = isSignup ? 'new-password' : 'current-password';
}

function renderAuthView() {
  state.isRecoveryMode = false;
  resetPasswordVisibility();
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
  configureAuthPasswordFields();
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
  resetPasswordVisibility();
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
    ? `Beoflow Workspace for ${formatClientType(state.activeClient.client_type)} operations.`
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
  setActiveSidebarSection('dashboard');
  els['dashboard-view'].hidden = false;
  els['dashboard-title'].textContent = state.activeClient.name;
  els['dashboard-description'].textContent = `Welcome to ${state.activeClient.name}. Your Beoflow modules are ready for real operating data when your team starts building.`;
  updateDashboardCards();

  loadDashboardCounts()
    .then(counts => {
      if (state.activeSection === 'dashboard') updateDashboardCards(counts);
    })
    .catch(error => {
      showAlert(els['workspace-message'], error.message || 'Unable to load dashboard counts.');
    });
}

function renderModuleSection(section) {
  const activeClient = requireActiveClient();
  if (!activeClient) return;

  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) {
    renderDashboard();
    return;
  }

  renderWorkspaceFrame();
  hideWorkspaceSections();
  setActiveSidebarSection(section);
  els['module-view'].hidden = false;
  els['module-title'].textContent = moduleConfig.title;
  els['module-subtitle'].textContent = moduleConfig.subtitle;
  els['module-count-badge'].textContent = section === 'reports' ? '7 metrics' : 'Loading';
  els['module-header-action-button'].textContent = moduleConfig.action;
  els['module-header-action-button'].hidden = section === 'reports';
  els['module-empty-icon'].textContent = moduleConfig.index;
  els['module-empty-title'].textContent = moduleConfig.emptyTitle;
  els['module-empty-copy'].textContent = moduleConfig.emptyCopy;
  els['module-action-button'].textContent = moduleConfig.action;
  els['module-action-button'].hidden = section === 'reports';
  els['module-empty-state'].hidden = true;
  els['module-record-list'].hidden = false;
  els['module-record-list'].innerHTML = '<div class="module-loading">Loading workspace records.</div>';

  loadModuleData(section)
    .then(result => {
      if (state.activeSection !== section) return;
      if (section === 'reports') {
        renderReportsSection(result);
        return;
      }

      renderModuleList(section, result);
      updateDashboardCards(state.moduleCounts);
    })
    .catch(error => {
      els['module-count-badge'].textContent = 'Unable to load';
      els['module-record-list'].innerHTML = '';
      els['module-empty-state'].hidden = false;
      showAlert(els['workspace-message'], error.message || `Unable to load ${moduleConfig.title}.`);
    });
}

function renderModuleList(section, records = state.moduleRecords[section] || []) {
  const moduleConfig = getModuleConfig(section);
  const count = records.length;
  els['module-count-badge'].textContent = `${count} ${count === 1 ? moduleConfig.singular : moduleConfig.plural}`;
  els['module-empty-state'].hidden = count > 0;
  els['module-record-list'].hidden = count === 0;

  if (count === 0) {
    els['module-record-list'].innerHTML = '';
    return;
  }

  els['module-record-list'].innerHTML = records.map(record => renderRecordCard(section, record)).join('');
}

function renderRecordCard(section, record) {
  const moduleConfig = getModuleConfig(section);
  const title = getRecordTitle(section, record);
  const status = record?.[moduleConfig.badgeField] || 'active';
  const metaHtml = (moduleConfig.metaFields || [])
    .map(fieldName => formatRecordValue(fieldName, record?.[fieldName]))
    .filter(Boolean)
    .map(value => `<span>${escapeHtml(value)}</span>`)
    .join('');
  const detailHtml = (moduleConfig.detailFields || [])
    .map(fieldName => {
      const value = formatRecordValue(fieldName, record?.[fieldName]);
      if (!value) return '';
      return `
        <div class="record-detail">
          <span>${escapeHtml(formatLabel(fieldName))}</span>
          <p>${escapeHtml(value)}</p>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');
  const lowStockHtml = section === 'inventory' && isLowStock(record)
    ? '<span class="status-badge status-badge-warning">Low Stock</span>'
    : '';

  return `
    <article class="record-card">
      <div class="record-card-main">
        <div class="record-title-row">
          <h4>${escapeHtml(title)}</h4>
          <div class="record-badges">
            ${lowStockHtml}
            <span class="status-badge">${escapeHtml(formatRecordValue('status', status))}</span>
          </div>
        </div>
        ${metaHtml ? `<div class="record-meta">${metaHtml}</div>` : ''}
        ${detailHtml ? `<div class="record-details">${detailHtml}</div>` : ''}
      </div>
      <div class="record-actions">
        <button type="button" class="secondary-action" data-module-action="edit" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">Edit</button>
        <button type="button" class="secondary-action danger-action" data-module-action="archive" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">Archive</button>
      </div>
    </article>
  `;
}

function renderReportsSection(reportsData = state.reportsData) {
  const metrics = [
    ['total_staff', 'Total staff'],
    ['total_menu_items', 'Total menu items'],
    ['total_recipes', 'Total recipes'],
    ['total_inventory_items', 'Total inventory items'],
    ['total_events', 'Total events'],
    ['total_production_logs', 'Total production logs'],
    ['low_stock_items', 'Low stock items']
  ];
  const totalSourceRecords = metrics
    .filter(([key]) => key !== 'low_stock_items')
    .reduce((total, [key]) => total + (reportsData?.[key] || 0), 0);

  els['module-count-badge'].textContent = '7 metrics';
  els['module-empty-state'].hidden = totalSourceRecords > 0;
  els['module-record-list'].hidden = false;
  els['module-record-list'].innerHTML = `
    <div class="reports-grid">
      ${metrics.map(([key, label]) => `
        <article class="report-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(reportsData?.[key] || 0)}</strong>
        </article>
      `).join('')}
    </div>
  `;
  updateDashboardCards(state.moduleCounts);
}

function getRecordById(section, recordId) {
  return (state.moduleRecords[section] || []).find(record => String(record.id) === String(recordId));
}

function renderFormField(field, record = null) {
  const rawValue = record?.[field.name] ?? field.defaultValue ?? '';
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const requiredAttr = field.required ? ' required' : '';
  const minAttr = field.min !== undefined ? ` min="${escapeHtml(field.min)}"` : '';
  const stepAttr = field.step !== undefined ? ` step="${escapeHtml(field.step)}"` : '';
  const wideClass = field.wide || field.type === 'textarea' ? ' form-field-wide' : '';

  if (field.type === 'textarea') {
    return `
      <label class="form-field${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <textarea name="${escapeHtml(field.name)}"${requiredAttr}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  return `
    <label class="form-field${wideClass}">
      <span>${escapeHtml(field.label)}</span>
      <input type="${escapeHtml(field.type || 'text')}" name="${escapeHtml(field.name)}" value="${escapeHtml(value)}"${requiredAttr}${minAttr}${stepAttr}>
    </label>
  `;
}

function openModuleModal(section, record = null) {
  const moduleConfig = getModuleConfig(section);
  if (!moduleConfig.table) return;

  state.modalSection = section;
  state.editingRecord = record;
  showAlert(els['module-form-message'], '');
  els['module-modal-title'].textContent = record
    ? `Edit ${moduleConfig.singular}`
    : moduleConfig.action;
  els['module-modal-subtitle'].textContent = record
    ? `Update this ${moduleConfig.singular} for ${state.activeClient?.name || 'this workspace'}.`
    : `Create a new ${moduleConfig.singular} for ${state.activeClient?.name || 'this workspace'}.`;
  els['module-save-button'].textContent = record ? 'Save Changes' : moduleConfig.action;
  els['module-form-fields'].innerHTML = moduleConfig.fields
    .map(field => renderFormField(field, record))
    .join('');
  els['module-modal'].hidden = false;
  const firstInput = els['module-form-fields'].querySelector('input, textarea, select');
  if (firstInput) firstInput.focus();
}

function closeModuleModal() {
  state.modalSection = null;
  state.editingRecord = null;
  els['module-modal'].hidden = true;
  els['module-form'].reset();
  els['module-form-fields'].innerHTML = '';
  showAlert(els['module-form-message'], '');
}

function buildModulePayload(section) {
  const moduleConfig = getModuleConfig(section);
  const formData = new FormData(els['module-form']);
  const payload = {};

  moduleConfig.fields.forEach(field => {
    const rawValue = String(formData.get(field.name) || '').trim();
    if (field.required && !rawValue) {
      throw new Error(`${field.label} is required.`);
    }

    if (field.name === 'status' && !rawValue) {
      payload[field.name] = field.defaultValue || 'active';
      return;
    }

    payload[field.name] = normalizePayloadValue(field, rawValue);
  });

  return payload;
}

async function saveModuleRecord(event) {
  event.preventDefault();
  const section = state.modalSection;
  if (!section) return;

  const moduleConfig = getModuleConfig(section);
  setLoading(true);
  showAlert(els['module-form-message'], '');

  try {
    const payload = buildModulePayload(section);
    if (state.editingRecord?.id) {
      await updateRecord(moduleConfig.table, state.editingRecord.id, payload);
      showToast(`${moduleConfig.title} record updated.`);
    } else {
      await createRecord(moduleConfig.table, payload);
      showToast(`${moduleConfig.title} record created.`);
    }

    closeModuleModal();
    await loadDashboardCounts();
    updateDashboardCards();
    renderModuleSection(section);
  } catch (error) {
    showAlert(els['module-form-message'], error.message || `Unable to save ${moduleConfig.singular}.`);
  } finally {
    setLoading(false);
  }
}

async function archiveModuleRecord(section, recordId) {
  const moduleConfig = getModuleConfig(section);
  const record = getRecordById(section, recordId);
  const recordName = getRecordTitle(section, record);
  const shouldArchive = window.confirm(`Archive ${recordName}?`);
  if (!shouldArchive) return;

  setLoading(true);
  clearAlerts();

  try {
    await deleteOrArchiveRecord(moduleConfig.table, recordId);
    await loadDashboardCounts();
    updateDashboardCards();
    renderModuleSection(section);
    showToast(`${moduleConfig.title} record archived.`);
  } catch (error) {
    showAlert(els['workspace-message'], error.message || `Unable to archive ${moduleConfig.singular}.`);
  } finally {
    setLoading(false);
  }
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
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

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
  state.moduleRecords = {};
  state.moduleCounts = {};
  state.reportsData = null;
  state.activeSection = 'dashboard';

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
  state.activeSection = 'dashboard';
  state.moduleRecords = {};
  state.moduleCounts = {};
  state.reportsData = null;
  state.modalSection = null;
  state.editingRecord = null;
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
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      setPasswordToggleState(button, input, input.type === 'password');
    });
  });

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
    const confirmPassword = els['auth-confirm-password'].value;
    const fullName = els['auth-full-name'].value.trim();

    try {
      if (state.authMode === 'signup') {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

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

  document.querySelectorAll('.sidebar-link[data-section]').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.section;
      if (section === 'dashboard') {
        renderDashboard();
        return;
      }

      renderModuleSection(section);
    });
  });

  document.querySelectorAll('.module-card[data-section]').forEach(card => {
    card.addEventListener('click', () => {
      renderModuleSection(card.dataset.section);
    });
  });

  els['module-action-button'].addEventListener('click', () => {
    openModuleModal(state.activeSection);
  });

  els['module-header-action-button'].addEventListener('click', () => {
    openModuleModal(state.activeSection);
  });

  els['module-record-list'].addEventListener('click', event => {
    const actionButton = event.target.closest('[data-module-action]');
    if (!actionButton) return;

    const section = actionButton.dataset.section;
    const recordId = actionButton.dataset.recordId;
    if (actionButton.dataset.moduleAction === 'edit') {
      const record = getRecordById(section, recordId);
      if (record) openModuleModal(section, record);
      return;
    }

    if (actionButton.dataset.moduleAction === 'archive') {
      archiveModuleRecord(section, recordId);
    }
  });

  els['module-form'].addEventListener('submit', saveModuleRecord);

  els['module-cancel-button'].addEventListener('click', closeModuleModal);
  els['module-modal-close'].addEventListener('click', closeModuleModal);
  els['module-modal'].addEventListener('click', event => {
    if (event.target === els['module-modal']) closeModuleModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !els['module-modal'].hidden) {
      closeModuleModal();
    }
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
  getActiveClientId,
  loadModuleData,
  createRecord,
  updateRecord,
  deleteOrArchiveRecord,
  renderModuleList,
  openModuleModal,
  closeModuleModal,
  showToast,
  createBeoflowClient,
  sendPasswordResetEmail,
  updatePassword,
  renderDashboard,
  renderModuleSection,
  setActiveClient,
  requireActiveClient,
  state
};
