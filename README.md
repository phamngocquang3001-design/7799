# Wedding Operations SPA — Apps Script

Ứng dụng quản lý vận hành đám cưới dạng SPA, đọc/ghi trực tiếp Google Sheet:

- Spreadsheet ID: `1nywmZEtRFXcmeQhuhW8Iho0AQVPyAldZwkfBbTosXCs`
- Apps Script ID: `1xcQ7b6cEF4tL1FjDtjRHuD53Oi6yL5t6xnncLeqX1Koie9cNCyEiutlI`
- Múi giờ: `Asia/Ho_Chi_Minh`

## Chức năng

- Dashboard: lead, dự án, công việc quá hạn, công nợ và lịch đám 14 ngày.
- CRUD lead, cơ hội, khách hàng, dự án, hóa đơn, thanh toán, công việc, vật tư.
- Xóa mềm qua `deleted_at`; kiểm tra khóa ngoại trước khi xóa.
- Sinh mã tuần tự bằng `LockService` và sheet `id_sequences`.
- Phân quyền theo `users` và `role_permissions`.
- Ghi lịch sử thêm/sửa/xóa vào `audit_logs`.
- Quản trị danh mục, phòng ban, người dùng, mẫu công việc.
- Mô phỏng 6 giai đoạn của một đám cưới điển hình, tạo dữ liệu liên kết thật.

## Các tệp cần đưa lên Apps Script

Giữ nguyên tên tệp: `Code.gs`, `Config.gs`, `DataStore.gs`, `Services.gs`, `Demo.gs`, `Index.html`, `Styles.html`, `AppJs.html`, `appsscript.json`.

Nếu dùng clasp:

```bash
npm install -g @google/clasp
clasp login
clasp push
```

`.clasp.json` đã trỏ đúng Script ID.

Mã được chia thành đúng 9 tệp chạy thật theo nhóm chức năng để dễ đọc và debug:

- API công khai: `Code.gs`.
- Cấu hình/schema hiển thị: `Config.gs`.
- Truy cập dữ liệu, khóa, ID, xóa mềm và audit: `DataStore.gs`.
- Setup, phân quyền, dashboard và công nợ: `Services.gs`.
- Mô phỏng và bộ nghiệm thu trực tiếp: `Demo.gs`.
- Khung giao diện, thiết kế và hành vi client: `Index.html`, `Styles.html`, `AppJs.html`.
- Manifest triển khai: `appsscript.json`.

`tests/smoke_test.js`, tài liệu và cấu hình cục bộ không được tải lên Apps Script nhờ `.claspignore`.

## Triển khai Web App

1. Trong Apps Script chọn **Deploy → New deployment → Web app**.
2. Chọn chạy dưới quyền **User accessing the web app**.
3. Chỉ cấp truy cập cho người dùng nội bộ cần sử dụng.
4. Cấp quyền đọc/ghi file Sheet cho các tài khoản đó.
5. Mở URL `/dev` để kiểm thử; sau khi đạt mới dùng URL `/exec`.

Lần tải đầu, `setupSystem_()` sẽ:

- sửa múi giờ Sheet về `Asia/Ho_Chi_Minh`;
- tạo sheet `demo_scenarios` nếu chưa có;
- bổ sung danh mục trạng thái;
- khởi tạo phòng ban, phân quyền và mẫu công việc nếu các bảng đang trống.

## Kiểm thử nhanh

1. Mở **Mô phỏng quy trình** → **Tạo kịch bản**.
2. Chạy từng bước để quan sát dữ liệu được tạo.
3. Kiểm tra một khách hàng có hai dự án: `tu_gia_cuoi` và `hoi_truong`.
4. Vào **Công việc**, sửa trạng thái và tiến độ; thử xóa mềm.
5. Vào **Công nợ**, thêm thanh toán `confirmed`; hóa đơn phải cập nhật `paid_amount`, `remaining_amount`, `invoice_status`.
6. Kiểm tra `audit_logs` có bản ghi tương ứng.

## Lưu ý vận hành

- Không đổi tên các sheet hoặc header nếu chưa cập nhật cấu hình/mã nguồn.
- Không xóa vật lý bản ghi nghiệp vụ; ứng dụng dùng `deleted_at`.
- Khi bảng `users` còn trống, ứng dụng cho phép tài khoản khởi tạo đầu tiên hoạt động như quản trị. Sau khi thêm người dùng, quyền được xét theo email Google và `role_permissions`.
- Nếu người dùng bỏ chọn quyền hoặc đóng ngang màn hình cấp quyền, bấm **Quyền truy cập** trên thanh trên cùng. Chọn **Reset quyền của tôi**, mở lại màn hình cấp quyền và chấp thuận đủ quyền đọc/ghi Google Sheets cùng quyền nhận diện email. Reset chỉ áp dụng cho tài khoản hiện tại và không xóa dữ liệu.
