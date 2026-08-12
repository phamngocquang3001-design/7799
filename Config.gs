const APP = Object.freeze({
  NAME: 'Wedding Operations SPA',
  VERSION: '2.15.0',
  SPREADSHEET_ID: '1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  CACHE_SECONDS: 300,
  DATA_CACHE_SECONDS: 120,
  SESSION_CACHE_SECONDS: 300,
  DASHBOARD_CACHE_SECONDS: 60,
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
  ['production_plans','Kế hoạch sản xuất','Sản xuất'], ['production_materials','Nguyên vật liệu tổng','Sản xuất'],
  ['production_accessories','Checklist phụ kiện','Sản xuất'], ['production_paints','Sơn','Sản xuất'],
  ['production_letters','Checklist chữ','Sản xuất'], ['production_prints','Checklist PP','Sản xuất'],
  ['warehouse_tasks','Công việc Kho','Kho'], ['logistics_tasks','Công việc Hậu cần','Hậu cần'],
  ['flower_project_plans','Sổ kế hoạch Hoa','Hoa'], ['flower_tasks','Công việc Hoa','Hoa'],
  ['flower_tool_orders','Order CCDC Hoa','Hoa'], ['flower_handoffs','Bàn giao Hoa / Hậu cần','Hoa'], ['flower_materials','Vật tư thi công Hoa','Hoa'],
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
  production_plans: { pk: 'production_plan_id', entity: 'production_plan', prefix: 'KHSX', label: 'Kế hoạch sản xuất' },
  production_materials: { pk: 'production_material_id', entity: 'production_material', prefix: 'NVL', label: 'Nguyên vật liệu tổng' },
  production_accessories: { pk: 'production_accessory_id', entity: 'production_accessory', prefix: 'PKSX', label: 'Checklist phụ kiện' },
  production_paints: { pk: 'production_paint_id', entity: 'production_paint', prefix: 'SON', label: 'Sơn' },
  production_letters: { pk: 'production_letter_id', entity: 'production_letter', prefix: 'CHU', label: 'Checklist chữ' },
  production_prints: { pk: 'production_print_id', entity: 'production_print', prefix: 'PP', label: 'Checklist PP' },
  warehouse_tasks: { pk: 'warehouse_task_id', entity: 'warehouse_task', prefix: 'KHO', label: 'Công việc Kho' },
  logistics_tasks: { pk: 'logistics_task_id', entity: 'logistics_task', prefix: 'HC', label: 'Công việc Hậu cần' },
  flower_project_plans: { pk: 'flower_plan_id', entity: 'flower_project_plan', prefix: 'KHHOA', label: 'Sổ kế hoạch Hoa' },
  flower_tasks: { pk: 'flower_task_id', entity: 'flower_task', prefix: 'CVHOA', label: 'Công việc Hoa' },
  flower_tool_orders: { pk: 'flower_tool_order_id', entity: 'flower_tool_order', prefix: 'CCDC', label: 'Order CCDC Hoa' },
  flower_handoffs: { pk: 'flower_handoff_id', entity: 'flower_handoff', prefix: 'BGHOA', label: 'Bàn giao Hoa / Hậu cần' },
  flower_materials: { pk: 'flower_material_id', entity: 'flower_material', prefix: 'VTHOA', label: 'Vật tư thi công Hoa' },
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
  ,subtotal_amount: 'Tạm tính', tax_rate: 'Thuế suất (%)', tax_amount: 'Tiền thuế',
  production_date: 'Ngày sản xuất', construction_date: 'Ngày thi công', work_date: 'Ngày thực hiện',
  project_item_id: 'Hạng mục thi công', work_detail: 'Chi tiết công việc', production_file_url: 'Hồ sơ sản xuất / SOP',
  production_status: 'Tình trạng sản xuất', assignee_user_id: 'Người thực hiện', completion_at: 'Thời gian hoàn thành',
  material_name: 'Tên vật tư', specification: 'Quy cách', actual_new_quantity: 'Thực tế dùng NVL mới', issue_status: 'Tình trạng cấp',
  accessory_name: 'Phụ kiện', preparation_status: 'Tình trạng chuẩn bị', paint_name: 'Màu / loại sơn',
  checklist_item: 'Nội dung checklist', file_completed: 'Đã hoàn thành file', work_completed: 'Đã hoàn thành',
  material: 'Chất liệu', sheet_quantity: 'Số tấm 1220×2440', product_type: 'Loại sản phẩm',
  demo_paper_1_27_m: 'Demo giấy 1.27m', paper_0_914_m: 'Giấy 0.914m', paper_1_07_m: 'Giấy 1.07m',
  paper_1_27_m: 'Giấy 1.27m', paper_1_52_m: 'Giấy 1.52m', total_m2: 'Tổng m²', completed: 'Hoàn thành', missing_note: 'Còn thiếu',
  work_type: 'Loại công việc', responsible_user_id: 'Người phụ trách', personnel_note: 'Nhân sự tham gia', start_time: 'Bắt đầu', end_time: 'Kết thúc',
  vehicle_type: 'Chủng loại xe', vehicle_quantity: 'Số lượng xe', proposal_deadline: 'Hạn Proposal', flower_status: 'Tình trạng Hoa',
  flower_designer_id: 'Người thiết kế Hoa', has_fresh_table_flowers: 'Hoa tươi bàn Gallery', has_car_flowers: 'Hoa xe', important_note: 'Lưu ý quan trọng',
  flower_work_type: 'Loại công việc Hoa', internal_florist_user_id: 'Nhân sự Hoa nội bộ', external_florist_note: 'Nhân sự Hoa ngoài', parttime_note: 'Nhân sự part-time',
  handoff_date: 'Ngày bàn giao', handoff_item: 'Nội dung bàn giao', actual_additional_quantity: 'Số lượng phát sinh', flower_handoff_id: 'Mã bàn giao Hoa'
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

const PRODUCTION_TABLE_SCHEMAS = Object.freeze({
  production_plans: [
    ['production_plan_id','text',true,'Mã kế hoạch sản xuất tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['production_date','date',true,'Ngày thực hiện sản xuất',''],
    ['construction_date','date',false,'Ngày phải mang hạng mục đi thi công',''],
    ['work_detail','text',true,'Chi tiết công việc phải làm',''],
    ['unit','text',false,'Đơn vị tính',''], ['quantity','decimal',false,'Số lượng',''],
    ['production_file_url','url',false,'Hồ sơ sản xuất hoặc SOP tham chiếu',''],
    ['production_status','text',false,'Tình trạng sản xuất',''],
    ['assignee_user_id','text',false,'Người thực hiện','users.user_id'],
    ['completion_at','datetime',false,'Thời gian hoàn thành',''], ['note','text',false,'Lưu ý và ghi chú','']
  ],
  production_materials: [
    ['production_material_id','text',true,'Mã nguyên vật liệu tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['work_date','date',true,'Ngày chuẩn bị nguyên vật liệu',''],
    ['material_name','text',true,'Tên vật tư cần chuẩn bị',''], ['specification','text',false,'Quy cách vật tư',''],
    ['unit','text',false,'Đơn vị tính',''], ['planned_quantity','decimal',true,'Số lượng dự kiến',''],
    ['actual_new_quantity','decimal',false,'Thực tế sử dụng nguyên vật liệu mới',''],
    ['issue_status','text',false,'Tình trạng đã cấp hoặc còn thiếu',''], ['note','text',false,'Ghi chú','']
  ],
  production_accessories: [
    ['production_accessory_id','text',true,'Mã checklist phụ kiện tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['work_date','date',true,'Ngày chuẩn bị phụ kiện',''],
    ['accessory_name','text',true,'Phụ kiện cần chuẩn bị',''], ['unit','text',false,'Đơn vị tính',''],
    ['quantity','decimal',false,'Số lượng phụ kiện',''], ['preparation_status','text',false,'Tình trạng chuẩn bị',''],
    ['note','text',false,'Ghi chú','']
  ],
  production_paints: [
    ['production_paint_id','text',true,'Mã dòng sơn tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['work_date','date',true,'Ngày thực hiện công việc sơn',''],
    ['paint_name','text',true,'Màu hoặc loại sơn sử dụng',''], ['quantity','decimal',true,'Số lượng sơn',''],
    ['unit','text',false,'Đơn vị tính',''], ['preparation_status','text',false,'Tình trạng chuẩn bị',''],
    ['note','text',false,'Ghi chú','']
  ],
  production_letters: [
    ['production_letter_id','text',true,'Mã checklist chữ tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['work_date','date',true,'Ngày thực hiện chữ mỹ thuật/CNC',''],
    ['checklist_item','text',true,'Nội dung chữ hoặc vật tư cần làm',''],
    ['file_completed','boolean',false,'Đã hoàn thành file CNC',''], ['work_completed','boolean',false,'Đã hoàn thành sản xuất',''],
    ['material','text',false,'Chất liệu chữ',''], ['sheet_quantity','decimal',false,'Số lượng tấm 1220x2440',''],
    ['note','text',false,'Ghi chú','']
  ],
  production_prints: [
    ['production_print_id','text',true,'Mã checklist PP tự sinh',''],
    ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['project_item_id','text',true,'Hạng mục thi công của dự án','project_items.project_item_id'],
    ['production_date','date',true,'Ngày sản xuất',''], ['product_type','text',true,'Loại sản phẩm in',''],
    ['demo_paper_1_27_m','decimal',false,'Mét giấy demo khổ 1.27m',''],
    ['paper_0_914_m','decimal',false,'Mét giấy khổ 0.914m',''], ['paper_1_07_m','decimal',false,'Mét giấy khổ 1.07m',''],
    ['paper_1_27_m','decimal',false,'Mét giấy khổ 1.27m',''], ['paper_1_52_m','decimal',false,'Mét giấy khổ 1.52m',''],
    ['total_m2','decimal',false,'Tổng diện tích giấy tự tính',''],
    ['production_status','text',false,'Tình trạng sản xuất',''], ['completed','boolean',false,'Đã hoàn thành',''],
    ['missing_note','text',false,'Nội dung còn thiếu',''], ['note','text',false,'Ghi chú','']
  ]
});

const PRODUCTION_AUDIT_SCHEMA = Object.freeze([
  ['created_at','datetime',false,'Thời gian tạo',''], ['created_by','text',false,'Người tạo','users.user_id'],
  ['updated_at','datetime',false,'Thời gian cập nhật',''], ['updated_by','text',false,'Người cập nhật','users.user_id'],
  ['deleted_at','datetime',false,'Thời gian xóa mềm','']
]);

const BATCH_IDEMPOTENCY_SCHEMA = Object.freeze([
  ['batch_request_id','text',false,'Mã yêu cầu lưu hàng loạt để chống ghi trùng khi retry','']
]);

function productionSchema_(entity) {
  const purpose = 'Bảng nghiệp vụ riêng của phòng Sản xuất, liên kết dự án và hạng mục thi công';
  return (PRODUCTION_TABLE_SCHEMAS[entity] || []).concat(BATCH_IDEMPOTENCY_SCHEMA, PRODUCTION_AUDIT_SCHEMA).map(function (field) {
    return { sheet_name: entity, purpose: purpose, field_name: field[0], data_type: field[1], required: field[2], description: field[3], foreign_key: field[4] };
  });
}

const DEPARTMENT_OPERATION_TABLE_SCHEMAS = Object.freeze({
  warehouse_tasks: [
    ['warehouse_task_id','text',true,'Mã công việc Kho tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['work_date','date',true,'Ngày thực hiện',''], ['work_type','text',true,'Loại công việc Kho',''], ['work_detail','text',false,'Tên đám hoặc chi tiết công việc',''],
    ['responsible_user_id','text',false,'Người phụ trách','users.user_id'], ['personnel_note','text',false,'Nhân sự tham gia',''],
    ['start_time','text',false,'Giờ bắt đầu',''], ['end_time','text',false,'Giờ kết thúc',''], ['work_status','text',false,'Tình trạng công việc',''],
    ['vehicle_type','text',false,'Chủng loại xe',''], ['vehicle_quantity','decimal',false,'Số lượng xe',''],
    ['project_item_id','text',false,'Hạng mục thi công','project_items.project_item_id'], ['note','text',false,'Lưu ý','']
  ],
  logistics_tasks: [
    ['logistics_task_id','text',true,'Mã công việc Hậu cần tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['work_date','date',true,'Ngày thực hiện',''], ['work_type','text',true,'Loại công việc Hậu cần',''], ['work_detail','text',false,'Tên đám hoặc chi tiết công việc',''],
    ['responsible_user_id','text',false,'Người phụ trách','users.user_id'], ['personnel_note','text',false,'Nhân sự tham gia',''],
    ['start_time','text',false,'Giờ bắt đầu',''], ['end_time','text',false,'Giờ kết thúc',''], ['work_status','text',false,'Tình trạng công việc',''],
    ['vehicle_type','text',false,'Chủng loại xe',''], ['vehicle_quantity','decimal',false,'Số lượng xe',''],
    ['project_item_id','text',false,'Hạng mục thi công','project_items.project_item_id'], ['note','text',false,'Lưu ý','']
  ],
  flower_project_plans: [
    ['flower_plan_id','text',true,'Mã kế hoạch Hoa tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['proposal_deadline','datetime',false,'Hạn hoàn thành Proposal',''], ['flower_status','text',false,'Tình trạng kế hoạch Hoa',''],
    ['flower_designer_id','text',false,'Người thiết kế Hoa','users.user_id'], ['has_fresh_table_flowers','boolean',false,'Có hoa tươi bàn Gallery',''],
    ['has_car_flowers','boolean',false,'Có hoa xe',''], ['important_note','text',false,'Lưu ý quan trọng','']
  ],
  flower_tasks: [
    ['flower_task_id','text',true,'Mã công việc Hoa tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['work_date','date',true,'Ngày thực hiện',''], ['flower_work_type','text',true,'Loại công việc Hoa',''], ['work_detail','text',false,'Chi tiết công việc',''],
    ['start_time','text',false,'Giờ bắt đầu',''], ['end_time','text',false,'Giờ kết thúc',''],
    ['internal_florist_user_id','text',false,'Nhân sự Hoa nội bộ','users.user_id'], ['external_florist_note','text',false,'Nhân sự Hoa ngoài',''],
    ['parttime_note','text',false,'Nhân sự part-time',''], ['work_status','text',false,'Tình trạng công việc',''], ['note','text',false,'Ghi chú','']
  ],
  flower_tool_orders: [
    ['flower_tool_order_id','text',true,'Mã order CCDC tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['work_date','date',true,'Ngày chuẩn bị',''], ['project_item_id','text',false,'Khu vực / hạng mục','project_items.project_item_id'],
    ['checklist_item','text',true,'CCDC cần chuẩn bị',''], ['unit','text',false,'Đơn vị',''], ['quantity','decimal',false,'Số lượng',''],
    ['preparation_status','text',false,'Tình trạng chuẩn bị',''], ['note','text',false,'Ghi chú','']
  ],
  flower_handoffs: [
    ['flower_handoff_id','text',true,'Mã bàn giao tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['handoff_date','date',true,'Ngày bàn giao',''], ['project_item_id','text',false,'Khu vực / hạng mục','project_items.project_item_id'],
    ['handoff_item','text',true,'Nội dung bàn giao',''], ['unit','text',false,'Đơn vị',''], ['quantity','decimal',false,'Số lượng',''],
    ['handoff_status','text',false,'Tình trạng bàn giao',''], ['note','text',false,'Ghi chú','']
  ],
  flower_materials: [
    ['flower_material_id','text',true,'Mã vật tư Hoa tự sinh',''], ['project_id','text',true,'Dự án tham chiếu tự động','projects.project_id'],
    ['work_date','date',true,'Ngày chuẩn bị',''], ['material_name','text',true,'Tên vật tư thi công',''], ['unit','text',false,'Đơn vị',''],
    ['planned_quantity','decimal',false,'Số lượng dự kiến',''], ['actual_additional_quantity','decimal',false,'Số lượng phát sinh thực tế',''],
    ['preparation_status','text',false,'Tình trạng chuẩn bị',''], ['note','text',false,'Ghi chú','']
  ]
});

function departmentOperationSchema_(entity) {
  const purpose = 'Bảng nghiệp vụ riêng theo phòng ban, tự tham chiếu dự án đang mở';
  return (DEPARTMENT_OPERATION_TABLE_SCHEMAS[entity] || []).concat(BATCH_IDEMPOTENCY_SCHEMA, PRODUCTION_AUDIT_SCHEMA).map(function (field) {
    return { sheet_name: entity, purpose: purpose, field_name: field[0], data_type: field[1], required: field[2], description: field[3], foreign_key: field[4] };
  });
}

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
