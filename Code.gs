function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppBootstrap(request) {
  return handleApi_(function () {
    const user = requireSession_(request || {});
    const dictionaries = getMasterDataMap_();
    return {
      app: { name: APP.NAME, version: APP.VERSION, timezone: APP.TIMEZONE },
      user: sanitizeUser_(user),
      permissions: getPermissionMap_(user),
      dictionaries: dictionaries,
      schema: {},
      labels: FIELD_LABELS,
      lookups: emptyAppLookups_(),
      demoStages: DEMO_STAGES,
      dashboard: readDashboardCache_(user) || { metrics: {}, upcoming_projects: [], overdue_tasks: [], active_scenarios: [] },
      background_loading: true
    };
  });
}

function getAppReferenceData(request) {
  return handleApi_(function () {
    const user = requireSession_(request || {});
    const departments = scopedLookup_('departments', user, 200);
    const users = scopedLookup_('users', user, 200);
    const leads = scopedLookup_('leads', user, 300);
    const projects = scopedLookup_('projects', user, 300);
    const customers = scopedLookup_('customers', user, 300);
    const opportunities = scopedLookup_('sales_opportunities', user, 300);
    const invoices = scopedLookup_('invoices', user, 300);
    const tasks = scopedLookup_('project_tasks', user, 300);
    const projectItems = scopedLookup_('project_items', user, 300);
    const projectDepartments = scopedLookup_('project_departments', user, 300);
    const quotations = scopedLookup_('quotations', user, 300);
    const designLeaders = designLeaderUsers_().map(sanitizeUser_);
    return {
      schema: getDataDictionary_(),
      lookups: {
        departments: departments, users: users, leads: leads, projects: projects, customers: customers,
        opportunities: opportunities, invoices: invoices, tasks: tasks, projectItems: projectItems,
        projectDepartments: projectDepartments, quotations: quotations, designLeaders: designLeaders
      }
    };
  });
}

function emptyAppLookups_() {
  return {
    departments: [], users: [], leads: [], projects: [], customers: [], opportunities: [], invoices: [],
    tasks: [], projectItems: [], projectDepartments: [], quotations: [], designLeaders: []
  };
}

function runSystemMaintenance(request) {
  return handleApi_(function () {
    requireSession_(request || {});
    assertPermission_('users', 'update');
    setupSystem_();
    return { completed: true, at: serializeValue_(new Date()) };
  });
}

function queryAppData(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    const entity = assertEntity_(request.entity);
    assertPermission_(entity, 'view');
    if (request.id) {
      const row = getRowById_(entity, String(request.id));
      assertRecordScope_(entity, row, user);
      return { row: sanitizeRecordForClient_(entity, row) };
    }
    const filters = applyDataScopeFilters_(entity, request.filters || {}, user);
    const result = listRows_(entity, filters, request.limit || 50, request.offset || 0, request.search || '');
    result.rows = result.rows.map(function (row) { return sanitizeRecordForClient_(entity, row); });
    return result;
  });
}

function getEntityDetail(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    const entity = assertEntity_(request.entity);
    assertPermission_(entity, 'view');
    const record = getRowById_(entity, String(request.id || ''));
    assertRecordScope_(entity, record, user);
    const detail = { entity: entity, record: sanitizeRecordForClient_(entity, record), related: {} };
    if (entity === 'leads') detail.related = buildLeadDetail_(record, user);
    if (entity === 'customers') detail.related = buildCustomerDetail_(record, user);
    if (entity === 'projects') detail.related = buildProjectDetail_(record, user);
    if (entity === 'invoices') detail.related = buildInvoiceDetail_(record, user);
    if (entity === 'surveys') detail.related = buildSurveyDetail_(record, user);
    return detail;
  });
}

function buildSurveyDetail_(survey, user) {
  const opportunity = survey.opportunity_id ? getRowById_('sales_opportunities', String(survey.opportunity_id)) : null;
  const lead = opportunity && opportunity.lead_id ? getRowById_('leads', String(opportunity.lead_id)) : null;
  return {
    lead: pickClientFields_(lead, ['lead_id','contact_name','phone','email','source_channel','raw_need','lead_status','created_at']),
    opportunity: pickClientFields_(opportunity, ['opportunity_id','bride_name_provisional','groom_name_provisional','contact_role','expected_event_date','interested_service','interested_style','tone_color','customer_issue','note'])
  };
}

function submitSurveyResult(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    assertPermission_('surveys', 'update');
    const survey = getRowById_('surveys', String(request.survey_id || ''));
    assertRecordScope_('surveys', survey, user);
    const result = request.result || {};
    if (isBlank_(result.survey_result)) throw appError_('VALIDATION_ERROR', 'Cần nhập kết quả khảo sát');
    const images = normalizeSurveyImages_(request.images || []);
    const saved = saveRow_('surveys', {
      survey_id: survey.survey_id,
      actual_dimensions: String(result.actual_dimensions || '').trim(),
      site_conditions: String(result.site_conditions || '').trim(),
      access_conditions: String(result.access_conditions || '').trim(),
      survey_result: String(result.survey_result || '').trim(),
      note: String(result.note || '').trim(),
      photo_folder_url: JSON.stringify(images),
      handover_at: result.handover_at || new Date(),
      survey_status: 'completed',
      project_id: ''
    });
    return sanitizeMutationResult_('surveys', afterMutation_('surveys', saved));
  });
}

function uploadSurveyImage(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    assertPermission_('surveys', 'update');
    const survey = getRowById_('surveys', String(request.survey_id || ''));
    assertRecordScope_('surveys', survey, user);
    const mimeType = String(request.mime_type || '').toLowerCase();
    const allowedTypes = ['image/jpeg','image/png','image/webp'];
    if (allowedTypes.indexOf(mimeType) < 0) throw appError_('INVALID_IMAGE_TYPE', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
    const encoded = String(request.base64_data || '').replace(/^data:[^;]+;base64,/, '');
    if (!encoded) throw appError_('EMPTY_FILE', 'Không nhận được dữ liệu ảnh');
    const bytes = Utilities.base64Decode(encoded);
    if (bytes.length > 6 * 1024 * 1024) throw appError_('FILE_TOO_LARGE', 'Ảnh sau xử lý không được vượt quá 6 MB');
    const safeName = String(request.file_name || ('survey-' + Date.now() + '.jpg')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const blob = Utilities.newBlob(bytes, mimeType, safeName);
    const response = UrlFetchApp.fetch('https://tmpfile.link/api/upload', {
      method: 'post', payload: { file: blob }, muteHttpExceptions: true, followRedirects: true,
      headers: { Accept: 'application/json' }
    });
    const status = response.getResponseCode();
    let body = {};
    try { body = JSON.parse(response.getContentText() || '{}'); } catch (ignore) {}
    if (status < 200 || status >= 300 || !body.downloadLink) {
      throw appError_('TEMP_UPLOAD_FAILED', 'Dịch vụ tải ảnh tạm thời không phản hồi hợp lệ (HTTP ' + status + ')');
    }
    return normalizeSurveyImages_([{
      url: body.downloadLink, name: body.fileName || safeName, type: body.type || mimeType,
      size: Number(body.size || bytes.length), uploaded_at: new Date()
    }])[0];
  });
}

function normalizeSurveyImages_(images) {
  if (!Array.isArray(images)) images = [];
  if (images.length > 20) throw appError_('TOO_MANY_IMAGES', 'Mỗi khảo sát hỗ trợ tối đa 20 ảnh');
  return images.map(function (image) {
    const url = String(image && image.url || '').trim();
    if (!/^https:\/\/d\.tmpfile\.link\//i.test(url)) throw appError_('INVALID_IMAGE_URL', 'Đường dẫn ảnh khảo sát không hợp lệ');
    return {
      url: url,
      name: String(image.name || 'Ảnh khảo sát').slice(0, 160),
      type: String(image.type || 'image/jpeg').slice(0, 80),
      size: Math.max(0, Number(image.size || 0)),
      uploaded_at: serializeValue_(image.uploaded_at || new Date())
    };
  });
}

function pickClientFields_(record, fields) {
  if (!record) return {};
  return fields.reduce(function (safe, field) {
    safe[field] = serializeValue_(record[field]);
    return safe;
  }, {});
}

function buildLeadDetail_(lead, user) {
  const opportunities = readableRelatedRows_('sales_opportunities', { lead_id: lead.lead_id }, user);
  const opportunityIds = opportunities.map(function (row) { return row.opportunity_id; });
  const activities = opportunityIds.length ? readableRelatedRows_('sales_activities', { opportunity_id: opportunityIds }, user) : [];
  const surveys = opportunityIds.length ? readableRelatedRows_('surveys', { opportunity_id: opportunityIds }, user).filter(function (row) { return opportunityIds.indexOf(row.opportunity_id) >= 0; }) : [];
  const quotations = opportunityIds.length ? readableRelatedRows_('quotations', { opportunity_id: opportunityIds }, user).filter(function (row) { return opportunityIds.indexOf(row.opportunity_id) >= 0; }) : [];
  const quotationIds = quotations.map(function (row) { return row.quotation_id; });
  const quotationItems = quotationIds.length ? readableRelatedRows_('quotation_items', { quotation_id: quotationIds }, user).filter(function (row) { return quotationIds.indexOf(row.quotation_id) >= 0; }) : [];
  const attachments = readableRelatedRows_('lead_attachments', { lead_id: lead.lead_id }, user).filter(function (row) { return String(row.lead_id) === String(lead.lead_id); });
  const notes = readableRelatedRows_('lead_notes', { lead_id: lead.lead_id }, user).filter(function (row) { return String(row.lead_id) === String(lead.lead_id); });
  return {
    opportunities: opportunities,
    activities: activities,
    surveys: surveys,
    quotations: quotations,
    quotation_items: quotationItems,
    attachments: attachments,
    notes: notes,
    pipeline: [
      { code: 'raw', label: 'Lead thô', count: 1, completed: true },
      { code: 'opportunity', label: 'Cơ hội', count: opportunities.length, completed: opportunities.length > 0 },
      { code: 'care', label: 'Chăm sóc', count: activities.length, completed: activities.length > 0 },
      { code: 'survey', label: 'Khảo sát', count: surveys.length, completed: surveys.length > 0 },
      { code: 'quotation', label: 'Báo giá', count: quotations.length, completed: quotations.length > 0 }
    ]
  };
}

function convertLeadToCustomer(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    assertPermission_('leads', 'update');
    assertPermission_('sales_opportunities', 'create');
    assertPermission_('customers', 'create');
    const lead = getRowById_('leads', String(request.lead_id || ''));
    assertRecordScope_('leads', lead, user);
    const input = request.customer || {};
    const displayName = String(input.customer_display_name || lead.contact_name || lead.phone || lead.email || '').trim();
    if (!displayName) throw appError_('VALIDATION_ERROR', 'Cần nhập tên hiển thị khách hàng trước khi chuyển đổi');

    let opportunity = listRows_('sales_opportunities', { lead_id: lead.lead_id }, 1).rows[0];
    if (!opportunity) {
      opportunity = saveRow_('sales_opportunities', prepareMutation_('sales_opportunities', {
        lead_id: lead.lead_id,
        sales_id: lead.assigned_sales_id || user.user_id,
        bride_name_provisional: input.bride_name || lead.contact_name || '',
        groom_name_provisional: input.groom_name || '',
        contact_role: 'bride',
        interested_service: lead.raw_need || '',
        consultation_status: 'won',
        note: 'Tự động tạo khi chuyển Lead thành Khách hàng'
      }, user, true)).record;
    }
    let customer = listRows_('customers', { opportunity_id: opportunity.opportunity_id }, 1).rows[0];
    if (!customer) {
      customer = saveRow_('customers', prepareMutation_('customers', {
        opportunity_id: opportunity.opportunity_id,
        customer_display_name: displayName,
        bride_name: input.bride_name || '',
        groom_name: input.groom_name || '',
        note: input.note || 'Chuyển đổi từ lead ' + lead.lead_id
      }, user, true)).record;
    }
    saveRow_('leads', { lead_id: lead.lead_id, lead_status: 'converted' });
    return {
      lead: sanitizeRecordForClient_('leads', getRowById_('leads', lead.lead_id)),
      opportunity: sanitizeRecordForClient_('sales_opportunities', opportunity),
      customer: sanitizeRecordForClient_('customers', customer)
    };
  });
}

function readableRelatedRows_(entity, filters, user, limit) {
  const rule = permissionRule_(entity, user);
  const projectReference = entity === 'project_departments' && permissionRule_('projects', user) && permissionRule_('projects', user).view;
  if ((!rule || !rule.view) && !projectReference) return [];
  const result = listRows_(entity, applyDataScopeFilters_(entity, filters || {}, user), limit || APP.MAX_LIST_ROWS).rows;
  return result.map(function (row) { return sanitizeRecordForClient_(entity, row); });
}

function buildCustomerDetail_(customer, user) {
  const projects = readableRelatedRows_('projects', { customer_id: customer.customer_id }, user);
  const projectIds = projects.map(function (row) { return row.project_id; });
  const contacts = readableRelatedRows_('customer_contacts', { customer_id: customer.customer_id }, user).filter(function (row) { return String(row.customer_id) === String(customer.customer_id); });
  const invoices = readableRelatedRows_('invoices', { project_id: projectIds }, user).filter(function (row) { return projectIds.indexOf(row.project_id) >= 0; });
  const invoiceIds = invoices.map(function (row) { return row.invoice_id; });
  const payments = readableRelatedRows_('payments', { invoice_id: invoiceIds }, user).filter(function (row) { return invoiceIds.indexOf(row.invoice_id) >= 0; });
  const quotations = readableRelatedRows_('quotations', { project_id: projectIds }, user).filter(function (row) { return projectIds.indexOf(row.project_id) >= 0; });
  const contracts = readableRelatedRows_('contracts', { project_id: projectIds }, user).filter(function (row) { return row.customer_id === customer.customer_id || projectIds.indexOf(row.project_id) >= 0; });
  const tasks = projectIds.length ? listRows_('project_tasks', { project_id: projectIds }, APP.MAX_LIST_ROWS).rows.filter(function (row) { return projectIds.indexOf(row.project_id) >= 0; }) : [];
  const taskIds = tasks.map(function (row) { return row.task_id; });
  const taskMap = {};
  tasks.forEach(function (task) { taskMap[task.task_id] = task; });
  const assignments = readableRelatedRows_('task_assignments', { task_id: taskIds }, user).filter(function (row) { return taskIds.indexOf(row.task_id) >= 0; }).map(function (row) {
    const task = taskMap[row.task_id] || {};
    return Object.assign({}, row, { task_name: task.task_name || '', project_id: task.project_id || '', department_id: task.department_id || '' });
  });
  const total = invoices.reduce(function (sum, row) { return sum + Number(row.final_amount || 0); }, 0);
  const paid = invoices.reduce(function (sum, row) { return sum + Number(row.paid_amount || 0); }, 0);
  return {
    contacts: contacts, projects: projects, invoices: invoices, payments: payments, quotations: quotations,
    contracts: contracts, assignments: assignments,
    summary: { projects: projects.length, invoices: invoices.length, total: total, paid: paid, remaining: total - paid }
  };
}

function buildInvoiceDetail_(invoice, user) {
  const items = readableRelatedRows_('invoice_items', { invoice_id: invoice.invoice_id }, user).filter(function (row) { return String(row.invoice_id) === String(invoice.invoice_id); });
  const payments = readableRelatedRows_('payments', { invoice_id: invoice.invoice_id }, user).filter(function (row) { return String(row.invoice_id) === String(invoice.invoice_id); });
  const plans = readableRelatedRows_('payment_plans', { invoice_id: invoice.invoice_id }, user).filter(function (row) { return String(row.invoice_id) === String(invoice.invoice_id); });
  const projects = readableRelatedRows_('projects', { project_id: invoice.project_id }, user).filter(function (row) { return String(row.project_id) === String(invoice.project_id); });
  const project = projects[0] || null;
  const customers = project ? readableRelatedRows_('customers', { customer_id: project.customer_id }, user).filter(function (row) { return String(row.customer_id) === String(project.customer_id); }) : [];
  const contacts = project ? readableRelatedRows_('customer_contacts', { customer_id: project.customer_id }, user).filter(function (row) { return String(row.customer_id) === String(project.customer_id); }) : [];
  const quotations = readableRelatedRows_('quotations', { project_id: invoice.project_id }, user).filter(function (row) { return String(row.project_id) === String(invoice.project_id); });
  const contracts = readableRelatedRows_('contracts', { project_id: invoice.project_id }, user).filter(function (row) { return String(row.project_id) === String(invoice.project_id); });
  return { items: items, payments: payments, payment_plans: plans, project: project, customer: customers[0] || null, contacts: contacts, quotations: quotations, contracts: contracts };
}

function recordInvoicePayment(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    assertPermission_('payments', 'create');
    assertPermission_('invoices', 'view');
    const invoice = getRowById_('invoices', String(request.invoice_id || ''));
    assertRecordScope_('invoices', invoice, user);
    const amount = Number(request.amount || 0);
    if (!(amount > 0)) throw appError_('VALIDATION_ERROR', 'Số tiền thanh toán phải lớn hơn 0');
    const remaining = Number(invoice.remaining_amount || invoice.final_amount || 0);
    if (remaining <= 0) throw appError_('INVOICE_PAID', 'Hóa đơn đã được thanh toán đủ');
    if (amount > remaining) throw appError_('PAYMENT_EXCEEDS_REMAINING', 'Số tiền vượt quá công nợ còn lại ' + remaining);
    const result = saveRow_('payments', {
      invoice_id: invoice.invoice_id,
      payment_stage: request.payment_stage || 'phat_sinh',
      payment_at: request.payment_at || new Date(),
      amount: amount,
      payment_method: request.payment_method || 'bank_transfer',
      transaction_reference: request.transaction_reference || '',
      receipt_url: request.receipt_url || '',
      received_by: user.user_id,
      confirmed_by: user.user_id,
      confirmed_at: new Date(),
      payment_status: 'confirmed',
      source_reference: 'invoice_detail',
      note: request.note || ''
    });
    afterMutation_('payments', result);
    return { payment: sanitizeRecordForClient_('payments', result.record), invoice: sanitizeRecordForClient_('invoices', getRowById_('invoices', invoice.invoice_id)) };
  });
}

function buildProjectDetail_(project, user) {
  const entities = ['project_departments','project_tasks','project_items','project_milestones','project_documents','design_orders','contracts','invoices'];
  const related = {};
  entities.forEach(function (entity) {
    related[entity] = readableRelatedRows_(entity, { project_id: project.project_id }, user).filter(function (row) { return String(row.project_id || '') === String(project.project_id); });
  });
  const taskMap = {};
  const taskIds = (related.project_tasks || []).map(function (task) { taskMap[task.task_id] = task; return task.task_id; });
  related.task_assignments = readableRelatedRows_('task_assignments', { task_id: taskIds }, user).filter(function (row) {
    return taskIds.indexOf(row.task_id) >= 0;
  }).map(function (row) {
    const task = taskMap[row.task_id] || {};
    return Object.assign({}, row, { task_name: task.task_name || '', project_id: project.project_id, department_id: task.department_id || '' });
  });
  return related;
}

function mutateAppData(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    const entity = assertEntity_(request.entity);
    if (ENTITY_CONFIG[entity].readOnly) throw appError_('READ_ONLY_ENTITY', 'Dữ liệu ' + entity + ' chỉ được phép xem');
    const action = request.action || 'save';
    if (action === 'delete') {
      assertPermission_(entity, 'delete');
      const current = getRowById_(entity, String(request.id || ''));
      assertRecordScope_(entity, current, user);
      const deleted = afterMutation_(entity, softDeleteRow_(entity, String(request.id || '')));
      if (entity === 'users') revokeUserSessions_(String(request.id || ''));
      return sanitizeMutationResult_(entity, deleted);
    }
    const config = ENTITY_CONFIG[entity];
    const creating = !request.data || !request.data[config.pk];
    const resetsPassword = entity === 'users' && request.data && !!(request.data.temporary_password || request.data.new_password);
    assertPermission_(entity, creating ? 'create' : 'update');
    const prepared = prepareScopedMutation_(entity, prepareMutation_(entity, request.data || {}, user, creating), user, creating);
    if (entity === 'users') {
      const duplicateUser = listRows_('users', {}, APP.MAX_LIST_ROWS).rows.filter(function (row) {
        return String(row.email || '').toLowerCase() === String(prepared.email || '').toLowerCase() && String(row.user_id || '') !== String(prepared.user_id || '');
      })[0];
      if (duplicateUser) throw appError_('DUPLICATE_EMAIL', 'Email nhân viên đã tồn tại');
    }
    if (!creating) assertRecordScope_(entity, getRowById_(entity, String(prepared[config.pk] || '')), user);
    const result = saveRow_(entity, prepared);
    if (resetsPassword) revokeUserSessions_(result.record.user_id);
    return sanitizeMutationResult_(entity, afterMutation_(entity, result));
  });
}

function getDashboard(request) {
  return handleApi_(function () { requireSession_(request || {}); return buildDashboard_((request || {}).force === true); });
}

function getEmployeePermissions(request) {
  return handleApi_(function () { requireSession_(request || {}); return getEmployeePermissions_((request || {}).user_id); });
}

function saveEmployeePermissions(request) {
  return handleApi_(function () { requireSession_(request || {}); return saveEmployeePermissions_((request || {}).user_id, (request || {}).rules || []); });
}

function getAuthorizationState() {
  return handleApi_(function () {
    const info = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL, APP.OAUTH_SCOPES);
    const status = String(info.getAuthorizationStatus());
    const checks = { spreadsheets: false, userinfo_email: false, external_request: false };
    const errors = {};
    try {
      checks.spreadsheets = SpreadsheetApp.openById(APP.SPREADSHEET_ID).getId() === APP.SPREADSHEET_ID;
    } catch (sheetError) {
      errors.spreadsheets = sheetError.message || String(sheetError);
    }
    try {
      checks.userinfo_email = !!Session.getEffectiveUser().getEmail();
      if (!checks.userinfo_email) errors.userinfo_email = 'Google không trả về email cho phiên hiện tại.';
    } catch (identityError) {
      errors.userinfo_email = identityError.message || String(identityError);
    }
    try {
      checks.external_request = !!UrlFetchApp.getRequest('https://tmpfile.link/api/upload', { method: 'post' });
    } catch (fetchError) {
      errors.external_request = fetchError.message || String(fetchError);
    }
    const required = status === String(ScriptApp.AuthorizationStatus.REQUIRED) || !checks.spreadsheets || !checks.userinfo_email || !checks.external_request;
    return {
      status: status,
      required: required,
      authorization_url: info.getAuthorizationUrl() || '',
      authorized_scopes: info.getAuthorizedScopes() || [],
      required_scopes: APP.OAUTH_SCOPES.slice(),
      scope_checks: checks,
      scope_errors: errors,
      web_app_url: ScriptApp.getService().getUrl() || ''
    };
  });
}

function resetMyAuthorization() {
  return handleApi_(function () {
    ScriptApp.invalidateAuth();
    return {
      reset: true,
      message: 'Đã xóa quyền của tài khoản hiện tại. Hãy mở lại bước cấp quyền và chọn đủ quyền.'
    };
  });
}

function createDemoScenario(request) {
  return handleApi_(function () {
    requireSession_(request || {});
    assertPermission_('demo_scenarios', 'create');
    return createDemoScenario_(request || {});
  });
}

function runDemoStep(request) {
  return handleApi_(function () {
    requireSession_(request || {});
    assertPermission_('demo_scenarios', 'update');
    return runDemoStep_(String((request || {}).scenario_id || ''));
  });
}

function runDemoAll(request) {
  return handleApi_(function () {
    requireSession_(request || {});
    assertPermission_('demo_scenarios', 'update');
    return runDemoAll_(String((request || {}).scenario_id || ''));
  });
}

function getDemoScenario(request) {
  return handleApi_(function () {
    requireSession_(request || {});
    assertPermission_('demo_scenarios', 'view');
    return buildDemoResult_(getRowById_('demo_scenarios', String((request || {}).scenario_id || '')));
  });
}

function handleApi_(fn) {
  try {
    return { ok: true, data: fn() };
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return { ok: false, error: { message: error.message || String(error), code: error.code || 'APP_ERROR' } };
  } finally {
    REQUEST_USER_ = null;
    REQUEST_PERMISSION_MAP_ = {};
    REQUEST_RECORDS_CACHE_ = {};
  }
}

function sanitizeRecordForClient_(entity, record) {
  if (!record) return record;
  return entity === 'users' ? sanitizeUser_(record) : record;
}

function sanitizeMutationResult_(entity, result) {
  result = Object.assign({}, result || {});
  if (result.record) result.record = sanitizeRecordForClient_(entity, result.record);
  if (result.previous) result.previous = sanitizeRecordForClient_(entity, result.previous);
  return result;
}
