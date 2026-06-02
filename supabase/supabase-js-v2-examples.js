/*
  Bastida Systems Portal - supabase-js v2 examples

  Browser usage with CDN:
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase/supabase-js-v2-examples.js"></script>

  Never place the service_role key in this file or any frontend file.
*/

const BastidaPortalApi = (() => {
  let client = null;

  function initSupabase({ url, anonKey }) {
    if (!url || !anonKey) {
      throw new Error('Missing Supabase URL or anon/publishable key.');
    }

    client = window.supabase.createClient(url, anonKey);
    return client;
  }

  function requireClient() {
    if (!client) {
      throw new Error('Call initSupabase({ url, anonKey }) before using the portal API.');
    }

    return client;
  }

  async function login(email, password) {
    const supabase = requireClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const profile = await getCurrentProfile();
    return {
      session: data.session,
      user: data.user,
      profile
    };
  }

  async function logout() {
    const supabase = requireClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function getCurrentSession() {
    const supabase = requireClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getCurrentProfile() {
    const supabase = requireClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id, auth_user_id, email, full_name, platform_role, active')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async function getVisibleCompanies() {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('companies')
      .select('id, slug, name, legal_name, status, website_url, logo_url, notes')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async function getDashboard(companySlug = null) {
    const supabase = requireClient();
    let query = supabase
      .from('company_dashboard')
      .select('*')
      .order('name', { ascending: true });

    if (companySlug) {
      query = query.eq('slug', companySlug).single();
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function getCompanyBySlug(slug) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('companies')
      .select('id, slug, name, legal_name, status, website_url, logo_url, notes')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  async function getHourPackages(companyId) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('hour_packages')
      .select('id, company_id, hours_purchased, amount_usd, status, purchased_at, activated_at, notes')
      .eq('company_id', companyId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async function getWorkHistory(companyId) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('work_logs')
      .select('id, company_id, title, description, work_date, hours_used, is_billable, category, status, attachment_urls, notes, created_at')
      .eq('company_id', companyId)
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async function getPaymentHistory(companyId) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('payments')
      .select('id, company_id, hour_package_id, amount_usd, currency, method, status, reference_number, paid_at, notes, created_at')
      .eq('company_id', companyId)
      .order('paid_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async function getReceipts(companyId) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('receipts')
      .select('id, company_id, payment_id, receipt_number, amount_usd, storage_path, issued_at')
      .eq('company_id', companyId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async function getReports(companyId) {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('reports')
      .select('id, company_id, report_type, report_month, title, summary, storage_path, status, created_at')
      .eq('company_id', companyId)
      .order('report_month', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async function getCompanyHistory(companyId) {
    const [
      hourPackages,
      workLogs,
      payments,
      receipts,
      reports
    ] = await Promise.all([
      getHourPackages(companyId),
      getWorkHistory(companyId),
      getPaymentHistory(companyId),
      getReceipts(companyId),
      getReports(companyId)
    ]);

    return {
      hourPackages,
      workLogs,
      payments,
      receipts,
      reports
    };
  }

  async function recordManualPayment({
    companyId,
    hours,
    amountUsd,
    method = 'manual_transfer',
    reference = null,
    notes = null,
    paidAt = new Date().toISOString()
  }) {
    const supabase = requireClient();
    const { data, error } = await supabase.rpc('admin_record_manual_payment', {
      p_company_id: companyId,
      p_hours: hours,
      p_amount_usd: amountUsd,
      p_payment_method: method,
      p_payment_reference: reference,
      p_notes: notes,
      p_paid_at: paidAt
    });

    if (error) throw error;
    return data && data[0] ? data[0] : null;
  }

  async function registerWorkLog({
    companyId,
    title,
    description,
    hours,
    workDate = new Date().toISOString().slice(0, 10),
    category = 'Design',
    notes = null,
    status = 'completed'
  }) {
    const supabase = requireClient();
    const { data, error } = await supabase.rpc('admin_register_work_log', {
      p_company_id: companyId,
      p_title: title,
      p_description: description,
      p_hours: hours,
      p_work_date: workDate,
      p_category: category,
      p_notes: notes,
      p_status: status
    });

    if (error) throw error;
    return data;
  }

  async function createReport({
    companyId,
    reportType = 'monthly',
    title,
    summary = null,
    reportMonth = null,
    storagePath = null,
    status = 'published'
  }) {
    const supabase = requireClient();
    const { data, error } = await supabase.rpc('admin_create_report', {
      p_company_id: companyId,
      p_report_type: reportType,
      p_title: title,
      p_summary: summary,
      p_report_month: reportMonth,
      p_storage_path: storagePath,
      p_status: status
    });

    if (error) throw error;
    return data;
  }

  async function loadBeoflowDashboard() {
    const company = await getCompanyBySlug('beoflow');
    const dashboard = await getDashboard('beoflow');
    const history = await getCompanyHistory(company.id);

    return {
      company,
      dashboard,
      ...history
    };
  }

  function subscribeToCompanyActivity(companyId, onChange) {
    const supabase = requireClient();
    const channel = supabase
      .channel(`company-activity-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hour_packages', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_logs', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  return {
    initSupabase,
    login,
    logout,
    getCurrentSession,
    getCurrentProfile,
    getVisibleCompanies,
    getDashboard,
    getCompanyBySlug,
    getHourPackages,
    getWorkHistory,
    getPaymentHistory,
    getReceipts,
    getReports,
    getCompanyHistory,
    recordManualPayment,
    registerWorkLog,
    createReport,
    loadBeoflowDashboard,
    subscribeToCompanyActivity
  };
})();

window.BastidaPortalApi = BastidaPortalApi;

/*
  Example pilot flow:

  BastidaPortalApi.initSupabase({
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ANON_OR_PUBLISHABLE_KEY'
  });

  await BastidaPortalApi.login('david@bastidasystems.com', 'temporary-password');

  const beoflow = await BastidaPortalApi.getCompanyBySlug('beoflow');

  await BastidaPortalApi.recordManualPayment({
    companyId: beoflow.id,
    hours: 2,
    amountUsd: 190,
    method: 'manual_transfer',
    reference: 'manual-transfer-test-001',
    notes: 'Pilot payment from Rodrigo for BEOFlow.'
  });

  await BastidaPortalApi.registerWorkLog({
    companyId: beoflow.id,
    title: 'Homepage design polish',
    description: 'Adjusted visual spacing, typography, and hero section hierarchy.',
    hours: 1.25,
    category: 'Design'
  });

  const dashboard = await BastidaPortalApi.loadBeoflowDashboard();
  console.log(dashboard.dashboard.remaining_hours);
*/
