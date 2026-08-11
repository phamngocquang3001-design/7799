'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'appsscript.json', 'Code.gs', 'Config.gs', 'DataStore.gs', 'Services.gs',
  'Demo.gs', 'Index.html', 'Styles.html', 'AppJs.html'
];

function read(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

function check(name, condition, detail) {
  assert.ok(condition, `${name}: ${detail}`);
  process.stdout.write(`PASS  ${name}\n`);
}

const topLevelRuntime = fs.readdirSync(root)
  .filter((name) => /^(appsscript\.json|.+\.gs|.+\.html)$/.test(name))
  .sort();
check('runtime file count', topLevelRuntime.length === 9, `expected 9, found ${topLevelRuntime.length}`);
check('runtime file names', runtimeFiles.slice().sort().join('|') === topLevelRuntime.join('|'), topLevelRuntime.join(', '));

const clasp = JSON.parse(read('.clasp.json'));
check('Apps Script ID', clasp.scriptId === '1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI', clasp.scriptId);
check('clasp root', clasp.rootDir === '.', String(clasp.rootDir));

const manifest = JSON.parse(read('appsscript.json'));
check('manifest timezone', manifest.timeZone === 'Asia/Ho_Chi_Minh', manifest.timeZone);
check('manifest runtime', manifest.runtimeVersion === 'V8', manifest.runtimeVersion);
check('web app execution identity', manifest.webapp && manifest.webapp.executeAs === 'USER_ACCESSING', JSON.stringify(manifest.webapp));
check('minimal OAuth scopes', Array.isArray(manifest.oauthScopes) && manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets') && manifest.oauthScopes.includes('https://www.googleapis.com/auth/userinfo.email'), JSON.stringify(manifest.oauthScopes));
check('external upload OAuth scope', manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'), JSON.stringify(manifest.oauthScopes));

const serverSource = ['Config.gs', 'DataStore.gs', 'Services.gs', 'Demo.gs', 'Code.gs']
  .map((name) => `\n// ${name}\n${read(name)}`)
  .join('\n');
new vm.Script(serverSource, { filename: 'apps-script-server-bundle.js' });
check('server syntax', true, 'V8 parse');

const appHtml = read('AppJs.html');
const clientMatch = appHtml.match(/<script>([\s\S]*)<\/script>/i);
check('client script wrapper', Boolean(clientMatch), 'missing <script> wrapper');
new vm.Script(clientMatch[1], { filename: 'AppJs.client.js' });
check('client syntax', true, 'browser JS parse');

const config = read('Config.gs');
check('Spreadsheet ID', config.includes("SPREADSHEET_ID: '1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs'"), 'wrong database target');
check('application timezone', config.includes("TIMEZONE: 'Asia/Ho_Chi_Minh'"), 'wrong business timezone');
check('audit is read-only', config.includes("audit_logs:") && config.includes('readOnly: true'), 'audit_logs must not be mutable');

const code = read('Code.gs');
const dataStore = read('DataStore.gs');
const services = read('Services.gs');
const demo = read('Demo.gs');
check('iframe support', code.includes('XFrameOptionsMode.ALLOWALL'), 'ALLOWALL is required');
check('authorization recovery API', code.includes('function getAuthorizationState()') && code.includes('function resetMyAuthorization()') && code.includes('ScriptApp.invalidateAuth()'), 'reset/re-authorize API missing');
check('authorization probes', code.includes('scope_checks') && code.includes('Session.getEffectiveUser()') && services.includes('Session.getEffectiveUser()'), 'live scope probes/effective user fallback missing');
check('soft delete', dataStore.includes('deleted_at: new Date()') && !dataStore.includes('deleteRow('), 'physical delete detected or soft delete missing');
check('non-reentrant ID lock fix', /nextId_\(config\.entity, config\.prefix, true\)/.test(dataStore), 'saveRow_ must reuse its lock');
check('permission scope', services.includes('applyDataScopeFilters_') && services.includes('assertRecordScope_'), 'data scope enforcement missing');
check('invoice synchronization', services.includes('syncInvoiceTotals_') && services.includes("payment_status: 'confirmed'"), 'debt synchronization missing');
check('six demo stages', (config.match(/code: '(lead_received|qualified|deposit_confirmed|design_approved|operation_started|event_completed)'/g) || []).length === 6, 'stage definition mismatch');
check('live acceptance suite', /function runSystemAcceptanceTests\([^)]*\)/.test(demo) && demo.includes('audit_create_update_delete'), 'acceptance evidence function missing');
check('custom login session', services.includes('function loginApp(') && services.includes('function requireSession_(') && services.includes("AUTH_SHEET"), 'persistent login/session service missing');
check('password protection', services.includes('derivePasswordHash_') && services.includes('password_salt') && services.includes('tokenHash_') && !read('Index.html').includes('password_hash'), 'password/session secret handling missing');
check('login response serialization', services.includes("safe[field] = serializeValue_(safe[field])") && services.includes("event: 'login_success'") && appHtml.includes('WeddingOps RPC:empty'), 'login Date serialization or RPC diagnostics missing');
check('personal permission matrix', services.includes("'user:' + user.user_id") && services.includes('saveEmployeePermissions_') && appHtml.includes('permission-matrix'), 'per-user module permissions missing');
check('auto generated primary keys', dataStore.includes("field.field_name === ENTITY_CONFIG[entity].pk") && dataStore.includes('nextId_(config.entity, config.prefix, true)'), 'primary key must be server generated');

const index = read('Index.html');
const styles = read('Styles.html');
check('ERP shell', index.includes('Operations ERP') && index.includes('utility-bar') && index.includes('Hệ thống & danh mục'), 'ERP navigation shell missing');
check('authorization recovery UI', index.includes('authAccessButton') && appHtml.includes('openAuthCenter') && appHtml.includes('Reset quyền của tôi'), 'authorization recovery UI missing');
check('ERP login page', index.includes('loginPage') && index.includes('loginForm') && index.includes('changePasswordForm') && appHtml.includes('weddingops_session'), 'login page or persisted client session missing');
check('responsive UI', styles.includes('@media(max-width:780px)') && styles.includes('.data-table'), 'responsive/table styles missing');
check('pagination', appHtml.includes("data-action=\"page-next\"") && appHtml.includes('state.pageSize'), 'true pagination missing');
check('expanded modules', ['surveys','quotation_items','customer_contacts','project_milestones','project_documents','design_orders','project_items','project_departments','invoice_items','role_permissions','audit_logs'].every((name) => appHtml.includes(name)), 'one or more required modules missing');
check('entity detail actions', appHtml.includes('data-action="view-detail"') && code.includes('function getEntityDetail('), 'generic detail action/API missing');
check('lead conversion', appHtml.includes('convert-lead') && code.includes('function convertLeadToCustomer(') && code.includes("lead_status: 'converted'"), 'Lead to customer conversion missing');
check('customer 360 relationship detail', code.includes('buildCustomerDetail_') && ['contacts','invoices','payments','quotations','contracts','projects','assignments'].every((name) => code.includes(`${name}:`)) && appHtml.includes('renderCustomerHub') && appHtml.includes('customer-hub-tab'), 'customer 360 relationship detail missing');
check('invoice detail and payment', code.includes('buildInvoiceDetail_') && code.includes('function recordInvoicePayment(') && appHtml.includes('renderInvoiceDetail') && appHtml.includes('invoice-payment'), 'invoice detail or payment workflow missing');
check('invoice reference layout', appHtml.includes('renderInvoiceListPage') && appHtml.includes('invoice-overview') && appHtml.includes('invoice-document') && appHtml.includes('invoice-item-table') && styles.includes('@media print'), 'invoice list/detail reference layout missing');
check('invoice financial extension', config.includes('INVOICE_EXTENSION_SCHEMA') && services.includes('syncInvoiceFinancials_') && ['subtotal_amount','tax_rate','tax_amount'].every((name) => config.includes(name)), 'invoice subtotal/tax synchronization missing');
check('customer contextual child forms', appHtml.includes('openCustomerContextForm') && appHtml.includes('optionOverrides') && appHtml.includes('detailParent'), 'customer contextual module linking missing');
check('project workspace', appHtml.includes('renderProjectListPage') && appHtml.includes('project-workspace-tab') && appHtml.includes('Proposal thiết kế') && code.includes('related.task_assignments'), 'project list/dynamic department workspace missing');
check('project list is simplified', appHtml.includes("projects:{entity:'projects',title:'Các dự án'") && !appHtml.includes("tabs:[['projects','Dự án']"), 'project list still exposes implementation child tabs');
check('department task context', appHtml.includes("data-department") && appHtml.includes("preset.department_id=departmentId") && appHtml.includes("overrides.task_id"), 'department task or assignment context missing');
check('contextual project linking', services.includes('PROJECT_DEPARTMENT_REQUIRED') && appHtml.includes("lockedFields:locked"), 'project/department IDs are not enforced contextually');
check('contracts module schema', config.includes('CONTRACT_SCHEMA') && services.includes('ensureContractsSheet_') && config.includes("contracts: { pk: 'contract_id'"), 'contracts module is incomplete');
check('lead-centered pipeline', appHtml.includes("title:'Khách hàng tiềm năng'") && appHtml.includes('lead-pipeline') && code.includes('buildLeadDetail_'), 'Lead is not the central pipeline record');
check('lead detail tabs', ['Thông tin chi tiết','Đề xuất kế hoạch','Phân công khảo sát','File đính kèm','Ghi chú'].every((label) => appHtml.includes(label)), 'one or more Lead detail tabs missing');
check('lead files and notes schema', config.includes('LEAD_EXTENSION_SCHEMAS') && services.includes('ensureLeadExtensionSheets_') && appHtml.includes('lead_attachments') && appHtml.includes('lead_notes'), 'Lead attachment/note persistence missing');
check('automatic Lead pipeline link', services.includes('ensureLeadOpportunityForMutation_') && appHtml.includes('extraData._lead_id'), 'pipeline child records still require manual opportunity IDs');
check('Lead pipeline scope', services.includes("entity === 'surveys' || entity === 'quotations'") && services.includes('Cơ hội nằm ngoài phạm vi Lead được giao'), 'Lead pipeline scope enforcement missing');
check('standalone survey tasks', index.includes('data-page="surveys"') && appHtml.includes("surveys:{entity:'surveys',title:'Nhiệm vụ khảo sát'") && appHtml.includes('renderSurveyDetail') && code.includes('buildSurveyDetail_'), 'dedicated survey task menu/detail missing');
check('survey has no project relation', !/surveys:\['opportunity_id','project_id'/.test(appHtml) && services.includes("if (entity === 'surveys') data.project_id = '';"), 'survey form or mutation still links a project');
check('assigned survey scope', services.includes("if (entity === 'surveys') scoped.surveyor_id = user.user_id") && services.includes("if (entity === 'surveys') visible = String(record.surveyor_id || '') === String(user.user_id)"), 'survey tasks are not restricted to the assigned surveyor');
check('survey lead snapshot', code.includes("pickClientFields_(lead") && appHtml.includes('Thông tin được in trực tiếp từ Lead'), 'survey detail does not expose the related Lead snapshot');
check('separate survey forms', appHtml.includes('openSurveyResultForm') && appHtml.includes("kind:'survey_result'") && appHtml.includes("surveys:['opportunity_id','surveyor_id','survey_date','location','contact_person','contact_phone','survey_requirements']"), 'survey request and result still share one form');
check('survey result whitelist', code.includes('function submitSurveyResult(') && services.includes('SURVEY_RESULT_FORM_REQUIRED') && code.includes("survey_status: 'completed'"), 'survey result fields are not protected server-side');
check('temporary multi-image upload', code.includes("UrlFetchApp.fetch('https://tmpfile.link/api/upload'") && code.includes('function uploadSurveyImage(') && appHtml.includes('multiple') && appHtml.includes('prepareSurveyImagePayload'), 'temporary multi-image upload is incomplete');
check('survey image gallery', appHtml.includes('renderSurveyGallery') && appHtml.includes('survey-image-view') && styles.includes('.survey-lightbox'), 'survey thumbnails or zoom viewer missing');
check('separate design order schema', config.includes('DESIGN_ORDER_EXTENSION_SCHEMA') && config.includes('PROJECT_DESIGN_EXTENSION_SCHEMA') && ['parent_design_order_id','work_name','progress_percent','result_note','leader_user_id','design_template_type'].every((name) => config.includes(name)), 'design_orders schema or project reference extension is incomplete');
check('explicit design leader routing', services.includes('isEligibleDesignLeader_') && services.includes('data.leader_user_id = parentOrder.leader_user_id') && appHtml.includes("['leader_user_id','note']") && appHtml.includes('designLeaders'), 'design order does not require and route to an explicitly selected leader');
check('design parent progress average', services.includes('function syncDesignOrderProgress_') && services.includes('children.reduce') && services.includes('/ children.length') && appHtml.includes('Trung bình cộng') && appHtml.includes('Tự tính TB'), 'parent design order progress is not derived from child assignments');
check('design parent child workflow', services.includes("entity === 'design_orders'") && services.includes('DESIGN_ROOT_SALES_ONLY') && services.includes('DESIGN_LEADER_ONLY') && services.includes('parent_design_order_id') && services.includes('departmentLeaderId_'), 'design leader assignment rules are incomplete');
check('design task tree UI', appHtml.includes('renderDesignTaskNode') && appHtml.includes('renderDesignTaskDetail') && appHtml.includes('openDesignTaskForm') && styles.includes('.design-task-row'), 'design task tree/detail UI is incomplete');
check('design assignee progress form', appHtml.includes('openDesignTaskProgressForm') && appHtml.includes('canUpdateDesignTask') && services.includes('DESIGN_ORDER_ASSIGNEE_ONLY'), 'design assignee progress update is incomplete');
check('project references in design UI', appHtml.includes('designProjectItems') && appHtml.includes('designProposalDocument') && appHtml.includes('r.design_orders') && appHtml.includes('Bảng riêng design_orders'), 'design UI still duplicates project fields');
check('separate production schemas', config.includes('PRODUCTION_TABLE_SCHEMAS') && ['production_plans','production_materials','production_accessories','production_paints','production_letters','production_prints'].every((name) => config.includes(name)), 'one or more production tables are missing');
check('production project item reference', config.includes("['project_item_id','text',true") && code.includes("['project_departments','project_items','project_documents']"), 'production items do not reuse project_items');
check('production batch persistence', dataStore.includes('function createRowsBatch_') && dataStore.includes('appendAuditBatch_') && code.includes('function batchCreateProductionRows(') && code.includes('BATCH_TOO_LARGE'), 'production rows are not persisted in one batch');
check('production batch response serialization', dataStore.includes('return rows.map(function (row) { return rowToObject_(headers, row); });'), 'production batch returns raw Date objects after a successful write');
check('production lazy bundle', code.includes('function getProjectProductionData(') && appHtml.includes('loadProjectProduction') && appHtml.includes("callServer('getProjectProductionData'"), 'production tables are not loaded together on demand');
check('production RPC serializes loaded time', code.includes('loaded_at: serializeValue_(new Date())'), 'production RPC returns an unsupported Date object');
check('production vertical tabs', appHtml.includes('production-subtab') && appHtml.includes('PRODUCTION_SECTIONS') && styles.includes('.production-subnav'), 'production level-2 vertical tabs are missing');
check('production multi-row editor', appHtml.includes('production-batch-add') && appHtml.includes('collectProductionBatchRows') && appHtml.includes("callServer('batchCreateProductionRows'") && styles.includes('.production-batch-row'), 'production bulk entry UI is incomplete');
check('production inline status updates', appHtml.includes('PRODUCTION_INLINE_FIELDS') && appHtml.includes('updateProductionInlineField') && appHtml.includes('data-production-inline') && appHtml.includes("callServer('mutateAppData'") && styles.includes('.production-inline-select') && styles.includes('.production-inline-toggle'), 'production statuses cannot be updated from the list');
check('lightweight bootstrap', code.includes('function getAppReferenceData(') && code.includes('background_loading: true') && !/function getAppBootstrap[\s\S]*?setupSystem_\(\)[\s\S]*?function getAppReferenceData/.test(code), 'bootstrap still blocks on setup or full reference reads');
check('background data warmup', appHtml.includes('warmApplicationData') && appHtml.includes('scheduleIdlePrefetch') && appHtml.includes('prefetchPage') && appHtml.includes('sessionStorage'), 'background reference/dashboard prefetch is incomplete');
check('client data cache', appHtml.includes('entityCacheKey') && appHtml.includes('fetchEntityPage') && appHtml.includes('detailCacheKey') && appHtml.includes('fetchEntityDetail'), 'entity/detail cache is incomplete');
check('server sheet cache', dataStore.includes('function recordsForEntity_') && dataStore.includes("'records:' + entity") && dataStore.includes('REQUEST_RECORDS_CACHE_'), 'server sheet rows are not cached');
check('cached auth session', services.includes('sessionCacheKey_') && services.includes('SESSION_CACHE_SECONDS') && services.includes('auth_infrastructure:v2'), 'auth/session fast path is incomplete');
check('single startup RPC', appHtml.includes("if(state.sessionToken)return enterApplication()") && appHtml.includes("callServer('getAppBootstrap')"), 'saved sessions still make a blocking resume RPC before bootstrap');
check('dashboard cache', services.includes('dashboardCacheKey_') && services.includes('DASHBOARD_CACHE_SECONDS') && code.includes('readDashboardCache_'), 'dashboard is recomputed on every request');

process.stdout.write(`\nSmoke test completed: ${runtimeFiles.length} runtime files validated.\n`);
