function createDemoScenario_(input) {
  const eventDate = input.event_date ? new Date(input.event_date) : new Date(Date.now() + 60 * 86400000);
  if (isNaN(eventDate.getTime())) throw appError_('VALIDATION_ERROR', 'Ngày tổ chức demo không hợp lệ');
  const bride = String(input.bride_name || 'Minh Anh').trim();
  const groom = String(input.groom_name || 'Đức Long').trim();
  const scenario = saveRow_('demo_scenarios', {
    scenario_name: input.scenario_name || ('Đám cưới ' + bride + ' - ' + groom),
    current_stage: 'not_started', current_stage_order: 0, scenario_status: 'active', bride_name: bride, groom_name: groom,
    event_date: Utilities.formatDate(eventDate, APP.TIMEZONE, 'yyyy-MM-dd'), service_type: input.service_type || 'hoi_truong', scenario_json: '{}'
  }).record;
  return runDemoStep_(scenario.scenario_id);
}

function runDemoStep_(scenarioId) {
  if (!scenarioId) throw appError_('MISSING_ID', 'Thiếu mã kịch bản demo');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const scenario = getRowById_('demo_scenarios', scenarioId);
    if (!scenario) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy kịch bản ' + scenarioId);
    const currentOrder = Number(scenario.current_stage_order || 0);
    if (currentOrder >= DEMO_STAGES.length) return buildDemoResult_(scenario);
    const nextStage = DEMO_STAGES[currentOrder];
    const state = parseScenarioState_(scenario.scenario_json);
    const handlers = {
      lead_received: demoLeadReceived_, qualified: demoQualified_, deposit_confirmed: demoDepositConfirmed_,
      design_approved: demoDesignApproved_, operation_started: demoOperationStarted_, event_completed: demoEventCompleted_
    };
    handlers[nextStage.code](scenario, state);
    const completed = nextStage.order === DEMO_STAGES.length;
    const updated = lockedSave_('demo_scenarios', {
      scenario_id: scenarioId, current_stage: nextStage.code, current_stage_order: nextStage.order,
      scenario_status: completed ? 'completed' : 'active', scenario_json: JSON.stringify(state)
    });
    return buildDemoResult_(updated);
  } finally {
    lock.releaseLock();
  }
}

function runDemoAll_(scenarioId) {
  let result = null;
  for (let index = 0; index < DEMO_STAGES.length; index++) {
    const current = getRowById_('demo_scenarios', scenarioId);
    if (!current || Number(current.current_stage_order || 0) >= DEMO_STAGES.length) break;
    result = runDemoStep_(scenarioId);
  }
  return result || buildDemoResult_(getRowById_('demo_scenarios', scenarioId));
}

function demoLeadReceived_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  const lead = lockedSave_('leads', {
    source_channel: 'facebook', source_name: 'Fanpage Wedding Demo', source_conversation_id: 'DEMO-' + scenario.scenario_id,
    contact_name: scenario.bride_name, phone: '0900000000', email: '', facebook_url: '',
    raw_need: 'Trang trí tư gia và hội trường cưới, tone trắng xanh', raw_message: 'Mình cần tư vấn gói trang trí cưới trọn gói',
    lead_status: 'qualified', duplicate_of_lead_id: '', assigned_sales_id: owner, note: 'Dữ liệu mô phỏng - ' + scenario.scenario_id
  });
  const opportunity = lockedSave_('sales_opportunities', {
    lead_id: lead.lead_id, sales_id: owner, bride_name_provisional: scenario.bride_name, groom_name_provisional: scenario.groom_name,
    contact_role: 'bride', expected_event_date: scenario.event_date, expected_event_month: String(scenario.event_date).slice(0,7),
    interested_service: 'Tư gia cưới + Hội trường', interested_style: 'Modern garden', tone_color: 'Trắng - xanh lá',
    customer_issue: 'Cần đồng bộ thiết kế giữa tư gia và hội trường', data_evaluation: 'Đủ tên, điện thoại, ngày dự kiến',
    aftercare_evaluation: '', next_followup_at: relativeDate_(scenario.event_date, -70, 9), consultation_status: 'consulting',
    estimated_value: 150000000, lost_reason: '', note: 'Dữ liệu mô phỏng - ' + scenario.scenario_id
  });
  state.lead_id = lead.lead_id;
  state.opportunity_id = opportunity.opportunity_id;
}

function demoQualified_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  lockedSave_('sales_activities', {
    opportunity_id: state.opportunity_id, activity_type: 'consultation', activity_at: relativeDate_(scenario.event_date, -68, 10), sales_id: owner,
    content: 'Tư vấn concept, ngân sách và phạm vi hai địa điểm', customer_response: 'Đồng ý khảo sát và nhận báo giá',
    next_action: 'Khảo sát địa điểm', next_action_at: relativeDate_(scenario.event_date, -65, 9), result: 'positive', attachment_url: '', note: 'Dữ liệu mô phỏng'
  });
  const survey = lockedSave_('surveys', {
    opportunity_id: state.opportunity_id, project_id: '', requested_by: owner, surveyor_id: owner, survey_date: relativeDate_(scenario.event_date, -65, 9),
    location: 'Tư gia Hải Phòng và Trung tâm tiệc cưới Demo', contact_person: scenario.bride_name, contact_phone: '0900000000',
    survey_requirements: 'Đo cổng, sân khấu, lối đi và khu vực đón khách', actual_dimensions: 'Sân khấu 8x4m; cổng 3x3.5m',
    site_conditions: 'Mặt bằng thuận lợi', access_conditions: 'Xe tải vào được', survey_result: 'Đủ điều kiện triển khai',
    photo_folder_url: '', survey_status: 'completed', handover_at: relativeDate_(scenario.event_date, -64, 15), note: 'Dữ liệu mô phỏng'
  });
  const quotation = lockedSave_('quotations', {
    opportunity_id: state.opportunity_id, project_id: '', quotation_type: 'after_survey', version_no: 1,
    quotation_date: relativeDate_(scenario.event_date, -63, 9), valid_until: relativeDate_(scenario.event_date, -56, 23),
    estimated_min: 140000000, estimated_max: 165000000, subtotal_amount: 155000000, discount_amount: 5000000, final_amount: 150000000,
    quotation_status: 'approved', file_url: '', approved_at: relativeDate_(scenario.event_date, -58, 14), note: 'Dữ liệu mô phỏng'
  });
  [
    ['Tư gia','Trang trí tư gia cưới','Gói cổng hoa, phông lễ gia tiên, bàn ghế',1,45000000],
    ['Hội trường','Trang trí hội trường','Sân khấu, lối đi, bàn gallery, photobooth',1,105000000]
  ].forEach(function (item, index) {
    lockedSave_('quotation_items', { quotation_id: quotation.quotation_id, service_group: item[0], item_name: item[1], description: item[2], unit: 'gói', quantity: item[3], unit_price: item[4], amount: item[3] * item[4], sort_order: index + 1, note: '' });
  });
  lockedSave_('sales_opportunities', { opportunity_id: state.opportunity_id, consultation_status: 'quotation_sent', aftercare_evaluation: 'Khách duyệt phương án và chuẩn bị cọc' });
  state.survey_id = survey.survey_id;
  state.quotation_id = quotation.quotation_id;
}

function demoDepositConfirmed_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  const customer = lockedSave_('customers', {
    opportunity_id: state.opportunity_id, customer_display_name: scenario.bride_name + ' - ' + scenario.groom_name,
    bride_name: scenario.bride_name, groom_name: scenario.groom_name, primary_contact_id: '', customer_status: 'active',
    customer_folder_url: '', note: 'Dữ liệu mô phỏng - ' + scenario.scenario_id
  });
  const contact = lockedSave_('customer_contacts', {
    customer_id: customer.customer_id, contact_name: scenario.bride_name, contact_role: 'bride', phone: '0900000000', email: '', facebook_url: '',
    address: 'Hải Phòng', is_primary: true, note: 'Liên hệ chính'
  });
  lockedSave_('customers', { customer_id: customer.customer_id, primary_contact_id: contact.contact_id });
  const projectDefs = [
    { service: 'tu_gia_cuoi', label: 'Tư gia cưới', amount: 45000000, date: relativeDate_(scenario.event_date, -1, 8), code: 'TG' },
    { service: 'hoi_truong', label: 'Hội trường cưới', amount: 105000000, date: relativeDate_(scenario.event_date, 0, 16), code: 'HT' }
  ];
  state.customer_id = customer.customer_id;
  state.projects = [];
  state.invoices = [];
  projectDefs.forEach(function (def) {
    const eventDate = new Date(def.date);
    const project = lockedSave_('projects', {
      customer_id: customer.customer_id, event_code: Utilities.formatDate(eventDate, APP.TIMEZONE, 'ddMMyy') + '_' + def.code,
      project_name: scenario.bride_name + ' - ' + scenario.groom_name + ' | ' + def.label, service_type: def.service, event_name: def.label,
      event_date: def.date, event_session: def.service === 'hoi_truong' ? 'evening' : 'morning', venue_type: def.service === 'hoi_truong' ? 'hall' : 'home',
      venue_name: def.service === 'hoi_truong' ? 'Trung tâm tiệc cưới Demo' : 'Tư gia nhà gái', venue_address: 'Hải Phòng', province: 'Hải Phòng',
      sales_id: owner, project_manager_id: owner, project_status: 'planning', complexity_level: 'standard',
      deposit_confirmed_at: relativeDate_(scenario.event_date, -56, 10), implementation_eligible: true, important_note: 'Tone trắng xanh; cần đồng bộ hai địa điểm'
    });
    const invoice = lockedSave_('invoices', {
      project_id: project.project_id, invoice_number: 'CN-' + project.event_code, contract_value: def.amount, discount_amount: 0, extra_amount: 0,
      final_amount: def.amount, paid_amount: 10000000, remaining_amount: def.amount - 10000000, difference_amount: 0, invoice_status: 'partial',
      issued_at: relativeDate_(scenario.event_date, -56, 9), due_at: def.date, sales_id: owner, accountant_id: owner, source_document_url: '', note: 'Dữ liệu mô phỏng'
    });
    const plan1 = lockedSave_('payment_plans', { invoice_id: invoice.invoice_id, payment_stage: 'coc_chot_lich', sequence_no: 1, expected_percentage: 10, expected_amount: 10000000, due_date: relativeDate_(scenario.event_date, -56, 9), condition_to_collect: 'Khi ký xác nhận giữ lịch', plan_status: 'paid', note: '' });
    lockedSave_('payment_plans', { invoice_id: invoice.invoice_id, payment_stage: 'tat_toan', sequence_no: 2, expected_percentage: 90, expected_amount: def.amount - 10000000, due_date: relativeDate_(def.date, -3, 17), condition_to_collect: 'Trước ngày thi công', plan_status: 'pending', note: '' });
    lockedSave_('payments', { invoice_id: invoice.invoice_id, payment_plan_id: plan1.payment_plan_id, payment_stage: 'coc_chot_lich', payment_at: relativeDate_(scenario.event_date, -56, 10), amount: 10000000, payment_method: 'bank_transfer', transaction_reference: 'DEMO-' + invoice.invoice_id, receipt_url: '', received_by: owner, confirmed_by: owner, confirmed_at: relativeDate_(scenario.event_date, -56, 10), payment_status: 'confirmed', source_reference: 'Sao kê demo', note: '' });
    state.projects.push(project.project_id);
    state.invoices.push(invoice.invoice_id);
  });
  lockedSave_('sales_opportunities', { opportunity_id: state.opportunity_id, consultation_status: 'won' });
  state.primary_project_id = state.projects[1];
}

function demoDesignApproved_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  state.tasks = [];
  state.project_items = [];
  const templates = listRows_('task_templates', { is_active: true }, 200).rows;
  state.projects.forEach(function (projectId) {
    const project = getRowById_('projects', projectId);
    const designOrder = lockedSave_('design_orders', {
      project_id: projectId, ordered_by: owner, ordered_at: relativeDate_(project.event_date, -50, 9), design_type: 'proposal', template_type: 'custom',
      proposal_input_url: '', designer_id: owner, assigned_at: relativeDate_(project.event_date, -49, 9), due_at: relativeDate_(project.event_date, -42, 17),
      progress_status: 'approved', revision_count: 2, kpi_days: 7, extended_days: 0, internal_approved_at: relativeDate_(project.event_date, -40, 10),
      customer_approved_at: relativeDate_(project.event_date, -38, 14), final_design_url: '', note: 'Dữ liệu mô phỏng'
    });
    const itemDefs = project.service_type === 'hoi_truong'
      ? [['Sân khấu','Backdrop sân khấu','8x4m','Khung sắt, fomex','Hoa lụa cao cấp'],['Lối đi','Lối đi cô dâu','12x1.5m','Thảm và bục','Hoa lụa'],['Đón khách','Photobooth','4x3m','Khung gỗ','Hoa lụa']]
      : [['Gia tiên','Phông lễ gia tiên','4x3m','Khung sắt','Hoa lụa'],['Cổng','Cổng hoa tư gia','3x3.5m','Khung sắt','Hoa lụa'],['Bàn ghế','Bàn ghế lễ','20 bàn','Gỗ và vải','Không']];
    itemDefs.forEach(function (item) {
      const projectItem = lockedSave_('project_items', {
        project_id: projectId, item_group: item[0], item_name: item[1], description: 'Theo Proposal đã duyệt', dimensions: item[2], structure: item[3],
        main_material: item[3], flower_material: item[4], color_tone: 'Trắng - xanh lá', letter_content: scenario.bride_name + ' & ' + scenario.groom_name,
        unit: 'bộ', quantity: 1, reference_image_url: '', responsible_department_id: 'production', customer_approved: true, note: ''
      });
      state.project_items.push(projectItem.project_item_id);
    });
    const deptMap = {};
    ['design','production','warehouse','flower','logistics','construction','accounting'].forEach(function (departmentId) {
      const projectDepartment = lockedSave_('project_departments', {
        project_id: projectId, department_id: departmentId, department_leader_id: owner, handover_at: relativeDate_(project.event_date, -38, 15),
        accepted_at: relativeDate_(project.event_date, -38, 16), department_status: 'active', deadline: project.event_date, note: ''
      });
      deptMap[departmentId] = projectDepartment.project_department_id;
    });
    templates.filter(function (template) { return template.service_type === '*' || template.service_type === project.service_type; }).forEach(function (template) {
      const start = relativeDate_(project.event_date, Number(template.start_offset_days || 0), 9);
      const end = relativeDate_(start, Number(template.duration_days || 1) - 1, 17);
      const task = lockedSave_('project_tasks', {
        project_id: projectId, project_item_id: '', project_department_id: deptMap[template.department_id], task_template_id: template.task_template_id,
        parent_task_id: '', department_id: template.department_id, task_group: template.task_group, task_type: template.task_type,
        task_name: template.task_name, task_detail: template.task_detail_template, planned_start_at: start, planned_end_at: end, deadline_at: end,
        priority: template.priority || 'medium', unit: 'công việc', planned_quantity: 1, actual_start_at: '', actual_end_at: '', actual_quantity: 0,
        task_status: template.department_id === 'design' ? 'done' : 'todo', progress_percent: template.department_id === 'design' ? 100 : 0,
        is_blocked: false, blocked_reason: '', proposal_url: designOrder.final_design_url || '', production_file_url: '', checklist_url: '', result_note: '', result_file_url: '', important_note: ''
      });
      state.tasks.push(task.task_id);
    });
    lockedSave_('projects', { project_id: projectId, project_status: 'designing' });
  });
}

function demoOperationStarted_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  let resourcesCreated = 0;
  state.projects.forEach(function (projectId) { lockedSave_('projects', { project_id: projectId, project_status: 'production' }); });
  state.tasks.forEach(function (taskId) {
    const task = getRowById_('project_tasks', taskId);
    if (!task) return;
    let status = task.task_status;
    let progress = Number(task.progress_percent || 0);
    if (['production','warehouse','flower','logistics'].indexOf(task.department_id) >= 0) { status = 'in_progress'; progress = 45; }
    if (task.department_id === 'design') { status = 'done'; progress = 100; }
    lockedSave_('project_tasks', { task_id: taskId, task_status: status, progress_percent: progress, actual_start_at: status === 'in_progress' ? new Date() : task.actual_start_at });
    lockedSave_('task_assignments', { task_id: taskId, user_id: '', assignment_role: task.department_id === 'construction' ? 'Đội thi công' : 'Nhân sự phòng ban', external_worker_name: 'Nhân sự Demo', assigned_at: new Date(), accepted_at: new Date(), work_status: status, note: '' });
    if (resourcesCreated < 6 && ['production','flower','warehouse'].indexOf(task.department_id) >= 0) {
      lockedSave_('task_resources', {
        task_id: taskId, project_item_id: '', resource_category: task.department_id === 'flower' ? 'flower_material' : 'material',
        resource_name: task.department_id === 'flower' ? 'Hoa lụa tone trắng xanh' : 'Khung, fomex và phụ kiện', specification: 'Theo bản vẽ sản xuất', color: 'Trắng - xanh', paper_width: '',
        unit: 'bộ', planned_quantity: 1, issued_quantity: 0, actual_used_quantity: 0, additional_quantity: 0, resource_status: 'prepared', purchase_required: false, external_order_required: false, note: 'Dữ liệu mô phỏng'
      });
      resourcesCreated += 1;
    }
  });
}

function demoEventCompleted_(scenario, state) {
  const owner = getCurrentUser_().user_id;
  state.tasks.forEach(function (taskId) {
    if (getRowById_('project_tasks', taskId)) lockedSave_('project_tasks', { task_id: taskId, task_status: 'done', progress_percent: 100, actual_end_at: new Date(), actual_quantity: 1, result_note: 'Hoàn thành trong kịch bản demo' });
  });
  state.invoices.forEach(function (invoiceId) {
    const invoice = getRowById_('invoices', invoiceId);
    if (!invoice) return;
    const remaining = Number(invoice.final_amount || 0) - Number(invoice.paid_amount || 0);
    if (remaining > 0) {
      lockedSave_('payments', { invoice_id: invoiceId, payment_plan_id: '', payment_stage: 'tat_toan', payment_at: new Date(), amount: remaining, payment_method: 'bank_transfer', transaction_reference: 'DEMO-FINAL-' + invoiceId, receipt_url: '', received_by: owner, confirmed_by: owner, confirmed_at: new Date(), payment_status: 'confirmed', source_reference: 'Sao kê demo', note: '' });
    }
    lockedSave_('invoices', { invoice_id: invoiceId, paid_amount: Number(invoice.final_amount || 0), remaining_amount: 0, difference_amount: 0, invoice_status: 'paid' });
  });
  state.projects.forEach(function (projectId) {
    lockedSave_('projects', { project_id: projectId, project_status: 'completed' });
    lockedSave_('project_handoffs', { project_id: projectId, from_department_id: 'construction', to_department_id: 'warehouse', handoff_type: 'return_after_event', handoff_at: new Date(), handover_by: owner, received_by: owner, checklist_url: '', handoff_status: 'completed', missing_items: '', note: 'Đã thu dọn và hoàn kho' });
  });
  lockedSave_('customers', { customer_id: state.customer_id, customer_status: 'completed' });
}

function buildDemoResult_(scenario) {
  if (!scenario) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy kịch bản');
  const state = parseScenarioState_(scenario.scenario_json);
  return {
    scenario: scenario,
    state: state,
    project: state.primary_project_id ? getRowById_('projects', state.primary_project_id) : null,
    tasks: state.primary_project_id ? listRows_('project_tasks', { project_id: state.primary_project_id }, 200).rows : [],
    invoices: (state.invoices || []).map(function (id) { return getRowById_('invoices', id); }).filter(Boolean)
  };
}

function lockedSave_(entity, data) { return saveRow_(entity, data, { lockHeld: true }).record; }
function parseScenarioState_(json) { try { return json ? JSON.parse(json) : {}; } catch (e) { return {}; } }
function relativeDate_(base, offsetDays, hour) {
  const date = base instanceof Date ? new Date(base.getTime()) : new Date(base);
  date.setDate(date.getDate() + Number(offsetDays || 0));
  if (typeof hour === 'number') date.setHours(hour, 0, 0, 0);
  return date;
}

/**
 * Live acceptance suite. This intentionally creates records clearly marked
 * DEMO/ACCEPTANCE and never physically deletes business data.
 */
function runSystemAcceptanceTests(request) {
  requireSession_(request || {});
  setupSystem_();
  assertPermission_('demo_scenarios', 'create');
  const startedAt = new Date();
  const suffix = Utilities.formatDate(startedAt, APP.TIMEZONE, 'yyyyMMdd-HHmmss');
  const firstStage = createDemoScenario_({
    scenario_name: 'ACCEPTANCE ' + suffix,
    bride_name: 'Test ' + suffix,
    groom_name: 'ERP',
    event_date: Utilities.formatDate(new Date(startedAt.getTime() + 90 * 86400000), APP.TIMEZONE, 'yyyy-MM-dd'),
    service_type: 'hoi_truong'
  });
  const completed = runDemoAll_(firstStage.scenario.scenario_id);
  const state = completed.state || {};
  const projectId = state.primary_project_id;
  const projectTasks = listRows_('project_tasks', { project_id: projectId }, APP.MAX_LIST_ROWS).rows;
  if (!projectTasks.length) throw appError_('ACCEPTANCE_FAILED', 'Kịch bản không sinh công việc');

  const template = Object.assign({}, projectTasks[0]);
  ['task_id','created_at','created_by','updated_at','updated_by','deleted_at'].forEach(function (field) { delete template[field]; });
  template.task_name = 'ACCEPTANCE CRUD ' + suffix;
  template.task_status = 'todo';
  template.progress_percent = 0;
  template.actual_start_at = '';
  template.actual_end_at = '';
  const createdTask = saveRow_('project_tasks', template).record;
  const updatedTask = saveRow_('project_tasks', { task_id: createdTask.task_id, task_status: 'in_progress', progress_percent: 35, actual_start_at: new Date() }).record;
  const deletedTask = softDeleteRow_('project_tasks', createdTask.task_id);
  const storedDeletedTask = getRowById_('project_tasks', createdTask.task_id);

  const invoices = (state.invoices || []).map(function (id) { return getRowById_('invoices', id); }).filter(Boolean);
  const projects = listRows_('projects', { customer_id: state.customer_id }, APP.MAX_LIST_ROWS).rows;
  const resources = listRows_('task_resources', {}, APP.MAX_LIST_ROWS).rows.filter(function (row) { return state.tasks.indexOf(row.task_id) >= 0; });
  const assignments = listRows_('task_assignments', {}, APP.MAX_LIST_ROWS).rows.filter(function (row) { return state.tasks.indexOf(row.task_id) >= 0; });
  const auditRows = listRows_('audit_logs', { record_id: createdTask.task_id }, APP.MAX_LIST_ROWS).rows;
  const viewer = getPermissionMap_({ role_code: 'viewer' });
  const accounting = getPermissionMap_({ role_code: 'accounting' });
  const sheetTimezone = db_().getSpreadsheetTimeZone();
  const timezoneAliases = ['Asia/Ho_Chi_Minh', 'Asia/Saigon'];

  const checks = {
    six_stages_completed: Number(completed.scenario.current_stage_order) === 6 && completed.scenario.scenario_status === 'completed',
    one_customer_two_projects: projects.length >= 2 && projects.some(function (p) { return p.service_type === 'tu_gia_cuoi'; }) && projects.some(function (p) { return p.service_type === 'hoi_truong'; }),
    linked_operations: projectTasks.every(function (task) { return !!task.project_id && !!task.project_department_id && !!task.department_id; }) && resources.length > 0 && assignments.length > 0,
    crud_create_update: updatedTask.task_status === 'in_progress' && Number(updatedTask.progress_percent) === 35,
    soft_delete: deletedTask.deleted === true && !!storedDeletedTask.deleted_at,
    debt_paid: invoices.length >= 2 && invoices.every(function (invoice) { return invoice.invoice_status === 'paid' && Number(invoice.remaining_amount) === 0 && Number(invoice.paid_amount) === Number(invoice.final_amount); }),
    audit_create_update_delete: ['create','update','delete'].every(function (action) { return auditRows.some(function (row) { return row.action_type === action; }); }),
    permissions: !!(viewer['*'] && viewer['*'].view && !viewer['*'].create && viewer.audit_logs && !viewer.audit_logs.view && accounting.payments && accounting.payments.create),
    timezone: timezoneAliases.indexOf(sheetTimezone) >= 0 && APP.TIMEZONE === 'Asia/Ho_Chi_Minh'
  };
  const failed = Object.keys(checks).filter(function (key) { return !checks[key]; });
  return {
    ok: failed.length === 0,
    started_at: Utilities.formatDate(startedAt, APP.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    finished_at: Utilities.formatDate(new Date(), APP.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    spreadsheet_id: APP.SPREADSHEET_ID,
    spreadsheet_timezone: sheetTimezone,
    scenario_id: completed.scenario.scenario_id,
    customer_id: state.customer_id,
    project_ids: state.projects,
    invoice_ids: state.invoices,
    crud_task_id: createdTask.task_id,
    checks: checks,
    failed_checks: failed
  };
}
