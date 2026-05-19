# PHÂN CÔNG FE: Sprint 1 - Nền tảng & Bán hàng
**Ngày lập:** 2026-04-09  
**Nguồn tham chiếu:** `../docs/2026-04-09/SPRINT-1-NEN-TANG-BAN-HANG-AUDIT.md`  
**Phạm vi:** Chỉ chia phần FE chưa hoàn thành trong Sprint 1

## Mục tiêu

Chia lại phần việc FE còn dang dở trong Sprint 1 cho 3 thành viên:
- Thiên
- Hoàng
- Huy Nhật

Nguyên tắc chia:
- Giữ ownership cũ tối đa để giảm thời gian handoff
- Ưu tiên task có thể chốt end-to-end nhanh nhất
- Tách rõ phần `phải làm ngay`, `phần hỗ trợ`, `phần bị block bởi BE`
- Bổ sung yêu cầu mới: `Owner cũng phải order được`
- Bổ sung yêu cầu mới: cần làm rõ `giao diện pos/staff` trong Sprint 1

## Kết luận từ audit dùng để chia việc

Các phần FE còn chưa hoàn thành của Sprint 1:
- `3.1.2` Nhân viên còn mock, chưa có UI quản lý phân quyền; tenant admin chưa có page thật
- `3.1.4` Quản lý bàn còn dùng mock, route staff cho bàn chưa có màn thật
- `3.1.5` Quản lý đơn hàng mới nối một phần, list đơn đang mock
- `3.1.6` Thanh toán/hóa đơn mới là UI local, chưa nối API thật

Các phần FE đã khá ổn:
- Đăng nhập / Đăng ký / Quên mật khẩu
- Quản lý chi nhánh
- Quản lý menu
- Quản lý kho đang do Hoàng giữ ownership và cần tiếp tục chốt ở nhánh `staff/pos` nếu có liên quan

## Đề xuất phân công chính thức

### 1. Thiên

**Ownership chính:** `Quản lý bàn` + `Quản lý nhân viên`

**Lý do giữ ownership:**
- Đây là phần đã được giao trước
- Audit cho thấy đúng 2 module này còn dang dở ở FE
- Nếu Thiên thật sự đã làm xong local thì cần đẩy code và nối đúng API là nhanh nhất

**Task phải chốt trong Sprint 1:**
- Chuyển `tableService` từ mock sang API thật
- Hoàn thiện màn owner quản lý bàn với dữ liệu backend thật
- Bổ sung/hoàn thiện màn staff thao tác bàn nếu scope Sprint 1 yêu cầu staff dùng được
- Chuyển `staffService` từ mock/in-memory sang API thật
- Hoàn thiện CRUD nhân viên bằng backend thật
- Hoàn thiện gán role cho nhân viên nếu BE đã sẵn contract dùng được

**Task cần làm đầu tiên:**
- Push toàn bộ phần local đang có
- Liệt kê rõ file nào đã làm xong, file nào mới là UI, file nào chưa nối API
- Demo 2 luồng thật:
  - danh sách bàn + CRUD bàn
  - danh sách nhân viên + CRUD nhân viên

**Acceptance tối thiểu:**
- Không còn `mockTableDetails`, `tableService` mock trong luồng chính
- Không còn `staffService` in-memory trong luồng chính
- Owner dùng được màn bàn và nhân viên với dữ liệu thật

### 2. Huy Nhật

**Ownership chính:** `Quản lý đơn hàng` + `Thanh toán` + `giao diện POS/Staff cho order flow`

**Lý do giữ ownership:**
- Đây là phần đã giao trước
- Audit cho thấy order/payment là vùng FE còn dở rõ nhất
- Đây cũng là nơi cần xử lý yêu cầu mới: `owner cũng có thể order`

**Task phải chốt trong Sprint 1:**
- Thay `orderService.getOrders()` mock bằng API thật
- Hoàn thiện danh sách đơn hàng, lọc, chi tiết, cập nhật trạng thái từ backend thật
- Tạo `paymentService` riêng cho payment module
- Nối `PaymentPage` với API `/payments/cash` và `/payments/qr`
- Nối luồng lấy thông tin hóa đơn/search invoice nếu nằm trong scope màn hiện tại
- Sửa luồng order để `owner` cũng đặt món được, không chỉ `staff/POS`
- Chốt toàn bộ giao diện POS/Staff liên quan đến:
  - đặt món
  - quản lý đơn hàng
  - thanh toán
  - các trạng thái rỗng/lỗi/loading của các màn trên

**Phần owner cũng có thể order cần chốt rõ:**
- Owner vào được luồng đặt món và quản lý đơn hàng
- Owner dùng cùng flow POS nếu đó là quyết định UX cuối
- Không hardcode logic chỉ staff/cashier mới thấy hoặc mới dùng được order flow ở FE
- Kiểm tra lại route/menu/guard để owner không bị redirect sai

**Task cần làm đầu tiên:**
- Bỏ mock khỏi `getOrders`
- Xác định contract response thật cho danh sách đơn
- Tách payment khỏi UI local state thành service + hook/use case rõ ràng
- Chốt wireframe/luồng cuối cho staff POS trước khi code lan rộng
- Demo 3 luồng thật:
  - đặt món
  - xem/quản lý đơn hàng
  - thanh toán tiền mặt hoặc QR

**Acceptance tối thiểu:**
- Không còn `mockOrders` trong luồng chính
- `PaymentPage` không còn `setTimeout` giả lập thành công làm luồng chính
- Owner và Staff đều đi được vào flow order
- Bộ màn POS/Staff cho order-payment có thể đi qua được bằng route thật

### 3. Hoàng

**Ownership chính:** `auth` + `branch` + `menu` + `kho` + `điểm giao integration`

**Lý do giao phần này cho Hoàng:**
- Hoàng đang giữ các module đã ổn nhất: `auth`, `branch`, `menu`, `kho`
- Đây là người phù hợp xử lý các phần giao cắt nhiều module
- Cần một người chốt integration và dọn các phần lệch role/route/context

**Task phải chốt trong Sprint 1:**
- Hỗ trợ Huy Nhật chốt owner order flow ở các phần liên quan `route`, `role`, `branch context`
- Rà lại toàn bộ route/menu/guard để owner và staff vào đúng màn đúng role
- Chốt branch selection/context cho order-payment nếu còn lỗi do branch hiện tại
- Review integration cuối cho menu -> order -> payment
- Chốt phần `kho` theo ownership cũ của Hoàng, bao gồm:
  - kiểm tra luồng owner/staff dùng kho có đúng role
  - rà lại màn `inventory` cho staff nếu đang dùng chung page
  - xử lý các lệch route/menu liên quan kho giữa owner và staff

**Task nên nhận thêm nếu còn sức:**
- Dựng khung FE `tenant admin` nếu muốn giữ đúng tên scope sprint

**Lưu ý với tenant admin:**
- Theo audit hiện tại, phần này chưa thấy backend quản lý danh sách tenant tương ứng
- Vì vậy không nên coi đây là task FE có thể chốt end-to-end ngay
- Nếu chưa có contract BE thì chỉ nên:
  - dựng page skeleton
  - chuẩn hóa route/layout admin
  - tách rõ trạng thái `blocked by backend`

**Acceptance tối thiểu:**
- Luồng owner/staff route không đi sai role
- Order flow không vỡ do branch context hoặc guard
- Luồng kho không đi sai role giữa owner và staff
- Có checklist integration để merge code của Thiên và Huy Nhật

## Danh sách giao diện `staff / pos` cần có trong Sprint 1

### Nhóm Staff/POS bắt buộc nên có

- `Đăng nhập`
- `Dashboard staff`
  - nếu chưa kịp full data thì tối thiểu có khung page riêng thay vì placeholder
- `Bàn / sơ đồ bàn`
- `Đặt món`
- `Quản lý đơn hàng`
- `Thanh toán`
- `Kho`
  - nếu role staff/branch manager được phép dùng theo thiết kế hiện tại
- `Ca làm của tôi`
  - ít nhất có page riêng thay vì placeholder nếu vẫn giữ trong scope Sprint 1

### Nhóm dùng chung nhưng staff cần truy cập đúng role

- `Chọn chi nhánh làm việc` nếu flow có dùng
- `Header / menu / mobile nav / sidebar` theo role staff
- `Loading / empty / error states` cho các màn staff chính

### Mapping ownership cho phần staff / pos

- `Thiên`
  - giao diện `Bàn / sơ đồ bàn` cho staff nếu Sprint 1 yêu cầu dùng thật
  - phần nhân sự nếu có staff-facing view liên quan
- `Huy Nhật`
  - giao diện `Đặt món`
  - giao diện `Quản lý đơn hàng`
  - giao diện `Thanh toán`
  - sửa flow để owner cũng dùng được order
- `Hoàng`
  - giao diện `Kho` theo role staff
  - route/menu/guard chung cho staff
  - branch context và integration toàn flow

## Ưu tiên triển khai đề xuất

### Ưu tiên P1 - Phải làm ngay

- Thiên: push code bàn + nhân viên, nối API thật
- Huy Nhật: bỏ mock order list, nối payment API thật, chốt bộ màn POS/Staff của order-payment
- Hoàng: chốt owner order flow + route/guard/context + kho theo role staff

### Ưu tiên P2 - Làm sau khi P1 ổn

- Thiên: staff table page nếu Sprint 1 bắt buộc
- Huy Nhật: invoice search/detail nếu cần trong UI sprint
- Hoàng: dựng khung tenant admin FE nếu muốn giữ đúng tên backlog

### Ưu tiên P3 - Nếu còn thời gian

- UI quản lý role/permission cho staff
- Hoàn thiện thêm các case realtime cho order/table

## Phân chia phụ thuộc giữa các thành viên

### Thiên phụ thuộc

- Contract API thật cho `staff` và `table` từ backend
- Review route/role từ Hoàng nếu có màn staff riêng

### Huy Nhật phụ thuộc

- Contract response order list/order detail/payment từ backend
- Route và branch context do Hoàng hỗ trợ chốt

### Hoàng phụ thuộc

- Code local chưa push của Thiên
- Quyết định UX cuối cho owner order: dùng chung POS hay có wrapper riêng
- Quyết định cuối về staff có được dùng kho ở scope Sprint 1 hay chỉ branch_manager dùng

## Việc cần manager chốt ngay

- Yêu cầu Thiên push code trong ngày, không để trạng thái "nghe nói xong rồi"
- Chốt rõ `owner order` là dùng chung flow POS hay cần màn owner riêng
- Chốt rõ `staff/pos` trong Sprint 1 phải có những màn nào là bắt buộc release
- Xác nhận `tenant admin` có giữ trong scope Sprint 1 FE hay chuyển sang sprint sau vì đang có dấu hiệu block từ BE

## Kết quả đề xuất

- Giữ nguyên ownership cũ để tối ưu tốc độ
- Phần còn thiếu lớn nhất nên chia như sau:
  - `Thiên`: bàn + nhân viên
  - `Huy Nhật`: order + payment + sửa owner order + bộ giao diện pos/staff của order flow
  - `Hoàng`: auth/branch/menu/kho + integration role/route/branch context + chốt phần giao cắt và phần block
- Nếu cần chốt Sprint 1 nhanh, ưu tiên bỏ mock ở `staff`, `table`, `order list`, `payment`, sau đó dọn các màn staff còn placeholder
