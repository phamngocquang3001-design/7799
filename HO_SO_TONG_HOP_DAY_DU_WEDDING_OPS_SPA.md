# HỒ SƠ TỔNG HỢP ĐẦY ĐỦ — WEDDING OPERATIONS SPA APPS SCRIPT

> Tài liệu nguồn chuẩn để chuyển cho AI Agent, PM hoặc Dev tiếp tục dự án. Nội dung hợp nhất yêu cầu nghiệp vụ, thiết kế dữ liệu, cấu trúc workbook thật, chức năng SPA, mã nguồn, mô phỏng, cách triển khai và trạng thái thực tế. Không coi các nội dung “đã thiết kế”, “đã có mã cục bộ” và “đã triển khai lên Google” là cùng một trạng thái.

**Ngày chốt hồ sơ:** 10/08/2026
**Múi giờ nghiệp vụ:** `Asia/Ho_Chi_Minh`

## 1. Yêu cầu nguyên văn theo nghĩa nghiệp vụ

1. Từ quy trình vận hành doanh nghiệp tổ chức đám cưới, xây dựng cơ sở dữ liệu liên kết thay cho các file/tab rời rạc theo phòng ban, ngày hoặc tháng.
2. Tạo toàn bộ bảng trong một Google Spreadsheet để dùng làm nguồn dữ liệu cho Web App dạng SPA chạy trên Google Apps Script.
3. Xây dựng hệ thống quản lý có chức năng thêm, sửa, xóa công việc và các loại dữ liệu bổ sung.
4. Hệ thống phải bám quy trình vận hành thực tế; có thể giả lập một đám cưới điển hình, chạy tuần tự các kịch bản trên chính ứng dụng và tạo dữ liệu liên kết thật.
5. Mã nguồn phải gắn với Apps Script ID đã cung cấp và đọc/ghi đúng Spreadsheet đã tạo.
6. Cơ chế tải mã lên Apps Script phải theo hướng dẫn chính thức của Google, dùng Apps Script API/`clasp push`; không dán thủ công từng file.
7. Khi cần xác thực Google, người dùng tự đăng nhập; không gửi mật khẩu, cookie hoặc OTP qua chat.
8. Ứng dụng có thể được bọc dưới domain/subdomain riêng bằng iframe để người dùng thông thường không nhìn thấy URL `script.google.com` trên thanh địa chỉ. Apps Script phải bật `XFrameOptionsMode.ALLOWALL`. Cần hiểu rõ iframe chỉ che URL ở mức giao diện; người có kỹ thuật vẫn có thể thấy URL gốc trong DevTools/Network.
9. Apps Script có thể chứa hàng nghìn dòng mã; yêu cầu tổ chức theo module, dùng `clasp` và nên quản lý bằng Git. Giới hạn thực tế cần theo dõi là thời gian chạy, quota, đồng thời và khả năng bảo trì, không phải một giới hạn số dòng được công bố.
10. Không lược bỏ ngữ cảnh, không thiết kế lại từ đầu khi đã có workbook và mã nguồn cục bộ.

## 2. Mục tiêu và phạm vi hệ thống

Xây dựng Mini ERP/Wedding Operations SPA quản lý xuyên suốt từ lead đến hoàn tất sự kiện:

`lead_id → opportunity_id → customer_id → project_id → invoice_id/project_item_id → task_id → resource/assignment`

Các phân hệ cần có:

- Dashboard tổng quan.
- Lead, cơ hội bán hàng, lịch sử chăm sóc, khảo sát và báo giá.
- Khách hàng thực tế và nhiều dự án/loại đám trên cùng khách hàng.
- Hóa đơn, kế hoạch thanh toán, từng giao dịch thanh toán và công nợ.
- Order thiết kế, Proposal, hạng mục khách duyệt và tài liệu dự án.
- Công việc theo dự án, phòng ban, nhân sự, ngày và trạng thái.
- Phân công, vật tư, phương tiện và bàn giao liên phòng ban.
- Danh mục, người dùng, vai trò/quyền, mẫu công việc, audit và sinh ID.
- Màn hình mô phỏng toàn bộ một đám cưới điển hình.

Ngoài phạm vi của bước triển khai SPA hiện tại: xây workflow n8n. n8n có thể là giai đoạn tự động hóa tiếp theo sau khi dữ liệu và quy trình SPA ổn định.

## 3. Tài nguyên và ID bắt buộc

| Tài nguyên | Giá trị |
| --- | --- |
| Google Spreadsheet | https://docs.google.com/spreadsheets/d/1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs/edit |
| Spreadsheet ID | `1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs` |
| Apps Script ID | `1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI` |
| Thư mục mã nguồn | `wedding_spa_app/` |
| Gói mã nguồn | `wedding_ops_spa_appscript.zip` |
| Workbook Excel | `outputs/wedding_spa_database/CSDL_Quan_ly_Du_an_Cuoi_SPA_AppsScript.xlsx` |
| Hồ sơ bàn giao cũ | `BAN_GIAO_AI_AGENT_WEDDING_OPS_SPA.md` |
| Gói bàn giao cũ | `GOI_BAN_GIAO_AI_AGENT_WEDDING_OPS_SPA_20260810.zip` |
| URL Web App `/exec` | Chưa có; chưa deploy thành công trong hội thoại này |

## 4. Nguyên tắc kiến trúc dữ liệu đã chốt

- Google Sheets là cơ sở dữ liệu trung tâm; Google Drive giữ file lớn, Sheet chỉ giữ ID, metadata, URL và phiên bản.
- Không hợp nhất mọi nghiệp vụ thành một sheet lớn. Dùng nhiều bảng liên kết và nhiều view theo vai trò.
- Không dùng tên cô dâu–chú rể, ngày cưới hoặc tên đám làm khóa chính vì có thể trùng hoặc thay đổi.
- Khách hàng chính thức chỉ được tạo sau khi khoản cọc đầu tiên được xác nhận.
- Một cặp cô dâu–chú rể là một khách hàng; mỗi loại đám/dịch vụ là một dự án riêng nhưng dùng chung `customer_id`.
- Không lưu `Tráp + TG + HT` trong một ô; phải tạo các dòng dự án riêng.
- Thanh toán: mỗi lần chuyển tiền là một dòng trong `payments`; không gộp nhiều lần thanh toán vào một ô hóa đơn.
- `paid_amount`, `remaining_amount`, `invoice_status` phải được đồng bộ/tính từ các giao dịch `confirmed`.
- Proposal vẫn là tài liệu hình ảnh, nhưng dữ liệu triển khai phải được bóc tách thành `project_items`.
- Công việc được khởi tạo theo `project_id` và phòng ban; lịch ngày chỉ là view lọc từ `project_tasks`.
- Không nhập lại tên khách hàng, điện thoại, địa chỉ, Sale và Proposal trong bảng công việc; truy ngược bằng ID.
- Không tạo sheet riêng cho mỗi ngày hoặc mỗi tháng.
- Xóa dữ liệu nghiệp vụ bằng `deleted_at`; không xóa vật lý.
- Sinh mã đồng thời bằng `LockService` + `id_sequences` để tránh trùng.
- Tất cả ngày/giờ dùng `Asia/Ho_Chi_Minh`.
- Ghi audit các thao tác chính và giữ khóa chính không đổi sau khi tạo.

## 5. Hệ thống mã định danh

| Đối tượng | Mẫu mã | Ví dụ/tiền tố |
| --- | --- | --- |
| Lead | `lead_id` | `LD000125` / `LD` |
| Cơ hội tư vấn | `opportunity_id` | `OP000084` / `OP` |
| Khách hàng | `customer_id` | `KH000328` / `KH` |
| Dự án/đám | `project_id` | `DA000572` / `DA` |
| Mã đám hiển thị | `event_code` | `080826_NT_HT` |
| Báo giá | `quotation_id` | `BG000572_V2` / `BG` |
| Hóa đơn | `invoice_id` | `HD000572` / `HD` |
| Thanh toán | `payment_id` | `TT001248` / `TT` |
| Hạng mục | `project_item_id` | `HM004821` / `HM` |
| Công việc | `task_id` | `CV012548` / `CV` |
| Nhu cầu vật tư | `task_resource_id` | `VT008742` / `VT` |

Mã nguồn còn cấu hình các tiền tố: `HDTV`, `KS`, `BGC`, `LH`, `MS`, `TL`, `HDCT`, `KHTT`, `TK`, `PBDA`, `MCV`, `PC`, `XE`, `BGIAO`, `MD`, `PB`, `USR`, `Q`, `DEMO`.

## 6. Sơ đồ quan hệ tổng quan

`leads → sales_opportunities → customers → projects → invoices/payments → project_items → project_tasks → task_resources/task_assignments/task_vehicles`

Một số nhánh song song:

- `sales_opportunities → sales_activities / surveys / quotations / quotation_items`.
- `projects → project_milestones / project_documents / design_orders / project_departments / project_handoffs`.
- `invoices → invoice_items / payment_plans / payments`.
- `project_tasks → task_assignments / task_resources / task_vehicles`.

## 7. Số lượng sheet và điểm chênh lệch cần biết

- Workbook Excel hiện có **35 sheet**: `00_huong_dan`, `app_config`, `id_sequences`, `master_data`, `departments`, `users`, `role_permissions`, `leads`, `sales_opportunities`, `sales_activities`, `surveys`, `quotations`, `quotation_items`, `customers`, `customer_contacts`, `projects`, `project_milestones`, `project_documents`, `invoices`, `invoice_items`, `payment_plans`, `payments`, `design_orders`, `project_items`, `project_departments`, `task_templates`, `project_tasks`, `task_assignments`, `task_resources`, `task_vehicles`, `project_handoffs`, `audit_logs`, `data_dictionary`, `table_relationships`, `view_specs`.
- `data_dictionary` có **516 dòng tính cả header**, tương ứng **515 mô tả trường**. Phản hồi trước từng ghi “516 trường”; hồ sơ này giữ lại lịch sử đó nhưng dùng số đếm thực tế để tránh hiểu nhầm.
- `demo_scenarios` chưa có trong workbook Excel gốc; `setupSystem_()` của Apps Script tạo bảng này khi ứng dụng tải lần đầu. Sau setup, hệ thống dự kiến có **36 sheet**.

## 8. Mô tả đầy đủ mọi bảng và mọi trường

Các bảng dưới đây được lấy từ `data_dictionary` của workbook thật. Mỗi bảng có tên trường, kiểu dữ liệu, bắt buộc, mô tả, khóa ngoại và quy tắc SPA. Năm trường audit dùng phổ biến là `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`.

### 1. `app_config`

**Mục đích:** Cấu hình dùng chung cho SPA và Apps Script

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| config_key | text | Có | Khóa cấu hình duy nhất |  |  |
| config_value | text | Có | Giá trị cấu hình |  |  |
| data_type | enum | Có | Kiểu dữ liệu của giá trị |  |  |
| description | text | Không | Diễn giải |  |  |
| is_active | boolean | Có | Cấu hình còn hiệu lực |  |  |

### 2. `id_sequences`

**Mục đích:** Bộ đếm sinh mã an toàn trong Apps Script LockService

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| entity_type | text | Có | Tên đối tượng |  |  |
| prefix | text | Có | Tiền tố mã |  |  |
| current_value | integer | Có | Giá trị hiện tại |  |  |
| padding_length | integer | Có | Số chữ số |  |  |
| updated_at | datetime | Không | Lần cấp mã gần nhất |  |  |

### 3. `master_data`

**Mục đích:** Danh mục dùng chung; category + code là khóa duy nhất

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| master_data_id | text | Có | Mã dòng danh mục |  | Không cho sửa sau khi tạo nếu là khóa chính |
| category | text | Có | Nhóm danh mục |  |  |
| code | text | Có | Mã không dấu |  |  |
| label_vi | text | Có | Tên hiển thị tiếng Việt |  |  |
| parent_code | text | Không | Mã cha nếu có |  |  |
| sort_order | integer | Không | Thứ tự hiển thị |  |  |
| is_active | boolean | Có | Còn sử dụng |  |  |
| description | text | Không | Diễn giải |  |  |

### 4. `departments`

**Mục đích:** Phòng ban tham gia vận hành

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| department_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| department_code | text | Có | Mã phòng ban |  |  |
| department_name | text | Có | Tên phòng ban |  |  |
| leader_user_id | text | Không | Người phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| is_active | boolean | Có | Còn hoạt động |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 5. `users`

**Mục đích:** Người dùng đăng nhập SPA

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| user_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| email | email | Có | Email Google đăng nhập |  |  |
| full_name | text | Có | Họ tên |  |  |
| phone | phone | Không | Điện thoại |  |  |
| department_id | text | Không | Phòng ban chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| role_code | text | Có | Vai trò |  |  |
| user_status | enum | Có | Trạng thái tài khoản |  |  |
| last_login_at | datetime | Không | Đăng nhập gần nhất |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 6. `role_permissions`

**Mục đích:** Phân quyền theo vai trò và tài nguyên

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| permission_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| role_code | text | Có | Mã vai trò |  |  |
| resource_code | text | Có | Màn hình hoặc bảng dữ liệu |  |  |
| can_view | boolean | Có | Quyền xem |  |  |
| can_create | boolean | Có | Quyền tạo |  |  |
| can_update | boolean | Có | Quyền sửa |  |  |
| can_delete | boolean | Có | Quyền xóa mềm |  |  |
| data_scope | enum | Có | Phạm vi dữ liệu |  |  |
| is_active | boolean | Có | Còn hiệu lực |  |  |

### 7. `leads`

**Mục đích:** Lead thô từ các kênh nhắn tin và giới thiệu

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| lead_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| source_channel | enum | Có | Kênh nguồn |  |  |
| source_name | text | Không | Tên nguồn/chiến dịch |  |  |
| source_conversation_id | text | Không | ID hội thoại nguồn |  | Không cho sửa sau khi tạo nếu là khóa chính |
| contact_name | text | Không | Tên liên hệ ban đầu |  |  |
| phone | phone | Không | Số điện thoại |  |  |
| email | email | Không | Email |  |  |
| facebook_url | url | Không | Link Facebook |  |  |
| raw_need | text | Không | Nhu cầu thô |  |  |
| raw_message | text | Không | Tin nhắn gốc |  |  |
| lead_status | enum | Có | Trạng thái lead |  |  |
| duplicate_of_lead_id | text | Không | Lead trùng |  | Không cho sửa sau khi tạo nếu là khóa chính |
| assigned_sales_id | text | Không | Sale phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 8. `sales_opportunities`

**Mục đích:** Lead đã lọc để Sale tư vấn

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| opportunity_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| lead_id | text | Có | Liên kết lead | leads.lead_id | Không cho sửa sau khi tạo nếu là khóa chính |
| sales_id | text | Có | Sale phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| bride_name_provisional | text | Không | Tên cô dâu tạm |  |  |
| groom_name_provisional | text | Không | Tên chú rể tạm |  |  |
| contact_role | enum | Không | Vai trò người liên hệ |  |  |
| expected_event_date | date | Không | Ngày dự kiến |  |  |
| expected_event_month | text | Không | Tháng cưới dự kiến |  |  |
| interested_service | text | Không | Dịch vụ quan tâm |  |  |
| interested_style | text | Không | Mẫu mã/phong cách |  |  |
| tone_color | text | Không | Tone màu |  |  |
| customer_issue | text | Không | Vấn đề quan tâm |  |  |
| data_evaluation | text | Không | Đánh giá dữ liệu |  |  |
| aftercare_evaluation | text | Không | Đánh giá sau chăm sóc |  |  |
| next_followup_at | datetime | Không | Ngày chăm sóc tiếp |  |  |
| consultation_status | enum | Có | Trạng thái tư vấn |  |  |
| estimated_value | currency | Không | Giá trị dự kiến |  |  |
| lost_reason | text | Không | Lý do không đặt |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 9. `sales_activities`

**Mục đích:** Lịch sử gọi, nhắn và chăm sóc cơ hội

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| activity_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| opportunity_id | text | Có | Cơ hội | sales_opportunities.opportunity_id | Không cho sửa sau khi tạo nếu là khóa chính |
| activity_type | enum | Có | Loại hoạt động |  |  |
| activity_at | datetime | Có | Thời điểm |  |  |
| sales_id | text | Có | Sale thực hiện |  | Không cho sửa sau khi tạo nếu là khóa chính |
| content | text | Không | Nội dung trao đổi |  |  |
| customer_response | text | Không | Phản hồi khách |  |  |
| next_action | text | Không | Việc tiếp theo |  |  |
| next_action_at | datetime | Không | Hẹn lần sau |  |  |
| result | enum | Không | Kết quả |  |  |
| attachment_url | url | Không | Tệp đính kèm |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 10. `surveys`

**Mục đích:** Yêu cầu và kết quả khảo sát thực địa

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| survey_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| opportunity_id | text | Có | Cơ hội liên quan | sales_opportunities.opportunity_id | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Không | Dự án nếu đã khởi tạo |  | Không cho sửa sau khi tạo nếu là khóa chính |
| requested_by | text | Có | Người yêu cầu |  |  |
| surveyor_id | text | Không | Người khảo sát |  | Không cho sửa sau khi tạo nếu là khóa chính |
| survey_date | datetime | Không | Lịch khảo sát |  |  |
| location | text | Không | Địa điểm |  |  |
| contact_person | text | Không | Người liên hệ |  |  |
| contact_phone | phone | Không | Số điện thoại |  |  |
| survey_requirements | text | Không | Yêu cầu khảo sát |  |  |
| actual_dimensions | text | Không | Kích thước thực tế |  |  |
| site_conditions | text | Không | Điều kiện mặt bằng |  |  |
| access_conditions | text | Không | Điều kiện vận chuyển/tiếp cận |  |  |
| survey_result | text | Không | Kết quả |  |  |
| photo_folder_url | url | Không | Thư mục ảnh |  |  |
| survey_status | enum | Có | Trạng thái |  |  |
| handover_at | datetime | Không | Thời điểm bàn giao |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 11. `quotations`

**Mục đích:** Báo giá sơ bộ và báo giá sau khảo sát

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| quotation_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| opportunity_id | text | Có | Cơ hội | sales_opportunities.opportunity_id | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Không | Dự án sau khi chốt |  | Không cho sửa sau khi tạo nếu là khóa chính |
| quotation_type | enum | Có | Loại báo giá |  |  |
| version_no | integer | Có | Phiên bản |  |  |
| quotation_date | date | Có | Ngày báo giá |  |  |
| valid_until | date | Không | Hiệu lực đến |  |  |
| estimated_min | currency | Không | Giá tối thiểu |  |  |
| estimated_max | currency | Không | Giá tối đa |  |  |
| subtotal_amount | currency | Không | Tạm tính |  |  |
| discount_amount | currency | Không | Giảm giá |  |  |
| final_amount | currency | Không | Giá cuối |  |  |
| quotation_status | enum | Có | Trạng thái |  |  |
| file_url | url | Không | Link báo giá |  |  |
| approved_at | datetime | Không | Thời điểm khách duyệt |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 12. `quotation_items`

**Mục đích:** Chi tiết hạng mục của báo giá

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| quotation_item_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| quotation_id | text | Có | Báo giá | quotations.quotation_id | Không cho sửa sau khi tạo nếu là khóa chính |
| service_group | text | Không | Nhóm dịch vụ |  |  |
| item_name | text | Có | Tên hạng mục |  |  |
| description | text | Không | Mô tả |  |  |
| unit | text | Không | Đơn vị |  |  |
| quantity | decimal | Không | Số lượng |  |  |
| unit_price | currency | Không | Đơn giá |  |  |
| amount | currency | Không | Thành tiền |  |  |
| sort_order | integer | Không | Thứ tự |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 13. `customers`

**Mục đích:** Khách hàng thực tế sau khi xác nhận cọc

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| customer_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| opportunity_id | text | Có | Cơ hội nguồn | sales_opportunities.opportunity_id | Không cho sửa sau khi tạo nếu là khóa chính |
| customer_display_name | text | Có | Tên hiển thị CD - CR |  |  |
| bride_name | text | Không | Tên cô dâu |  |  |
| groom_name | text | Không | Tên chú rể |  |  |
| primary_contact_id | text | Không | Người liên hệ chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| customer_status | enum | Có | Trạng thái |  |  |
| customer_folder_url | url | Không | Thư mục hồ sơ |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 14. `customer_contacts`

**Mục đích:** Người liên hệ của khách hàng

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| contact_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| customer_id | text | Có | Khách hàng | customers.customer_id | Không cho sửa sau khi tạo nếu là khóa chính |
| contact_name | text | Có | Tên người liên hệ |  |  |
| contact_role | enum | Không | Vai trò |  |  |
| phone | phone | Không | Số điện thoại |  |  |
| email | email | Không | Email |  |  |
| facebook_url | url | Không | Facebook |  |  |
| address | text | Không | Địa chỉ |  |  |
| is_primary | boolean | Có | Liên hệ chính |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 15. `projects`

**Mục đích:** Mỗi loại đám/dịch vụ là một dự án

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| project_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| customer_id | text | Có | Khách hàng | customers.customer_id | Không cho sửa sau khi tạo nếu là khóa chính |
| event_code | text | Có | Mã đám hiển thị |  |  |
| project_name | text | Có | Tên dự án |  |  |
| service_type | enum | Có | Loại đám/dịch vụ |  |  |
| event_name | text | Không | Tên sự kiện |  |  |
| event_date | date | Có | Ngày tổ chức |  |  |
| event_session | enum | Không | Buổi tổ chức |  |  |
| venue_type | enum | Không | Loại địa điểm |  |  |
| venue_name | text | Không | Tên địa điểm |  |  |
| venue_address | text | Không | Địa chỉ |  |  |
| province | text | Không | Tỉnh/thành |  |  |
| sales_id | text | Có | Sale phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_manager_id | text | Không | PM phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_status | enum | Có | Trạng thái dự án |  |  |
| complexity_level | enum | Không | Mức độ phức tạp |  |  |
| deposit_confirmed_at | datetime | Không | Xác nhận cọc đầu |  |  |
| implementation_eligible | boolean | Có | Đủ điều kiện triển khai |  |  |
| important_note | text | Không | Lưu ý quan trọng |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 16. `project_milestones`

**Mục đích:** Mốc quan trọng của dự án

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| milestone_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| milestone_type | enum | Có | Loại mốc |  |  |
| planned_at | datetime | Không | Kế hoạch |  |  |
| actual_at | datetime | Không | Thực tế |  |  |
| milestone_status | enum | Có | Trạng thái |  |  |
| owner_department_id | text | Không | Phòng ban phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 17. `project_documents`

**Mục đích:** Tài liệu hợp đồng, Proposal, thiết kế và nghiệm thu

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| document_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| document_type | enum | Có | Loại tài liệu |  |  |
| document_name | text | Có | Tên tài liệu |  |  |
| file_url | url | Có | Link file |  |  |
| version_no | integer | Không | Phiên bản |  |  |
| document_status | enum | Có | Trạng thái |  |  |
| approved_by_customer | boolean | Không | Khách đã duyệt |  |  |
| approved_at | datetime | Không | Thời điểm duyệt |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 18. `invoices`

**Mục đích:** Hóa đơn chính gắn với từng dự án

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| invoice_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| invoice_number | text | Có | Số hóa đơn/mã công nợ |  |  |
| contract_value | currency | Có | Giá trị hợp đồng |  |  |
| discount_amount | currency | Không | Giảm giá |  |  |
| extra_amount | currency | Không | Phát sinh |  |  |
| final_amount | currency | Có | Tổng phải thu |  |  |
| paid_amount | currency | Không | Đã thu; đồng bộ từ payments |  |  |
| remaining_amount | currency | Không | Còn phải thu |  |  |
| difference_amount | currency | Không | Chênh lệch |  |  |
| invoice_status | enum | Có | Trạng thái |  |  |
| issued_at | date | Không | Ngày phát hành |  |  |
| due_at | date | Không | Hạn thanh toán |  |  |
| sales_id | text | Có | Sale theo dõi |  | Không cho sửa sau khi tạo nếu là khóa chính |
| accountant_id | text | Không | Kế toán theo dõi |  | Không cho sửa sau khi tạo nếu là khóa chính |
| source_document_url | url | Không | Chứng từ nguồn |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 19. `invoice_items`

**Mục đích:** Ảnh chụp chi tiết giá trị tại thời điểm xuất hóa đơn

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| invoice_item_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| invoice_id | text | Có | Hóa đơn | invoices.invoice_id | Không cho sửa sau khi tạo nếu là khóa chính |
| project_item_id | text | Không | Hạng mục dự án |  | Không cho sửa sau khi tạo nếu là khóa chính |
| item_name | text | Có | Tên hạng mục |  |  |
| description | text | Không | Mô tả |  |  |
| unit | text | Không | Đơn vị |  |  |
| quantity | decimal | Không | Số lượng |  |  |
| unit_price | currency | Không | Đơn giá |  |  |
| amount | currency | Không | Thành tiền |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 20. `payment_plans`

**Mục đích:** Các mốc phải thanh toán theo hợp đồng

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| payment_plan_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| invoice_id | text | Có | Hóa đơn | invoices.invoice_id | Không cho sửa sau khi tạo nếu là khóa chính |
| payment_stage | enum | Có | Giai đoạn thanh toán |  |  |
| sequence_no | integer | Có | Thứ tự |  |  |
| expected_percentage | percent | Không | Tỷ lệ dự kiến |  |  |
| expected_amount | currency | Có | Số tiền dự kiến |  |  |
| due_date | date | Không | Hạn thu |  |  |
| condition_to_collect | text | Không | Điều kiện thu |  |  |
| plan_status | enum | Có | Trạng thái |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 21. `payments`

**Mục đích:** Mỗi lần thu/chi/hoàn tiền là một giao dịch

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| payment_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| invoice_id | text | Có | Hóa đơn | invoices.invoice_id | Không cho sửa sau khi tạo nếu là khóa chính |
| payment_plan_id | text | Không | Mốc thanh toán |  | Không cho sửa sau khi tạo nếu là khóa chính |
| payment_stage | enum | Có | Giai đoạn |  |  |
| payment_at | datetime | Có | Thời điểm giao dịch |  |  |
| amount | currency | Có | Số tiền; hoàn tiền ghi số âm |  |  |
| payment_method | enum | Có | Phương thức |  |  |
| transaction_reference | text | Không | Mã giao dịch |  |  |
| receipt_url | url | Không | Chứng từ |  |  |
| received_by | text | Không | Người nhận |  |  |
| confirmed_by | text | Không | Người xác nhận |  |  |
| confirmed_at | datetime | Không | Thời điểm xác nhận |  |  |
| payment_status | enum | Có | Trạng thái |  |  |
| source_reference | text | Không | Nguồn chứng từ |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 22. `design_orders`

**Mục đích:** Order và theo dõi thiết kế

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| design_order_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| ordered_by | text | Có | Người order |  |  |
| ordered_at | datetime | Có | Thời điểm order |  |  |
| design_type | enum | Có | Loại thiết kế |  |  |
| template_type | enum | Không | Loại template |  |  |
| proposal_input_url | url | Không | Đầu vào Proposal |  |  |
| designer_id | text | Không | Designer |  | Không cho sửa sau khi tạo nếu là khóa chính |
| assigned_at | datetime | Không | Thời điểm phân |  |  |
| due_at | datetime | Không | Deadline |  |  |
| progress_status | enum | Có | Trạng thái |  |  |
| revision_count | integer | Không | Số lần sửa |  |  |
| kpi_days | integer | Không | KPI ngày |  |  |
| extended_days | integer | Không | Số ngày gia hạn |  |  |
| internal_approved_at | datetime | Không | Duyệt nội bộ |  |  |
| customer_approved_at | datetime | Không | Khách duyệt |  |  |
| final_design_url | url | Không | Thiết kế cuối |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 23. `project_items`

**Mục đích:** Hạng mục khách đã chốt trong Proposal

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| project_item_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| item_group | text | Không | Nhóm hạng mục |  |  |
| item_name | text | Có | Tên hạng mục |  |  |
| description | text | Không | Mô tả |  |  |
| dimensions | text | Không | Kích thước |  |  |
| structure | text | Không | Kết cấu |  |  |
| main_material | text | Không | Vật liệu chính |  |  |
| flower_material | text | Không | Chất liệu hoa |  |  |
| color_tone | text | Không | Tone màu |  |  |
| letter_content | text | Không | Nội dung chữ |  |  |
| unit | text | Không | Đơn vị |  |  |
| quantity | decimal | Không | Số lượng |  |  |
| reference_image_url | url | Không | Ảnh tham chiếu |  |  |
| responsible_department_id | text | Không | Phòng ban chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| customer_approved | boolean | Có | Khách đã duyệt |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 24. `project_departments`

**Mục đích:** Phòng ban tham gia từng dự án

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| project_department_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| department_id | text | Có | Phòng ban |  | Không cho sửa sau khi tạo nếu là khóa chính |
| department_leader_id | text | Không | Leader phụ trách |  | Không cho sửa sau khi tạo nếu là khóa chính |
| handover_at | datetime | Không | Thời điểm giao |  |  |
| accepted_at | datetime | Không | Thời điểm nhận |  |  |
| department_status | enum | Có | Trạng thái |  |  |
| deadline | datetime | Không | Deadline phòng ban |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 25. `task_templates`

**Mục đích:** Mẫu đầu việc để tự khởi tạo theo loại đám

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| task_template_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| service_type | enum | Có | Loại dự án áp dụng |  |  |
| department_id | text | Có | Phòng ban |  | Không cho sửa sau khi tạo nếu là khóa chính |
| parent_template_id | text | Không | Mẫu việc cha |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_group | text | Không | Nhóm công việc |  |  |
| task_type | text | Không | Loại công việc |  |  |
| task_name | text | Có | Tên công việc |  |  |
| task_detail_template | text | Không | Mô tả mẫu |  |  |
| start_offset_days | integer | Không | Số ngày so với event_date |  |  |
| duration_days | integer | Không | Thời lượng dự kiến |  |  |
| priority | enum | Có | Ưu tiên |  |  |
| is_required | boolean | Có | Bắt buộc |  |  |
| is_active | boolean | Có | Còn dùng |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 26. `project_tasks`

**Mục đích:** Bảng công việc trung tâm; lịch ngày lọc từ bảng này

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| task_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| project_item_id | text | Không | Hạng mục |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_department_id | text | Có | Phòng ban trong dự án |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_template_id | text | Không | Mẫu nguồn |  | Không cho sửa sau khi tạo nếu là khóa chính |
| parent_task_id | text | Không | Công việc cha |  | Không cho sửa sau khi tạo nếu là khóa chính |
| department_id | text | Có | Phòng ban |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_group | text | Không | Nhóm công việc |  |  |
| task_type | text | Không | Loại công việc |  |  |
| task_name | text | Có | Tên công việc |  |  |
| task_detail | text | Không | Chi tiết |  |  |
| planned_start_at | datetime | Không | Bắt đầu kế hoạch |  |  |
| planned_end_at | datetime | Không | Kết thúc kế hoạch |  |  |
| deadline_at | datetime | Không | Deadline |  |  |
| priority | enum | Có | Ưu tiên |  |  |
| unit | text | Không | Đơn vị |  |  |
| planned_quantity | decimal | Không | Số lượng kế hoạch |  |  |
| actual_start_at | datetime | Không | Bắt đầu thực tế |  |  |
| actual_end_at | datetime | Không | Kết thúc thực tế |  |  |
| actual_quantity | decimal | Không | Số lượng thực tế |  |  |
| task_status | enum | Có | Trạng thái |  |  |
| progress_percent | percent | Không | Tiến độ |  |  |
| is_blocked | boolean | Có | Đang bị chặn |  |  |
| blocked_reason | text | Không | Lý do bị chặn |  |  |
| proposal_url | url | Không | Proposal |  |  |
| production_file_url | url | Không | File sản xuất |  |  |
| checklist_url | url | Không | Checklist |  |  |
| result_note | text | Không | Kết quả |  |  |
| result_file_url | url | Không | Tệp kết quả |  |  |
| important_note | text | Không | Lưu ý |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 27. `task_assignments`

**Mục đích:** Phân công nhân sự cho công việc

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| assignment_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_id | text | Có | Công việc | project_tasks.task_id | Không cho sửa sau khi tạo nếu là khóa chính |
| user_id | text | Không | Nhân sự nội bộ |  | Không cho sửa sau khi tạo nếu là khóa chính |
| assignment_role | enum | Có | Vai trò thực hiện |  |  |
| external_worker_name | text | Không | Nhân sự ngoài |  |  |
| assigned_at | datetime | Không | Thời điểm phân |  |  |
| accepted_at | datetime | Không | Thời điểm nhận |  |  |
| work_status | enum | Có | Trạng thái |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 28. `task_resources`

**Mục đích:** Nhu cầu và cấp phát vật tư theo công việc

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| task_resource_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_id | text | Có | Công việc | project_tasks.task_id | Không cho sửa sau khi tạo nếu là khóa chính |
| project_item_id | text | Không | Hạng mục |  | Không cho sửa sau khi tạo nếu là khóa chính |
| resource_category | enum | Có | Nhóm vật tư |  |  |
| resource_name | text | Có | Tên vật tư |  |  |
| specification | text | Không | Quy cách/chất liệu |  |  |
| color | text | Không | Màu |  |  |
| paper_width | text | Không | Khổ giấy |  |  |
| unit | text | Không | Đơn vị |  |  |
| planned_quantity | decimal | Không | Dự kiến |  |  |
| issued_quantity | decimal | Không | Đã cấp |  |  |
| actual_used_quantity | decimal | Không | Thực dùng |  |  |
| additional_quantity | decimal | Không | Bổ sung |  |  |
| resource_status | enum | Có | Trạng thái |  |  |
| purchase_required | boolean | Có | Cần mua |  |  |
| external_order_required | boolean | Có | Cần order ngoài |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 29. `task_vehicles`

**Mục đích:** Phương tiện theo công việc

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| task_vehicle_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| task_id | text | Có | Công việc | project_tasks.task_id | Không cho sửa sau khi tạo nếu là khóa chính |
| vehicle_type | text | Có | Loại xe |  |  |
| vehicle_quantity | integer | Có | Số lượng |  |  |
| driver_id | text | Không | Tài xế |  | Không cho sửa sau khi tạo nếu là khóa chính |
| departure_at | datetime | Không | Giờ đi |  |  |
| return_at | datetime | Không | Giờ về |  |  |
| vehicle_status | enum | Có | Trạng thái |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 30. `project_handoffs`

**Mục đích:** Bàn giao giữa các phòng ban

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| handoff_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| project_id | text | Có | Dự án | projects.project_id | Không cho sửa sau khi tạo nếu là khóa chính |
| from_department_id | text | Có | Phòng ban giao |  | Không cho sửa sau khi tạo nếu là khóa chính |
| to_department_id | text | Có | Phòng ban nhận |  | Không cho sửa sau khi tạo nếu là khóa chính |
| handoff_type | enum | Có | Loại bàn giao |  |  |
| handoff_at | datetime | Không | Thời điểm bàn giao |  |  |
| handover_by | text | Không | Người giao |  |  |
| received_by | text | Không | Người nhận |  |  |
| checklist_url | url | Không | Checklist |  |  |
| handoff_status | enum | Có | Trạng thái |  |  |
| missing_items | text | Không | Nội dung thiếu |  |  |
| note | text | Không | Ghi chú |  |  |
| created_at | datetime | Không | Thời điểm tạo bản ghi |  |  |
| created_by | text | Không | user_id người tạo |  |  |
| updated_at | datetime | Không | Thời điểm cập nhật cuối |  |  |
| updated_by | text | Không | user_id người cập nhật cuối |  |  |
| deleted_at | datetime | Không | Xóa mềm; để trống nếu còn hiệu lực |  |  |

### 31. `audit_logs`

**Mục đích:** Nhật ký thao tác người dùng trong SPA

| field_name | data_type | required | description | foreign_key | spa_rule |
| --- | --- | --- | --- | --- | --- |
| log_id | text | Có | Khóa chính |  | Không cho sửa sau khi tạo nếu là khóa chính |
| user_id | text | Không | Người thao tác |  | Không cho sửa sau khi tạo nếu là khóa chính |
| action_type | enum | Có | Hành động |  |  |
| entity_type | text | Có | Loại đối tượng |  |  |
| record_id | text | Có | ID bản ghi |  | Không cho sửa sau khi tạo nếu là khóa chính |
| before_json | json | Không | Dữ liệu trước sửa |  |  |
| after_json | json | Không | Dữ liệu sau sửa |  |  |
| created_at | datetime | Có | Thời điểm |  |  |
| request_id | text | Không | Mã request để truy vết |  | Không cho sửa sau khi tạo nếu là khóa chính |
| user_agent | text | Không | Trình duyệt |  |  |
| note | text | Không | Ghi chú |  |  |

### 32. `demo_scenarios` — bảng runtime

**Mục đích:** Lưu trạng thái kịch bản mô phỏng; được `setupSystem_()` tạo khi chưa tồn tại.

| field_name | data_type | required | description |
| --- | --- | --- | --- |
| scenario_id | text | Có | Khóa chính, tiền tố DEMO |
| scenario_name | text | Có | Tên kịch bản |
| current_stage | enum | Có | Giai đoạn hiện tại |
| current_stage_order | integer | Có | Thứ tự giai đoạn 0–6 |
| scenario_status | enum | Có | draft/running/completed |
| bride_name | text | Có | Tên cô dâu mẫu |
| groom_name | text | Có | Tên chú rể mẫu |
| event_date | date | Có | Ngày tổ chức mẫu |
| service_type | enum | Có | Loại dịch vụ chính |
| scenario_json | json_text | Không | Trạng thái và toàn bộ ID được sinh trong các bước |
| created_at | datetime | Không | Thời điểm tạo |
| created_by | text | Không | Người tạo |
| updated_at | datetime | Không | Thời điểm cập nhật |
| updated_by | text | Không | Người cập nhật |
| deleted_at | datetime | Không | Xóa mềm |

## 9. Quan hệ khóa ngoại được khai báo trong workbook

Workbook hiện khai báo 22 quan hệ dữ liệu chính (23 dòng nếu tính header):

| from_table | from_field | to_table | to_field | relationship | delete_rule |
| --- | --- | --- | --- | --- | --- |
| sales_opportunities | lead_id | leads | lead_id | many_to_one | restrict_or_soft_delete |
| sales_activities | opportunity_id | sales_opportunities | opportunity_id | many_to_one | restrict_or_soft_delete |
| surveys | opportunity_id | sales_opportunities | opportunity_id | many_to_one | restrict_or_soft_delete |
| quotations | opportunity_id | sales_opportunities | opportunity_id | many_to_one | restrict_or_soft_delete |
| quotation_items | quotation_id | quotations | quotation_id | many_to_one | restrict_or_soft_delete |
| customers | opportunity_id | sales_opportunities | opportunity_id | many_to_one | restrict_or_soft_delete |
| customer_contacts | customer_id | customers | customer_id | many_to_one | restrict_or_soft_delete |
| projects | customer_id | customers | customer_id | many_to_one | restrict_or_soft_delete |
| project_milestones | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| project_documents | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| invoices | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| invoice_items | invoice_id | invoices | invoice_id | many_to_one | restrict_or_soft_delete |
| payment_plans | invoice_id | invoices | invoice_id | many_to_one | restrict_or_soft_delete |
| payments | invoice_id | invoices | invoice_id | many_to_one | restrict_or_soft_delete |
| design_orders | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| project_items | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| project_departments | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| project_tasks | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |
| task_assignments | task_id | project_tasks | task_id | many_to_one | restrict_or_soft_delete |
| task_resources | task_id | project_tasks | task_id | many_to_one | restrict_or_soft_delete |
| task_vehicles | task_id | project_tasks | task_id | many_to_one | restrict_or_soft_delete |
| project_handoffs | project_id | projects | project_id | many_to_one | restrict_or_soft_delete |

Ngoài danh sách này, mã nguồn và nghiệp vụ còn dùng liên kết thực tế qua các trường như `primary_contact_id`, `sales_id`, `project_manager_id`, `accountant_id`, `driver_id`, `parent_task_id`, `parent_template_id`, `task_template_id`, `project_department_id`; khi hoàn thiện production cần kiểm tra/bổ sung đầy đủ vào `table_relationships` nếu muốn validate FK tập trung.

## 10. Danh mục nghiệp vụ bắt buộc

### 10.1. Loại dự án/dịch vụ

- `tu_gia_an_hoi`
- `tu_gia_cuoi`
- `hoi_truong`
- `trap`
- `doi_be_trap`
- `hoa_xe`
- `dich_vu_khac`

### 10.2. Phòng ban

- `design`
- `production`
- `warehouse`
- `logistics`
- `flower`
- `construction`
- `accounting`
- `sales`

### 10.3. Giai đoạn thanh toán

- `coc_chot_lich`
- `coc_lan_1`
- `coc_lan_2`
- `tat_toan`
- `phat_sinh`
- `hoan_tien`
- `chuyen_du_sang_du_an_khac`

View công nợ vẫn hiển thị các cột quen thuộc: Cọc chốt lịch, Cọc lần 1, Cọc lần 2, Tất toán, Chênh lệch, Thời gian check cọc; nhưng các số liệu được tính từ `payments`, không nhập trực tiếp vào một ô tổng hợp.

## 11. View nghiệp vụ người dùng đã yêu cầu giữ nguyên

Các màn hình cũ không bị xóa về mặt nghiệp vụ; chúng phải trở thành view sinh từ dữ liệu trung tâm:

| view_code | thay_the_file_tab | nguon_du_lieu |
| --- | --- | --- |
| vw_sales_customer_list | DSKH | leads + sales_opportunities |
| vw_customer_debt | Theo dõi công nợ | invoices + payments |
| vw_design_orders | CHIA ORDER | design_orders + projects |
| vw_construction_daily | Lịch thi công | project_tasks lọc construction |
| vw_production_overview | Lịch tổng sản xuất | project_tasks lọc production |
| vw_production_plan | Kế hoạch SX | project_tasks theo từng dự án |
| vw_material_plan | NVL tổng | task_resources lọc material |
| vw_accessory_checklist | Checklist phụ kiện | task_resources lọc accessory |
| vw_paint_plan | Sơn | task_resources lọc paint |
| vw_cnc_checklist | Checklist chữ | task_resources lọc cnc |
| vw_print_checklist | Checklist PP | task_resources lọc print |
| vw_warehouse_logistics | Lịch Kho + Hậu cần | project_tasks lọc warehouse/logistics |
| vw_flower_daily | Lịch thi công team Hoa | project_tasks lọc flower |
| vw_flower_projects | Sổ team Hoa | projects + project_departments |
| vw_flower_ccdc | Order CCDC | task_resources lọc flower_tool |
| vw_flower_handover | Bàn giao HC | project_handoffs + task_resources |
| vw_flower_materials | Vật tư thi công | task_resources lọc flower_material |

Nhân viên vẫn thấy các cột quen thuộc như Ngày, Tên khách, Hạng mục, Checklist, ĐVT, Số lượng, Người thực hiện, Tình trạng và Ghi chú. Tên khách, điện thoại, địa chỉ, Sale và Proposal được tra cứu tự động qua `project_id`.

### View hiện đã đặc tả trong workbook

| view_code | muc_dich | source_tables | default_filter | ghi_chu |
| --- | --- | --- | --- | --- |
| vw_sales_pipeline | Cơ hội bán hàng | leads, sales_opportunities, sales_activities | sales/opportunity | Không ghi trực tiếp |
| vw_customer_debt | Công nợ theo dự án | customers, projects, invoices, payment_plans, payments | accounting/invoice | paid_amount và remaining_amount tính từ payments đã confirmed |
| vw_project_overview | Toàn cảnh một đám | customers, projects, project_items, project_departments, project_tasks | project | Màn hình trung tâm của SPA |
| vw_daily_tasks | Lịch theo ngày | projects, project_tasks, task_assignments | planned_start_at + department_id | Ngày chỉ là bộ lọc |
| vw_design_orders | Danh sách order thiết kế | projects, design_orders | design/progress_status |  |
| vw_production_plan | Kế hoạch sản xuất | projects, project_items, project_tasks, task_resources | production/project |  |
| vw_warehouse_logistics | Kho và hậu cần | project_tasks, task_resources, task_vehicles, project_handoffs | warehouse/logistics/date |  |
| vw_flower_daily | Lịch team hoa | projects, project_tasks, task_resources | flower/date |  |
| vw_construction_daily | Lịch thi công | projects, project_tasks, task_assignments, task_vehicles | construction/date |  |

**Khoảng trống cần giữ trong backlog:** workbook hiện mới đặc tả 9 view (10 dòng tính cả header), trong khi yêu cầu nghiệp vụ ban đầu có 17 view chi tiết. Các view chưa có trong `view_specs` không được coi là bị hủy; vẫn là yêu cầu cần triển khai/đặc tả tiếp.

## 12. Cách xem dữ liệu

### 12.1. View mặc định theo dự án

`Khách hàng → Dự án → Hóa đơn/thanh toán → Proposal → Hạng mục → Thiết kế → Sản xuất → Kho → Hoa → Hậu cần → Thi công`.

### 12.2. View phụ theo ngày

Lọc `project_tasks.planned_start_at` theo ngày, tuần, phòng ban, nhân sự, trạng thái, dự án và loại công việc. Khi mở một ngày cụ thể, chỉ hiện công việc có lịch trong ngày đó; quản lý không tổng hợp lại thủ công từ từng đám.

## 13. Quy trình tạo dữ liệu mới đầy đủ

1. Lead từ phần mềm nhắn tin/nguồn khác ghi vào `leads`.
2. Sale Admin lọc và tạo `sales_opportunities`.
3. Sale tư vấn; từng lần gọi/nhắn/gửi báo giá ghi vào `sales_activities`.
4. Nếu cần khảo sát, tạo `surveys`.
5. Tạo `quotations` và `quotation_items`; quản lý phiên bản báo giá.
6. Khi khoản cọc đầu tiên được xác nhận: tạo `customers`, `customer_contacts`, một hoặc nhiều `projects`, `invoices`, `payment_plans`, ghi cọc vào `payments`, tạo thư mục và `project_documents`.
7. Khi đủ điều kiện thiết kế, tạo `design_orders`.
8. Khi Proposal được khách duyệt, bóc tách thành `project_items`.
9. Tạo `project_departments` cho các phòng ban tham gia.
10. Từ `task_templates`, sinh `project_tasks`.
11. Các phòng ban thêm `task_assignments`, `task_resources` và `task_vehicles`.
12. Lịch ngày được sinh từ `project_tasks`.
13. Dùng `project_handoffs` để kiểm soát bàn giao.
14. Sau sự kiện: cập nhật kết quả, thu dọn, tất toán và đóng dự án.

## 14. Phạm vi giao diện SPA đã viết

### 14.1. Màn hình

| Màn hình | Entity/tab |
| --- | --- |
| Dashboard | Lead, dự án đang chạy, việc quá hạn, công nợ, đám 14 ngày tới |
| Lead & tư vấn | `sales_opportunities`, `leads`, `sales_activities`, `quotations` |
| Khách hàng | `customers` |
| Dự án / Loại đám | `projects` |
| Công việc | `project_tasks` |
| Công nợ & thanh toán | `invoices`, `payments`, `payment_plans` |
| Vật tư & nguồn lực | `task_resources`, `task_assignments`, `task_vehicles`, `project_handoffs` |
| Dữ liệu bổ sung | `master_data`, `departments`, `users`, `task_templates` |
| Mô phỏng quy trình | `demo_scenarios` và dữ liệu liên kết được tạo thật |

### 14.2. Chức năng đã có trong mã cục bộ

- Dashboard và tải dữ liệu bootstrap.
- Danh sách, tìm kiếm và giới hạn tối đa 500 dòng mỗi lần ở client hiện tại.
- CRUD qua biểu mẫu động dựa trên `data_dictionary`.
- Thêm/sửa và xóa mềm.
- Phân quyền xem/tạo/sửa/xóa theo `users` + `role_permissions`.
- Sinh mã tuần tự an toàn bằng `LockService` + `id_sequences`.
- Audit thao tác vào `audit_logs`.
- Đồng bộ công nợ sau thay đổi thanh toán.
- Responsive SPA và gọi backend bất đồng bộ bằng `google.script.run`.
- Cho phép nhúng iframe bằng `ALLOWALL`.

### 14.3. API phía Apps Script

| Hàm public | Mục đích |
| --- | --- |
| `doGet()` | Trả giao diện SPA |
| `getAppBootstrap()` | Setup, người dùng, quyền, danh mục, schema, lookup và dashboard |
| `queryAppData(request)` | Đọc một entity, lọc/tìm/offset/limit hoặc lấy theo ID |
| `mutateAppData(request)` | Tạo, cập nhật hoặc xóa mềm |
| `getDashboard()` | Làm mới dashboard |
| `createDemoScenario(request)` | Tạo kịch bản mô phỏng |
| `runDemoStep(request)` | Chạy bước tiếp theo |
| `runDemoAll(request)` | Chạy toàn bộ bước còn lại |
| `getDemoScenario(request)` | Lấy trạng thái và dữ liệu kịch bản |

Phản hồi API thống nhất dạng `{ok: true, data: ...}` hoặc `{ok: false, error: {message, code}}`.

## 15. Mô phỏng một đám cưới điển hình

| Thứ tự | stage_code | Nội dung |
| --- | --- | --- |
| 1 | `lead_received` | Tạo lead mới |
| 2 | `qualified` | Tạo cơ hội, hoạt động tư vấn và báo giá |
| 3 | `deposit_confirmed` | Xác nhận cọc; tạo khách hàng, liên hệ, hai dự án, hóa đơn, kế hoạch và thanh toán |
| 4 | `design_approved` | Tạo order thiết kế, tài liệu, hạng mục và phòng ban dự án |
| 5 | `operation_started` | Tạo công việc, phân công, vật tư và kế hoạch vận hành |
| 6 | `event_completed` | Hoàn thành công việc, tất toán hóa đơn và đóng dự án |

Kịch bản mẫu tạo một khách hàng có hai dự án, gồm ít nhất `tu_gia_cuoi` và `hoi_truong`. Kịch bản ghi toàn bộ ID tạo ra trong `scenario_json` để chạy tiếp từng bước và truy vết.

## 16. Phân quyền và bảo mật

- Vai trò fallback hiện có: `admin`, `manager`, `sales`, `accounting`, `operator`, `viewer`.
- Phạm vi quyền gồm view/create/update/delete và `data_scope`.
- Khi bảng `users` trống, mã hiện cho tài khoản khởi tạo đầu tiên hoạt động như quản trị; sau khi có user, quyền xét theo email Google và `role_permissions`.
- Không chia sẻ token, cookie, mật khẩu hoặc OTP.
- Không đổi mô hình deploy từ “User accessing the web app” sang “Execute as me” nếu chưa trao đổi vì ảnh hưởng quyền truy cập dữ liệu.
- Với custom domain/iframe: trang bọc giữ URL branded trên thanh địa chỉ nhưng không phải biện pháp bảo mật URL Apps Script.

## 17. Tệp mã nguồn và vai trò

| Tệp | Vai trò |
| --- | --- |
| `Code.gs` | `doGet`, bootstrap và API public |
| `Config.gs` | ID, entity, trạng thái, label và cấu hình |
| `DataStore.gs` | Truy vấn, lưu, sinh ID, khóa, xóa mềm, audit |
| `Services.gs` | Setup, seed, quyền, dashboard, đồng bộ hóa đơn |
| `Demo.gs` | Sáu giai đoạn mô phỏng |
| `Index.html` | Khung SPA |
| `Styles.html` | Giao diện responsive |
| `AppJs.html` | Route, bảng, form, CRUD, dashboard và demo |
| `appsscript.json` | Manifest Apps Script |
| `tests/smoke_test.js` | Test cục bộ; không được upload |

`.clasp.json` trỏ đúng Script ID. `.claspignore` phải chỉ cho upload manifest, `*.gs` và `*.html`; tài liệu và test không đưa lên Apps Script.

## 18. Trạng thái triển khai chính xác tại thời điểm chốt

### Đã hoàn thành

- Thiết kế workbook dữ liệu liên kết.
- Tạo file Excel và Google Spreadsheet.
- Viết mã nguồn SPA cục bộ.
- Gắn đúng Script ID và Spreadsheet ID trong cấu hình.
- Chuẩn bị cơ chế `clasp push`.
- Đã từng kiểm tra `clasp` 3.3.0 và xác nhận 9 file chạy thật.
- Đã từng chạy smoke test cục bộ thành công; Agent tiếp theo vẫn phải chạy lại.

### Chưa có bằng chứng hoàn thành

- Chưa xác minh `clasp push` đã thành công vào dự án Apps Script.
- Chưa xác minh mã đã compile trên môi trường Google.
- Chưa deploy Web App.
- Chưa có URL `/exec`.
- Chưa kiểm thử trực tiếp SPA với quyền người dùng thật.
- Chưa xác minh trực tiếp Google Sheet hiện có `demo_scenarios` và múi giờ đã đổi; mã `setupSystem_()` có thể thực hiện ở lần tải đầu.

Lý do dừng trước đây: chưa có phiên Google đã xác thực có quyền sửa Apps Script. Người dùng đã yêu cầu mở màn hình đăng nhập và muốn tự nhập thông tin xác thực.

## 19. Quy trình triển khai tiếp theo bằng cơ chế chính thức của Google

1. Vào thư mục `wedding_spa_app`.
2. Chạy `node tests/smoke_test.js`.
3. Chạy `npx clasp status`; xác nhận chỉ có 9 file chạy thật.
4. Nếu chưa xác thực, chạy `npx clasp login`; người dùng tự đăng nhập tài khoản có quyền sửa Script ID.
5. Chạy `npx clasp push`.
6. Kiểm tra dự án Apps Script có đầy đủ file và compile không lỗi.
7. Deploy → New deployment → Web app.
8. Theo README hiện tại, chọn chạy dưới quyền “User accessing the web app”, cấp quyền cho người dùng nội bộ và đảm bảo họ có quyền đọc/ghi Spreadsheet.
9. Kiểm thử URL `/dev`; đạt mới bàn giao URL `/exec`.
10. Nếu dùng domain riêng, tạo portal trên domain/subdomain và iframe URL Web App; Apps Script đã đặt `ALLOWALL`.

## 20. Kiểm thử nghiệm thu bắt buộc

1. Dashboard tải được và số liệu không lỗi.
2. Tạo, sửa, xóa mềm một công việc; bản ghi còn tồn tại với `deleted_at`.
3. Tạo khoản thanh toán `confirmed`; `paid_amount`, `remaining_amount`, `invoice_status` cập nhật đúng.
4. Tạo kịch bản demo, chạy từng bước và chạy toàn bộ.
5. Một khách hàng phải có hai dự án riêng.
6. Các công việc, hạng mục, phòng ban, phân công và vật tư có đúng khóa ngoại.
7. Bước cuối làm hóa đơn tất toán và dự án đóng.
8. `audit_logs` ghi nhận create/update/delete quan trọng.
9. Quyền user đúng vai trò; user không có quyền không được thao tác.
10. Ngày/giờ không lệch khỏi `Asia/Ho_Chi_Minh`.
11. Xác minh các view ngày/phòng ban lọc từ `project_tasks`, không tạo bảng ngày mới.
12. Nếu dùng iframe domain riêng, kiểm tra Web App hiển thị được và các cuộc gọi `google.script.run` vẫn hoạt động.

## 21. Tiêu chí chỉ được coi là hoàn thành khi

1. `clasp push` thành công vào đúng Script ID.
2. Apps Script compile/chạy không lỗi.
3. Web App có URL `/exec`.
4. SPA đọc/ghi đúng Spreadsheet ID.
5. CRUD và xóa mềm hoạt động.
6. Công nợ đồng bộ đúng.
7. Sáu giai đoạn mô phỏng chạy xuyên suốt không lỗi khóa ngoại.
8. Audit ghi nhận thao tác.
9. Quyền truy cập được kiểm thử.
10. Người dùng nhận URL Web App và hướng dẫn sử dụng/quyền.

## 22. Ràng buộc bảo toàn dữ liệu

- Không ghi đè hoặc xóa dữ liệu thật khi chưa xác định bản ghi demo.
- Không đổi tên sheet/header nếu chưa cập nhật cấu hình và mã nguồn.
- Không xóa vật lý dữ liệu nghiệp vụ.
- Không tự đổi Spreadsheet ID hoặc Script ID.
- Không tự thiết kế lại toàn bộ hệ thống trước khi kiểm tra mã hiện tại.
- Không coi dữ liệu demo là dữ liệu thật.
- Không coi một phản hồi trước đây là bằng chứng deploy; phải kiểm tra trực tiếp.

## 23. Các điểm cần hoàn thiện sau bản MVP

Đây là backlog được suy ra trực tiếp từ chênh lệch giữa yêu cầu nghiệp vụ và phần đã viết, không phải yêu cầu mới thay thế phạm vi cũ:

- Bổ sung đầy đủ 17 view nghiệp vụ ban đầu vào `view_specs` và UI.
- Mở các màn hình còn chưa có route trực tiếp: khảo sát, chi tiết báo giá, liên hệ khách, milestones, tài liệu, invoice items, design orders, project items và project departments.
- Bổ sung kiểm tra khóa ngoại tập trung cho toàn bộ trường liên kết.
- Bổ sung phân trang thực sự thay vì client gọi tối đa 500 dòng.
- Kiểm tra hiệu năng/quota khi dữ liệu lớn; có chiến lược cache, batch và archive.
- Quản lý mã nguồn bằng Git cùng `clasp`.
- Sau khi SPA ổn định mới thiết kế workflow n8n cho nhắc việc, đồng bộ, thông báo, backup hoặc AI.

## 24. Prompt tiếp tục cho AI Agent/Dev khác

> Đọc toàn bộ hồ sơ này và kiểm tra các file đi kèm. Không làm lại từ đầu và không lược bỏ yêu cầu. Trước mắt hãy chạy lại smoke test, kiểm tra `clasp status`, mở bước xác thực Google để tôi tự đăng nhập, dùng `clasp push` đưa đúng 9 file chạy thật lên Apps Script ID `1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI`, deploy Web App kết nối Spreadsheet ID `1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs`, rồi chạy đầy đủ test CRUD, xóa mềm, công nợ, quyền, audit, múi giờ và mô phỏng sáu giai đoạn. Chỉ báo hoàn thành khi có bằng chứng push, compile, deployment và URL `/exec`.

---

## Cập nhật ERP v2.2.0 — Chi tiết, chuyển đổi và workspace dự án (10/08/2026)

- Mọi bảng dữ liệu trên SPA có nút `Xem chi tiết`; quyền xem/sửa vẫn kiểm tra ở server theo nhân sự và phạm vi dữ liệu.
- Chi tiết Lead có luồng `Chuyển thành khách hàng`: hệ thống tự sinh `opportunity_id`, `customer_id`, tái sử dụng cơ hội/khách hàng nếu đã chuyển trước đó và cập nhật Lead sang `converted`.
- Chi tiết Khách hàng tổng hợp các Dự án của khách hàng, Hóa đơn theo các dự án và Hợp đồng gắn với dự án.
- Bổ sung bảng `contracts` gồm khóa liên kết `customer_id`, `project_id`, thông tin ký/hiệu lực/giá trị/trạng thái và các trường audit/xóa mềm.
- Chi tiết Dự án trở thành workspace: chọn dự án trên giao diện, xem thông tin, phòng ban, công việc nhóm theo phòng ban, hạng mục, mốc, tài liệu, thiết kế, hợp đồng và hóa đơn.
- Các nút thêm trong workspace chỉ xuất hiện khi nhân sự có quyền `create`. `project_id` và `customer_id` được khóa/tự điền theo ngữ cảnh. Khi tạo công việc, server tự tìm `project_department_id` từ dự án + phòng ban và báo lỗi rõ ràng nếu phòng ban chưa tham gia dự án.
- Bản runtime vẫn giữ đúng 9 file. Smoke test đạt 39 kiểm tra. `clasp push` thành công lúc 17:59:27 ngày 10/08/2026; version Apps Script `12`; deployment Web App `AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA @12`.
- URL chạy thật: `https://script.google.com/macros/s/AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA/exec`.

### Cập nhật ERP v2.4.1 — Giao diện danh sách và chứng từ hóa đơn

- Danh sách hóa đơn được thiết kế lại theo giao diện tài chính: thẻ tổng hợp chưa thanh toán/quá hạn/đã thanh toán; bảng gọn gồm số hóa đơn, tổng cộng, tổng thuế, ngày xuất, dự án, hạn trả và trạng thái.
- Số hóa đơn là liên kết mở trực tiếp chi tiết; trạng thái có màu riêng cho đã thanh toán, quá hạn, thanh toán một phần, chưa thanh toán và đã hủy.
- Chi tiết hóa đơn được trình bày như chứng từ: thanh tab, thanh thao tác, bên phát hành, người nhận, thông tin dự án, bảng sản phẩm/hạng mục và khối tạm tính/giảm giá/phụ thu/thuế/tổng tiền/đã thu/còn lại.
- Bổ sung nút in hóa đơn với stylesheet riêng cho bản in, đồng thời giữ nguyên nút sửa, thêm hạng mục và ghi nhận thanh toán theo quyền.
- Danh sách hóa đơn trong hồ sơ Khách hàng 360° dùng cùng kiểu bảng tài chính. Chi tiết hóa đơn tải thêm người liên hệ khách hàng để hiển thị bên nhận.
- Smoke test đạt toàn bộ kiểm tra, gồm kiểm tra layout tham chiếu mới. `clasp push` đủ 9 file lúc 21:17:07; version Apps Script `15`; deployment Web App `AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA @15`.

### Cập nhật ERP v2.5.0 — Danh sách và workspace dự án theo phòng ban

- Trang danh sách Dự án chỉ còn bảng dự án tập trung; bỏ các tab con Tài liệu, Thiết kế, Hạng mục và Phòng ban khỏi trang ngoài.
- Danh sách có bộ đếm trạng thái, tên dự án, khách hàng, loại dự án, ngày bắt đầu, hạn chót/ngày tổ chức, người phụ trách và trạng thái.
- Chi tiết dự án được tổ chức thành workspace gồm Tổng quan dự án, Phân công, tab động cho từng phòng ban tham gia và Proposal thiết kế.
- Tab Phân công tổng hợp toàn bộ phân công từ mọi công việc/phòng ban của dự án. Khi thêm phân công, danh sách công việc chỉ lấy từ dự án đang mở.
- Mỗi tab phòng ban chỉ hiển thị công việc của phòng đó. Nút thêm công việc tự khóa `project_id`, `department_id` và `project_department_id` theo tab đang mở.
- Tab Proposal dùng `project_documents`, tự gắn dự án và loại tài liệu `proposal`; đây là nguồn thiết kế chung để các phòng ban xem và bóc tách công việc.
- Smoke test đạt toàn bộ kiểm tra, gồm danh sách tối giản, workspace tab động và liên kết ngữ cảnh. `clasp push` đủ 9 file lúc 00:17:46 ngày 11/08/2026; version Apps Script `16`; deployment `AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA @16`.

### Cập nhật ERP v2.5.1 — Sửa phản hồi đăng nhập và bổ sung RPC log

- Nguyên nhân lỗi đăng nhập toàn hệ thống: sau khi xác thực đúng, `loginApp` gán `last_login_at` bằng đối tượng JavaScript `Date`; `sanitizeUser_` chưa tuần tự hóa trường này trước khi trả qua `google.script.run`, khiến client nhận phản hồi rỗng và hiện thông báo dự phòng “Không nhận được phản hồi từ máy chủ”.
- `sanitizeUser_` hiện tuần tự hóa toàn bộ giá trị trước khi trả về client. Mật khẩu, hash, salt, số lần sai và thông tin khóa vẫn bị loại khỏi response.
- Client RPC có `request_id`, log bắt đầu/thành công/phản hồi rỗng/thất bại; thông báo phản hồi rỗng kèm mã yêu cầu để truy vết. Server ghi `login_start`, `login_failed`, `login_success` nhưng không ghi mật khẩu hoặc token.
- Kiểm tra console sau triển khai ghi nhận `WeddingOps RPC:start` và `WeddingOps RPC:success` cho lời gọi khởi tạo trang.
- Smoke test đạt toàn bộ, gồm kiểm tra tuần tự hóa đăng nhập. `clasp push` đủ 9 file lúc 00:58:35 ngày 11/08/2026; version Apps Script `17`; deployment `AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA @17`.

### Cập nhật ERP v2.3.0 — Lead là hồ sơ khách hàng tiềm năng trung tâm

- Màn hình Kinh doanh chỉ hiển thị danh sách `Lead thô`; Cơ hội, Chăm sóc, Khảo sát và Báo giá được trình bày thành pipeline bên trong từng Lead.
- Chi tiết Lead có 5 tab: Thông tin chi tiết, Đề xuất kế hoạch, Phân công khảo sát, File đính kèm và Ghi chú.
- Tab Thông tin chứa dữ liệu cơ bản, lịch sử chăm sóc và trạng thái cơ hội. Tab Đề xuất kế hoạch dùng `quotations`. Tab Phân công khảo sát dùng `surveys`, gồm người thực hiện, lịch, địa điểm, yêu cầu và bàn giao.
- Bổ sung `lead_attachments` và `lead_notes`; cả hai liên kết về `leads.lead_id`, có mã tự sinh, audit và xóa mềm. File chỉ chấp nhận đường dẫn HTTPS.
- Khi thêm chăm sóc, phân công khảo sát hoặc báo giá từ chi tiết Lead, hệ thống tự tìm hoặc tạo `sales_opportunities`; người dùng không nhập `opportunity_id`.
- Sale chỉ xem/sửa pipeline của Lead được giao. Khảo sát viên thuộc vai trò vận hành được xem và cập nhật các khảo sát giao cho chính mình.
- Google Sheet đã có hai native table `LeadAttachmentsTable` và `LeadNotesTable`, dropdown loại file/phạm vi ghi chú, 21 dòng `data_dictionary` và 2 quan hệ mới trong `table_relationships`.

## Phụ lục A — Dữ liệu cấu hình/seed hiện có trong workbook

### A1. `app_config`

| config_key | config_value | data_type | description | is_active |
| --- | --- | --- | --- | --- |
| schema_version | 1.0.0 | string | Phiên bản cấu trúc dữ liệu | true |
| timezone | Asia/Ho_Chi_Minh | string | Múi giờ thống nhất toàn hệ thống | true |
| id_date_format | yyyyMMdd | string | Định dạng ngày trong mã hiển thị | true |
| default_currency | VND | string | Tiền tệ mặc định | true |
| soft_delete_enabled | true | boolean | Không xóa vật lý dữ liệu nghiệp vụ | true |

### A2. `id_sequences`

| entity_type | prefix | current_value | padding_length | updated_at |
| --- | --- | --- | --- | --- |
| lead | LD | 0 | 6 |  |
| opportunity | OP | 0 | 6 |  |
| customer | KH | 0 | 6 |  |
| project | DA | 0 | 6 |  |
| quotation | BG | 0 | 6 |  |
| invoice | HD | 0 | 6 |  |
| payment | TT | 0 | 7 |  |
| task | CV | 0 | 7 |  |

### A3. `master_data`

| master_data_id | category | code | label_vi | parent_code | sort_order | is_active | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MD0001 | service_type | tu_gia_an_hoi | Tư gia ăn hỏi |  | 10 | true |  |
| MD0002 | service_type | tu_gia_cuoi | Tư gia cưới |  | 20 | true |  |
| MD0003 | service_type | hoi_truong | Hội trường |  | 30 | true |  |
| MD0004 | service_type | trap | Tráp |  | 40 | true |  |
| MD0005 | service_type | doi_be_trap | Đội bê tráp |  | 50 | true |  |
| MD0006 | service_type | hoa_xe | Hoa xe |  | 60 | true |  |
| MD0007 | service_type | dich_vu_khac | Dịch vụ khác |  | 70 | true |  |
| MD0010 | department | sales | Kinh doanh |  | 10 | true |  |
| MD0011 | department | accounting | Kế toán |  | 20 | true |  |
| MD0012 | department | design | Thiết kế |  | 30 | true |  |
| MD0013 | department | production | Sản xuất |  | 40 | true |  |
| MD0014 | department | warehouse | Kho |  | 50 | true |  |
| MD0015 | department | logistics | Hậu cần |  | 60 | true |  |
| MD0016 | department | flower | Hoa |  | 70 | true |  |
| MD0017 | department | construction | Thi công |  | 80 | true |  |

## Phụ lục B — Ghi chú về độ đầy đủ

Tài liệu này chủ động giữ cả trạng thái thiết kế ban đầu, cấu trúc workbook thực tế, cấu trúc runtime do Apps Script tạo, yêu cầu UI/SPA, yêu cầu deployment và các chênh lệch chưa hoàn tất. Những nội dung chưa có bằng chứng đã chạy trên Google được đánh dấu là chưa xác minh, không bị xóa khỏi ngữ cảnh và cũng không bị mô tả sai là đã hoàn thành.

---

## Cập nhật ERP v2.4.0 — Hồ sơ Khách hàng 360° và chi tiết hóa đơn (10/08/2026)

- Trang ngoài của module Khách hàng tiếp tục là danh sách tất cả khách hàng. Nút `Xem chi tiết` mở hồ sơ Khách hàng 360° theo bố cục ERP gồm nhận diện khách hàng, KPI công nợ và menu phân hệ dọc.
- Hồ sơ khách hàng có các mục: Thông tin, Liên hệ, Hóa đơn, Thanh toán, Báo giá, Hợp đồng, Dự án và Phân công. Dữ liệu được lọc trên server theo `customer_id`, các dự án của khách hàng, hóa đơn của các dự án và công việc/phân công thuộc các dự án đó.
- Các nút thêm dữ liệu trong ngữ cảnh khách hàng chỉ hiển thị khi người dùng có quyền `create`; `customer_id`, `project_id`, `opportunity_id` và `invoice_id` được tự điền hoặc khóa theo ngữ cảnh để tránh nhập sai khóa liên kết.
- Chi tiết hóa đơn hiển thị khách hàng/dự án, báo giá liên quan, các hạng mục sản phẩm, số lượng, đơn giá, thành tiền, tạm tính, giảm giá, thuế, tổng phải thu, đã thu và còn phải thu.
- Nút `Thanh toán` kiểm tra quyền ở server, không cho thu vượt công nợ, lưu lần thanh toán cùng thời điểm/phương thức/mã giao dịch/chứng từ và tự đồng bộ `paid_amount`, `remaining_amount`, `invoice_status`.
- Sheet `invoices` được mở rộng thêm `subtotal_amount`, `tax_rate`, `tax_amount`; native table `tbl_invoices` đã mở rộng từ A:V sang A:Y. Ba trường cũng đã được ghi vào `data_dictionary`.
- Runtime giữ đúng 9 file và smoke test đạt toàn bộ kiểm tra. `clasp push` thành công lúc 20:56:12 ngày 10/08/2026; version Apps Script `14`; deployment Web App `AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA @14`.
- URL chạy thật: `https://script.google.com/macros/s/AKfycbyvIvKg53Y4aSMOjEPZPoH8dgN9O8Zjx4fkFV1lCk6QY3yBdRrCAaWvczPFxI6G9gPRTA/exec`.
