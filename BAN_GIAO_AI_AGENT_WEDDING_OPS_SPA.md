# HỒ SƠ BÀN GIAO AI AGENT

## 1. Câu lệnh dành cho Agent mới

Tiếp tục dự án **Wedding Operations SPA trên Google Apps Script** từ trạng thái hiện tại. Không thiết kế lại từ đầu. Trước tiên đọc toàn bộ hồ sơ này, kiểm tra thư mục `wedding_spa_app`, sau đó dùng cơ chế chính thức của Google là `clasp push` để đẩy mã lên đúng Apps Script ID. Nếu chưa có phiên Google hợp lệ, mở màn hình đăng nhập để người dùng tự đăng nhập; tuyệt đối không yêu cầu người dùng gửi mật khẩu hoặc mã xác thực trong chat. Sau khi push thành công, triển khai Web App, chạy kiểm thử trực tiếp và báo URL `/exec`.

## 2. Mục tiêu dự án

Xây dựng một SPA bằng Google Apps Script để quản lý quy trình vận hành một doanh nghiệp tổ chức đám cưới. Google Sheets là cơ sở dữ liệu trung tâm; Apps Script cung cấp giao diện, phân quyền, CRUD, dashboard, logic trạng thái, audit và mô phỏng quy trình.

Kiến trúc nghiệp vụ trung tâm:

`lead_id → opportunity_id → customer_id → project_id → invoice_id/project_item_id → task_id → resource/assignment`

Nguyên tắc đã chốt:

- Khách hàng chính thức được tạo sau khi xác nhận khoản cọc đầu tiên.
- Một khách hàng có thể có nhiều dự án/loại đám.
- Công việc được tạo theo dự án và phòng ban; lịch ngày chỉ là view lọc từ `project_tasks`.
- Không nhập lại tên khách, điện thoại, địa chỉ và Proposal ở từng phòng ban.
- Thanh toán lưu từng giao dịch trong `payments`, không gộp nhiều lần chuyển tiền vào một ô.
- Dùng mã ID làm khóa liên kết, không dùng tên cô dâu–chú rể hoặc ngày tổ chức.
- Dùng xóa mềm qua `deleted_at`, không xóa vật lý dữ liệu nghiệp vụ.
- Múi giờ chuẩn: `Asia/Ho_Chi_Minh`.

## 3. Tài nguyên và ID bắt buộc

| Tài nguyên | Giá trị |
|---|---|
| Google Spreadsheet | https://docs.google.com/spreadsheets/d/1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs/edit |
| Spreadsheet ID | `1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs` |
| Apps Script ID | `1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI` |
| Mã nguồn cục bộ | `wedding_spa_app/` |
| Gói mã nguồn | `wedding_ops_spa_appscript.zip` |
| Bản CSDL Excel | `outputs/wedding_spa_database/CSDL_Quan_ly_Du_an_Cuoi_SPA_AppsScript.xlsx` |

Không có URL Web App `/exec` vì dự án chưa được deploy thành công trong cuộc hội thoại này.

## 4. Phần đã hoàn thành

### 4.1. Cơ sở dữ liệu

Đã thiết kế workbook theo mô hình dữ liệu liên kết, gồm 35 sheet và 516 trường được mô tả trong `data_dictionary`; có 22 quan hệ khóa ngoại chính. Các nhóm bảng gồm:

- Cấu hình: hướng dẫn, danh mục, phòng ban, người dùng, quyền, sinh ID, audit.
- Bán hàng: `leads`, `sales_opportunities`, `sales_activities`, `surveys`, `quotations`, `quotation_items`.
- Khách hàng/dự án: `customers`, `customer_contacts`, `projects`, `project_milestones`, `project_documents`.
- Tài chính: `invoices`, `payment_plans`, `payments`.
- Thiết kế/vận hành: `design_orders`, `project_items`, `project_departments`, `project_tasks`.
- Phân công/tài nguyên: `task_assignments`, `task_resources`, `task_vehicles`, `project_handoffs`.
- Kỹ thuật SPA: `data_dictionary`, `table_relationships`, `id_sequences`, `role_permissions`, `audit_logs`, `task_templates`, `view_specs`, `demo_scenarios`.

### 4.2. Mã nguồn SPA

Mã nguồn hiện có các file chạy thật:

- `Code.gs`: `doGet()`, bootstrap, API gọi từ giao diện.
- `Config.gs`: Spreadsheet ID, cấu hình entity, trạng thái và màn hình.
- `DataStore.gs`: truy vấn, lưu dữ liệu, ID, khóa, xóa mềm và audit.
- `Services.gs`: setup, dashboard, quyền, nghiệp vụ bổ trợ.
- `Demo.gs`: mô phỏng sáu giai đoạn đám cưới.
- `Index.html`: khung SPA.
- `Styles.html`: giao diện responsive.
- `AppJs.html`: route phía client, biểu mẫu, CRUD, dashboard và mô phỏng.
- `appsscript.json`: manifest Apps Script.

File `tests/smoke_test.js` chỉ dùng kiểm thử cục bộ và đã được loại khỏi upload bằng `.claspignore`.

### 4.3. Chức năng đã viết

- Dashboard tổng quan.
- Quản lý lead/cơ hội bán hàng.
- Quản lý khách hàng và dự án.
- Quản lý hóa đơn, kế hoạch thanh toán và giao dịch.
- Quản lý công việc theo dự án/phòng ban/ngày.
- Quản lý vật tư và dữ liệu bổ sung.
- Thêm, sửa, xóa mềm dữ liệu.
- Sinh mã tuần tự bằng `LockService` và `id_sequences`.
- Phân quyền qua `users` và `role_permissions`.
- Ghi lịch sử thao tác vào `audit_logs`.
- Đồng bộ `paid_amount`, `remaining_amount`, `invoice_status` khi có thanh toán được xác nhận.
- Mô phỏng quy trình đám cưới bằng dữ liệu liên kết thật.

### 4.4. Sáu giai đoạn mô phỏng

1. `lead_received`: tiếp nhận lead.
2. `qualified`: lọc lead, tạo cơ hội và hoạt động tư vấn/báo giá.
3. `deposit_confirmed`: xác nhận cọc, tạo khách hàng, liên hệ, hai dự án, hóa đơn, kế hoạch và giao dịch thanh toán.
4. `design_approved`: tạo order thiết kế, tài liệu/hạng mục và các phòng ban tham gia.
5. `operation_started`: tạo công việc, phân công, vật tư và kế hoạch vận hành.
6. `event_completed`: hoàn thành công việc, tất toán hóa đơn và đóng dự án.

Kịch bản mẫu tạo một khách hàng có hai dự án, trong đó có `tu_gia_cuoi` và `hoi_truong`.

## 5. Trạng thái kỹ thuật chính xác

- `.clasp.json` đã trỏ đúng Apps Script ID.
- `.claspignore` chỉ cho upload `appsscript.json`, `*.gs`, `*.html`; file test và tài liệu không bị upload.
- Trước đó đã cài/kiểm tra `clasp` 3.3.0 và xác nhận có 9 file chạy thật cần push.
- Smoke test cục bộ từng được báo là thành công; Agent mới nên chạy lại trước khi push.
- Chưa có bằng chứng rằng `clasp push` đã chạy thành công.
- Chưa có deployment Web App và chưa có URL `/exec`.
- Lý do dừng: chưa có phiên Google đã xác thực có quyền sửa dự án Apps Script.
- Người dùng yêu cầu dùng cơ chế upload chính thức theo hướng dẫn Google (`clasp`/Apps Script API), không dán thủ công từng file.
- Yêu cầu cuối trước khi bàn giao: mở màn hình đăng nhập để người dùng tự đăng nhập.

Lưu ý: Một số phản hồi trước nói Google Sheet đã được bổ sung `demo_scenarios` và sửa múi giờ. Agent mới cần kiểm tra trực tiếp Sheet trước khi coi đây là trạng thái đã xác minh; mã `setupSystem_()` cũng có khả năng thực hiện các bước này ở lần tải đầu.

## 6. Quy trình tiếp tục đề xuất

### Bước 1 — Kiểm tra gói mã

```bash
cd wedding_spa_app
node tests/smoke_test.js
npx clasp status
```

Kiểm tra danh sách push chỉ gồm 9 file chạy thật và manifest.

### Bước 2 — Xác thực Google

Nếu chưa đăng nhập:

```bash
npx clasp login
```

Mở URL xác thực trong trình duyệt để người dùng tự đăng nhập bằng tài khoản có quyền sửa Script ID. Không nhận thông tin đăng nhập qua chat.

### Bước 3 — Push mã

```bash
npx clasp push
```

Sau push, kiểm tra nội dung dự án Apps Script có đầy đủ các file `.gs`, `.html` và manifest.

### Bước 4 — Deploy Web App

Trong Apps Script:

1. `Deploy → New deployment → Web app`.
2. Theo README hiện tại: chạy dưới quyền **User accessing the web app**.
3. Chỉ cấp truy cập cho người dùng nội bộ cần sử dụng.
4. Bảo đảm các tài khoản đó có quyền đọc/ghi Spreadsheet.
5. Kiểm thử deployment `/dev`; đạt mới bàn giao `/exec`.

Nếu mô hình phân quyền thực tế không phù hợp với “User accessing the web app”, phải trao đổi lại với người dùng trước khi đổi sang “Execute as me”, vì thay đổi này ảnh hưởng phạm vi quyền truy cập dữ liệu.

### Bước 5 — Kiểm thử trực tiếp

- Mở Dashboard và xác nhận dữ liệu tải được.
- Tạo/sửa/xóa mềm một công việc.
- Tạo khoản thanh toán `confirmed`; xác nhận công nợ hóa đơn tự cập nhật.
- Tạo một kịch bản demo và chạy từng bước.
- Xác nhận cùng một khách hàng có hai dự án.
- Kiểm tra công việc, vật tư, phân công và audit được tạo đúng khóa ngoại.
- Chạy đến bước cuối; hóa đơn phải tất toán và dự án đóng.
- Kiểm tra ngày/giờ không lệch múi giờ Việt Nam.

## 7. Tiêu chí hoàn thành

Dự án chỉ được coi là hoàn thành khi:

1. `clasp push` thành công vào đúng Script ID.
2. Apps Script compile/chạy không lỗi.
3. Web App được deploy và có URL `/exec`.
4. SPA đọc/ghi đúng Spreadsheet ID.
5. CRUD công việc hoạt động, xóa là xóa mềm.
6. Thanh toán cập nhật đúng công nợ.
7. Sáu giai đoạn mô phỏng chạy xuyên suốt không lỗi khóa ngoại.
8. `audit_logs` ghi nhận các thao tác chính.
9. Người dùng nhận được URL Web App và hướng dẫn quyền truy cập.

## 8. Ràng buộc an toàn và phạm vi

- Không ghi đè hoặc xóa dữ liệu thật khi chưa xác định rõ bản ghi demo.
- Không đổi tên sheet/header nếu chưa cập nhật cấu hình và mã nguồn.
- Không xóa vật lý dữ liệu nghiệp vụ.
- Không chia sẻ token, cookie, mật khẩu hoặc mã xác thực.
- Không tự đổi Spreadsheet ID hay Script ID.
- Không thiết kế lại toàn bộ hệ thống khi mã nguồn hiện tại chưa được kiểm tra.
- Chưa cần xây workflow n8n trong phạm vi bước triển khai SPA này.

## 9. Thông điệp ngắn để dán sang Agent mới

> Hãy tiếp tục dự án Wedding Operations SPA từ hồ sơ bàn giao và gói mã đính kèm. Không làm lại từ đầu. Mục tiêu trước mắt là kiểm tra mã, mở xác thực Google để tôi tự đăng nhập, dùng `clasp push` đưa 9 file chạy thật lên Apps Script ID `1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI`, deploy Web App kết nối Spreadsheet ID `1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs`, rồi chạy đủ test CRUD, công nợ, audit và mô phỏng sáu giai đoạn. Không yêu cầu tôi gửi mật khẩu hoặc OTP trong chat.
