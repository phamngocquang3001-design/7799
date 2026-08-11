const APP = Object.freeze({
  NAME: 'Wedding Operations SPA',
  VERSION: '2.11.0',
  SPREADSHEET_ID: '1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  CACHE_SECONDS: 300,
  MAX_LIST_ROWS: 5000,
  DEMO_SHEET: 'demo_scenarios',
  AUDIT_SHEET: 'audit_logs',
  AUTH_SHEET: 'auth_sessions',
  AUTH_SESSION_DAYS: 30,
  PASSWORD_ITERATIONS: 4000,
  OAUTH_SCOPES: Object.freeze([
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/script.external_request'
  ])
});

const PERMISSION_MODULES = Object.freeze([
  ['leads','Lead thô','Kinh doanh'], ['sales_opportunities','Cơ hội tư vấn','Kinh doanh'], ['sales_activities','Chăm sóc khách','Kinh doanh'],
  ['lead_attachments','File Lead','Kinh doanh'], ['lead_notes','Ghi chú Lead','Kinh doanh'],
  ['surveys','Nhiệm vụ khảo sát','Vận hành'], ['quotations','Báo giá','Kinh doanh'], ['quotation_items','Chi tiết báo giá','Kinh doanh'],
  ['customers','Khách hàng','Khách hàng'], ['customer_contacts','Người liên hệ','Khách hàng'],
  ['projects','Dự án / Đám','Dự án'], ['project_milestones','Mốc dự án','Dự án'], ['project_documents','Tài liệu dự án','Dự án'],
  ['design_orders','Order thiết kế','Dự án'], ['project_items','Hạng mục','Dự án'], ['project_departments','Phòng ban dự án','Dự án'],
  ['project_tasks','Công việc','Vận hành'], ['task_assignments','Phân công nhân sự','Vận hành'], ['task_resources','Vật tư','Vận hành'],
  ['task_vehicles','Phương tiện','Vận hành'], ['project_handoffs','Bàn giao','Vận hành'], ['task_templates','Mẫu công việc','Vận hành'],
  ['contracts','Hợp đồng','Tài chính'], ['invoices','Hóa đơn','Tài chính'], ['invoice_items','Chi tiết hóa đơn','Tài chính'], ['payment_plans','Kế hoạch thu','Tài chính'], ['payments','Thanh toán','Tài chính'],
  ['master_data','Danh mục','Quản trị'], ['departments','Phòng ban','Quản trị'], ['users','Nhân viên','Quản trị'],
  ['role_permissions','Phân quyền','Quản trị'], ['audit_logs','Nhật ký hệ thống','Quản trị'], ['demo_scenarios','Mô phỏng quy trình','Điều hành']
]);

const ENTITY_CONFIG = Object.freeze({
  leads: { pk: 'lead_id', entity: 'lead', prefix: 'LD', label: 'Lead' },
  lead_attachments: { pk: 'attachment_id', entity: 'lead_attachment', prefix: 'LDF', label: 'File Lead' },
  lead_notes: { pk: 'lead_note_id', entity: 'lead_note', prefix: 'LDN', label: 'Ghi chú Lead' },
  sales_opportunities: { pk: 'opportunity_id', entity: 'opportunity', prefix: 'OP', label: 'Cơ hội' },
  sales_activities: { pk: 'activity_id', entity: 'activity', prefix: 'HDTV', label: 'Hoạt động tư vấn' },
  surveys: { pk: 'survey_id', entity: 'survey', prefix: 'KS', label: 'Khảo sát' },
  quotations: { pk: 'quotation_id', entity: 'quotation', prefix: 'BG', label: 'Báo giá' },
  quotation_items: { pk: 'quotation_item_id', entity: 'quotation_item', prefix: 'BGC', label: 'Dòng báo giá' },
  customers: { pk: 'customer_id', entity: 'customer', prefix: 'KH', label: 'Khách hàng' },
  customer_contacts: { pk: 'contact_id', entity: 'contact', prefix: 'LH', label: 'Liên hệ' },
  projects: { pk: 'project_id', entity: 'project', prefix: 'DA', label: 'Dự án' },
  project_milestones: { pk: 'milestone_id', entity: 'milestone', prefix: 'MS', label: 'Mốc dự án' },
  project_documents: { pk: 'document_id', entity: 'document', prefix: 'TL', label: 'Tài liệu' },
  contracts: { pk: 'contract_id', entity: 'contract', prefix: 'HDONG', label: 'Hợp đồng' },
  invoices: { pk: 'invoice_id', entity: 'invoice', prefix: 'HD', label: 'Hóa đơn' },
  invoice_items: { pk: 'invoice_item_id', entity: 'invoice_item', prefix: 'HDCT', label: 'Dòng hóa đơn' },
  payment_plans: { pk: 'payment_plan_id', entity: 'payment_plan', prefix: 'KHTT', label: 'Kế hoạch thanh toán' },
  payments: { pk: 'payment_id', entity: 'payment', prefix: 'TT', label: 'Thanh toán' },
  design_orders: { pk: 'design_order_id', entity: 'design_order', prefix: 'TK', label: 'Order thiết kế' },
  project_items: { pk: 'project_item_id', entity: 'project_item', prefix: 'HM', label: 'Hạng mục' },
  project_departments: { pk: 'project_department_id', entity: 'project_department', prefix: 'PBDA', label: 'Phòng ban dự án' },
  task_templates: { pk: 'task_template_id', entity: 'task_template', prefix: 'MCV', label: 'Mẫu công việc' },
  project_tasks: { pk: 'task_id', entity: 'task', prefix: 'CV', label: 'Công việc' },
  task_assignments: { pk: 'assignment_id', entity: 'assignment', prefix: 'PC', label: 'Phân công' },
  task_resources: { pk: 'task_resource_id', entity: 'task_resource', prefix: 'VT', label: 'Vật tư' },
  task_vehicles: { pk: 'task_vehicle_id', entity: 'task_vehicle', prefix: 'XE', label: 'Phương tiện' },
  project_handoffs: { pk: 'handoff_id', entity: 'handoff', prefix: 'BGIAO', label: 'Bàn giao' },
  master_data: { pk: 'master_data_id', entity: 'master_data', prefix: 'MD', label: 'Danh mục' },
  departments: { pk: 'department_id', entity: 'department', prefix: 'PB', label: 'Phòng ban' },
  users: { pk: 'user_id', entity: 'user', prefix: 'USR', label: 'Người dùng' },
  role_permissions: { pk: 'permission_id', entity: 'permission', prefix: 'Q', label: 'Phân quyền' },
  demo_scenarios: { pk: 'scenario_id', entity: 'scenario', prefix: 'DEMO', label: 'Kịch bản demo' },
  audit_logs: { pk: 'log_id', entity: 'audit', prefix: 'AUD', label: 'Nhật ký hệ thống', readOnly: true }
});

const DEMO_STAGES = Object.freeze([
  { code: 'lead_received', label: 'Tiếp nhận lead', order: 1 },
  { code: 'qualified', label: 'Tư vấn & báo giá', order: 2 },
  { code: 'deposit_confirmed', label: 'Xác nhận cọc', order: 3 },
  { code: 'design_approved', label: 'Duyệt thiết kế', order: 4 },
  { code: 'operation_started', label: 'Sản xuất & thi công', order: 5 },
  { code: 'event_completed', label: 'Hoàn tất & tất toán', order: 6 }
]);

const FIELD_LABELS = Object.freeze({
  lead_id: 'Mã lead', opportunity_id: 'Mã cơ hội', customer_id: 'Mã khách hàng', project_id: 'Mã dự án',
  invoice_id: 'Mã hóa đơn', payment_id: 'Mã thanh toán', task_id: 'Mã công việc', department_id: 'Phòng ban',
  contact_name: 'Tên liên hệ', phone: 'Số điện thoại', email: 'Email', source_channel: 'Kênh nguồn',
  lead_status: 'Trạng thái lead', consultation_status: 'Trạng thái tư vấn', customer_display_name: 'Tên khách hàng',
  bride_name: 'Tên cô dâu', groom_name: 'Tên chú rể', project_name: 'Tên dự án', service_type: 'Loại đám',
  event_date: 'Ngày tổ chức', event_session: 'Buổi', venue_name: 'Địa điểm', venue_address: 'Địa chỉ',
  project_status: 'Trạng thái dự án', implementation_eligible: 'Đủ điều kiện triển khai',
  contract_value: 'Giá trị hợp đồng', final_amount: 'Phải thu', paid_amount: 'Đã thu', remaining_amount: 'Còn lại',
  invoice_status: 'Trạng thái hóa đơn', payment_stage: 'Đợt thanh toán', amount: 'Số tiền', payment_at: 'Ngày thanh toán',
  payment_status: 'Trạng thái thanh toán', task_name: 'Tên công việc', task_detail: 'Chi tiết',
  planned_start_at: 'Bắt đầu dự kiến', deadline_at: 'Hạn hoàn thành', priority: 'Ưu tiên', task_status: 'Trạng thái',
  progress_percent: 'Tiến độ (%)', is_blocked: 'Đang bị chặn', blocked_reason: 'Lý do bị chặn',
  resource_name: 'Tên vật tư', resource_category: 'Nhóm vật tư', planned_quantity: 'Số lượng dự kiến',
  resource_status: 'Trạng thái vật tư', category: 'Nhóm danh mục', code: 'Mã', label_vi: 'Tên hiển thị',
  department_name: 'Tên phòng ban', full_name: 'Họ tên', role_code: 'Vai trò', user_status: 'Trạng thái tài khoản',
  temporary_password: 'Mật khẩu tạm', new_password: 'Mật khẩu mới', must_change_password: 'Buộc đổi mật khẩu',
  contract_id: 'Mã hợp đồng', contract_number: 'Số hợp đồng', contract_name: 'Tên hợp đồng',
  signed_at: 'Ngày ký', effective_date: 'Ngày hiệu lực', expiry_date: 'Ngày hết hiệu lực', contract_status: 'Trạng thái hợp đồng', file_url: 'Tệp hợp đồng'
  ,attachment_id: 'Mã file', attachment_name: 'Tên file', attachment_type: 'Loại file', description: 'Mô tả',
  lead_note_id: 'Mã ghi chú', note_content: 'Nội dung ghi chú', note_at: 'Thời gian ghi chú', visibility: 'Phạm vi ghi chú'
  ,subtotal_amount: 'Tạm tính', tax_rate: 'Thuế suất (%)', tax_amount: 'Tiền thuế'
});

const DESIGN_ORDER_EXTENSION_SCHEMA = Object.freeze([
  { sheet_name: 'design_orders', purpose: 'Bang cong viec rieng cua phong Thiet ke', field_name: 'parent_design_order_id', data_type: 'text', required: false, description: 'Order cha de hien thi cay phan cong', foreign_key: 'design_orders.design_order_id' },
  { sheet_name: 'design_orders', purpose: 'Bang cong viec rieng cua phong Thiet ke', field_name: 'work_name', data_type: 'text', required: false, description: 'Ten noi bo cua phan cong; order goc duoc tu sinh theo du an', foreign_key: '' },
  { sheet_name: 'design_orders', purpose: 'Bang cong viec rieng cua phong Thiet ke', field_name: 'progress_percent', data_type: 'percent', required: false, description: 'Tien do do nguoi thiet ke khai bao, tu 0 den 100', foreign_key: '' },
  { sheet_name: 'design_orders', purpose: 'Bang cong viec rieng cua phong Thiet ke', field_name: 'result_note', data_type: 'text', required: false, description: 'Ket qua va ghi chu ban giao file thiet ke', foreign_key: '' },
  { sheet_name: 'design_orders', purpose: 'Bang cong viec rieng cua phong Thiet ke', field_name: 'leader_user_id', data_type: 'text', required: false, description: 'Leader team Thiet ke duoc Sale chon de nhan order va tao phan cong con', foreign_key: 'users.user_id' }
]);

const PROJECT_DESIGN_EXTENSION_SCHEMA = Object.freeze([
  { sheet_name: 'projects', purpose: 'Thong tin chung cua du an duoc cac phong ban tham chieu', field_name: 'design_template_type', data_type: 'text', required: false, description: 'Loai mau thiet ke cua du an: new hoac old', foreign_key: '' }
]);

const INVOICE_EXTENSION_SCHEMA = Object.freeze([
  { sheet_name: 'invoices', purpose: 'Hóa đơn chính gắn với từng dự án', field_name: 'subtotal_amount', data_type: 'currency', required: false, description: 'Tổng tiền hàng trước giảm giá, phát sinh và thuế', foreign_key: '' },
  { sheet_name: 'invoices', purpose: 'Hóa đơn chính gắn với từng dự án', field_name: 'tax_rate', data_type: 'percent', required: false, description: 'Thuế suất phần trăm', foreign_key: '' },
  { sheet_name: 'invoices', purpose: 'Hóa đơn chính gắn với từng dự án', field_name: 'tax_amount', data_type: 'currency', required: false, description: 'Tiền thuế được tính từ tạm tính', foreign_key: '' }
]);

const LEAD_EXTENSION_SCHEMAS = Object.freeze({
  lead_attachments: [
    ['attachment_id','text',true,'Mã file tự sinh',''], ['lead_id','text',true,'Lead liên quan','leads.lead_id'],
    ['attachment_name','text',true,'Tên file hiển thị',''], ['attachment_type','text',false,'Loại tài liệu',''],
    ['file_url','url',true,'Đường dẫn Google Drive hoặc file đính kèm',''], ['description','text',false,'Mô tả',''],
    ['created_at','datetime',false,'Thời gian tạo',''], ['created_by','text',false,'Người tạo','users.user_id'],
    ['updated_at','datetime',false,'Thời gian cập nhật',''], ['updated_by','text',false,'Người cập nhật','users.user_id'], ['deleted_at','datetime',false,'Thời gian xóa mềm','']
  ],
  lead_notes: [
    ['lead_note_id','text',true,'Mã ghi chú tự sinh',''], ['lead_id','text',true,'Lead liên quan','leads.lead_id'],
    ['note_content','text',true,'Nội dung ghi chú',''], ['note_at','datetime',false,'Thời gian ghi chú',''],
    ['visibility','text',false,'Phạm vi hiển thị',''],
    ['created_at','datetime',false,'Thời gian tạo',''], ['created_by','text',false,'Người tạo','users.user_id'],
    ['updated_at','datetime',false,'Thời gian cập nhật',''], ['updated_by','text',false,'Người cập nhật','users.user_id'], ['deleted_at','datetime',false,'Thời gian xóa mềm','']
  ]
});

const CONTRACT_SCHEMA = Object.freeze([
  ['contract_id','text',true,'Mã hợp đồng tự sinh',''],
  ['customer_id','text',true,'Khách hàng kết nối','customers.customer_id'],
  ['project_id','text',true,'Dự án áp dụng','projects.project_id'],
  ['contract_number','text',true,'Số hợp đồng',''],
  ['contract_name','text',false,'Tên/nội dung hợp đồng',''],
  ['signed_at','date',false,'Ngày ký',''],
  ['effective_date','date',false,'Ngày hiệu lực',''],
  ['expiry_date','date',false,'Ngày hết hiệu lực',''],
  ['contract_value','currency',false,'Giá trị hợp đồng',''],
  ['contract_status','text',true,'Trạng thái hợp đồng',''],
  ['file_url','url',false,'Liên kết tệp hợp đồng',''],
  ['note','text',false,'Ghi chú',''],
  ['created_at','datetime',false,'Thời gian tạo',''], ['created_by','text',false,'Người tạo','users.user_id'],
  ['updated_at','datetime',false,'Thời gian cập nhật',''], ['updated_by','text',false,'Người cập nhật','users.user_id'],
  ['deleted_at','datetime',false,'Thời gian xóa mềm','']
].map(function (field) {
  return { sheet_name: 'contracts', purpose: 'Quản lý hợp đồng theo khách hàng và dự án', field_name: field[0], data_type: field[1], required: field[2], description: field[3], foreign_key: field[4] };
}));
