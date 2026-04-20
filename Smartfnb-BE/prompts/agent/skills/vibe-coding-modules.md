# ⚡ SmartF&B — Vibe Coding Quick-Start Guide
> Hướng dẫn ngắn gọn cho từng module để AI generate code đúng ngay lần đầu.
> Copy paste prompt tương ứng khi bắt đầu code một module.

---

## 🚀 CÁCH SỬ DỤNG

Khi bắt đầu code một module, bảo AI:
> "Đọc file `.cursor/rules.md`, `docs/architecture/CODING_GUIDELINES.md` và `docs/architecture/RBAC_STANDARD.md` trước, sau đó implement [task] cho module [X]"

---

## 📦 MODULE PROMPTS

### 🔑 Module Auth
```
Implement tính năng [X] cho Module Auth của SmartF&B.

Context:
- Entities: User (id, tenant_id, email, phone, password_hash, role, failed_login_count, locked_until, pos_pin)
- OTPRecord (id, user_id, otp_code hashed, purpose, expires_at, is_used)
- Tenant (id, name, slug, owner_user_id, status)

Business Rules cần đảm bảo:
- Sai mật khẩu > {N} lần → khóa tài khoản tạm thời (locked_until)
- OTP có thời hạn, is_used = true sau khi dùng (không được reuse)
- JWT token phải chứa: tenantId, branchId, role, permissions
- Password không được giống mật khẩu cũ khi reset
- Email/SĐT phải unique trên toàn hệ thống

Package: com.smartfnb.auth
Tạo: Command/Query + Handler + Domain Entity + JPA Entity + Controller + DTO
```

---

### 🏢 Module Branch (Chi nhánh)
```
Implement tính năng [X] cho Module Branch của SmartF&B.

Context:
- Entity: Branch (id, tenant_id, name, code unique, address, latitude, longitude, phone, manager_staff_id, status)
- BranchStaff (id, branch_id, user_id, is_primary_branch)

Business Rules:
- Branch count bị giới hạn bởi plan.max_branches → kiểm tra qua SubscriptionService
- Chỉ SUPER_ADMIN mới tạo/xóa chi nhánh
- OWNER thấy tất cả chi nhánh trong tenant
- STAFF chỉ thấy chi nhánh được assign (join BranchStaff)
- Tìm kiếm real-time theo tên/code/địa chỉ (dùng Specification + LIKE LOWER)

Package: com.smartfnb.branch
```

---

### 👤 Module Staff (Nhân sự)
```
Implement tính năng [X] cho Module Staff của SmartF&B.

Context:
- Staff (id, tenant_id, user_id, full_name, phone, position_id, status, pos_pin hashed)
- Position (id, tenant_id, name, base_salary)
- RolePermission (id, tenant_id, role, module_key, can_view, can_create, can_update, can_delete)
- ShiftTemplate (id, branch_id, name, start_time, end_time, min_staff, max_staff)
- ShiftSchedule (id, branch_id, staff_id, shift_template_id, date, status, checked_in_at, checked_out_at)

Business Rules:
- SĐT unique trong cùng tenant
- Không được xóa nhân viên đang có ShiftSchedule chưa hoàn tất
- Chỉ OWNER mới thay đổi phân quyền của ADMIN/BRANCH_MANAGER
- Nhân viên không đăng ký 2 ca trùng giờ trong cùng ngày
- Hạn đăng ký ca: trước 24h khi ca bắt đầu
- Ghi audit log khi thay đổi RolePermission

Package: com.smartfnb.staff
```

---

### 🍜 Module Menu (Thực đơn)
```
Implement tính năng [X] cho Module Menu của SmartF&B.

Context:
- Category (id, tenant_id, name, description, is_active, display_order)
- MenuItem (id, tenant_id, category_id, name, description, image_url, base_price, is_active)
- MenuItemAddon/Topping (id, tenant_id, name, extra_price, is_active)
- Recipe (id, menu_item_id, ingredient_id, quantity, unit)

Business Rules:
- Tên Category/MenuItem/Topping phải unique trong tenant
- Giá bán >= 0
- Quantity trong Recipe phải > 0
- Soft delete (is_active = false) nếu đã có giao dịch — không hard delete
- Tìm kiếm không phân biệt hoa thường (LOWER(name) LIKE LOWER(:keyword))
- Khi vô hiệu hóa Category → tất cả MenuItem trong đó cũng inactive

Package: com.smartfnb.menu
```

---

### 📋 Module Order (Đơn hàng)
```
Implement tính năng [X] cho Module Order của SmartF&B.

Context — QUAN TRỌNG (module phức tạp nhất):
- TableZone (id, branch_id, name, floor_number)
- Table (id, branch_id, zone_id, name, capacity, status: available|occupied|cleaning, position_x, position_y, shape)
- Order (id, tenant_id, branch_id, order_number, table_id, staff_id, status: pending|processing|completed|cancelled, subtotal, discount_amount, total_amount, notes)
- OrderItem (id, order_id, menu_item_id, quantity, unit_price, addons_json, notes, status: pending|processing|ready|served)
- OrderStatusLog (id, order_id, old_status, new_status, changed_by_staff_id, reason, changed_at)

Business Rules:
- Khi tạo đơn: kiểm tra tồn kho nguyên liệu theo Recipe → nếu thiếu thì reject
- Khi đơn COMPLETED: publish OrderCompletedEvent → trigger trừ kho
- Không xóa bàn đang có đơn chưa thanh toán
- Mọi thay đổi trạng thái đơn phải ghi vào OrderStatusLog
- Realtime: Broadcast qua WebSocket /topic/orders/{branchId} khi status thay đổi
- Phân quyền: Chỉ nhân viên có quyền mới cập nhật trạng thái
- Đảm bảo Optimistic Locking (@Version) trên Order entity

Package: com.smartfnb.order
QUAN TRỌNG: Dùng @Transactional cho CommandHandler, tránh N+1 khi load OrderItems
```

---

### 💳 Module Payment (Thanh toán)
```
Implement tính năng [X] cho Module Payment của SmartF&B.

Context:
- Payment (id, order_id, amount, method: cash|vietqr|momo|zalopay, status: pending|completed|failed|refunded, transaction_id, paid_at, cashier_id)
- Invoice (id, order_id, payment_id, invoice_number unique, branch_id, tenant_id, subtotal, discount, tax_amount, total, issued_at)
- InvoiceItem (id, invoice_id, name, quantity, unit_price, total_price)

Business Rules:
- invoice_number là unique và immutable sau khi tạo
- Sau thanh toán thành công: tạo Invoice tự động + cập nhật Table.status = 'cleaning'
- Không sửa Invoice sau khi tạo — chỉ có thể Refund
- QR payment timeout sau 3 phút → nhắc nhân viên thử lại
- Tìm kiếm hóa đơn giới hạn tối đa 90 ngày
- CASHIER chỉ xem Invoice của branch mình; OWNER xem toàn chuỗi

Package: com.smartfnb.payment
GÔM VÀO: Publish InvoiceCreatedEvent sau thanh toán thành công
```

---

### 🎁 Module Promotion (Khuyến mãi)
```
Implement tính năng [X] cho Module Promotion của SmartF&B.

Context:
- Promotion (id, tenant_id, name, type: percent|fixed|buy_x_get_y, value, min_order_value, max_discount, start_date, end_date, applicable_branches_json, is_active)
- Voucher (id, promotion_id, code unique, max_uses, used_count, expires_at, is_active)
- VoucherUsage (id, voucher_id, order_id, used_by_staff_id, discount_applied, used_at)

Business Rules:
- Validate ngày bắt đầu < ngày kết thúc
- Mã voucher unique toàn hệ thống
- Kiểm tra used_count < max_uses trước khi apply (dùng pessimistic lock)
- Voucher chỉ áp dụng cho branch trong applicable_branches_json
- Không áp dụng nhiều voucher cho cùng 1 đơn hàng
- Tự động vô hiệu hóa khi hết hạn (scheduled job)

Package: com.smartfnb.promotion
```

---

### 📦 Module Inventory (Kho)
```
Implement tính năng [X] cho Module Inventory của SmartF&B.

Context:
- Ingredient (id, tenant_id, name, unit, low_stock_threshold, expiry_days)
- InventoryStock (id, branch_id, ingredient_id, current_quantity, last_updated)
- InventoryTransaction (id, branch_id, ingredient_id, type: import|export|adjust|waste, quantity, unit_cost, reason, reference_id, staff_id, transacted_at)
- StockBatch (id, branch_id, ingredient_id, quantity, cost_per_unit, imported_at, expires_at)

Business Rules:
- Khi Order completed: auto-export dựa trên Recipe × quantity (gọi từ Domain Event)
- Khi stock < low_stock_threshold: trigger cảnh báo
- Waste > 8%: đánh dấu cảnh báo trong báo cáo
- Nhập kho FIFO: xuất từ batch cũ nhất trước
- Điều chỉnh kho thủ công PHẢI ghi audit log với lý do

Package: com.smartfnb.inventory
LISTEN: OrderCompletedEvent → deduct stock theo recipe
```

---

### 📊 Module Report (Báo cáo)
```
Implement tính năng [X] cho Module Report của SmartF&B.

Context — Chỉ READ (QueryHandler, không có CommandHandler):
- Dữ liệu từ DailySummary, HourlyStats, ProductStat (pre-aggregated)
- Hoặc query trực tiếp Order/Invoice/InventoryTransaction (với filter phức tạp)

Business Rules phân quyền:
- OWNER: xem báo cáo toàn bộ chi nhánh trong tenant
- BRANCH_MANAGER/CASHIER: chỉ xem chi nhánh được assign
- STAFF: chỉ xem lương của chính mình (HR Report)

Performance:
- Dùng native query + index cho báo cáo phức tạp
- Không load toàn bộ data vào memory — dùng Stream hoặc pagination
- Export Excel/PDF: xử lý async, trả về job_id, client polling kết quả

Package: com.smartfnb.report
CÔNG CỤ: Apache POI cho Excel export, iText hoặc JasperReports cho PDF
```

---

## 🔧 SHARED UTILITIES PROMPT

```
Implement shared utilities cho SmartF&B:

Cần tạo trong package com.smartfnb.shared:
1. TenantContext (ThreadLocal context holder)
2. BaseAggregateRoot (extends với audit fields)
3. ApiResponse<T> (wrapper chuẩn cho mọi response)
4. SmartFnbException (base exception với errorCode)
5. GlobalExceptionHandler (@RestControllerAdvice)
6. PageResponse<T> (wrapper cho paginated response)
7. SecurityUtils (helper lấy current user từ SecurityContext)

Đảm bảo:
- TenantContext dùng InheritableThreadLocal (tương thích Virtual Thread Java 21)
- GlobalExceptionHandler xử lý: MethodArgumentNotValidException, SmartFnbException, AccessDeniedException
- Tất cả response đều theo format chuẩn trong CODING_GUIDELINES.md
```
