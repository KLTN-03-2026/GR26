# REPORT: Đối chiếu Sprint 1 từ `images/image.png`
**Ngày kiểm tra:** 2026-04-09  
**Nguồn sprint:** `../images/image.png`  
**Phạm vi đọc:** `smartfb-frontend` + tham chiếu `../Smartfnb-BE` để phân biệt FE/BE  
**Sprint:** `3.1 Sprint 1 - Nền tảng & Bán hàng`

## Mục tiêu

Đối chiếu 6 hạng mục trong ảnh sprint với code hiện có để xác định:
- Hạng mục nào đã hoàn thành
- Hạng mục nào mới hoàn thành một phần
- Hạng mục nào thuộc giao diện `owner`, `pos/staff`, hay `auth/admin`
- Phần nào đang nằm ở FE, phần nào đã có ở BE

## Tiêu chí đánh giá

- `Hoàn thành`: FE và BE đã có luồng chính chạy thật, không chỉ placeholder hoặc mock
- `Hoàn thành một phần`: đã có code nhưng còn mock, placeholder, hoặc mới xong một phía
- `Chưa hoàn thành`: chưa thấy màn hình/luồng thực thi tương ứng

## Tổng quan nhanh

- `Hoàn thành`: `2/6`
- `Hoàn thành một phần`: `4/6`
- `Chưa hoàn thành`: `0/6` ở mức hạng mục lớn, nhưng có nhiều phần con còn thiếu trong `3.1.2`, `3.1.4`, `3.1.5`, `3.1.6`

## Ma trận đối chiếu

| Mã | Hạng mục | Giao diện chính | FE | BE | Đánh giá |
| --- | --- | --- | --- | --- | --- |
| `3.1.1` | Đăng ký / Đăng nhập | `Auth public` | Có màn `Login`, `Register`, `Forgot Password`; hooks/service nối API thật | Có `AuthController` cho `register`, `login`, `refresh`, `forgot-password`, `verify-otp`, `reset-password`, `select-branch`, `pin-login` | `Hoàn thành` |
| `3.1.2` | Quản lý Tenant, Chi nhánh, Nhân viên + Phân quyền | `Owner` + một phần `Admin` | `Chi nhánh` dùng API thật; `Nhân viên` có UI nhưng service đang mock/in-memory; `Tenant admin` mới placeholder; guard quyền có nhưng chưa thấy UI quản lý role/permission | Có `BranchController`, `StaffController`, `RoleController`; chưa thấy controller quản trị danh sách tenant phía admin | `Hoàn thành một phần` |
| `3.1.3` | Quản lý Thực đơn | `Owner` | Có page/hook/dialog CRUD món, danh mục, addon, cấu hình theo chi nhánh; dùng API thật | Có `MenuItemController`, `CategoryController`, `AddonController`, `BranchItemController`, `RecipeController` | `Hoàn thành` |
| `3.1.4` | Quản lý Bàn | `Owner` là chính; `Staff` chưa có màn riêng thật | Có `TablesPage` và dialog CRUD, nhưng `tableService` vẫn dùng mock data; route staff cho bàn còn placeholder | Có `TableController`, `TableZoneController`, broadcast websocket sơ đồ bàn | `Hoàn thành một phần` |
| `3.1.5` | Quản lý Đơn hàng | `POS/Staff` là chính, `Owner` dùng chung luồng POS | Có `OrderPage`, `OrderManagementPage`; `placeOrder` và `updateStatus` gọi API thật, nhưng `getOrders` đang trả mock | Có `OrderController`, query/filter/list/detail/status/cancel, domain event + websocket | `Hoàn thành một phần` |
| `3.1.6` | Thanh toán, hóa đơn | `POS/Staff` | Có `PaymentPage` UI, nhưng chưa thấy `paymentService`, chưa gọi `/payments`, chưa nối search/get invoice | Có `PaymentController` cho `cash`, `qr`, webhook QR, search invoice, lấy invoice/payment | `Hoàn thành một phần` |

## Phân loại theo giao diện

### Nhóm `owner`

- `3.1.2` Quản lý chi nhánh: đã chạy FE + BE khá đầy đủ
- `3.1.2` Quản lý nhân viên: owner có màn hình nhưng FE còn mock
- `3.1.3` Quản lý thực đơn: đã có đầy đủ nhất ở phía owner
- `3.1.4` Quản lý bàn: owner có màn hình, nhưng dữ liệu FE chưa nối backend thật

### Nhóm `pos/staff`

- `3.1.5` Quản lý đơn hàng: đây là nhóm gần với POS nhất, UI đã có nhưng danh sách đơn vẫn mock
- `3.1.6` Thanh toán, hóa đơn: UI thanh toán đã dựng, nhưng chưa nối BE
- `3.1.4` Quản lý bàn cho staff: route staff hiện còn placeholder, chưa thấy màn thao tác thật riêng cho staff

### Nhóm `auth/admin`

- `3.1.1` Đăng ký / Đăng nhập: hoàn chỉnh nhất trong sprint
- `3.1.2` Quản lý tenant phía admin: mới dừng ở route placeholder, chưa thấy page thật

## Phân loại theo FE / BE

### Phần FE đã khá hoàn chỉnh

- Auth public: đăng ký, đăng nhập, quên mật khẩu
- Quản lý chi nhánh owner
- Quản lý thực đơn owner

### Phần FE còn dang dở

- Quản lý nhân viên đang dùng `staffService` mock
- Quản lý bàn đang dùng `tableService` mock
- Quản lý đơn hàng mới nối một phần, phần list vẫn mock
- Thanh toán/hóa đơn mới là UI local, chưa nối API thật
- Tenant admin chưa có page thật

### Phần BE đã có nền tốt hơn FE

- Auth và RBAC
- Branch
- Staff + role/permission
- Menu
- Table + zone + websocket
- Order
- Payment + invoice

## Dấu hiệu chính dùng để kết luận

- FE `thật`: service/hook gọi `axios` tới API thật như `authService`, `branchService`, `menuService`
- FE `mock`: service giữ dữ liệu in-memory hoặc hard-code như `staffService`, `tableService`, `orderService.getOrders`, `PaymentPage`
- FE `placeholder`: route có nhưng render `PagePlaceholder`
- BE `thật`: có controller, command/query handler, repository/domain tương ứng trong `../Smartfnb-BE`

## Kết quả kiểm tra

- Sprint 1 hiện **chưa hoàn thành end-to-end toàn bộ**.
- Các hạng mục đã chắc chắn xong ở mức triển khai thực tế là:
  - `3.1.1 Đăng ký / Đăng nhập`
  - `3.1.3 Quản lý Thực đơn`
- Các hạng mục còn dở chủ yếu nằm ở FE:
  - `3.1.2` thiếu phần tenant admin thật, staff FE còn mock, chưa có UI quản lý phân quyền
  - `3.1.4` FE quản lý bàn còn mock
  - `3.1.5` FE quản lý đơn mới nối một phần
  - `3.1.6` FE thanh toán/hóa đơn mới dừng ở UI
- Backend hiện đi trước frontend ở nửa sau sprint, nhất là `table`, `order`, `payment`

## File tham chiếu chính

- FE:
  - `src/routes/routeConfig.tsx`
  - `src/pages/auth/LoginPage.tsx`
  - `src/pages/auth/RegisterPage.tsx`
  - `src/pages/owner/BranchesPage.tsx`
  - `src/pages/owner/StaffPage.tsx`
  - `src/pages/owner/MenuPage.tsx`
  - `src/pages/owner/TablesPage.tsx`
  - `src/pages/pos/OrderPage.tsx`
  - `src/pages/pos/OrderManagementPage.tsx`
  - `src/pages/pos/PaymentPage.tsx`
  - `src/modules/staff/services/staffService.ts`
  - `src/modules/table/services/tableService.ts`
  - `src/modules/order/services/orderService.ts`
- BE:
  - `../Smartfnb-BE/src/main/java/com/smartfnb/auth/web/controller/AuthController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/branch/web/controller/BranchController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/staff/web/controller/StaffController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/staff/web/controller/RoleController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/menu/web/controller/MenuItemController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/order/web/controller/TableController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/order/web/controller/OrderController.java`
  - `../Smartfnb-BE/src/main/java/com/smartfnb/payment/web/controller/PaymentController.java`
