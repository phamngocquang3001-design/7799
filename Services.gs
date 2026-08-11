var REQUEST_USER_ = null;

const MASTER_SEED = [
  ['lead_status','new','Mới'], ['lead_status','qualified','Đã lọc'], ['lead_status','contacted','Đã liên hệ'], ['lead_status','converted','Đã chuyển đổi'], ['lead_status','lost','Không phù hợp'],
  ['consultation_status','new','Chưa tư vấn'], ['consultation_status','consulting','Đang tư vấn'], ['consultation_status','quotation_sent','Đã gửi báo giá'], ['consultation_status','won','Đã chốt'], ['consultation_status','lost','Không chốt'],
  ['customer_status','active','Đang phục vụ'], ['customer_status','completed','Hoàn tất'], ['customer_status','inactive','Ngừng'],
  ['project_status','planning','Lập kế hoạch'], ['project_status','designing','Đang thiết kế'], ['project_status','production','Đang sản xuất'], ['project_status','ready','Sẵn sàng thi công'], ['project_status','in_progress','Đang triển khai'], ['project_status','completed','Hoàn tất'], ['project_status','cancelled','Đã hủy'],
  ['task_status','todo','Chưa làm'], ['task_status','in_progress','Đang làm'], ['task_status','review','Chờ kiểm tra'], ['task_status','done','Hoàn thành'], ['task_status','cancelled','Đã hủy'],
  ['priority','low','Thấp'], ['priority','medium','Trung bình'], ['priority','high','Cao'], ['priority','urgent','Khẩn cấp'],
  ['invoice_status','unpaid','Chưa thanh toán'], ['invoice_status','partial','Thanh toán một phần'], ['invoice_status','paid','Đã thanh toán'], ['invoice_status','overdue','Quá hạn'],
  ['payment_status','pending','Chờ xác nhận'], ['payment_status','confirmed','Đã xác nhận'], ['payment_status','rejected','Từ chối'],
  ['payment_stage','coc_chot_lich','Cọc chốt lịch'], ['payment_stage','coc_lan_1','Cọc lần 1'], ['payment_stage','coc_lan_2','Cọc lần 2'], ['payment_stage','tat_toan','Tất toán'], ['payment_stage','phat_sinh','Phát sinh'], ['payment_stage','hoan_tien','Hoàn tiền'],
  ['payment_method','bank_transfer','Chuyển khoản'], ['payment_method','cash','Tiền mặt'], ['payment_method','card','Thẻ'],
  ['resource_status','not_prepared','Chưa chuẩn bị'], ['resource_status','prepared','Đã chuẩn bị'], ['resource_status','issued','Đã cấp'], ['resource_status','missing','Thiếu'],
  ['resource_category','material','Nguyên vật liệu'], ['resource_category','accessory','Phụ kiện'], ['resource_category','paint','Sơn'], ['resource_category','cnc','CNC/Chữ'], ['resource_category','print','In ấn'], ['resource_category','flower_material','Hoa'], ['resource_category','flower_tool','CCDC hoa'],
  ['event_session','morning','Sáng'], ['event_session','afternoon','Chiều'], ['event_session','evening','Tối'], ['event_session','full_day','Cả ngày'],
  ['complexity_level','standard','Tiêu chuẩn'], ['complexity_level','complex','Phức tạp'], ['complexity_level','premium','Cao cấp'],
  ['user_status','active','Hoạt động'], ['user_status','inactive','Ngừng hoạt động']
];

function setupSystem_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureAuthInfrastructure_(true);
    ensureSheetColumns_('invoices', ['subtotal_amount','tax_rate','tax_amount']);
    const spreadsheet = db_();
    if (spreadsheet.getSpreadsheetTimeZone() !== APP.TIMEZONE) spreadsheet.setSpreadsheetTimeZone(APP.TIMEZONE);
    ensureContractsSheet_();
    ensureLeadExtensionSheets_();
    ensureDemoSheet_();
    seedMasterData_();
    seedDepartments_();
    seedPermissions_(true);
    ensureContractPermissions_(true);
    ensureLeadExtensionPermissions_(true);
    ensureCustomerHubPermissions_(true);
    seedTaskTemplates_(true);
    deduplicateTaskTemplates_();
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------
// Xác thực nội bộ: mật khẩu chỉ lưu dưới dạng dẫn xuất có salt; phiên đăng nhập
// lưu bằng hash trong Sheet, còn token thô chỉ tồn tại ở trình duyệt người dùng.
// -----------------------------------------------------------------------------

function ensureAuthInfrastructure_(lockHeld) {
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(30000);
  try {
    ensureSheetColumns_('users', ['password_hash','password_salt','must_change_password','failed_login_count','locked_until']);
    let sheet = db_().getSheetByName(APP.AUTH_SHEET);
    if (!sheet) {
      sheet = db_().insertSheet(APP.AUTH_SHEET);
      const headers = ['session_id','token_hash','user_id','created_at','expires_at','last_seen_at','revoked_at'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#123f3a').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setHiddenGridlines(true);
      sheet.hideSheet();
    }
    CacheService.getScriptCache().remove('headers:' + APP.AUTH_SHEET);
  } finally {
    if (lock) lock.releaseLock();
  }
}

function ensureSheetColumns_(sheetName, requiredHeaders) {
  const sheet = sheet_(sheetName);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String);
  const missing = requiredHeaders.filter(function (header) { return headers.indexOf(header) < 0; });
  if (!missing.length) return;
  sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  sheet.getRange(1, headers.length + 1, 1, missing.length).setBackground('#123f3a').setFontColor('#ffffff').setFontWeight('bold');
  CacheService.getScriptCache().remove('headers:' + sheetName);
}

function getLoginState() {
  return handleApi_(function () {
    ensureAuthInfrastructure_();
    return { needs_setup: listRows_('users', {}, 1).total === 0, session_days: APP.AUTH_SESSION_DAYS };
  });
}

function initializeAdmin(request) {
  return handleApi_(function () {
    request = request || {};
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      ensureAuthInfrastructure_(true);
      if (listRows_('users', {}, 1).total) throw appError_('SETUP_COMPLETED', 'Hệ thống đã có tài khoản quản trị');
      validatePassword_(request.password);
      const email = String(request.email || '').trim().toLowerCase();
      const fullName = String(request.full_name || '').trim();
      if (!email || !fullName) throw appError_('VALIDATION_ERROR', 'Cần nhập họ tên và email quản trị');
      const salt = Utilities.getUuid();
      REQUEST_USER_ = { user_id: 'system_admin', email: email, full_name: fullName, role_code: 'admin', department_id: '', user_status: 'active' };
      const result = saveRow_('users', {
        email: email, full_name: fullName, phone: '', department_id: '', role_code: 'admin', user_status: 'active',
        password_salt: salt, password_hash: derivePasswordHash_(String(request.password), salt), must_change_password: false,
        failed_login_count: 0, locked_until: ''
      }, { lockHeld: true });
      REQUEST_USER_ = result.record;
      return issueSession_(result.record);
    } finally {
      REQUEST_USER_ = null;
      lock.releaseLock();
    }
  });
}

function loginApp(request) {
  return handleApi_(function () {
    ensureAuthInfrastructure_();
    request = request || {};
    const requestId = String(request._request_id || Utilities.getUuid());
    const email = String(request.email || '').trim().toLowerCase();
    const password = String(request.password || '');
    console.log(JSON.stringify({ event: 'login_start', request_id: requestId, email: email, at: new Date().toISOString() }));
    if (!email || !password) throw appError_('LOGIN_REQUIRED', 'Vui lòng nhập email và mật khẩu');
    const users = listRows_('users', {}, APP.MAX_LIST_ROWS).rows;
    const user = users.filter(function (row) { return String(row.email || '').trim().toLowerCase() === email; })[0];
    if (!user || user.user_status !== 'active' || user.deleted_at) throw appError_('LOGIN_FAILED', 'Email hoặc mật khẩu không đúng');
    if (user.locked_until && dateValue_(user.locked_until) > Date.now()) throw appError_('ACCOUNT_LOCKED', 'Tài khoản đang tạm khóa. Vui lòng thử lại sau 15 phút');
    const valid = user.password_hash && constantTimeEquals_(derivePasswordHash_(password, String(user.password_salt || '')), String(user.password_hash));
    if (!valid) {
      const failures = Number(user.failed_login_count || 0) + 1;
      updateUserAuthFields_(user.user_id, { failed_login_count: failures, locked_until: failures >= 5 ? new Date(Date.now() + 15 * 60000) : '' });
      console.warn(JSON.stringify({ event: 'login_failed', request_id: requestId, email: email, failure_count: failures }));
      throw appError_('LOGIN_FAILED', 'Email hoặc mật khẩu không đúng');
    }
    updateUserAuthFields_(user.user_id, { failed_login_count: 0, locked_until: '', last_login_at: new Date() });
    user.failed_login_count = 0;
    user.locked_until = '';
    user.last_login_at = new Date();
    console.log(JSON.stringify({ event: 'login_success', request_id: requestId, user_id: user.user_id, role_code: user.role_code }));
    return issueSession_(user);
  });
}

function resumeAppSession(request) {
  return handleApi_(function () {
    const user = requireSession_(request || {});
    return { authenticated: true, user: sanitizeUser_(user), must_change_password: !!user.must_change_password };
  });
}

function logoutApp(request) {
  return handleApi_(function () {
    ensureAuthInfrastructure_();
    const located = findAuthSession_(String((request || {}).session_token || (request || {})._session_token || ''));
    if (located) located.sheet.getRange(located.rowIndex, 7).setValue(new Date());
    REQUEST_USER_ = null;
    return { logged_out: true };
  });
}

function changeMyPassword(request) {
  return handleApi_(function () {
    request = request || {};
    const user = requireSession_(request);
    validatePassword_(request.new_password);
    if (!constantTimeEquals_(derivePasswordHash_(String(request.current_password || ''), String(user.password_salt || '')), String(user.password_hash || ''))) {
      throw appError_('LOGIN_FAILED', 'Mật khẩu hiện tại không đúng');
    }
    const salt = Utilities.getUuid();
    updateUserAuthFields_(user.user_id, { password_salt: salt, password_hash: derivePasswordHash_(String(request.new_password), salt), must_change_password: false, failed_login_count: 0, locked_until: '' });
    return { changed: true };
  });
}

function requireSession_(request) {
  ensureAuthInfrastructure_();
  const token = String((request || {}).session_token || (request || {})._session_token || '');
  const located = findAuthSession_(token);
  if (!located) throw appError_('AUTH_REQUIRED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
  const session = rowToObject_(located.headers, located.values);
  if (session.revoked_at || dateValue_(session.expires_at) <= Date.now()) throw appError_('AUTH_EXPIRED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
  const user = getRowById_('users', session.user_id);
  if (!user || user.user_status !== 'active' || user.deleted_at) throw appError_('ACCESS_DENIED', 'Tài khoản đã bị khóa hoặc ngừng hoạt động');
  if (!session.last_seen_at || Date.now() - dateValue_(session.last_seen_at) > 60 * 60000) located.sheet.getRange(located.rowIndex, 6).setValue(new Date());
  REQUEST_USER_ = user;
  return user;
}

function issueSession_(user) {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const now = new Date();
  const expires = new Date(now.getTime() + APP.AUTH_SESSION_DAYS * 86400000);
  const sheet = sheet_(APP.AUTH_SHEET);
  const headers = headers_(APP.AUTH_SHEET);
  const row = objectToRow_(headers, { session_id: Utilities.getUuid(), token_hash: tokenHash_(token), user_id: user.user_id, created_at: now, expires_at: expires, last_seen_at: now, revoked_at: '' });
  sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, headers.length).setValues([row]);
  return { authenticated: true, session_token: token, expires_at: serializeValue_(expires), user: sanitizeUser_(user), must_change_password: !!user.must_change_password };
}

function findAuthSession_(token) {
  if (!token) return null;
  const sheet = sheet_(APP.AUTH_SHEET);
  const headers = headers_(APP.AUTH_SHEET);
  const tokenColumn = headers.indexOf('token_hash');
  if (tokenColumn < 0 || sheet.getLastRow() < 2) return null;
  const finder = sheet.getRange(2, tokenColumn + 1, sheet.getLastRow() - 1, 1).createTextFinder(tokenHash_(token)).matchEntireCell(true).findNext();
  if (!finder) return null;
  const rowIndex = finder.getRow();
  return { sheet: sheet, headers: headers, rowIndex: rowIndex, values: sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0] };
}

function updateUserAuthFields_(userId, patch) {
  const located = findRowByValue_('users', 'user_id', userId);
  if (!located) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy nhân viên');
  const row = objectToRow_(located.headers, Object.assign({ updated_at: new Date(), updated_by: userId }, patch || {}), located.values);
  located.sheet.getRange(located.rowIndex, 1, 1, located.headers.length).setValues([row]);
  clearCaches_('users');
}

function prepareUserCredentials_(data, creating) {
  data = Object.assign({}, data || {});
  const password = String(data.temporary_password || data.new_password || '');
  delete data.temporary_password;
  delete data.new_password;
  if (creating && !password) throw appError_('VALIDATION_ERROR', 'Cần nhập mật khẩu tạm cho nhân viên mới');
  if (password) {
    validatePassword_(password);
    const salt = Utilities.getUuid();
    data.password_salt = salt;
    data.password_hash = derivePasswordHash_(password, salt);
    data.must_change_password = true;
    data.failed_login_count = 0;
    data.locked_until = '';
  }
  data.email = String(data.email || '').trim().toLowerCase();
  data.role_code = data.role_code || 'viewer';
  data.user_status = data.user_status || 'active';
  return data;
}

function validatePassword_(password) {
  password = String(password || '');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw appError_('WEAK_PASSWORD', 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số');
}

function authSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('AUTH_PEPPER');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('AUTH_PEPPER', secret);
  }
  return secret;
}

function derivePasswordHash_(password, salt) {
  let value = String(password || '') + '|' + String(salt || '');
  const secret = authSecret_();
  for (let i = 0; i < APP.PASSWORD_ITERATIONS; i++) {
    value = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value + '|' + i, secret, Utilities.Charset.UTF_8));
  }
  return value;
}

function tokenHash_(token) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token || ''), Utilities.Charset.UTF_8));
}

function constantTimeEquals_(left, right) {
  left = String(left || ''); right = String(right || '');
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) diff |= (left.charCodeAt(i % Math.max(left.length, 1)) || 0) ^ (right.charCodeAt(i % Math.max(right.length, 1)) || 0);
  return diff === 0;
}

function sanitizeUser_(user) {
  const safe = Object.assign({}, user || {});
  ['password_hash','password_salt','failed_login_count','locked_until'].forEach(function (field) { delete safe[field]; });
  Object.keys(safe).forEach(function (field) { safe[field] = serializeValue_(safe[field]); });
  return safe;
}

function ensureDemoSheet_() {
  const spreadsheet = db_();
  if (spreadsheet.getSheetByName(APP.DEMO_SHEET)) return;
  const sheet = spreadsheet.insertSheet(APP.DEMO_SHEET);
  const headers = ['scenario_id','scenario_name','current_stage','current_stage_order','scenario_status','bride_name','groom_name','event_date','service_type','scenario_json','created_at','created_by','updated_at','updated_by','deleted_at'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#0f766e').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);
  CacheService.getScriptCache().remove('headers:' + APP.DEMO_SHEET);
}

function ensureContractsSheet_() {
  const spreadsheet = db_();
  if (spreadsheet.getSheetByName('contracts')) return;
  const sheet = spreadsheet.insertSheet('contracts');
  const headers = CONTRACT_SCHEMA.map(function (field) { return field.field_name; });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#123f3a').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);
  CacheService.getScriptCache().remove('headers:contracts');
  CacheService.getScriptCache().remove('data_dictionary');
}

function leadExtensionSchema_(entity) {
  return (LEAD_EXTENSION_SCHEMAS[entity] || []).map(function (field) {
    return { sheet_name: entity, purpose: entity === 'lead_attachments' ? 'File và đường dẫn đính kèm của Lead' : 'Lịch sử ghi chú của Lead', field_name: field[0], data_type: field[1], required: field[2], description: field[3], foreign_key: field[4] };
  });
}

function ensureLeadExtensionSheets_() {
  let created = false;
  Object.keys(LEAD_EXTENSION_SCHEMAS).forEach(function (entity) {
    if (db_().getSheetByName(entity)) return;
    const sheet = db_().insertSheet(entity);
    const headers = LEAD_EXTENSION_SCHEMAS[entity].map(function (field) { return field[0]; });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#123f3a').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setHiddenGridlines(true);
    CacheService.getScriptCache().remove('headers:' + entity);
    created = true;
  });
  if (created) CacheService.getScriptCache().remove('data_dictionary');
}

function seedMasterData_() {
  const existing = listRows_('master_data', {}, 500).rows;
  const keys = {};
  let maxNumber = 0;
  existing.forEach(function (row) {
    keys[row.category + '|' + row.code] = true;
    const number = Number(String(row.master_data_id || '').replace(/\D/g, ''));
    if (number > maxNumber) maxNumber = number;
  });
  const additions = [];
  MASTER_SEED.forEach(function (seed, index) {
    const key = seed[0] + '|' + seed[1];
    if (keys[key]) return;
    maxNumber += 1;
    additions.push({
      master_data_id: 'MD' + String(maxNumber).padStart(4, '0'), category: seed[0], code: seed[1], label_vi: seed[2],
      parent_code: '', sort_order: (index + 1) * 10, is_active: true, description: 'Danh mục hệ thống SPA'
    });
  });
  appendRowsBatch_('master_data', additions);
}

function seedDepartments_() {
  if (listRows_('departments', {}, 20).total) return;
  const rows = [
    ['sales','SALE','Kinh doanh'], ['accounting','KT','Kế toán'], ['design','TK','Thiết kế'], ['production','SX','Sản xuất'],
    ['warehouse','KHO','Kho'], ['logistics','HC','Hậu cần'], ['flower','HOA','Team Hoa'], ['construction','TC','Thi công']
  ].map(function (item) { return { department_id: item[0], department_code: item[1], department_name: item[2], leader_user_id: '', is_active: true, note: '' }; });
  appendRowsBatch_('departments', rows);
}

function seedPermissions_(lockHeld) {
  if (listRows_('role_permissions', {}, 20).total) return;
  const definitions = [
    ['admin','*',true,true,true,true,'all'],
    ['manager','*',true,true,true,false,'all'],
    ['sales','leads',true,true,true,false,'own'], ['sales','sales_opportunities',true,true,true,false,'own'], ['sales','customers',true,true,true,false,'own'], ['sales','projects',true,true,true,false,'own'], ['sales','contracts',true,false,false,false,'own'], ['sales','invoices',true,false,false,false,'own'],
    ['accounting','contracts',true,true,true,false,'all'], ['accounting','invoices',true,true,true,false,'all'], ['accounting','payments',true,true,true,false,'all'], ['accounting','payment_plans',true,true,true,false,'all'],
    ['operator','projects',true,false,false,false,'department'], ['operator','project_tasks',true,true,true,false,'department'], ['operator','task_resources',true,true,true,false,'department'],
    ['viewer','*',true,false,false,false,'all']
  ];
  const ids = nextIds_('permission', 'Q', definitions.length, lockHeld);
  appendRowsBatch_('role_permissions', definitions.map(function (item, index) { return {
    permission_id: ids[index], role_code: item[0], resource_code: item[1], can_view: item[2], can_create: item[3], can_update: item[4], can_delete: item[5], data_scope: item[6], is_active: true
  }; }));
}

function ensureContractPermissions_(lockHeld) {
  const existing = listRows_('role_permissions', { resource_code: 'contracts' }, APP.MAX_LIST_ROWS).rows;
  const roles = {};
  existing.forEach(function (row) { roles[row.role_code] = true; });
  const definitions = [
    ['sales','contracts',true,false,false,false,'own'],
    ['accounting','contracts',true,true,true,false,'all']
  ].filter(function (item) { return !roles[item[0]]; });
  if (!definitions.length) return;
  const ids = nextIds_('permission', 'Q', definitions.length, lockHeld);
  appendRowsBatch_('role_permissions', definitions.map(function (item, index) { return {
    permission_id: ids[index], role_code: item[0], resource_code: item[1], can_view: item[2], can_create: item[3], can_update: item[4], can_delete: item[5], data_scope: item[6], is_active: true
  }; }));
}

function ensureLeadExtensionPermissions_(lockHeld) {
  const definitions = [
    ['sales','lead_attachments',true,true,true,true,'own'], ['sales','lead_notes',true,true,true,true,'own'],
    ['sales','sales_activities',true,true,true,false,'own'], ['sales','surveys',true,true,true,false,'own'],
    ['sales','quotations',true,true,true,false,'own'], ['sales','quotation_items',true,true,true,false,'own'],
    ['operator','surveys',true,false,true,false,'own']
  ];
  const existing = listRows_('role_permissions', {}, APP.MAX_LIST_ROWS).rows;
  const keys = {};
  existing.forEach(function (row) { keys[row.role_code + '|' + row.resource_code] = true; });
  const additions = definitions.filter(function (item) { return !keys[item[0] + '|' + item[1]]; });
  if (!additions.length) return;
  const ids = nextIds_('permission', 'Q', additions.length, lockHeld);
  appendRowsBatch_('role_permissions', additions.map(function (item, index) { return {
    permission_id: ids[index], role_code: item[0], resource_code: item[1], can_view: item[2], can_create: item[3], can_update: item[4], can_delete: item[5], data_scope: item[6], is_active: true
  }; }));
}

function ensureCustomerHubPermissions_(lockHeld) {
  const definitions = [
    ['sales','customer_contacts',true,true,true,false,'own'], ['sales','invoice_items',true,false,false,false,'own'],
    ['sales','payments',true,false,false,false,'own'], ['sales','payment_plans',true,false,false,false,'own'], ['sales','task_assignments',true,false,false,false,'own'],
    ['accounting','customers',true,false,false,false,'all'], ['accounting','customer_contacts',true,false,false,false,'all'],
    ['accounting','projects',true,false,false,false,'all'], ['accounting','quotations',true,false,false,false,'all'],
    ['accounting','invoice_items',true,true,true,false,'all']
  ];
  const existing = listRows_('role_permissions', {}, APP.MAX_LIST_ROWS).rows;
  const keys = {};
  existing.forEach(function (row) { keys[row.role_code + '|' + row.resource_code] = true; });
  const additions = definitions.filter(function (item) { return !keys[item[0] + '|' + item[1]]; });
  if (!additions.length) return;
  const ids = nextIds_('permission', 'Q', additions.length, lockHeld);
  appendRowsBatch_('role_permissions', additions.map(function (item, index) { return {
    permission_id: ids[index], role_code: item[0], resource_code: item[1], can_view: item[2], can_create: item[3], can_update: item[4], can_delete: item[5], data_scope: item[6], is_active: true
  }; }));
}

function seedTaskTemplates_(lockHeld) {
  if (listRows_('task_templates', {}, 20).total) return;
  const templates = [
    ['design','Thiết kế','proposal','Lên Proposal & moodboard',-45,5,'high'],
    ['design','Thiết kế','revision','Chỉnh sửa và chốt thiết kế',-38,7,'high'],
    ['production','Sản xuất','production_plan','Bóc tách kế hoạch sản xuất',-30,3,'high'],
    ['production','Sản xuất','production','Gia công hạng mục',-25,15,'high'],
    ['warehouse','Kho','material_plan','Chuẩn bị vật tư và phụ kiện',-15,8,'medium'],
    ['flower','Hoa','flower_plan','Chốt danh sách hoa và CCDC',-10,5,'high'],
    ['logistics','Hậu cần','logistics_plan','Lập kế hoạch xe và nhân lực',-7,3,'high'],
    ['construction','Thi công','precheck','Kiểm tra trước khi xuất kho',-2,1,'urgent'],
    ['construction','Thi công','setup','Thi công lắp đặt tại địa điểm',-1,1,'urgent'],
    ['construction','Thi công','event_support','Trực sự kiện',0,1,'urgent'],
    ['logistics','Hậu cần','dismantle','Thu dọn và hoàn kho',1,1,'high'],
    ['accounting','Kế toán','settlement','Đối soát và tất toán',2,3,'high']
  ];
  const ids = nextIds_('task_template', 'MCV', templates.length, lockHeld);
  appendRowsBatch_('task_templates', templates.map(function (item, index) { return {
      task_template_id: ids[index],
      service_type: '*', department_id: item[0], parent_template_id: '', task_group: item[1], task_type: item[2], task_name: item[3],
      task_detail_template: 'Tự động tạo từ mẫu vận hành chuẩn', start_offset_days: item[4], duration_days: item[5], priority: item[6],
      is_required: true, is_active: true, note: 'Mẫu mặc định cho SPA'
  }; }));
}

function deduplicateTaskTemplates_() {
  const sheet = sheet_('task_templates');
  const headers = headers_('task_templates');
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return 0;
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const seen = {};
  const user = getCurrentUser_();
  const now = new Date();
  let changed = 0;
  values.forEach(function (row, index) {
    const record = rowToObject_(headers, row);
    if (record.deleted_at || record.is_active === false || String(record.is_active).toLowerCase() === 'false') return;
    const key = [record.service_type, record.department_id, record.task_type, record.task_name, record.start_offset_days, record.duration_days].map(String).join('|');
    if (!seen[key]) {
      seen[key] = record.task_template_id;
      return;
    }
    values[index] = objectToRow_(headers, { is_active: false, updated_at: now, updated_by: user.user_id, note: 'Vô hiệu hóa mẫu trùng do setup đồng thời; giữ bản ' + seen[key] }, row);
    changed += 1;
  });
  if (changed) {
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    clearCaches_('task_templates');
  }
  return changed;
}

function getDataDictionary_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('data_dictionary');
  if (cached) {
    const parsed = JSON.parse(cached);
    parsed.contracts = CONTRACT_SCHEMA.slice();
    Object.keys(LEAD_EXTENSION_SCHEMAS).forEach(function (entity) { parsed[entity] = leadExtensionSchema_(entity); });
    parsed.invoices = parsed.invoices || [];
    INVOICE_EXTENSION_SCHEMA.forEach(function (field) { if (!parsed.invoices.some(function (item) { return item.field_name === field.field_name; })) parsed.invoices.push(field); });
    return parsed;
  }
  const sheet = sheet_('data_dictionary');
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const headers = values[0].map(String);
  const result = {};
  values.slice(1).forEach(function (row) {
    const record = rowToObject_(headers, row);
    if (!record.sheet_name || !record.field_name) return;
    if (!result[record.sheet_name]) result[record.sheet_name] = [];
    result[record.sheet_name].push(record);
  });
  result.contracts = CONTRACT_SCHEMA.slice();
  Object.keys(LEAD_EXTENSION_SCHEMAS).forEach(function (entity) { result[entity] = leadExtensionSchema_(entity); });
  result.invoices = result.invoices || [];
  INVOICE_EXTENSION_SCHEMA.forEach(function (field) { if (!result.invoices.some(function (item) { return item.field_name === field.field_name; })) result.invoices.push(field); });
  const json = JSON.stringify(result);
  if (json.length < 95000) cache.put('data_dictionary', json, APP.CACHE_SECONDS);
  return result;
}

function getMasterDataMap_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('master_data_map');
  if (cached) return JSON.parse(cached);
  const rows = listRows_('master_data', { is_active: true }, 500).rows;
  const result = {};
  rows.forEach(function (row) {
    if (!result[row.category]) result[row.category] = [];
    result[row.category].push({ code: row.code, label: row.label_vi, parent_code: row.parent_code || '' });
  });
  cache.put('master_data_map', JSON.stringify(result), APP.CACHE_SECONDS);
  return result;
}

function getCurrentUser_() {
  if (REQUEST_USER_) return REQUEST_USER_;
  let email = '';
  let identityError = null;
  try {
    email = Session.getEffectiveUser().getEmail() || '';
  } catch (error) {
    identityError = error;
  }
  if (!email) {
    try {
      email = Session.getActiveUser().getEmail() || '';
    } catch (error) {
      identityError = identityError || error;
    }
  }
  if (!email && identityError) throw identityError;
  const users = listRows_('users', {}, 500).rows;
  const match = users.filter(function (user) { return String(user.email || '').toLowerCase() === email.toLowerCase(); })[0];
  if (match) return match;
  if (!users.length) return { user_id: 'system_admin', email: email, full_name: email || 'Quản trị khởi tạo', role_code: 'admin', department_id: '', user_status: 'active', bootstrap: true };
  return { user_id: 'anonymous', email: email, full_name: email || 'Chưa xác định', role_code: 'viewer', department_id: '', user_status: 'inactive' };
}

function getPermissionMap_(user) {
  if (user.role_code === 'admin') return { '*': { view: true, create: true, update: true, delete: true, scope: 'all' } };
  const rows = listRows_('role_permissions', { role_code: user.role_code, is_active: true }, 500).rows;
  const result = {};
  rows.forEach(function (row) {
    result[row.resource_code] = { view: !!row.can_view, create: !!row.can_create, update: !!row.can_update, delete: !!row.can_delete, scope: row.data_scope || 'all' };
  });
  const personalRows = listRows_('role_permissions', { role_code: 'user:' + user.user_id, is_active: true }, 500).rows;
  personalRows.forEach(function (row) {
    result[row.resource_code] = { view: !!row.can_view, create: !!row.can_create, update: !!row.can_update, delete: !!row.can_delete, scope: row.data_scope || 'all', personal: true };
  });
  if (user.role_code === 'manager') result.audit_logs = { view: true, create: false, update: false, delete: false, scope: 'all' };
  else result.audit_logs = { view: false, create: false, update: false, delete: false, scope: 'all' };
  return result;
}

function getEmployeePermissions_(userId) {
  assertPermission_('users', 'update');
  const employee = getRowById_('users', String(userId || ''));
  if (!employee) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy nhân viên');
  const baseRows = listRows_('role_permissions', { role_code: employee.role_code, is_active: true }, 500).rows;
  const personalRows = listRows_('role_permissions', { role_code: 'user:' + employee.user_id, is_active: true }, 500).rows;
  const base = {};
  const personal = {};
  baseRows.forEach(function (row) { base[row.resource_code] = row; });
  personalRows.forEach(function (row) { personal[row.resource_code] = row; });
  return {
    user: sanitizeUser_(employee),
    protected_admin: employee.role_code === 'admin',
    modules: PERMISSION_MODULES.map(function (module) {
      const inherited = base[module[0]] || base['*'] || {};
      const override = employee.role_code === 'admin' ? null : (personal[module[0]] || null);
      const effective = override || inherited;
      return {
        resource_code: module[0], label: module[1], group: module[2], overridden: !!override,
        can_view: !!effective.can_view, can_create: !!effective.can_create, can_update: !!effective.can_update, can_delete: !!effective.can_delete,
        data_scope: effective.data_scope || 'all'
      };
    })
  };
}

function saveEmployeePermissions_(userId, rules) {
  assertPermission_('users', 'update');
  assertPermission_('role_permissions', 'update');
  const employee = getRowById_('users', String(userId || ''));
  if (!employee) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy nhân viên');
  if (employee.role_code === 'admin') throw appError_('PROTECTED_ADMIN', 'Tài khoản quản trị luôn có toàn quyền và không nhận giới hạn cá nhân');
  const allowed = {};
  PERMISSION_MODULES.forEach(function (module) { allowed[module[0]] = true; });
  const roleCode = 'user:' + employee.user_id;
  const existing = listRows_('role_permissions', { role_code: roleCode }, 500).rows;
  const byResource = {};
  existing.forEach(function (row) { byResource[row.resource_code] = row; });
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    (rules || []).forEach(function (rule) {
      const resource = String(rule.resource_code || '');
      if (!allowed[resource]) return;
      const current = byResource[resource] || {};
      saveRow_('role_permissions', {
        permission_id: current.permission_id || '', role_code: roleCode, resource_code: resource,
        can_view: !!rule.can_view, can_create: !!rule.can_create, can_update: !!rule.can_update, can_delete: !!rule.can_delete,
        data_scope: ['all','own','department'].indexOf(rule.data_scope) >= 0 ? rule.data_scope : 'all', is_active: true
      }, { lockHeld: true });
    });
  } finally {
    lock.releaseLock();
  }
  return getEmployeePermissions_(employee.user_id);
}

function revokeUserSessions_(userId) {
  const sheet = sheet_(APP.AUTH_SHEET);
  const headers = headers_(APP.AUTH_SHEET);
  const userColumn = headers.indexOf('user_id');
  const revokedColumn = headers.indexOf('revoked_at');
  if (userColumn < 0 || revokedColumn < 0 || sheet.getLastRow() < 2) return;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  let changed = false;
  values.forEach(function (row) {
    if (String(row[userColumn]) === String(userId) && !row[revokedColumn]) { row[revokedColumn] = new Date(); changed = true; }
  });
  if (changed) sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function permissionRule_(entity, user) {
  const permissions = getPermissionMap_(user);
  return permissions[entity] || permissions['*'] || null;
}

function assertPermission_(entity, action) {
  const user = getCurrentUser_();
  if (user.user_status !== 'active') throw appError_('ACCESS_DENIED', 'Tài khoản chưa được cấp quyền sử dụng');
  const rule = permissionRule_(entity, user);
  if (!rule || !rule[action]) throw appError_('ACCESS_DENIED', 'Không có quyền ' + action + ' dữ liệu ' + entity);
}

function applyDataScopeFilters_(entity, filters, user) {
  const scoped = Object.assign({}, filters || {});
  const rule = permissionRule_(entity, user);
  if (!rule || rule.scope === 'all') return scoped;
  const ownerFields = {
    leads: 'assigned_sales_id', sales_opportunities: 'sales_id', sales_activities: 'sales_id',
    projects: 'sales_id', invoices: 'sales_id'
  };
  if (rule.scope === 'own' && ownerFields[entity]) scoped[ownerFields[entity]] = user.user_id;
  if (rule.scope === 'own' && entity === 'customers') {
    scoped.opportunity_id = listRows_('sales_opportunities', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.opportunity_id; });
  }
  if (rule.scope === 'own' && entity === 'contracts') {
    scoped.project_id = listRows_('projects', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.project_id; });
  }
  if (rule.scope === 'own' && (entity === 'lead_attachments' || entity === 'lead_notes')) {
    scoped.lead_id = listRows_('leads', { assigned_sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.lead_id; });
  }
  if (rule.scope === 'own' && (entity === 'surveys' || entity === 'quotations')) {
    if (entity === 'surveys') scoped.surveyor_id = user.user_id;
    else scoped.opportunity_id = listRows_('sales_opportunities', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.opportunity_id; });
  }
  if (rule.scope === 'own' && entity === 'quotation_items') {
    const opportunityIds = listRows_('sales_opportunities', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.opportunity_id; });
    scoped.quotation_id = listRows_('quotations', { opportunity_id: opportunityIds }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.quotation_id; });
  }
  if (rule.scope === 'own' && entity === 'customer_contacts') {
    const opportunityIds = listRows_('sales_opportunities', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.opportunity_id; });
    scoped.customer_id = listRows_('customers', { opportunity_id: opportunityIds }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.customer_id; });
  }
  if (rule.scope === 'own' && (entity === 'payments' || entity === 'invoice_items' || entity === 'payment_plans')) {
    scoped.invoice_id = listRows_('invoices', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.invoice_id; });
  }
  if (rule.scope === 'own' && entity === 'task_assignments') {
    const projectIds = listRows_('projects', { sales_id: user.user_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.project_id; });
    scoped.task_id = listRows_('project_tasks', { project_id: projectIds }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.task_id; });
  }
  if (rule.scope === 'department') {
    if (entity === 'project_tasks') scoped.department_id = user.department_id;
    if (entity === 'task_templates') scoped.department_id = user.department_id;
    if (entity === 'projects') {
      scoped.project_id = listRows_('project_departments', { department_id: user.department_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.project_id; });
    }
    if (entity === 'task_resources') {
      scoped.task_id = listRows_('project_tasks', { department_id: user.department_id }, APP.MAX_LIST_ROWS).rows.map(function (row) { return row.task_id; });
    }
  }
  return scoped;
}

function scopedLookup_(entity, user, limit) {
  const rule = permissionRule_(entity, user);
  const referenceEntity = ['departments','users','project_items','project_departments'].indexOf(entity) >= 0;
  if ((!rule || !rule.view) && !referenceEntity) return [];
  const rows = listRows_(entity, applyDataScopeFilters_(entity, {}, user), limit || 200).rows;
  return entity === 'users' ? rows.map(sanitizeUser_) : rows;
}

function assertRecordScope_(entity, record, user) {
  if (!record) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy bản ghi cần thao tác');
  const rule = permissionRule_(entity, user);
  if (!rule || rule.scope === 'all') return;
  const ownerFields = { leads: 'assigned_sales_id', sales_opportunities: 'sales_id', sales_activities: 'sales_id', projects: 'sales_id', invoices: 'sales_id' };
  let visible = false;
  if (rule.scope === 'own' && ownerFields[entity]) visible = String(record[ownerFields[entity]] || '') === String(user.user_id);
  if (rule.scope === 'own' && entity === 'customers') {
    const opportunity = getRowById_('sales_opportunities', record.opportunity_id);
    visible = !!opportunity && String(opportunity.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && entity === 'contracts') {
    const project = getRowById_('projects', record.project_id);
    visible = !!project && String(project.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && (entity === 'lead_attachments' || entity === 'lead_notes')) {
    const lead = getRowById_('leads', record.lead_id);
    visible = !!lead && String(lead.assigned_sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && (entity === 'surveys' || entity === 'quotations')) {
    if (entity === 'surveys') visible = String(record.surveyor_id || '') === String(user.user_id);
    else {
      const opportunity = getRowById_('sales_opportunities', record.opportunity_id);
      visible = !!opportunity && String(opportunity.sales_id || '') === String(user.user_id);
    }
  }
  if (rule.scope === 'own' && entity === 'quotation_items') {
    const quotation = getRowById_('quotations', record.quotation_id);
    const quotationOpportunity = quotation && getRowById_('sales_opportunities', quotation.opportunity_id);
    visible = !!quotationOpportunity && String(quotationOpportunity.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && entity === 'customer_contacts') {
    const customer = getRowById_('customers', record.customer_id);
    const opportunity = customer && getRowById_('sales_opportunities', customer.opportunity_id);
    visible = !!opportunity && String(opportunity.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && (entity === 'payments' || entity === 'invoice_items' || entity === 'payment_plans')) {
    const invoice = getRowById_('invoices', record.invoice_id);
    visible = !!invoice && String(invoice.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'own' && entity === 'task_assignments') {
    const task = getRowById_('project_tasks', record.task_id);
    const project = task && getRowById_('projects', task.project_id);
    visible = !!project && String(project.sales_id || '') === String(user.user_id);
  }
  if (rule.scope === 'department' && (entity === 'project_tasks' || entity === 'task_templates')) visible = String(record.department_id || '') === String(user.department_id);
  if (rule.scope === 'department' && entity === 'projects') {
    visible = listRows_('project_departments', { project_id: record.project_id, department_id: user.department_id }, 1).total > 0;
  }
  if (rule.scope === 'department' && entity === 'task_resources') {
    const task = getRowById_('project_tasks', record.task_id);
    visible = !!task && String(task.department_id || '') === String(user.department_id);
  }
  if (!visible) throw appError_('ACCESS_DENIED_SCOPE', 'Bản ghi nằm ngoài phạm vi dữ liệu được cấp');
}

function prepareScopedMutation_(entity, data, user, creating) {
  const scoped = Object.assign({}, data || {});
  const rule = permissionRule_(entity, user);
  if (!creating && entity === 'surveys' && rule && rule.scope !== 'all') {
    throw appError_('SURVEY_RESULT_FORM_REQUIRED', 'Khảo sát viên chỉ được cập nhật bằng biểu mẫu Khai báo kết quả khảo sát');
  }
  if (!creating || !rule || rule.scope === 'all') return scoped;
  const ownerFields = { leads: 'assigned_sales_id', sales_opportunities: 'sales_id', sales_activities: 'sales_id', projects: 'sales_id', invoices: 'sales_id' };
  if (rule.scope === 'own' && ownerFields[entity]) scoped[ownerFields[entity]] = user.user_id;
  if (rule.scope === 'own' && (entity === 'surveys' || entity === 'quotations')) {
    const opportunity = getRowById_('sales_opportunities', scoped.opportunity_id);
    if (!opportunity || String(opportunity.sales_id || '') !== String(user.user_id)) throw appError_('ACCESS_DENIED_SCOPE', 'Cơ hội nằm ngoài phạm vi Lead được giao');
  }
  if (rule.scope === 'own' && (entity === 'lead_attachments' || entity === 'lead_notes')) {
    const lead = getRowById_('leads', scoped.lead_id);
    if (!lead || String(lead.assigned_sales_id || '') !== String(user.user_id)) throw appError_('ACCESS_DENIED_SCOPE', 'Lead nằm ngoài phạm vi được giao');
  }
  if (rule.scope === 'own' && entity === 'quotation_items') {
    const quotation = getRowById_('quotations', scoped.quotation_id);
    const opportunity = quotation && getRowById_('sales_opportunities', quotation.opportunity_id);
    if (!opportunity || String(opportunity.sales_id || '') !== String(user.user_id)) throw appError_('ACCESS_DENIED_SCOPE', 'Báo giá nằm ngoài phạm vi Lead được giao');
  }
  if (rule.scope === 'own' && entity === 'customer_contacts') {
    const customer = getRowById_('customers', scoped.customer_id);
    const opportunity = customer && getRowById_('sales_opportunities', customer.opportunity_id);
    if (!opportunity || String(opportunity.sales_id || '') !== String(user.user_id)) throw appError_('ACCESS_DENIED_SCOPE', 'Khách hàng nằm ngoài phạm vi được giao');
  }
  if (rule.scope === 'department') {
    if (entity === 'project_tasks' || entity === 'task_templates') scoped.department_id = user.department_id;
  }
  return scoped;
}

function buildDashboard_() {
  const user = getCurrentUser_();
  function readableRows(entity, limit) {
    const rule = permissionRule_(entity, user);
    if (!rule || !rule.view) return [];
    return listRows_(entity, applyDataScopeFilters_(entity, {}, user), limit || 500).rows;
  }
  const leads = readableRows('leads');
  const opportunities = readableRows('sales_opportunities');
  const customers = readableRows('customers');
  const projects = readableRows('projects');
  const tasks = readableRows('project_tasks');
  const invoices = readableRows('invoices');
  const scenarios = readableRows('demo_scenarios', 100);
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86400000);
  const activeProjects = projects.filter(function (p) { return ['completed','cancelled'].indexOf(p.project_status) < 0; });
  const upcoming = activeProjects.filter(function (p) { const d = new Date(p.event_date); return d >= now && d <= in14Days; }).sort(function (a,b){ return dateValue_(a.event_date)-dateValue_(b.event_date); }).slice(0,8);
  const overdue = tasks.filter(function (t) { return t.task_status !== 'done' && t.deadline_at && new Date(t.deadline_at) < now; });
  const dueToday = tasks.filter(function (t) { return sameDay_(t.planned_start_at, now) || sameDay_(t.deadline_at, now); });
  const totalRevenue = invoices.reduce(function (sum, row) { return sum + Number(row.final_amount || 0); }, 0);
  const paid = invoices.reduce(function (sum, row) { return sum + Number(row.paid_amount || 0); }, 0);
  return {
    metrics: { leads: leads.length, opportunities: opportunities.length, customers: customers.length, active_projects: activeProjects.length, overdue_tasks: overdue.length, due_today: dueToday.length, total_revenue: totalRevenue, paid: paid, remaining: totalRevenue - paid },
    upcoming_projects: upcoming,
    overdue_tasks: overdue.slice(0,10),
    active_scenarios: scenarios.filter(function (s) { return s.scenario_status !== 'completed'; }).slice(0,10)
  };
}

function sameDay_(value, date) {
  if (!value) return false;
  return Utilities.formatDate(new Date(value), APP.TIMEZONE, 'yyyy-MM-dd') === Utilities.formatDate(date, APP.TIMEZONE, 'yyyy-MM-dd');
}

function syncInvoiceTotals_(invoiceId) {
  const invoice = getRowById_('invoices', invoiceId);
  if (!invoice) return;
  const payments = listRows_('payments', { invoice_id: invoiceId, payment_status: 'confirmed' }, 500).rows;
  const paid = payments.reduce(function (sum, row) { return sum + Number(row.amount || 0); }, 0);
  const finalAmount = Number(invoice.final_amount || 0);
  const remaining = finalAmount - paid;
  let status = paid <= 0 ? 'unpaid' : (remaining <= 0 ? 'paid' : 'partial');
  saveRow_('invoices', { invoice_id: invoiceId, paid_amount: paid, remaining_amount: remaining, difference_amount: remaining < 0 ? Math.abs(remaining) : 0, invoice_status: status });
}

function prepareMutation_(entity, data, user, creating) {
  data = Object.assign({}, data || {});
  user = user || getCurrentUser_();
  if (entity === 'surveys') data.project_id = '';
  if (creating) {
    if (['sales_activities','surveys','quotations'].indexOf(entity) >= 0 && data._lead_id && !data.opportunity_id) {
      data.opportunity_id = ensureLeadOpportunityForMutation_(data._lead_id, user).opportunity_id;
    }
    delete data._lead_id;
    if (entity === 'leads') {
      data.source_channel = data.source_channel || 'other';
      data.lead_status = data.lead_status || 'new';
      data.assigned_sales_id = data.assigned_sales_id || user.user_id;
    }
    if (entity === 'sales_opportunities') {
      data.sales_id = data.sales_id || user.user_id;
      data.consultation_status = data.consultation_status || 'new';
    }
    if (entity === 'sales_activities') data.sales_id = data.sales_id || user.user_id;
    if (entity === 'customers') data.customer_status = data.customer_status || 'active';
    if (entity === 'contracts') {
      data.contract_status = data.contract_status || 'draft';
      if (data.project_id && !data.customer_id) {
        const contractProject = getRowById_('projects', data.project_id);
        if (contractProject) data.customer_id = contractProject.customer_id;
      }
    }
    if (entity === 'customer_contacts' && isBlank_(data.is_primary)) data.is_primary = false;
    if (entity === 'lead_notes') {
      data.note_at = data.note_at || new Date();
      data.visibility = data.visibility || 'internal';
    }
    if (entity === 'invoices') {
      data.subtotal_amount = Number(data.subtotal_amount || data.contract_value || data.final_amount || 0);
      data.tax_rate = Number(data.tax_rate || 0);
      data.tax_amount = Number(data.tax_amount || (data.subtotal_amount * data.tax_rate / 100));
    }
    if (entity === 'projects') {
      data.sales_id = data.sales_id || user.user_id;
      data.project_status = data.project_status || 'planning';
      if (isBlank_(data.implementation_eligible)) data.implementation_eligible = false;
    }
    if (entity === 'surveys') {
      data.requested_by = data.requested_by || user.user_id;
      data.survey_status = data.survey_status || 'requested';
    }
    if (entity === 'quotations') {
      data.version_no = data.version_no || 1;
      data.quotation_date = data.quotation_date || Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd');
      data.quotation_status = data.quotation_status || 'draft';
    }
  }
  if (entity === 'users') data = prepareUserCredentials_(data, creating);
  if (entity === 'project_tasks') {
    if (data.project_id && data.department_id && !data.project_department_id) {
      const membership = listRows_('project_departments', { project_id: data.project_id, department_id: data.department_id }, 1).rows[0];
      if (!membership) throw appError_('PROJECT_DEPARTMENT_REQUIRED', 'Phòng ban chưa được thêm vào dự án này. Hãy thêm phòng ban dự án trước khi tạo công việc.');
      data.project_department_id = membership.project_department_id;
    }
    if (data.task_status === 'done') { data.progress_percent = 100; data.actual_end_at = data.actual_end_at || new Date(); }
    if (data.task_status === 'in_progress' && !data.actual_start_at) data.actual_start_at = new Date();
  }
  if (entity === 'invoice_items' && isBlank_(data.amount)) data.amount = Number(data.quantity || 0) * Number(data.unit_price || 0);
  return data;
}

function ensureLeadOpportunityForMutation_(leadId, user) {
  const lead = getRowById_('leads', String(leadId || ''));
  if (!lead) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy Lead để tạo dữ liệu pipeline');
  assertRecordScope_('leads', lead, user);
  const existing = listRows_('sales_opportunities', { lead_id: lead.lead_id }, 1).rows[0];
  if (existing) return existing;
  return saveRow_('sales_opportunities', {
    lead_id: lead.lead_id,
    sales_id: lead.assigned_sales_id || user.user_id,
    bride_name_provisional: lead.contact_name || '',
    contact_role: 'bride',
    interested_service: lead.raw_need || '',
    consultation_status: 'new',
    note: 'Cơ hội được tạo tự động từ hồ sơ Lead'
  }).record;
}

function afterMutation_(entity, result) {
  if (entity === 'payments' && result.record.invoice_id) syncInvoiceTotals_(result.record.invoice_id);
  if (entity === 'invoice_items' && result.record.invoice_id) syncInvoiceFinancials_(result.record.invoice_id);
  if (entity === 'invoices' && result.record.invoice_id) result.record = syncInvoiceFinancials_(result.record.invoice_id);
  if (entity === 'users' && result.record.user_status !== 'active') revokeUserSessions_(result.record.user_id);
  return result;
}

function syncInvoiceFinancials_(invoiceId) {
  const invoice = getRowById_('invoices', invoiceId);
  if (!invoice) return invoice;
  const items = listRows_('invoice_items', { invoice_id: invoiceId }, APP.MAX_LIST_ROWS).rows;
  const itemSubtotal = items.reduce(function (sum, item) { return sum + Number(item.amount || (Number(item.quantity || 0) * Number(item.unit_price || 0))); }, 0);
  const subtotal = itemSubtotal || Number(invoice.subtotal_amount || invoice.contract_value || invoice.final_amount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxAmount = subtotal * taxRate / 100;
  const finalAmount = subtotal - Number(invoice.discount_amount || 0) + Number(invoice.extra_amount || 0) + taxAmount;
  const saved = saveRow_('invoices', { invoice_id: invoiceId, subtotal_amount: subtotal, tax_rate: taxRate, tax_amount: taxAmount, final_amount: finalAmount });
  return saved.record;
}
