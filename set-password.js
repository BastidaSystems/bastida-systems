(function () {
  const INVALID_INVITATION_MESSAGE = 'Your invitation link is invalid or expired. Please request a new invitation.';
  const REDIRECTS = window.BASTIDA_AUTH_REDIRECTS || {};
  const CONFIG = window.BASTIDA_AUTH_CONFIG || {
    ...(window.BASTIDA_SUPABASE_CONFIG || {}),
    portalUrl: REDIRECTS.portal || 'https://bastidasystems.com/portal.html',
    loginUrl: REDIRECTS.login || 'https://bastidasystems.com/login.html',
    setPasswordUrl: REDIRECTS.setPassword || 'https://bastidasystems.com/set-password.html'
  };

  const statusMessage = document.getElementById('status-message');
  const form = document.getElementById('set-password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const submitButton = document.getElementById('create-password-button');

  let supabaseClient = null;
  let invitationSession = null;

  function setMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('error', 'success');
    if (type === 'error') statusMessage.classList.add('error');
    if (type === 'success') statusMessage.classList.add('success');
  }

  function showForm() {
    form.classList.remove('hidden');
    setMessage('Invitation verified. Create a password with at least 8 characters.');
  }

  function hideForm() {
    form.classList.add('hidden');
  }

  function getHashParams() {
    const rawHash = window.location.hash ? window.location.hash.slice(1) : '';
    return new URLSearchParams(rawHash);
  }

  function getQueryParams() {
    return new URLSearchParams(window.location.search);
  }

  function getAuthErrorFromUrl() {
    const hashParams = getHashParams();
    const queryParams = getQueryParams();
    return (
      hashParams.get('error_description') ||
      hashParams.get('error') ||
      queryParams.get('error_description') ||
      queryParams.get('error')
    );
  }

  function cleanAuthHash() {
    if (!window.location.hash) return;
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }

  function getSupabaseClient() {
    if (!CONFIG.url || !CONFIG.anonKey) {
      throw new Error('Supabase is not configured yet. Add the project URL and anon key in set-password.html.');
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase client failed to load. Please refresh and try again.');
    }

    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true
        }
      });
    }

    return supabaseClient;
  }

  async function waitForInvitationSession(client) {
    const currentSession = await client.auth.getSession();
    if (currentSession.error) throw currentSession.error;
    if (currentSession.data && currentSession.data.session) {
      return currentSession.data.session;
    }

    return new Promise(resolve => {
      let authListener = null;
      const timeout = window.setTimeout(() => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
        resolve(null);
      }, 2200);

      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (!session) return;
        window.clearTimeout(timeout);
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
        resolve(session);
      });

      authListener = data;
    });
  }

  function validatePasswords(newPassword, confirmPassword) {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return '';
  }

  async function initializeInvitationFlow() {
    hideForm();

    try {
      const urlError = getAuthErrorFromUrl();
      if (urlError) {
        setMessage(`${INVALID_INVITATION_MESSAGE} ${urlError}`, 'error');
        return;
      }

      const client = getSupabaseClient();
      invitationSession = await waitForInvitationSession(client);
      cleanAuthHash();

      if (!invitationSession || !invitationSession.user) {
        setMessage(INVALID_INVITATION_MESSAGE, 'error');
        return;
      }

      showForm();
      newPasswordInput.focus();
    } catch (error) {
      setMessage(error.message || INVALID_INVITATION_MESSAGE, 'error');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const validationError = validatePasswords(newPassword, confirmPassword);

    if (validationError) {
      setMessage(validationError, 'error');
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating password...';

      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setMessage('Password created successfully. Redirecting to your portal...', 'success');
      hideForm();

      window.setTimeout(() => {
        window.location.replace(CONFIG.portalUrl || 'portal.html');
      }, 1100);
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = 'Create password';
      setMessage(error.message || 'Unable to create password. Please try again.', 'error');
    }
  });

  initializeInvitationFlow();
})();
