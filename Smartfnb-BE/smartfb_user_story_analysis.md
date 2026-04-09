# 🍽️ Hệ Thống Quản Lý Chuỗi F&B SmartF&B
### Phân tích User Story & Thiết kế hệ thống toàn diện
**SaaS Multi-Tenant POS cho Chuỗi F&B | 36 User Stories | 13 Module**

---

## Mục lục

1. [Xác thực & Tài khoản (Auth)](#module-1-xác-thực--tài-khoản-auth)
2. [Quản lý Gói dịch vụ (Subscription/Plan)](#module-2-quản-lý-gói-dịch-vụ-subscriptionplan)
3. [Quản lý Chi nhánh (Branch)](#module-3-quản-lý-chi-nhánh-branch)
4. [Quản lý Nhân sự (Staff & Role)](#module-4-quản-lý-nhân-sự-staff--role)
5. [Quản lý Thực đơn (Menu)](#module-5-quản-lý-thực-đơn-menu)
6. [Quản lý Đơn hàng & Bàn (Order & Table)](#module-6-quản-lý-đơn-hàng--bàn-order--table)
7. [Quản lý Thanh toán & Hóa đơn (Payment & Invoice)](#module-7-quản-lý-thanh-toán--hóa-đơn-payment--invoice)
8. [Quản lý Khuyến mãi (Promotion & Voucher)](#module-8-quản-lý-khuyến-mãi-promotion--voucher)
9. [Quản lý Kho Nguyên liệu (Inventory)](#module-9-quản-lý-kho-nguyên-liệu-inventory)
10. [Quản lý Nhà cung cấp (Supplier)](#module-10-quản-lý-nhà-cung-cấp-supplier)
11. [Báo cáo Doanh thu & Sản phẩm (Revenue Report)](#module-11-báo-cáo-doanh-thu--sản-phẩm-revenue-report)
12. [Báo cáo Kho (Inventory Report)](#module-12-báo-cáo-kho-inventory-report)
13. [Báo cáo Nhân sự (HR Report)](#module-13-báo-cáo-nhân-sự-hr-report)
- [A. Thông tin dự án](#a-thông-tin-dự-án)
- [B. Mục tiêu hệ thống](#b-mục-tiêu-hệ-thống)
- [C. Ràng buộc & Công cụ](#c-ràng-buộc--công-cụ)

---

## Module 1: Xác thực & Tài khoản (Auth)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Quản lý vòng đời xác thực của tất cả người dùng trong hệ thống: chủ quán đăng ký tài khoản SaaS mới, đăng nhập theo role, đăng xuất an toàn và khôi phục mật khẩu qua OTP. Xác thực dựa trên RBAC (Role-Based Access Control), điều hướng dashboard khác nhau theo từng vai trò.

**Actors:** Chủ quán (Owner), Quản trị viên (Admin), Nhân viên (Staff)

**User Stories liên quan:** US-01, US-02, US-03, US-04

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `ACTION` | Đăng ký tài khoản | Chủ quán tạo tài khoản mới, chọn gói dịch vụ, hệ thống tạo tenant |
| `ACTION` | Đăng nhập | Xác thực email/SĐT + mật khẩu, điều hướng dashboard theo role |
| `ACTION` | Đăng xuất | Xóa session, vô hiệu hóa token |
| `ACTION` | Quên mật khẩu | Khôi phục qua OTP email/SĐT, đặt mật khẩu mới |
| `RULE` | RBAC | Mỗi role được điều hướng dashboard khác nhau (Admin / Owner / POS) |
| `RULE` | Khóa tài khoản | Sai quá số lần quy định → khóa tạm thời |
| `RULE` | OTP hết hạn | Mã OTP có thời hạn sử dụng giới hạn |

### 3. Entities & Data Model

```
User
  id, tenant_id, email, phone, password_hash,
  role (owner | admin | branch_manager | cashier | barista | waiter),
  is_active, failed_login_count, locked_until,
  last_login_at, pos_pin (hashed)

OTPRecord
  id, user_id, otp_code (hashed), purpose (reset_password | verify_email),
  expires_at, is_used, created_at

Tenant
  id, name, slug, owner_user_id, status (active | suspended | cancelled),
  created_at
```

### 4. Business Rules & Validation

- `IF email/phone đã tồn tại THEN block đăng ký + hiển thị lỗi`
- `IF password không đạt yêu cầu (độ dài, ký tự đặc biệt) THEN reject`
- `IF đăng nhập thành công THEN redirect đến dashboard theo role (Admin / Owner / POS)`
- `IF sai thông tin THEN hiển thị thông báo lỗi rõ ràng`
- `IF sai quá số lần quy định THEN khóa tài khoản tạm thời`
- `IF đăng xuất THEN xóa session + vô hiệu hóa JWT token`
- `IF OTP hết hạn THEN yêu cầu gửi lại mã mới`
- `IF mật khẩu mới = mật khẩu cũ THEN reject`

### 5. Tích hợp với module khác
- → **Quản lý Gói:** Khi đăng ký, chủ quán chọn gói → tạo subscription
- → **Tất cả module:** JWT token mang `tenant_id` + `role` để phân quyền

### 7. UI Screens
- Trang đăng ký (nhập email/SĐT, mật khẩu, chọn gói)
- Trang đăng nhập (email/SĐT + mật khẩu)
- Trang quên mật khẩu (nhập email/SĐT → nhập OTP → đặt mật khẩu mới)

### 8. API Endpoints

```
POST   /api/v1/auth/register              # Đăng ký chủ quán mới
POST   /api/v1/auth/login                 # Đăng nhập
POST   /api/v1/auth/logout                # Đăng xuất + invalidate token
POST   /api/v1/auth/forgot-password       # Gửi OTP quên mật khẩu
POST   /api/v1/auth/reset-password        # Đặt lại mật khẩu mới
POST   /api/v1/auth/refresh               # Refresh JWT token
```

---

## Module 2: Quản lý Gói dịch vụ (Subscription/Plan)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Quản trị viên (Super Admin) quản lý các gói dịch vụ SaaS cung cấp cho chủ quán. Mỗi gói định nghĩa số lượng chi nhánh tối đa, tính năng được bật (Feature Flags: POS, Inventory, Promotion, AI...). Chủ quán chọn gói khi đăng ký và được gán tự động.

**Actors:** Quản trị viên (Super Admin), Chủ quán (khi đăng ký)

**User Stories liên quan:** US-05

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý Plan | Tạo/sửa/vô hiệu hóa các gói: Basic, Standard, Premium... |
| `CRUD` | Feature Flag | Cấu hình tính năng được bật/tắt theo từng gói |
| `ACTION` | Gán gói | Gán gói cho tenant khi đăng ký |
| `ACTION` | Vô hiệu hóa/kích hoạt | Bật tắt gói dịch vụ |
| `VIEW` | Danh sách tenant | Xem tenant đang dùng từng gói |
| `RULE` | Tên gói unique | Tên gói không được trùng |
| `RULE` | Giá hợp lệ | Giá gói phải >= 0 |
| `RULE` | Không xóa gói đang dùng | Không được xóa gói khi còn tenant sử dụng |

### 3. Entities & Data Model

```
Plan
  id, name, slug, price_monthly,
  max_branches, features_json (POS | Inventory | Promotion | AI),
  is_active, created_at

Subscription
  id, tenant_id, plan_id,
  status (active | suspended | cancelled),
  started_at, expires_at

FeatureFlag
  id, plan_id, feature_key, is_enabled, limit_value
```

### 4. Business Rules & Validation

- `IF tên gói trùng THEN reject`
- `IF giá < 0 THEN reject`
- `IF gói đang có tenant sử dụng THEN không được xóa cứng`
- `IF vô hiệu hóa gói THEN tenant hiện tại vẫn dùng cho đến hết hạn`
- `IF branch_count >= plan.max_branches THEN block tạo chi nhánh mới`

### 5. Tích hợp với module khác
- → **Auth:** Đăng ký tenant → chọn gói → tạo subscription
- → **Chi nhánh:** Số chi nhánh tối đa bị giới hạn bởi plan
- → **Tất cả module:** Middleware kiểm tra feature flag trước mỗi action

### 7. UI Screens
- Danh sách gói dịch vụ (tên, giá, số chi nhánh tối đa, feature flags)
- Form thêm/sửa gói (tên, giá, giới hạn chi nhánh, cấu hình Feature Flags)
- Màn hình xem tenant đang dùng gói

### 8. API Endpoints

```
GET    /api/v1/plans                      # Danh sách gói
POST   /api/v1/plans                      # Tạo gói mới
PUT    /api/v1/plans/:id                  # Cập nhật gói
PUT    /api/v1/plans/:id/toggle           # Vô hiệu hóa / kích hoạt
GET    /api/v1/plans/:id/tenants          # Danh sách tenant đang dùng gói này
GET    /api/v1/subscriptions/current      # Subscription hiện tại của tenant
```

---

## Module 3: Quản lý Chi nhánh (Branch)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Quản lý toàn bộ thông tin các chi nhánh trong chuỗi F&B. Mỗi chi nhánh có định danh duy nhất, thông tin liên hệ, trạng thái hoạt động. Chủ quán xem tất cả chi nhánh; nhân viên chỉ thấy chi nhánh được phân công.

**Actors:** Admin (Super Admin), Chủ quán (Owner), Nhân viên (Staff)

**User Stories liên quan:** US-06, US-07

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý chi nhánh | Tạo/sửa/vô hiệu hóa chi nhánh (tên, địa chỉ, GPS, hotline, quản lý) |
| `ACTION` | Vô hiệu hóa/tạm đóng | Đóng cửa tạm thời mà không mất dữ liệu |
| `VIEW` | Danh sách chi nhánh | Xem danh sách kèm trạng thái (đang mở/tạm nghỉ) |
| `VIEW` | Tìm kiếm chi nhánh | Tìm theo tên, mã chi nhánh, địa chỉ — hiển thị real-time |
| `ACTION` | Chọn chi nhánh làm việc | Thiết lập "context" chi nhánh cho phiên làm việc |
| `RULE` | Mã định danh duy nhất | Mỗi chi nhánh phải có mã định danh unique toàn hệ thống |
| `RULE` | Phân quyền xem | Chủ quán thấy tất cả; nhân viên chỉ thấy chi nhánh được phân công |
| `RULE` | Chỉ Super Admin tạo/xóa | Chỉ Super Admin mới có quyền tạo mới hoặc xóa chi nhánh |

### 3. Entities & Data Model

```
Branch
  id, tenant_id, name, code (unique), address,
  latitude, longitude, phone, manager_staff_id,
  status (active | inactive | temporarily_closed), created_at

BranchStaff
  id, branch_id, user_id, is_primary_branch, assigned_at
```

### 4. Business Rules & Validation

- `IF plan.max_branches exceeded THEN block tạo chi nhánh + hiện thông báo`
- `IF branch.status = 'inactive' THEN POS không thể tạo đơn tại chi nhánh này`
- `IF user.role = 'staff' THEN chỉ thấy chi nhánh được phân công`
- `IF tìm kiếm chi nhánh THEN trả kết quả trong vòng dưới 1 giây`
- `IF người dùng chọn chi nhánh làm việc THEN ghi nhớ trong session`

### 5. Tích hợp với module khác
- → **Nhân sự:** Nhân viên được gán vào một hoặc nhiều chi nhánh
- → **Kho:** Mỗi chi nhánh có kho nguyên liệu riêng
- → **Đơn hàng:** Mỗi đơn hàng gắn với `branch_id`
- → **Ca làm:** Ca làm gắn với chi nhánh

### 7. UI Screens
- Danh sách chi nhánh (tên, địa chỉ, hotline, trạng thái, nút chọn)
- Form thêm/sửa chi nhánh (tên, địa chỉ, GPS, hotline, nhân sự quản lý)
- Màn hình tìm kiếm & chọn chi nhánh làm việc

### 8. API Endpoints

```
GET    /api/v1/branches                   # Danh sách chi nhánh
POST   /api/v1/branches                   # Tạo chi nhánh (Super Admin)
GET    /api/v1/branches/:id               # Chi tiết chi nhánh
PUT    /api/v1/branches/:id               # Cập nhật chi nhánh
PUT    /api/v1/branches/:id/toggle        # Kích hoạt / vô hiệu hóa
POST   /api/v1/branches/:id/staff         # Gán nhân viên vào chi nhánh
DELETE /api/v1/branches/:id/staff/:userId # Xóa nhân viên khỏi chi nhánh
POST   /api/v1/session/branch             # Chọn chi nhánh làm việc cho session
```

---

## Module 4: Quản lý Nhân sự (Staff & Role)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Quản lý toàn bộ nhân sự: hồ sơ, chức vụ, phân quyền RBAC, ca làm việc và đăng ký ca. Phân quyền theo vai trò: Owner, Admin, Branch Manager, Cashier, Barista, Waiter. Nhân viên đăng nhập POS bằng PIN để thao tác nhanh.

**Actors:** Chủ quán (Owner), Quản lý chi nhánh (Branch Manager), Nhân viên (Staff)

**User Stories liên quan:** US-08, US-09, US-10, US-11, US-12, US-13

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý nhân viên | Thêm/sửa/khóa/xóa nhân viên (tên, SĐT, vai trò, chi nhánh, PIN POS) |
| `CRUD` | Quản lý chức vụ | Tạo/sửa/xóa các chức vụ nghiệp vụ (Barista, Cashier, Waiter, Shift Manager) |
| `CRUD` | Quản lý phân quyền | Thiết lập ma trận RBAC (View/Create/Update/Delete) theo module cho từng role |
| `CRUD` | Quản lý ca | Thiết lập khung giờ ca làm việc (Sáng/Chiều/Tối/Ca gãy), số nhân sự tối thiểu/tối đa |
| `ACTION` | Đăng ký ca làm | Nhân viên tự đăng ký ca còn trống tại chi nhánh |
| `VIEW` | Tìm kiếm nhân viên | Tìm theo tên/SĐT, lọc theo vai trò/trạng thái/chi nhánh — real-time |
| `RULE` | SĐT unique | Số điện thoại không được trùng trong cùng tenant |
| `RULE` | Nhân viên thuộc 1 tenant | Nhân viên chỉ thuộc một tenant |
| `RULE` | Không xóa khi có ca | Không được xóa nhân viên đang có ca làm việc |
| `RULE` | Không đăng ký trùng ca | Nhân viên không được đăng ký 2 ca trùng giờ nhau |

### 3. Entities & Data Model

```
Staff
  id, tenant_id, user_id, full_name, phone,
  position_id, status (active | inactive),
  pos_pin (hashed), created_at

Position
  id, tenant_id, name (Barista | Cashier | Waiter | Shift Manager),
  description, base_salary

RolePermission
  id, tenant_id, role, module_key,
  can_view, can_create, can_update, can_delete

ShiftTemplate
  id, branch_id, name, start_time, end_time,
  min_staff, max_staff, color

ShiftSchedule
  id, branch_id, staff_id, shift_template_id, date,
  status (scheduled | completed | absent | cancelled),
  checked_in_at, checked_out_at
```

### 4. Business Rules & Validation

- `IF SĐT trùng trong cùng tenant THEN reject`
- `IF xóa nhân viên đang có ca làm việc THEN block + hiện thông báo`
- `IF chức vụ đang có nhân viên THEN không được xóa`
- `IF chỉ chủ quán (Owner) mới được thay đổi phân quyền cho tài khoản quản lý khác`
- `IF audit trail THEN ghi lại tất cả thay đổi phân quyền`
- `IF ca kết thúc <= ca bắt đầu THEN reject`
- `IF nhân viên đăng ký 2 ca trùng giờ THEN block`
- `IF đăng ký ca trễ hơn thời hạn quy định (24h) THEN block`
- `IF nhân viên chỉ xem chi nhánh được phân công`

### 5. Tích hợp với module khác
- → **Chi nhánh:** Nhân viên được gán vào chi nhánh
- → **Đơn hàng:** Mỗi đơn có `created_by_staff_id`
- → **Báo cáo nhân sự:** Chấm công, lương từ dữ liệu ca làm

### 6. AI/Automation Opportunities
- Gợi ý xếp lịch tự động dựa trên traffic forecast và sự sẵn sàng của nhân viên
- Phát hiện pattern nghỉ phép bất thường (đi muộn liên tục, vắng trước ngày lễ)

### 7. UI Screens
- Danh sách nhân viên (filter theo chi nhánh, vai trò, trạng thái)
- Form thêm/sửa nhân viên (tên, SĐT, chức vụ, chi nhánh, tạo PIN)
- Màn hình ma trận phân quyền RBAC (bật/tắt View/Create/Update/Delete theo module)
- Màn hình quản lý ca (thiết lập khung giờ, số nhân sự yêu cầu)
- Màn hình đăng ký ca (danh sách ca trống, nhấn đăng ký)

### 8. API Endpoints

```
GET    /api/v1/staff                      # Danh sách nhân viên
POST   /api/v1/staff                      # Thêm nhân viên
GET    /api/v1/staff/:id                  # Chi tiết nhân viên
PUT    /api/v1/staff/:id                  # Cập nhật nhân viên
PUT    /api/v1/staff/:id/toggle           # Khóa / mở khóa tài khoản
DELETE /api/v1/staff/:id                  # Xóa nhân viên

GET    /api/v1/positions                  # Danh sách chức vụ
POST   /api/v1/positions                  # Tạo chức vụ
PUT    /api/v1/positions/:id              # Cập nhật chức vụ
DELETE /api/v1/positions/:id              # Xóa chức vụ

GET    /api/v1/permissions/:role          # Lấy phân quyền theo role
PUT    /api/v1/permissions/:role          # Cập nhật phân quyền

GET    /api/v1/shifts/templates           # Danh sách ca
POST   /api/v1/shifts/templates           # Tạo ca
PUT    /api/v1/shifts/templates/:id       # Cập nhật ca
GET    /api/v1/shifts/open                # Danh sách ca còn trống
POST   /api/v1/shifts/register            # Đăng ký ca
```

---

## Module 5: Quản lý Thực đơn (Menu)
> **Độ phức tạp:** 🔴 Cao

### 1. Mô tả tổng quan
Quản lý toàn bộ thực đơn: danh mục, món ăn/đồ uống, topping, công thức chế biến. Mỗi món gắn với công thức để hệ thống tự động trừ kho nguyên liệu khi bán. Tìm kiếm thực đơn hỗ trợ real-time, không phân biệt hoa thường.

**Actors:** Chủ quán (Owner), Nhân viên (Staff)

**User Stories liên quan:** US-14, US-15, US-16, US-17, US-18

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Danh mục thực đơn | Tạo/sửa/vô hiệu hóa danh mục (tên, mô tả, trạng thái) |
| `CRUD` | Món ăn / Đồ uống | Thêm/sửa/vô hiệu hóa món (tên, giá, hình ảnh, danh mục) |
| `CRUD` | Topping / Add-on | Quản lý topping (tên, giá bán, trạng thái) |
| `CRUD` | Công thức (Recipe) | Định nghĩa nguyên liệu và định lượng cho từng món |
| `VIEW` | Tìm kiếm thực đơn | Tìm theo từ khóa, lọc theo danh mục — không phân biệt hoa thường |
| `RULE` | Tên danh mục unique | Tên danh mục không được trùng |
| `RULE` | Tên món unique | Tên món không được trùng |
| `RULE` | Tên topping unique | Tên topping không được trùng |
| `RULE` | Giá hợp lệ | Giá bán phải >= 0 |
| `RULE` | Không xóa cứng | Danh mục chứa món, topping đã phát sinh giao dịch chỉ được vô hiệu hóa |
| `RULE` | Định lượng công thức > 0 | Định lượng nguyên liệu trong công thức phải > 0 |

### 3. Entities & Data Model

```
Category
  id, tenant_id, name, description, is_active, display_order

MenuItem
  id, tenant_id, category_id, name, description,
  image_url, base_price, is_active

MenuItemAddon (Topping)
  id, tenant_id, name, extra_price, is_active

Recipe
  id, tenant_id, menu_item_id, notes

RecipeIngredient
  id, recipe_id, ingredient_id, quantity, unit, wastage_percent
```

### 4. Business Rules & Validation

- `IF danh mục đang chứa món ăn THEN không xóa cứng, chỉ vô hiệu hóa`
- `IF topping đã phát sinh giao dịch hóa đơn THEN không xóa cứng`
- `IF item.is_active = false THEN không hiển thị trên POS`
- `IF tìm kiếm THEN case-insensitive, trả kết quả real-time`
- `IF một nguyên liệu trùng lặp trong công thức THEN cộng dồn số lượng`
- `IF không có công thức THEN bán được nhưng không trừ kho`

### 5. Tích hợp với module khác
- → **Kho:** Công thức là cầu nối giữa thực đơn và kho, trừ nguyên liệu khi bán
- → **Đơn hàng:** Order items tham chiếu menu items
- → **Báo cáo:** Doanh thu và gross margin per item

### 7. UI Screens
- Danh sách danh mục thực đơn (tên, trạng thái, số món)
- Form thêm/sửa danh mục
- Danh sách món ăn/đồ uống (tên, giá, hình ảnh, danh mục, trạng thái)
- Form thêm/sửa món (tên, giá, hình ảnh, danh mục)
- Danh sách topping (tên, giá, trạng thái)
- Màn hình quản lý công thức (chọn nguyên liệu, định lượng, đơn vị)
- Thanh tìm kiếm thực đơn với bộ lọc danh mục

### 8. API Endpoints

```
GET    /api/v1/menu/categories             # Danh sách danh mục
POST   /api/v1/menu/categories             # Tạo danh mục
PUT    /api/v1/menu/categories/:id         # Cập nhật danh mục
PUT    /api/v1/menu/categories/:id/toggle  # Vô hiệu hóa / kích hoạt

GET    /api/v1/menu/items                  # Danh sách món (filter: category, status)
POST   /api/v1/menu/items                  # Tạo món
PUT    /api/v1/menu/items/:id              # Cập nhật món
PUT    /api/v1/menu/items/:id/toggle       # Vô hiệu hóa / kích hoạt

GET    /api/v1/menu/addons                 # Danh sách topping
POST   /api/v1/menu/addons                 # Tạo topping
PUT    /api/v1/menu/addons/:id             # Cập nhật topping
PUT    /api/v1/menu/addons/:id/toggle      # Vô hiệu hóa / kích hoạt

GET    /api/v1/recipes                     # Danh sách công thức
POST   /api/v1/recipes                     # Tạo công thức
PUT    /api/v1/recipes/:id                 # Cập nhật công thức

GET    /api/v1/menu/search                 # Tìm kiếm thực đơn
```

---

## Module 6: Quản lý Đơn hàng & Bàn (Order & Table)
> **Độ phức tạp:** 🔴🔴 Rất cao

### 1. Mô tả tổng quan
Trung tâm của hệ thống POS. Quản lý sơ đồ bàn theo chi nhánh với khả năng kéo thả (Drag & Drop), theo dõi trạng thái bàn real-time. Quản lý vòng đời đơn hàng: tạo đơn, theo dõi trạng thái (Chờ → Đang làm → Hoàn tất → Đã hủy), đồng bộ real-time giữa các bộ phận.

**Actors:** Nhân viên (Staff), Chủ quán (Owner)

**User Stories liên quan:** US-19, US-20

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý bàn | Tạo/sửa/xóa bàn (tên, sức chứa, khu vực, hình dạng, vị trí) |
| `ACTION` | Drag & Drop bàn | Kéo thả bàn để bố trí sơ đồ theo mặt bằng thực tế |
| `ACTION` | Trạng thái bàn | Thiết lập trạng thái mặc định (Trống / Đang dọn) |
| `ACTION` | Tạo đơn hàng | Chọn món, nhập số lượng, ghi chú đặc biệt, lưu đơn |
| `VIEW` | Danh sách đơn hàng | Hiển thị real-time theo trạng thái tại chi nhánh |
| `ACTION` | Lọc đơn theo trạng thái | Chờ xử lý / Đang làm / Hoàn tất / Đã hủy |
| `ACTION` | Cập nhật trạng thái | Thay đổi trạng thái và thông báo bộ phận liên quan |
| `VIEW` | Chi tiết đơn hàng | Xem đầy đủ món ăn, số lượng, yêu cầu riêng |
| `RULE` | Không xóa bàn có đơn | Không được xóa bàn đang có đơn hàng chưa thanh toán |
| `RULE` | Giới hạn số bàn | Số bàn tối đa bị giới hạn bởi gói dịch vụ |
| `RULE` | Realtime sync | Mọi thay đổi đơn hàng phải đồng bộ real-time |
| `RULE` | Phân quyền cập nhật | Chỉ nhân viên được phân quyền mới cập nhật trạng thái đơn |

### 3. Entities & Data Model

```
TableZone
  id, branch_id, name, floor_number

Table
  id, branch_id, zone_id, name, capacity,
  status (available | occupied | cleaning),
  position_x, position_y, shape (square | round),
  is_active

Order
  id, tenant_id, branch_id, order_number,
  table_id, staff_id,
  status (pending | processing | completed | cancelled),
  subtotal, discount_amount, total_amount,
  notes, created_at, completed_at

OrderItem
  id, order_id, menu_item_id,
  quantity, unit_price, total_price,
  addons_json, notes,
  status (pending | processing | ready | served)

OrderStatusLog
  id, order_id, old_status, new_status,
  changed_by_staff_id, reason, changed_at
```

### 4. Business Rules & Validation

- `IF tên bàn trùng trong cùng Zone THEN reject`
- `IF bàn đang có đơn hàng chưa thanh toán THEN không được xóa`
- `IF số bàn vượt giới hạn gói THEN block`
- `IF order created THEN check ingredient stock theo công thức`
- `IF order completed THEN trigger: trừ kho + cập nhật doanh thu`
- `IF chỉ nhân viên được phân quyền mới cập nhật trạng thái đơn`
- `IF dữ liệu đơn hàng phải đồng bộ real-time`

### 5. Tích hợp với module khác
- → **Thực đơn:** Order items tham chiếu menu items
- → **Kho:** Trừ nguyên liệu khi đơn hoàn tất
- → **Thanh toán:** 1 đơn hàng → 1 phiên thanh toán
- → **Báo cáo:** Dữ liệu doanh thu và hiệu suất

### 7. UI Screens
- **POS Screen:** Lưới menu (phải) + Giỏ hàng/Tổng đơn (trái)
- **Sơ đồ bàn:** Floor plan với màu sắc theo trạng thái, Drag & Drop
- **Danh sách đơn hàng:** Thẻ đơn với trạng thái, filter, tìm kiếm
- **Chi tiết đơn hàng:** Timeline trạng thái, danh sách món, thông tin thanh toán

### 8. API Endpoints

```
GET    /api/v1/tables                     # Danh sách bàn (filter: branch, zone, status)
POST   /api/v1/tables                     # Tạo bàn
PUT    /api/v1/tables/:id                 # Cập nhật bàn
DELETE /api/v1/tables/:id                 # Xóa bàn (soft)
PUT    /api/v1/tables/floor-plan/:branchId # Lưu vị trí sơ đồ (Drag & Drop)

POST   /api/v1/orders                     # Tạo đơn hàng
GET    /api/v1/orders                     # Danh sách đơn (filter: branch, date, status)
GET    /api/v1/orders/:id                 # Chi tiết đơn
PUT    /api/v1/orders/:id/status          # Cập nhật trạng thái đơn
POST   /api/v1/orders/:id/items           # Thêm món vào đơn
DELETE /api/v1/orders/:id/items/:itemId   # Xóa món khỏi đơn

WS     /ws/v1/orders/:branchId            # Realtime đồng bộ đơn hàng
```

---

## Module 7: Quản lý Thanh toán & Hóa đơn (Payment & Invoice)
> **Độ phức tạp:** 🔴 Cao

### 1. Mô tả tổng quan
Xử lý thanh toán đa phương thức (Tiền mặt, VietQR, MoMo, ZaloPay) và tự động tạo hóa đơn sau thanh toán. Hỗ trợ in lại hóa đơn, gửi hóa đơn điện tử (PDF) qua Email hoặc Zalo. Tìm kiếm hóa đơn với bộ lọc nâng cao.

**Actors:** Thu ngân (Cashier), Kế toán, Quản lý chi nhánh, Nhân viên

**User Stories liên quan:** US-21, US-22, US-23

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `ACTION` | Thanh toán tiền mặt | Nhập tiền khách, tính tiền thừa, xác nhận "Đã thanh toán" |
| `ACTION` | Thanh toán QR | Sinh mã QR động (VietQR / MoMo / ZaloPay) với số tiền chính xác |
| `ACTION` | Xác nhận tự động | Cập nhật trạng thái "Đã thanh toán" khi nhận tín hiệu giao dịch thành công |
| `ACTION` | In/Gửi hóa đơn | In hóa đơn tại quầy hoặc gửi PDF qua Email/Zalo |
| `VIEW` | Danh sách hóa đơn | Mã hóa đơn, thời gian, bàn, nhân viên, tổng tiền, phương thức |
| `VIEW` | Chi tiết hóa đơn | Danh sách món, topping, voucher đã áp dụng |
| `ACTION` | Reprint | In lại hóa đơn hoặc tem nước từ đơn cũ |
| `VIEW` | Tìm kiếm hóa đơn | Lọc theo ngày, chi nhánh, phương thức, nhân viên, mã hóa đơn |
| `RULE` | Mã hóa đơn unique | Invoice Number phải là duy nhất và không thể thay đổi |
| `RULE` | Không sửa sau thanh toán | Sau thanh toán không được sửa nội dung, chỉ xử lý qua Refund |
| `RULE` | Giới hạn tìm kiếm | Truy vấn theo khoảng thời gian không vượt quá 90 ngày |
| `RULE` | Phân quyền xem hóa đơn | Nhân viên chỉ xem hóa đơn chi nhánh mình; Owner xem toàn chuỗi |

### 3. Entities & Data Model

```
Payment
  id, order_id, amount,
  method (cash | vietqr | momo | zalopay),
  status (pending | completed | failed | refunded),
  transaction_id, paid_at, cashier_id

Invoice
  id, order_id, payment_id, invoice_number (unique),
  branch_id, tenant_id, subtotal, discount,
  tax_amount, total, issued_at

InvoiceItem
  id, invoice_id, name, quantity, unit_price, total_price
```

### 4. Business Rules & Validation

- `IF thanh toán tiền mặt THEN nhân viên có quyền mới xác nhận "Đã thanh toán"`
- `IF QR timeout (3 phút) THEN nhắc nhân viên thử lại hoặc đổi phương thức`
- `IF thanh toán thành công THEN tự động tạo hóa đơn + cập nhật trạng thái bàn`
- `IF tìm kiếm > 90 ngày THEN reject + hiển thị thông báo`
- `IF nhân viên chi nhánh THEN chỉ xem hóa đơn chi nhánh mình`
- `IF kết quả tìm kiếm THEN phân biệt rõ: hoàn tất / đã hủy / đã hoàn tiền`
- `IF response time tìm kiếm < 10.000 bản ghi THEN phải trả về trong 2 giây`

### 5. Tích hợp với module khác
- → **Đơn hàng:** Thanh toán hoàn tất vòng đời đơn hàng
- → **Khuyến mãi:** Giảm giá áp dụng trước khi tính tổng thanh toán
- → **Báo cáo:** Doanh thu hàng ngày, phân tích phương thức thanh toán

### 7. UI Screens
- **Màn hình thanh toán (Checkout):** Tổng hóa đơn, chọn phương thức, QR hiển thị
- **Danh sách hóa đơn:** Filter nâng cao (ngày, chi nhánh, phương thức, nhân viên)
- **Chi tiết hóa đơn:** Thông tin món, topping, voucher, nút In lại/Gửi email

### 8. API Endpoints

```
POST   /api/v1/payments                   # Khởi tạo thanh toán
POST   /api/v1/payments/:id/confirm       # Xác nhận thanh toán tiền mặt
GET    /api/v1/payments/qr/:orderId       # Sinh mã QR VietQR / MoMo / ZaloPay
POST   /api/v1/webhooks/momo              # MoMo callback
POST   /api/v1/webhooks/zalopay           # ZaloPay callback

GET    /api/v1/invoices                   # Danh sách hóa đơn (filter nâng cao)
GET    /api/v1/invoices/:id               # Chi tiết hóa đơn
GET    /api/v1/invoices/:id/pdf           # Tải PDF hóa đơn
POST   /api/v1/invoices/:id/send-email    # Gửi hóa đơn qua Email
POST   /api/v1/invoices/:id/send-zalo     # Gửi hóa đơn qua Zalo
POST   /api/v1/invoices/:id/print         # In lại hóa đơn
```

---

## Module 8: Quản lý Khuyến mãi (Promotion & Voucher)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Quản lý chương trình khuyến mãi và voucher của chủ quán. Hỗ trợ tạo voucher với giá trị giảm theo % hoặc số tiền cố định, thời gian áp dụng, điều kiện áp dụng (giá trị đơn tối thiểu). Tìm kiếm voucher theo mã hoặc tên chương trình.

**Actors:** Chủ quán (Owner), Thu ngân (Cashier), Quản lý

**User Stories liên quan:** US-24, US-25

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý voucher | Tạo/sửa/vô hiệu hóa voucher (mã, giá trị giảm, thời gian, điều kiện) |
| `ACTION` | Áp dụng voucher | Áp dụng voucher vào đơn hàng khi thanh toán |
| `VIEW` | Danh sách voucher | Hiển thị trạng thái: còn hạn / hết hạn / ngừng hoạt động |
| `VIEW` | Tìm kiếm voucher | Tìm theo mã voucher hoặc tên chương trình, lọc theo trạng thái/thời gian |
| `RULE` | Mã voucher unique | Mã voucher không được trùng |
| `RULE` | Thời gian hợp lệ | Thời gian kết thúc phải lớn hơn thời gian bắt đầu |
| `RULE` | Giá trị giảm hợp lệ | Giá trị giảm phải > 0 và không vượt quá giá trị đơn hàng |
| `RULE` | Nhân viên không sửa | Nhân viên chỉ được sử dụng voucher, không được chỉnh sửa |
| `RULE` | Chỉ hiển thị data của tenant | Tìm kiếm chỉ trả về data trong phạm vi tenant |

### 3. Entities & Data Model

```
Voucher
  id, tenant_id, code (unique), name,
  discount_type (percent | fixed), discount_value,
  min_order_value, max_discount_amount,
  start_date, end_date,
  status (active | inactive), created_at

VoucherUsage
  id, voucher_id, order_id, discount_applied, used_at
```

### 4. Business Rules & Validation

- `IF mã voucher trùng THEN reject`
- `IF end_date <= start_date THEN reject`
- `IF discount_value <= 0 THEN reject`
- `IF order.subtotal < voucher.min_order_value THEN không áp dụng`
- `IF voucher hết hạn THEN tự động chuyển trạng thái 'hết hạn'`
- `IF nhân viên chỉ được sử dụng không được sửa voucher`

### 5. Tích hợp với module khác
- → **Đơn hàng:** Voucher được áp dụng vào đơn → giảm discount_amount
- → **Thanh toán:** Số tiền thanh toán = subtotal - discount
- → **Báo cáo:** Theo dõi hiệu quả và tổng giảm giá đã cấp

### 8. API Endpoints

```
GET    /api/v1/vouchers                   # Danh sách voucher
POST   /api/v1/vouchers                   # Tạo voucher
PUT    /api/v1/vouchers/:id               # Cập nhật voucher
PUT    /api/v1/vouchers/:id/toggle        # Vô hiệu hóa / kích hoạt
GET    /api/v1/vouchers/search            # Tìm kiếm voucher
POST   /api/v1/vouchers/validate          # Kiểm tra voucher hợp lệ cho đơn hàng
POST   /api/v1/vouchers/apply             # Áp dụng voucher vào đơn
```

---

## Module 9: Quản lý Kho Nguyên liệu (Inventory)
> **Độ phức tạp:** 🔴🔴 Rất cao

### 1. Mô tả tổng quan
Quản lý toàn bộ vòng đời nguyên vật liệu: nguyên liệu thô, nguyên liệu bán thành phẩm, nhập/xuất kho, kiểm kho định kỳ. Hệ thống tự động trừ kho theo công thức khi đơn hàng hoàn tất. Tích hợp AI dự báo tồn kho để hỗ trợ quyết định nhập hàng.

**Actors:** Chủ quán (Owner), Nhân viên được cấp quyền

**User Stories liên quan:** US-26, US-27, US-28, US-29, US-30, US-31

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Quản lý nguyên liệu | Thêm/sửa/vô hiệu hóa nguyên liệu thô (tên, đơn vị, giá nhập, danh mục, ngưỡng tồn) |
| `CRUD` | Quản lý bán thành phẩm | Định nghĩa bán thành phẩm (tên, công thức từ NL thô, tỉ lệ hao hụt, ngày sử dụng) |
| `ACTION` | Nhập kho | Tạo phiếu nhập (nhà cung cấp, ngày nhập, danh sách NL, số lượng, đơn giá) |
| `ACTION` | Xuất kho thủ công | Tạo phiếu xuất (lý do: hao hụt/hỏng/nội bộ/hết hạn, danh sách NL, số lượng) |
| `ACTION` | Ghi nhận sản xuất BTP | Ghi nhận mẻ bán thành phẩm, tự động trừ NL thô tương ứng |
| `ACTION` | Kiểm kho | Tạo phiên kiểm, nhập số lượng thực tế, hệ thống tính chênh lệch |
| `VIEW` | Tìm kiếm nguyên liệu | Tìm theo tên, lọc theo loại/danh mục/trạng thái tồn/chi nhánh — real-time |
| `VIEW` | Lịch sử nhập/xuất | Toàn bộ giao dịch với đầy đủ thông tin audit trail |
| `VIEW` | Báo cáo lệch kho | Danh sách NL lệch, số lượng lệch, phân loại thừa/thiếu |
| `RULE` | Tồn kho không âm | Xuất kho không được vượt quá tồn hiện tại |
| `RULE` | Audit trail đầy đủ | Mọi giao dịch phải ghi log: nhân viên, thời gian, số lượng trước/sau |
| `RULE` | Không xóa NL đang dùng | NL đã có trong công thức hoặc lịch sử xuất nhập chỉ được vô hiệu hóa |
| `RULE` | Phân quyền theo chi nhánh | Nhân viên chỉ quản lý NL trong chi nhánh được phân công |

### 3. Entities & Data Model

```
Ingredient
  id, tenant_id, name, sku, unit (g | ml | cái | gói),
  cost_per_unit, category (Cà phê | Sữa | Đường | Trà | ...),
  min_stock_threshold, max_stock_threshold, is_active

IngredientStock
  id, ingredient_id, branch_id, current_qty, last_updated_at

SemiFinishedProduct (Bán thành phẩm)
  id, tenant_id, name, unit, wastage_percent, shelf_life_days,
  is_active

SemiFinishedIngredient
  id, semi_product_id, ingredient_id, quantity, unit

SemiProductStock
  id, semi_product_id, branch_id, current_qty,
  produced_at, expires_at

InventoryEntry (Phiếu nhập kho)
  id, branch_id, supplier_id, entry_date, status,
  total_amount, created_by_staff_id

InventoryEntryItem
  id, entry_id, ingredient_id, quantity, unit_price

InventoryExit (Phiếu xuất kho)
  id, branch_id, reason (waste | damage | internal | expired),
  exit_date, created_by_staff_id

InventoryExitItem
  id, exit_id, ingredient_id, quantity

InventoryMovement
  id, branch_id, ingredient_id,
  movement_type (in | out | auto_deduct | adjustment | stocktake),
  quantity, reference_type, reference_id,
  before_qty, after_qty, created_by_staff_id, created_at

StockTaking
  id, branch_id, date, conducted_by_staff_id,
  status (draft | submitted | approved)

StockTakingItem
  id, stocktaking_id, ingredient_id,
  system_qty, actual_qty, variance, variance_value
```

### 4. Business Rules & Validation

- `IF số lượng nhập/xuất <= 0 THEN reject`
- `IF xuất kho > tồn hiện tại THEN block + hiển thị cảnh báo`
- `IF phiếu nhập/xuất đã xác nhận THEN không thể chỉnh sửa, chỉ tạo phiếu điều chỉnh`
- `IF NL thô không đủ để sản xuất BTP THEN hiển thị cảnh báo, từ chối ghi nhận`
- `IF nhập BTP sau khi ca kết thúc THEN chỉ Quản lý chi nhánh mới điều chỉnh`
- `IF chênh lệch kiểm kho vượt ngưỡng (%) THEN yêu cầu nhập ghi chú trước khi nộp`
- `IF tồn kho < ngưỡng tối thiểu THEN cảnh báo sắp hết`
- `IF NL đang dùng trong công thức THEN chỉ vô hiệu hóa, không xóa`
- `IF nhân viên chỉ thao tác trong phạm vi chi nhánh được phân công`

### 5. Tích hợp với module khác
- → **Công thức:** Tự động trừ nguyên liệu theo công thức khi đơn hàng hoàn tất
- → **Đơn hàng:** Trigger trừ kho khi `order.status = completed`
- → **Nhà cung cấp:** Phiếu nhập kho gắn với nhà cung cấp
- → **Báo cáo kho:** COGS, waste cost, lịch sử xuất nhập tồn

### 6. AI/Automation Opportunities
- **Dự báo nhu cầu (Demand Forecasting):** Dự báo lượng nguyên liệu cần dùng 7/14/30 ngày tới dựa trên lịch sử bán hàng
- **Cảnh báo thông minh:** Tính ngày dự kiến hết hàng theo tiêu thụ thực tế thay vì ngưỡng tĩnh
- **Đề xuất nhập hàng:** Tự động tạo Draft phiếu nhập dựa trên dự báo AI

### 7. UI Screens
- Danh sách nguyên liệu (tên, tồn kho, trạng thái, ngày dự kiến hết)
- Form thêm/sửa nguyên liệu
- Danh sách bán thành phẩm (tên, tồn, ngày sản xuất, hết hạn)
- Form ghi nhận sản xuất BTP (chọn BTP, nhập số lượng → hiện NL thô cần dùng)
- Phiếu nhập kho (chọn NCC, danh sách NL, số lượng, đơn giá)
- Phiếu xuất kho thủ công (chọn lý do, danh sách NL, số lượng)
- Màn hình kiểm kho (mobile-friendly, nhập số lượng thực tế từng NL)
- Lịch sử giao dịch nhập/xuất (timeline, filter, xuất Excel)

### 8. API Endpoints

```
GET    /api/v1/ingredients                 # Danh sách nguyên liệu
POST   /api/v1/ingredients                 # Tạo nguyên liệu
PUT    /api/v1/ingredients/:id             # Cập nhật nguyên liệu
PUT    /api/v1/ingredients/:id/toggle      # Vô hiệu hóa / kích hoạt
GET    /api/v1/ingredients/search          # Tìm kiếm nguyên liệu

GET    /api/v1/semi-products               # Danh sách bán thành phẩm
POST   /api/v1/semi-products               # Tạo bán thành phẩm
PUT    /api/v1/semi-products/:id           # Cập nhật BTP
POST   /api/v1/semi-products/produce       # Ghi nhận sản xuất BTP

POST   /api/v1/inventory/entries           # Tạo phiếu nhập kho
GET    /api/v1/inventory/entries           # Danh sách phiếu nhập
POST   /api/v1/inventory/exits             # Tạo phiếu xuất kho thủ công
GET    /api/v1/inventory/exits             # Danh sách phiếu xuất
GET    /api/v1/inventory/movements         # Lịch sử giao dịch

POST   /api/v1/stocktaking                 # Tạo phiên kiểm kho
PUT    /api/v1/stocktaking/:id/items       # Nhập số lượng thực tế
PUT    /api/v1/stocktaking/:id/submit      # Nộp kết quả
GET    /api/v1/stocktaking/:id/report      # Báo cáo lệch kho

GET    /api/v1/ai/demand-forecast          # Dự báo nhu cầu nguyên liệu
GET    /api/v1/ai/low-stock-alerts         # Cảnh báo sắp hết hàng
```

---

## Module 10: Quản lý Nhà cung cấp (Supplier)
> **Độ phức tạp:** 🟢 Thấp

### 1. Mô tả tổng quan
Quản lý hồ sơ nhà cung cấp nguyên vật liệu, bảng giá, lịch sử giao dịch và công nợ. Hỗ trợ thiết lập nhà cung cấp mặc định cho từng loại nguyên liệu để tự động điền khi tạo phiếu nhập kho.

**Actors:** Kho trưởng, Kế toán, Quản lý chi nhánh (Branch Manager)

**User Stories liên quan:** US-32, US-33

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `CRUD` | Hồ sơ nhà cung cấp | Thêm/sửa NCC (tên, MST, địa chỉ, SĐT, ngân hàng, người liên hệ) |
| `VIEW` | Bảng giá NCC | NCC cung cấp nguyên liệu gì, giá bao nhiêu |
| `VIEW` | Lịch sử đơn mua | Toàn bộ Purchase Orders đã giao dịch với NCC |
| `VIEW` | Theo dõi công nợ | Số tiền còn nợ hiện tại với từng NCC |
| `ACTION` | NCC mặc định | Thiết lập NCC mặc định cho từng loại nguyên liệu |
| `VIEW` | Tìm kiếm NCC | Tìm theo tên, MST, SĐT — real-time, không phân biệt hoa thường |
| `RULE` | Tên & SĐT bắt buộc | Tên nhà cung cấp và SĐT là trường bắt buộc |
| `RULE` | MST đúng định dạng | Mã số thuế phải đúng định dạng quy định |
| `RULE` | Không xóa khi có công nợ | Không được xóa NCC khi còn công nợ chưa quyết toán hoặc có đơn đang xử lý |

### 3. Entities & Data Model

```
Supplier
  id, tenant_id, name, code, tax_code,
  address, phone, email, contact_person,
  bank_account, bank_name, is_active

SupplierIngredient
  id, supplier_id, ingredient_id,
  price, minimum_order_qty, is_preferred

SupplierPayment
  id, supplier_id, entry_id, amount,
  paid_at, reference_number, notes
```

### 4. Business Rules & Validation

- `IF tên hoặc SĐT để trống THEN reject`
- `IF MST sai định dạng THEN reject`
- `IF NCC có công nợ chưa quyết toán hoặc đơn đang xử lý THEN không xóa được`
- `IF tìm kiếm không có kết quả THEN hiển thị "Không tìm thấy nhà cung cấp phù hợp"`
- `IF tìm kiếm case-insensitive`

### 5. Tích hợp với module khác
- → **Kho:** Phiếu nhập kho gắn với `supplier_id`
- → **Báo cáo kho:** Lịch sử giao dịch theo NCC

### 8. API Endpoints

```
GET    /api/v1/suppliers                  # Danh sách nhà cung cấp
POST   /api/v1/suppliers                  # Thêm nhà cung cấp
GET    /api/v1/suppliers/:id              # Chi tiết NCC
PUT    /api/v1/suppliers/:id              # Cập nhật NCC
GET    /api/v1/suppliers/:id/orders       # Lịch sử phiếu nhập
GET    /api/v1/suppliers/:id/debt         # Công nợ hiện tại
GET    /api/v1/suppliers/search           # Tìm kiếm NCC
```

---

## Module 11: Báo cáo Doanh thu & Sản phẩm (Revenue Report)
> **Độ phức tạp:** 🔴 Cao

### 1. Mô tả tổng quan
Cung cấp báo cáo doanh thu và hiệu suất sản phẩm toàn diện. Chủ quán xem toàn bộ chuỗi; nhân viên chỉ xem chi nhánh được phân công. Hỗ trợ xuất file Excel/PDF.

**Actors:** Kho trưởng, Kế toán, Quản lý chi nhánh (Branch Manager)

**User Stories liên quan:** US-34

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `VIEW` | Báo cáo doanh thu | Tổng doanh thu theo ngày/tuần/tháng/năm (biểu đồ đường/cột) |
| `VIEW` | Heatmap khung giờ | Doanh thu theo khung giờ trong ngày để xác định giờ cao điểm |
| `VIEW` | So sánh kỳ trước | Tăng/giảm % so với ngày/tuần/tháng/năm trước |
| `VIEW` | Doanh thu theo chi nhánh | Phân tách doanh thu từng chi nhánh (Owner xem tất cả) |
| `VIEW` | Doanh thu theo kênh | POS tại quán / GrabFood / ShopeeFood |
| `VIEW` | Doanh thu theo phương thức TT | Tiền mặt / QR / Thẻ ngân hàng |
| `VIEW` | Top sản phẩm bán chạy | Theo số lượng và doanh thu trong khoảng thời gian chọn |
| `VIEW` | Sản phẩm bán chậm | Bán dưới ngưỡng X lần/tuần để lên kế hoạch xử lý |
| `VIEW` | Doanh thu theo danh mục | Biểu đồ tròn phân tích cơ cấu danh mục |
| `VIEW` | Giá vốn sản phẩm (COGS) | Doanh thu - giá vốn cho từng sản phẩm |
| `ACTION` | Xuất báo cáo | Xuất file Excel/PDF theo khoảng thời gian tùy chọn |
| `RULE` | Phân quyền xem | Chủ quán xem toàn chuỗi; nhân viên chỉ xem chi nhánh được cấp |

### 3. Entities & Data Model

```
DailySummary
  id, branch_id, date,
  total_revenue, total_orders, avg_order_value,
  payment_breakdown_json, cost_of_goods, gross_profit

HourlyStats
  id, branch_id, date, hour,
  order_count, revenue

ProductStat
  id, branch_id, menu_item_id, date,
  qty_sold, revenue, cost, gross_margin
```

### 4. Business Rules & Validation

- `IF user.role = 'owner' THEN xem báo cáo toàn bộ chi nhánh`
- `IF user.role = 'staff' THEN chỉ xem báo cáo chi nhánh được phân công`
- `IF item không bán trong 7 ngày THEN xuất hiện trong danh sách 'bán chậm'`
- `IF gross_margin < 60% THEN đánh dấu trong phân tích margin`

### 5. Tích hợp với module khác
- → **Đơn hàng:** Nguồn dữ liệu doanh thu
- → **Thực đơn:** Hiệu suất từng món
- → **Kho:** COGS dựa trên công thức và giá nguyên liệu

### 8. API Endpoints

```
GET    /api/v1/reports/revenue            # Doanh thu (params: from, to, branch_id, group_by)
GET    /api/v1/reports/hourly             # Heatmap doanh thu theo giờ
GET    /api/v1/reports/products           # Hiệu suất sản phẩm
GET    /api/v1/reports/cogs               # Chi phí hàng đã bán (COGS)
GET    /api/v1/reports/comparison         # So sánh chi nhánh
GET    /api/v1/reports/export/revenue     # Xuất Excel/PDF (async job)
```

---

## Module 12: Báo cáo Kho (Inventory Report)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Cung cấp cái nhìn toàn diện về tình trạng tồn kho, chi phí nguyên liệu và hao hụt. Giúp chủ quán và quản lý phát hiện sớm các vấn đề bất thường trong quản lý kho.

**Actors:** Chủ quán (Owner), Nhân viên được cấp quyền

**User Stories liên quan:** US-35

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `VIEW` | Tồn kho hiện tại | Tồn kho từng NL/BTP theo chi nhánh, trạng thái (đủ/sắp hết/hết) |
| `VIEW` | NL sắp hết hạn | Danh sách NL hết hạn trong vòng 3/7 ngày tới |
| `VIEW` | NL dưới ngưỡng tối thiểu | Danh sách NL cần đặt hàng bổ sung |
| `VIEW` | Báo cáo nhập/xuất tồn | Tồn đầu kỳ, tổng nhập, tổng xuất, tồn cuối kỳ theo ngày/tuần/tháng |
| `VIEW` | Chi phí hàng đã bán | Tổng giá trị NL xuất dùng để pha chế theo tháng |
| `VIEW` | Báo cáo hao hụt (Waste) | Phân loại theo lý do (hỏng/hết hạn/đổ vỡ/sai công thức), chi phí, % hao hụt |
| `VIEW` | Lịch sử giao dịch | Toàn bộ nhập/xuất với đầy đủ thông tin (ai, thời gian, số lượng, lý do) |
| `ACTION` | Xuất báo cáo | Xuất file Excel/PDF |
| `RULE` | Phân quyền xuất file | Chỉ chủ quán và nhân viên được cấp quyền mới xuất báo cáo |
| `RULE` | Phân quyền xem | Chủ quán xem toàn chuỗi; nhân viên chỉ xem chi nhánh được cấp |

### 4. Business Rules & Validation

- `IF chủ quán THEN xem báo cáo kho toàn bộ chi nhánh`
- `IF nhân viên THEN chỉ xem chi nhánh được phân công và quyền hạn được cấp`
- `IF chức năng xuất file THEN chỉ dành cho người được cấp quyền`
- `IF waste % > 8% THEN đánh dấu cảnh báo (benchmark: tốt < 3%, TB 3-8%, xấu > 8%)`

### 8. API Endpoints

```
GET    /api/v1/reports/inventory/stock    # Tồn kho hiện tại
GET    /api/v1/reports/inventory/expiring # NL sắp hết hạn
GET    /api/v1/reports/inventory/low      # NL dưới ngưỡng tối thiểu
GET    /api/v1/reports/inventory/movement # Báo cáo nhập/xuất tồn
GET    /api/v1/reports/inventory/cogs     # Chi phí hàng đã bán
GET    /api/v1/reports/inventory/waste    # Báo cáo hao hụt
GET    /api/v1/reports/export/inventory   # Xuất Excel/PDF
```

---

## Module 13: Báo cáo Nhân sự (HR Report)
> **Độ phức tạp:** 🟡 Trung bình

### 1. Mô tả tổng quan
Theo dõi chấm công, hiệu suất làm việc và chi phí nhân sự theo chi nhánh. Nhân viên thông thường chỉ xem được lương của chính mình; quản lý xem theo phạm vi được giao.

**Actors:** Chủ quán (Owner), Nhân viên được cấp quyền

**User Stories liên quan:** US-36

### 2. Danh sách chức năng chi tiết

| Type | Tên | Mô tả |
|------|-----|-------|
| `VIEW` | Bảng chấm công tháng | Số ngày đi làm, giờ thực tế, giờ tăng ca, ngày nghỉ phép/vắng mặt |
| `VIEW` | Nhân viên đi muộn/về sớm | Danh sách vi phạm giờ công trong khoảng thời gian chọn |
| `VIEW` | Lịch sử check-in/out | Check-in/check-out chi tiết theo ngày của từng nhân viên |
| `VIEW` | Bảng lương tháng | Lương cơ bản, tăng ca, thưởng, khấu trừ, tổng lương thực nhận |
| `VIEW` | Tổng chi phí nhân sự | Theo tháng/chi nhánh để kiểm soát ngân sách |
| `RULE` | Nhân viên chỉ xem lương mình | Nhân viên thông thường không được xem lương người khác |
| `RULE` | Chỉ tính ca đã xác nhận | Dữ liệu chấm công chỉ tính ca đã hoàn tất (không tính ca đang mở) |
| `RULE` | Phân quyền xem | Chủ quán xem toàn chuỗi; nhân viên chỉ xem chi nhánh được phân công |

### 4. Business Rules & Validation

- `IF user.role = 'staff' THEN chỉ xem lương của chính mình nếu được cấp quyền`
- `IF ca đang mở hoặc chưa check-out THEN không tính vào dữ liệu chấm công`
- `IF chủ quán THEN xem báo cáo nhân sự toàn bộ chi nhánh`

### 8. API Endpoints

```
GET    /api/v1/reports/hr/attendance      # Bảng chấm công (filter: staff, month, branch)
GET    /api/v1/reports/hr/violations      # Đi muộn/về sớm/vắng không phép
GET    /api/v1/reports/hr/checkin-history # Lịch sử check-in/out chi tiết
GET    /api/v1/reports/hr/payroll         # Bảng lương tháng
GET    /api/v1/reports/hr/cost            # Tổng chi phí nhân sự theo tháng/chi nhánh
GET    /api/v1/reports/export/hr          # Xuất Excel báo cáo nhân sự
```

---

# Tổng hợp & Thông tin dự án

## A. Thông tin dự án

| Hạng mục | Thông tin |
|----------|-----------|
| **Tên dự án** | Xây dựng hệ thống SmartF&B — Nền tảng quản lý chuỗi F&B đa chi nhánh tích hợp kho nguyên liệu, sử dụng AI để dự báo tồn kho |
| **Ngày bắt đầu** | 11/03/2026 |
| **Ngày kết thúc** | 15/05/2026 |
| **Nơi thực hiện** | Khoa Công nghệ thông tin — Đại học Duy Tân |
| **Mentor / Product Owner** | ThS. Phan Long |
| **Scrum Master** | Nguyễn Văn Hoàng |
| **Thành viên** | Trần Huy Nhật, Phan Sĩ Nhật, Đào Thu Thiên, Trương Quang Vũ |

---

## B. Mục tiêu hệ thống

- Xây dựng nền tảng quản lý toàn diện cho chuỗi quán cafe và nhà hàng: bán hàng, thực đơn, nhân viên, kho nguyên liệu trên một hệ thống duy nhất.
- Tự động hóa quản lý kho nguyên liệu thông qua công thức chế biến — mỗi đơn hàng hoàn tất sẽ tự động trừ nguyên liệu tương ứng.
- Ứng dụng AI dự báo nhu cầu nguyên liệu trong tương lai, hỗ trợ quản lý đưa ra quyết định nhập hàng hợp lý.
- Phân quyền người dùng theo vai trò (RBAC), cung cấp báo cáo và thống kê theo dõi hiệu quả kinh doanh.

---

## C. Ràng buộc & Công cụ

### Ràng buộc
- Hoàn thành trong khoảng **2,5 tháng** (11/03 – 15/05/2026)
- Chi phí hạn chế, chủ yếu sử dụng công cụ và nền tảng mã nguồn mở
- Nhóm phát triển: **5 thành viên**
- Hệ thống web app, yêu cầu kết nối Internet và trình duyệt web

### Ngôn ngữ & Công cụ

| Hạng mục | Công nghệ |
|----------|-----------|
| **Backend** | Java (Spring Boot) |
| **Frontend** | JavaScript, ReactJS, HTML, CSS |
| **AI Module** | Python (dự báo tồn kho) |
| **Database** | PostgreSQL (pgAdmin) |
| **IDE** | Visual Studio Code |
| **Version Control** | Git, GitHub |
| **Phương pháp** | Scrum (Agile) — phát triển theo Sprint |

### Phân chia Phase triển khai

| Phase | Mục tiêu | Module chính |
|-------|----------|-------------|
| **Phase 1 — MVP** | Có thể bán hàng, thu tiền, in hóa đơn | Auth, Branch, Menu, Recipe, Table, Order, Payment, Invoice, Inventory cơ bản |
| **Phase 2 — Full Ops** | Quản lý vận hành đầy đủ | Staff, Shift, Supplier, Promotion, Báo cáo hoàn chỉnh |
| **Phase 3 — AI** | AI dự báo kho, báo cáo nâng cao | AI Demand Forecast, AI Purchase Suggestion, AI Anomaly Detection |

---

*Tài liệu phân tích này được tổng hợp từ User Story Document của dự án SmartF&B — Đại học Duy Tân, tháng 03/2026.*
