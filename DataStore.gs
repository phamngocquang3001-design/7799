var REQUEST_RECORDS_CACHE_ = {};

function db_() {
  return SpreadsheetApp.openById(APP.SPREADSHEET_ID);
}

function sheet_(name) {
  const sheet = db_().getSheetByName(name);
  if (!sheet) throw appError_('SHEET_NOT_FOUND', 'Không tìm thấy sheet: ' + name);
  return sheet;
}

function headers_(name) {
  const cache = CacheService.getScriptCache();
  const key = 'headers:' + name;
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const sheet = sheet_(name);
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  const values = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String);
  cache.put(key, JSON.stringify(values), APP.CACHE_SECONDS);
  return values;
}

function rowToObject_(headers, row) {
  const result = {};
  headers.forEach(function (header, index) {
    result[header] = serializeValue_(row[index]);
  });
  return result;
}

function objectToRow_(headers, object, currentRow) {
  return headers.map(function (header, index) {
    if (Object.prototype.hasOwnProperty.call(object, header)) return normalizeForSheet_(header, object[header]);
    return currentRow ? currentRow[index] : '';
  });
}

function listRows_(entity, filters, limit, offset, search) {
  entity = assertEntity_(entity);
  const max = Math.min(Number(limit) || 200, APP.MAX_LIST_ROWS);
  const start = Math.max(Number(offset) || 0, 0);
  const normalizedSearch = String(search || '').trim().toLowerCase();
  const matched = recordsForEntity_(entity).filter(function (record) {
    if (record.deleted_at) return false;
    const validFilters = Object.keys(filters || {}).every(function (key) {
      const expected = filters[key];
      if (expected === '' || expected === null || typeof expected === 'undefined') return true;
      if (Array.isArray(expected)) return expected.map(String).indexOf(String(record[key])) >= 0;
      if (key === 'date_from') return dateValue_(record.planned_start_at || record.event_date) >= dateValue_(expected);
      if (key === 'date_to') return dateValue_(record.planned_start_at || record.event_date) <= dateValue_(expected) + 86399999;
      return String(record[key] == null ? '' : record[key]) === String(expected);
    });
    if (!validFilters) return false;
    if (!normalizedSearch) return true;
    return Object.keys(record).some(function (key) { return String(record[key] == null ? '' : record[key]).toLowerCase().indexOf(normalizedSearch) >= 0; });
  });
  matched.sort(function (a, b) {
    return dateValue_(b.updated_at || b.created_at || b.event_date) - dateValue_(a.updated_at || a.created_at || a.event_date);
  });
  return { rows: matched.slice(start, start + max), total: matched.length, limit: max, offset: start };
}

function recordsForEntity_(entity) {
  if (REQUEST_RECORDS_CACHE_[entity]) return REQUEST_RECORDS_CACHE_[entity];
  const cache = CacheService.getScriptCache();
  const key = 'records:' + entity;
  const cached = cache.get(key);
  if (cached) {
    REQUEST_RECORDS_CACHE_[entity] = JSON.parse(cached);
    return REQUEST_RECORDS_CACHE_[entity];
  }
  const sheet = sheet_(entity);
  const headers = headers_(entity);
  const lastRow = sheet.getLastRow();
  const records = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map(function (row) {
    return rowToObject_(headers, row);
  });
  REQUEST_RECORDS_CACHE_[entity] = records;
  const json = JSON.stringify(records);
  if (json.length < 95000) cache.put(key, json, APP.DATA_CACHE_SECONDS);
  return records;
}

function getRowById_(entity, id) {
  const config = ENTITY_CONFIG[entity];
  return recordsForEntity_(entity).filter(function (record) { return String(record[config.pk] || '') === String(id || ''); })[0] || null;
}

function findRowByValue_(entity, field, value) {
  const sheet = sheet_(entity);
  const headers = headers_(entity);
  const column = headers.indexOf(field);
  if (column < 0) throw appError_('FIELD_NOT_FOUND', 'Không tìm thấy cột ' + field + ' trong ' + entity);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const finder = sheet.getRange(2, column + 1, lastRow - 1, 1).createTextFinder(String(value)).matchEntireCell(true).findNext();
  if (!finder) return null;
  const rowIndex = finder.getRow();
  const values = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  return { sheet: sheet, headers: headers, rowIndex: rowIndex, values: values };
}

function saveRow_(entity, input, options) {
  options = options || {};
  const config = ENTITY_CONFIG[entity];
  const user = getCurrentUser_();
  const now = new Date();
  const data = Object.assign({}, input);
  const lock = options.lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(30000);
  try {
    validateRecord_(entity, data);
    let located = data[config.pk] ? findRowByValue_(entity, config.pk, data[config.pk]) : null;
    const before = located ? rowToObject_(located.headers, located.values) : null;
    if (!located) {
      // saveRow_ already owns the script lock here. Passing true prevents the
      // ID generator from attempting to acquire the same non-reentrant lock.
      if (!data[config.pk]) data[config.pk] = nextId_(config.entity, config.prefix, true);
      data.created_at = data.created_at || now;
      data.created_by = data.created_by || user.user_id;
    } else if (String(before[config.pk]) !== String(data[config.pk])) {
      throw appError_('IMMUTABLE_PRIMARY_KEY', 'Không được thay đổi khóa chính ' + config.pk);
    }
    data.updated_at = now;
    data.updated_by = user.user_id;
    const sheet = sheet_(entity);
    const headers = headers_(entity);
    const row = objectToRow_(headers, data, located && located.values);
    const targetRow = located ? located.rowIndex : Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);
    const after = rowToObject_(headers, row);
    appendAudit_(located ? 'update' : 'create', entity, after[config.pk], before, after, options.lockHeld);
    clearCaches_(entity);
    return { record: after, created: !located };
  } finally {
    if (lock) lock.releaseLock();
  }
}

function softDeleteRow_(entity, id) {
  if (!id) throw appError_('MISSING_ID', 'Thiếu mã bản ghi cần xóa');
  const config = ENTITY_CONFIG[entity];
  const located = findRowByValue_(entity, config.pk, id);
  if (!located) throw appError_('RECORD_NOT_FOUND', 'Không tìm thấy bản ghi ' + id);
  const before = rowToObject_(located.headers, located.values);
  const dependent = checkDependencies_(entity, id);
  if (dependent.length) throw appError_('RECORD_IN_USE', 'Không thể xóa vì đang được sử dụng tại: ' + dependent.join(', '));
  const user = getCurrentUser_();
  const patch = { deleted_at: new Date(), updated_at: new Date(), updated_by: user.user_id };
  const afterRow = objectToRow_(located.headers, patch, located.values);
  located.sheet.getRange(located.rowIndex, 1, 1, located.headers.length).setValues([afterRow]);
  const after = rowToObject_(located.headers, afterRow);
  appendAudit_('delete', entity, id, before, after);
  clearCaches_(entity);
  return { deleted: true, id: id, record: after, previous: before };
}

function appendAudit_(action, entity, id, before, after, lockHeld) {
  if (entity === APP.AUDIT_SHEET) return;
  if (entity === 'users') {
    before = before ? sanitizeUser_(before) : before;
    after = after ? sanitizeUser_(after) : after;
  }
  const sheet = sheet_(APP.AUDIT_SHEET);
  const headers = headers_(APP.AUDIT_SHEET);
  const user = getCurrentUser_();
  const rowObject = {
    log_id: Utilities.getUuid(), user_id: user.user_id, action_type: action, entity_type: entity,
    record_id: id, before_json: before ? truncateJson_(before) : '', after_json: after ? truncateJson_(after) : '',
    created_at: new Date(), request_id: Utilities.getUuid(), user_agent: 'Apps Script Web App', note: ''
  };
  sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, headers.length).setValues([objectToRow_(headers, rowObject)]);
}

function nextId_(entityType, prefix, lockHeld) {
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(30000);
  try {
    const sheet = sheet_('id_sequences');
    const headers = headers_('id_sequences');
    const located = findRowByValue_('id_sequences', 'entity_type', entityType);
    const now = new Date();
    if (located) {
      const record = rowToObject_(headers, located.values);
      const next = Number(record.current_value || 0) + 1;
      const update = objectToRow_(headers, { current_value: next, updated_at: now }, located.values);
      sheet.getRange(located.rowIndex, 1, 1, headers.length).setValues([update]);
      return String(record.prefix || prefix) + String(next).padStart(Number(record.padding_length || 6), '0');
    }
    const next = 1;
    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, headers.length).setValues([
      objectToRow_(headers, { entity_type: entityType, prefix: prefix, current_value: next, padding_length: 6, updated_at: now })
    ]);
    return String(prefix) + String(next).padStart(6, '0');
  } finally {
    if (lock) lock.releaseLock();
  }
}

function nextIds_(entityType, prefix, count, lockHeld) {
  count = Math.max(1, Number(count) || 1);
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(30000);
  try {
    const sheet = sheet_('id_sequences');
    const headers = headers_('id_sequences');
    const located = findRowByValue_('id_sequences', 'entity_type', entityType);
    const current = located ? Number(rowToObject_(headers, located.values).current_value || 0) : 0;
    const padding = located ? Number(rowToObject_(headers, located.values).padding_length || 6) : 6;
    const storedPrefix = located ? String(rowToObject_(headers, located.values).prefix || prefix) : String(prefix);
    const nextValue = current + count;
    const row = objectToRow_(headers, { entity_type: entityType, prefix: storedPrefix, current_value: nextValue, padding_length: padding, updated_at: new Date() }, located && located.values);
    sheet.getRange(located ? located.rowIndex : Math.max(sheet.getLastRow() + 1, 2), 1, 1, headers.length).setValues([row]);
    return Array.from({ length: count }, function (_, index) { return storedPrefix + String(current + index + 1).padStart(padding, '0'); });
  } finally {
    if (lock) lock.releaseLock();
  }
}

function appendRowsBatch_(entity, records) {
  if (!records || !records.length) return [];
  const sheet = sheet_(entity);
  const headers = headers_(entity);
  const user = getCurrentUser_();
  const now = new Date();
  const normalized = records.map(function (record) {
    const data = Object.assign({}, record);
    data.created_at = data.created_at || now;
    data.created_by = data.created_by || user.user_id;
    data.updated_at = data.updated_at || now;
    data.updated_by = data.updated_by || user.user_id;
    return data;
  });
  const rows = normalized.map(function (record) { return objectToRow_(headers, record); });
  sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, rows.length, headers.length).setValues(rows);
  clearCaches_(entity);
  // google.script.run cannot serialize Date objects. Return the same
  // client-safe shape used by normal reads so a successful batch write does
  // not surface as an empty RPC response in the production workspace.
  return rows.map(function (row) { return rowToObject_(headers, row); });
}

function createRowsBatch_(entity, records) {
  entity = assertEntity_(entity);
  records = records || [];
  if (!records.length) return [];
  const config = ENTITY_CONFIG[entity];
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    records.forEach(function (record) {
      if (record[config.pk]) throw appError_('BATCH_CREATE_ONLY', 'Thêm hàng loạt chỉ nhận các dòng dữ liệu mới');
      validateRecord_(entity, record);
    });
    const ids = nextIds_(config.entity, config.prefix, records.length, true);
    const prepared = records.map(function (record, index) {
      const row = Object.assign({}, record);
      row[config.pk] = ids[index];
      return row;
    });
    const saved = appendRowsBatch_(entity, prepared);
    appendAuditBatch_('create', entity, saved, true);
    return saved;
  } finally {
    lock.releaseLock();
  }
}

function appendAuditBatch_(action, entity, records, lockHeld) {
  if (!records || !records.length || entity === APP.AUDIT_SHEET) return;
  const sheet = sheet_(APP.AUDIT_SHEET);
  const headers = headers_(APP.AUDIT_SHEET);
  const user = getCurrentUser_();
  const config = ENTITY_CONFIG[entity];
  const now = new Date();
  const rows = records.map(function (record) {
    return objectToRow_(headers, {
      log_id: Utilities.getUuid(), user_id: user.user_id, action_type: action, entity_type: entity,
      record_id: record[config.pk], before_json: '', after_json: truncateJson_(record), created_at: now,
      request_id: Utilities.getUuid(), user_agent: 'Apps Script Web App', note: lockHeld ? 'batch_create' : ''
    });
  });
  sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, rows.length, headers.length).setValues(rows);
  clearCaches_(APP.AUDIT_SHEET);
}

function validateRecord_(entity, data) {
  const schema = getDataDictionary_()[entity] || [];
  const creating = !data[ENTITY_CONFIG[entity].pk];
  schema.forEach(function (field) {
    // Khóa chính được sinh bởi nextId_ sau bước kiểm tra; người dùng không bao
    // giờ phải nhập các mã OP/LD/KH/DA... bằng tay.
    if (field.field_name === ENTITY_CONFIG[entity].pk) return;
    if (field.required && creating && !isAuditField_(field.field_name) && isBlank_(data[field.field_name])) {
      throw appError_('VALIDATION_ERROR', 'Thiếu trường bắt buộc: ' + (FIELD_LABELS[field.field_name] || field.field_name));
    }
  });
  validateForeignKeys_(entity, data);
  if (entity === 'project_tasks') {
    const progress = Number(data.progress_percent || 0);
    if (progress < 0 || progress > 100) throw appError_('VALIDATION_ERROR', 'Tiến độ phải từ 0 đến 100');
    if (data.is_blocked && isBlank_(data.blocked_reason)) throw appError_('VALIDATION_ERROR', 'Cần nhập lý do khi công việc bị chặn');
  }
  if (entity === 'lead_attachments' && data.file_url && !/^https:\/\//i.test(String(data.file_url).trim())) {
    throw appError_('VALIDATION_ERROR', 'Đường dẫn file phải bắt đầu bằng https://');
  }
  if (entity === 'payments' && Number(data.amount || 0) === 0) throw appError_('VALIDATION_ERROR', 'Số tiền thanh toán phải khác 0');
}

function validateForeignKeys_(entity, data) {
  const schema = getDataDictionary_()[entity] || [];
  schema.forEach(function (field) {
    if (!field.foreign_key || isBlank_(data[field.field_name])) return;
    const parts = String(field.foreign_key).split('.');
    if (parts.length !== 2 || !ENTITY_CONFIG[parts[0]]) return;
    if (!findRowByValue_(parts[0], parts[1], data[field.field_name])) {
      throw appError_('FOREIGN_KEY_ERROR', 'Giá trị ' + data[field.field_name] + ' không tồn tại trong ' + parts[0]);
    }
  });
}

function checkDependencies_(entity, id) {
  const dependencies = [];
  const schema = getDataDictionary_();
  Object.keys(schema).forEach(function (table) {
    if (!ENTITY_CONFIG[table]) return;
    schema[table].forEach(function (field) {
      if (field.foreign_key === entity + '.' + ENTITY_CONFIG[entity].pk) {
        const result = listRows_(table, (function () { const f = {}; f[field.field_name] = id; return f; })(), 1);
        if (result.total) dependencies.push(table);
      }
    });
  });
  return dependencies;
}

function serializeValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(value, APP.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  return value;
}

function normalizeForSheet_(field, value) {
  if (value === null || typeof value === 'undefined') return '';
  const schemaField = findSchemaField_(field);
  if (schemaField && (schemaField.data_type === 'date' || schemaField.data_type === 'datetime') && typeof value === 'string' && value) {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed;
  }
  if (schemaField && schemaField.data_type === 'boolean') return value === true || value === 'true' || value === 'TRUE';
  if (schemaField && ['integer', 'decimal', 'currency', 'percent'].indexOf(schemaField.data_type) >= 0 && value !== '') return Number(value);
  return value;
}

function dateValue_(value) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

function isBlank_(value) { return value === '' || value === null || typeof value === 'undefined'; }
function isAuditField_(field) { return ['created_at','created_by','updated_at','updated_by','deleted_at'].indexOf(field) >= 0; }
function truncateJson_(value) { const text = JSON.stringify(value); return text.length > 40000 ? text.slice(0, 39980) + '…' : text; }
function appError_(code, message) { const error = new Error(message); error.code = code; return error; }
function assertEntity_(entity) { if (!ENTITY_CONFIG[entity]) throw appError_('INVALID_ENTITY', 'Loại dữ liệu không hợp lệ: ' + entity); return entity; }
function clearCaches_(entity) {
  delete REQUEST_RECORDS_CACHE_[entity];
  CacheService.getScriptCache().remove('records:' + entity);
  if (entity === 'master_data') CacheService.getScriptCache().remove('master_data_map');
  if (entity === 'data_dictionary') CacheService.getScriptCache().remove('data_dictionary');
}

function findSchemaField_(fieldName) {
  const dictionary = getDataDictionary_();
  const tables = Object.keys(dictionary);
  for (let i = 0; i < tables.length; i++) {
    const match = dictionary[tables[i]].filter(function (f) { return f.field_name === fieldName; })[0];
    if (match) return match;
  }
  return null;
}
