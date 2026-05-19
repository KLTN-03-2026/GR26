# ⚡ SmartF&B Frontend — Vibe Coding Quick-Start Guide
> Prompt nhanh cho từng module. Copy paste khi bắt đầu implement một module.
> AI đọc file này để biết đúng context, đúng pattern, không cần giải thích lại.

---

## 🚀 CÁCH SỬ DỤNG

Khi bắt đầu một module, nói với AI:
> "Đọc `CLAUDE.md` và `src/docs/skills/vibe-coding-modules.md`, sau đó implement [task] cho module [X]"

---

## 📦 MODULE PROMPTS

---

### 🔑 Module Auth (Xác thực)
```
Implement tính năng [X] cho Module Auth của SmartF&B Frontend.

CONTEXT — Đọc trước khi code:
- Zustand store: src/modules/auth/stores/authStore.ts
  Fields: user (AuthUser | null), token, isAuthenticated, isLoading
  Actions: setUser, logout, setLoading
- AuthUser interface: { id, tenantId, name, email, role: Role, branchIds[] }
- Token lưu trong localStorage qua Zustand persist
- Sau login thành công: gọi getRoleHomePage(role) để redirect đúng dashboard

Pages cần implement:
- LoginPage   → /login
- RegisterPage → /register (chọn gói dịch vụ + nhập thông tin)
- ForgotPasswordPage → /forgot-password (nhập email/SĐT → nhận OTP → đặt lại)

Business Rules FE cần xử lý:
- Sai quá 5 lần → hiện thông báo khóa tài khoản tạm thời
- OTP có countdown timer 60 giây, cho phép resend sau khi hết
- Form đăng ký: email/SĐT validate realtime (check unique với BE)
- Sau reset password thành công → redirect về /login + toast thành công

Vị trí file:
- src/modules/auth/components/LoginForm.tsx
- src/modules/auth/components/RegisterForm.tsx
- src/modules/auth/components/OTPInput.tsx
- src/modules/auth/hooks/useLogin.ts
- src/modules/auth/hooks/useRegister.ts
- src/modules/auth/services/authService.ts
- src/pages/auth/LoginPage.tsx

API endpoints (từ frontend_api_integration.md):
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/verify-otp
- POST /api/v1/auth/reset-password
- POST /api/v1/auth/logout
```

---

### 🏢 Module Branch (Chi nhánh)
```
Implement tính năng [X] cho Module Branch của SmartF&B Frontend.

CONTEXT:
- Chỉ OWNER mới truy cập trang quản lý chi nhánh (/branches)
- Owner thấy tất cả chi nhánh; Staff chỉ thấy chi nhánh được phân công
- Chi nhánh có trạng thái: active | inactive — inactive thì POS không tạo được đơn
- BranchSelector trên Header: user chọn chi nhánh đang làm việc → lưu vào BranchProvider

Entity interface (branch.types.ts):
  Branch { id, tenantId, name, code, address, city, phone, status, managerStaffId, createdAt }
  CreateBranchPayload { name, address, city, phone, managerStaffId? }
  BranchListParams { search?, status?, page?, limit? }

Vị trí file:
- src/modules/branch/components/BranchCard.tsx
- src/modules/branch/components/BranchForm.tsx     — dùng Dialog + React Hook Form
- src/modules/branch/components/BranchTable.tsx    — DataTable với action buttons
- src/modules/branch/hooks/useBranches.ts
- src/modules/branch/hooks/useCreateBranch.ts
- src/modules/branch/hooks/useUpdateBranch.ts
- src/modules/branch/hooks/useToggleBranch.ts
- src/modules/branch/services/branchService.ts
- src/pages/owner/BranchesPage.tsx

UI cần có:
- SearchBar + filter status (active/inactive)
- DataTable với columns: tên, địa chỉ, SĐT, quản lý, trạng thái, thao tác
- Dialog tạo/sửa chi nhánh
- ConfirmDialog trước khi vô hiệu hóa
- StatusBadge cho trạng thái active/inactive
```

---

### 👤 Module Staff (Nhân sự + Ca làm)
```
Implement tính năng [X] cho Module Staff của SmartF&B Frontend.

CONTEXT:
- Roles phụ: cashier | barista | waiter | branch_manager
- OWNER quản lý tất cả nhân viên toàn tenant
- branch_manager chỉ quản lý nhân viên trong chi nhánh mình
- PIN POS: 4-6 chữ số, dùng để đăng nhập nhanh trên màn hình POS
- Ca làm: ShiftTemplate (template) → ShiftSchedule (lịch thực tế)
- Staff tự đăng ký ca qua OpenShifts; Manager xếp lịch qua ShiftCalendar

Entity interfaces (staff.types.ts):
  Staff { id, userId, fullName, phone, positionId, branchIds[], role, status, posPin? }
  Position { id, tenantId, name, baseSalary }
  ShiftTemplate { id, branchId, name, startTime, endTime, minStaff, maxStaff }
  ShiftSchedule { id, branchId, staffId, shiftTemplateId, date, status, checkedInAt?, checkedOutAt? }

Vị trí file:
- src/modules/staff/components/StaffTable.tsx
- src/modules/staff/components/StaffForm.tsx         — tạo/sửa nhân viên
- src/modules/staff/components/PinSetupModal.tsx     — cấp/reset PIN
- src/modules/staff/components/ShiftCalendar.tsx     — drag & drop lịch tuần
- src/modules/staff/components/RolePermissionMatrix.tsx — bảng phân quyền
- src/modules/staff/hooks/useStaff.ts
- src/modules/staff/hooks/useShifts.ts
- src/pages/owner/StaffPage.tsx
- src/pages/owner/PermissionsPage.tsx
- src/pages/shared/shifts/ShiftSchedulePage.tsx
- src/pages/shared/shifts/MyShiftPage.tsx

UI đặc biệt:
- Bảng ma trận phân quyền: hàng = role, cột = module, cell = toggle switch
- Calendar lịch ca: weekly view, drag & drop assign nhân viên vào ca
- POS Login: màn hình fullscreen keypad nhập PIN 4-6 số
```

---

### 🍜 Module Menu (Thực đơn + Công thức)
```
Implement tính năng [X] cho Module Menu của SmartF&B Frontend.

CONTEXT:
- Cấu trúc: Category → MenuItem → Variants (Size S/M/L) + Addons (Topping)
- Mỗi MenuItem liên kết với Recipe → khi bán sẽ tự động trừ kho
- Tên Category/MenuItem/Topping phải unique trong tenant
- Soft delete khi đã có giao dịch — chỉ toggle is_active

Entity interfaces (menu.types.ts):
  Category { id, tenantId, name, description, displayOrder, isActive }
  MenuItem { id, tenantId, categoryId, name, imageUrl, basePrice, isActive }
  MenuItemAddon { id, tenantId, name, extraPrice, isActive }
  Recipe { id, menuItemId, ingredientId, quantity, unit }

Vị trí file:
- src/modules/menu/components/CategoryList.tsx      — list + drag & drop sort
- src/modules/menu/components/MenuItemGrid.tsx       — grid dùng cả ở admin và POS
- src/modules/menu/components/MenuItemForm.tsx       — tên, giá, ảnh, danh mục
- src/modules/menu/components/VariantEditor.tsx      — thêm/sửa Size S/M/L
- src/modules/menu/components/ToppingList.tsx
- src/modules/menu/components/ToppingForm.tsx
- src/modules/menu/components/RecipeEditor.tsx       — chọn NL + nhập định lượng
- src/modules/menu/hooks/useMenu.ts
- src/modules/menu/hooks/useCategories.ts
- src/modules/menu/hooks/useRecipes.ts
- src/pages/owner/MenuPage.tsx
- src/pages/owner/CategoryPage.tsx
- src/pages/owner/ToppingPage.tsx
- src/pages/owner/RecipePage.tsx

Lưu ý quan trọng:
- MenuItemGrid dùng lại ở cả trang admin (quản lý) lẫn POS (chọn món) — design phải linh hoạt
- ImageUpload: preview realtime trước khi upload, giới hạn 2MB, chỉ JPG/PNG/WEBP
- RecipeEditor: khi thay đổi giá nguyên liệu → hiện preview giá vốn mới tính tự động
```

---

### 🗺️ Module Table (Bàn + Sơ đồ)
```
Implement tính năng [X] cho Module Table của SmartF&B Frontend.

CONTEXT:
- FloorPlan builder (admin): drag & drop đặt bàn, chọn hình dạng (vuông/tròn), khu vực
- FloorPlan viewer (vận hành): màu sắc theo trạng thái, hiển thị tổng tiền đang mở
- Trạng thái bàn: available (xanh) | occupied (đỏ) | cleaning (vàng) | reserved (tím)
- Cập nhật realtime qua Socket.io khi có đơn mới tạo hoặc hoàn tất

Entity interfaces (table.types.ts):
  TableZone { id, branchId, name, floorNumber, displayOrder }
  Table { id, branchId, zoneId, name, capacity, status, positionX, positionY, shape, width, height }
  TableWithOrder { ...Table, currentOrderId?, currentOrderTotal?, occupiedSince? }

Vị trí file:
- src/modules/order/components/FloorPlanBuilder.tsx — drag & drop thiết kế (dùng react-dnd)
- src/modules/order/components/FloorPlanView.tsx    — realtime view
- src/modules/order/components/TableCard.tsx        — 1 bàn trên sơ đồ
- src/modules/order/hooks/useTableMap.ts            — query + realtime subscribe
- src/pages/pos/TableMapPage.tsx

Realtime:
  socket.on('table:status-changed', ...) → invalidate QUERY_KEYS.tables.all
  Dùng useOrderRealtime hook để subscribe khi mount TableMapPage
```

---

### 📋 Module Order (Đơn hàng + POS + KDS)
```
Implement tính năng [X] cho Module Order của SmartF&B Frontend.

CONTEXT — Module phức tạp nhất, ưu tiên tách component nhỏ:
- POS Screen: 2 panel: MenuGrid (trái, chọn món) + CartPanel (phải, giỏ hàng)
- KDS Screen: Fullscreen, tiles ticket hiển thị đơn chờ bếp, countdown timer
- CartStore (Zustand): quản lý giỏ hàng local trước khi submit API
- Realtime: order status change → cập nhật cả POS lẫn KDS

Entity interfaces (order.types.ts):
  Order { id, branchId, orderNumber, tableId?, staffId, status, subtotal, discountAmount, total, notes }
  OrderItem { id, orderId, menuItemId, variantId?, quantity, unitPrice, addonsJson, notes, status }
  OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'
  CartItem { menuItemId, variantId?, quantity, unitPrice, addons[], notes? }  ← Zustand local

Vị trí file:
- src/modules/order/components/POSScreen/
│   ├── MenuGrid.tsx         — grid món ăn có filter danh mục + search
│   ├── CartPanel.tsx        — danh sách cart item, tổng tiền, nút checkout
│   ├── CartItem.tsx         — 1 dòng món (tên, qty stepper, giá, note)
│   └── TableSelector.tsx    — chọn bàn hoặc take-away
- src/modules/order/components/KDS/
│   ├── KDSScreen.tsx        — grid tickets fullscreen
│   ├── KDSTicket.tsx        — 1 ticket (order number, items, timer)
│   └── KDSTimer.tsx         — countdown hiển thị thời gian đã chờ
- src/modules/order/stores/cartStore.ts   — Zustand cart state
- src/modules/order/hooks/useOrders.ts
- src/modules/order/hooks/useOrderRealtime.ts   — Socket.io
- src/pages/pos/OrderPage.tsx
- src/pages/pos/TableMapPage.tsx

Zustand cartStore cần có:
  items: CartItem[]
  selectedTableId: string | null
  orderType: 'dine_in' | 'take_away'
  addItem / removeItem / updateQty / clearCart / setTable

Lưu ý POS UX:
- Thêm món nhanh (1 click) — không mở dialog nếu không có addon/variant
- Nếu có variant → mở bottom sheet chọn size trước
- CartPanel cố định bên phải, không scroll cùng menu
```

---

### 💳 Module Payment (Thanh toán + Hóa đơn)
```
Implement tính năng [X] cho Module Payment của SmartF&B Frontend.

CONTEXT:
- Checkout flow: OrderPage → PaymentPage (tách trang, không dùng modal)
- Phương thức: cash | vietqr | momo | zalopay
- QR payment: sinh QR động → polling trạng thái mỗi 3 giây → timeout sau 3 phút
- Sau thanh toán thành công: in hóa đơn hoặc gửi email/Zalo
- Danh sách hóa đơn: filter tối đa 90 ngày, CASHIER chỉ xem branch mình

Entity interfaces (payment.types.ts):
  Payment { id, orderId, amount, method, status, transactionId, paidAt }
  Invoice { id, orderId, invoiceNumber, subtotal, discount, taxAmount, total, issuedAt }
  PaymentMethod = 'cash' | 'vietqr' | 'momo' | 'zalopay'

Vị trí file:
- src/modules/payment/components/PaymentMethodTabs.tsx  — chọn phương thức
- src/modules/payment/components/CashPaymentForm.tsx    — nhập tiền mặt, hiển thị tiền thừa
- src/modules/payment/components/QRCodeDisplay.tsx      — QR fullscreen + countdown + polling
- src/modules/payment/components/PaymentSuccess.tsx     — màn hình xác nhận thành công
- src/modules/payment/components/InvoiceFilter.tsx      — bộ lọc nâng cao
- src/modules/payment/hooks/usePayment.ts               — mutation + polling
- src/modules/payment/hooks/useInvoices.ts
- src/pages/pos/PaymentPage.tsx
- src/pages/owner/InvoicesPage.tsx (nếu cần)

QR Polling pattern:
  useEffect: setInterval 3s → gọi GET /payments/:id → nếu status=completed → navigate('/payment-success')
  Cleanup: clearInterval khi unmount hoặc khi timeout 3 phút
```

---

### 📦 Module Inventory (Kho + Bán thành phẩm)
```
Implement tính năng [X] cho Module Inventory của SmartF&B Frontend.

CONTEXT:
- Nguyên liệu (Ingredient): nguyên liệu thô cơ bản
- Bán thành phẩm (SemiProduct): được sản xuất từ nguyên liệu thô, có shelf life
- Nhập kho: tạo phiếu → nhận hàng thực tế → xác nhận (không sửa được sau xác nhận)
- Xuất kho thủ công: lý do bắt buộc (hao hụt/hỏng hóc/nội bộ/hết hạn)
- Kiểm kho: hỗ trợ offline, nhập thực tế → hệ thống tính chênh lệch
- Badge tồn kho: 🟢 Đủ | 🟡 Sắp hết | 🔴 Hết hàng

Entity interfaces:
  Ingredient { id, name, unit, costPerUnit, minStockThreshold, isActive }
  IngredientStock { ingredientId, branchId, currentQty, lastUpdatedAt }
  SemiProduct { id, name, unit, shelfLifeDays, minStockThreshold }
  PurchaseOrder { id, branchId, supplierId, status, totalAmount, orderedAt }
  InventoryMovement { id, type: 'import'|'export'|'adjust', quantity, reason, createdAt }

Vị trí file:
- src/modules/inventory/components/IngredientTable.tsx     — bảng + stock badge
- src/modules/inventory/components/IngredientForm.tsx
- src/modules/inventory/components/StockStatusBadge.tsx    — shared badge màu
- src/modules/inventory/components/PurchaseOrderForm.tsx
- src/modules/inventory/components/ReceiveGoodsForm.tsx    — nhận hàng thực tế
- src/modules/inventory/components/StockTakingForm.tsx     — kiểm kho mobile-friendly
- src/modules/inventory/components/MovementHistory.tsx     — timeline audit trail
- src/pages/shared/inventory/IngredientPage.tsx
- src/pages/shared/inventory/StockEntryPage.tsx
- src/pages/shared/inventory/StockTakingPage.tsx

Lưu ý kiểm kho:
- Offline support: lưu data nhập vào localStorage khi mất mạng
- Sync khi có mạng lại (check navigator.onLine)
- Highlight dòng có chênh lệch > 5% bằng màu vàng/đỏ
```

---

### 🎁 Module Voucher & Promotion
```
Implement tính năng [X] cho Module Voucher của SmartF&B Frontend.

CONTEXT:
- Voucher có loại: percent (giảm %) | fixed (giảm tiền cố định)
- Điều kiện: min_order_value, số lần dùng, thời hạn
- Apply trên POS: cashier nhập mã → validate realtime → áp vào CartPanel
- Chỉ áp 1 voucher mỗi đơn; không stack

Entity interfaces (promotion.types.ts):
  Promotion { id, name, type, value, minOrderValue, maxDiscount, startDate, endDate, isActive }
  Voucher { id, promotionId, code, maxUses, usedCount, expiresAt, isActive }

Vị trí file:
- src/modules/voucher/components/VoucherForm.tsx
- src/modules/voucher/components/VoucherList.tsx
- src/modules/voucher/components/VoucherApplyInput.tsx  — input + validate trên POS cart
- src/pages/owner/VouchersPage.tsx

VoucherApplyInput cần:
  - Input nhập mã → onBlur hoặc Enter → gọi POST /promotions/validate
  - Hiện preview: "Giảm 20.000đ cho đơn từ 100.000đ"
  - Nếu không hợp lệ: inline error (không dùng toast để UX nhanh)
```

---

### 🏭 Module Supplier (Nhà cung cấp)
```
Implement tính năng [X] cho Module Supplier của SmartF&B Frontend.

CONTEXT:
- Liên kết chặt với Inventory (PurchaseOrder gắn supplierId)
- Theo dõi công nợ: số tiền còn nợ, quá hạn
- Khi tạo phiếu nhập kho → auto-suggest default supplier cho từng NL

Entity interfaces:
  Supplier { id, name, taxCode, address, phone, contactPerson, bankAccount, paymentTermsDays, isActive }
  SupplierIngredient { supplierId, ingredientId, price, minOrderQty, leadTimeDays, isPreferred }

Vị trí file:
- src/modules/supplier/components/SupplierForm.tsx
- src/modules/supplier/components/SupplierTable.tsx
- src/modules/supplier/components/SupplierDebtPanel.tsx  — công nợ + lịch sử thanh toán
- src/pages/owner/SuppliersPage.tsx
```

---

### 📊 Module Report (Báo cáo)
```
Implement tính năng [X] cho Module Report của SmartF&B Frontend.

CONTEXT — Read-only, không có create/update:
- OWNER: xem tất cả chi nhánh
- branch_manager/cashier: chỉ xem chi nhánh được gán
- Export Excel/PDF: gọi API → nhận job_id → polling đến khi done → download

Báo cáo cần implement:
  1. Revenue: doanh thu theo ngày/tuần/tháng/năm + heatmap giờ cao điểm
  2. Product: top bán chạy, bán chậm, margin per item
  3. Inventory: tồn kho, nhập/xuất tồn, waste report
  4. HR: chấm công, bảng lương tháng

Thư viện chart đề nghị:
  - Recharts: line chart, bar chart, pie chart (đã có trong package)
  - Không dùng Chart.js (conflict với shadcn)

Vị trí file:
- src/modules/report/components/RevenueChart.tsx
- src/modules/report/components/HourlyHeatmap.tsx
- src/modules/report/components/TopProductsTable.tsx
- src/modules/report/components/DateRangePicker.tsx   — reuse từ shared nếu có
- src/modules/report/hooks/useRevenueReport.ts
- src/pages/owner/reports/RevenuePage.tsx
- src/pages/owner/reports/InventoryReportPage.tsx
- src/pages/owner/reports/HRReportPage.tsx

Export pattern:
  const { mutate: exportReport, isPending } = useExportReport();
  // isPending → hiện "Đang xuất..." + disable nút
  // onSuccess → auto download file
```

---

## 🔧 SHARED UTILITIES PROMPT

```
Implement shared utilities cho SmartF&B Frontend.

Cần tạo trong src/shared/:

1. utils/cn.ts
   clsx + tailwind-merge helper (bắt buộc của shadcn/ui)

2. utils/formatCurrency.ts
   formatVND(10000) → "10.000 ₫"
   formatVNDCompact(1500000) → "1,5 triệu"

3. utils/formatDate.ts
   formatDate('2026-03-15') → "15/03/2026"
   formatDateTime('2026-03-15T14:30') → "15/03/2026 14:30"
   formatRelative('2026-03-15T14:00') → "2 giờ trước"

4. utils/getRoleHomePage.ts
   admin   → '/admin/dashboard'
   owner   → '/dashboard'
   staff (cashier/waiter) → '/pos/select-branch'
   staff (barista) → '/pos/kds'
   staff (branch_manager) → '/dashboard'

5. constants/roles.ts
   export const ROLES = { ADMIN: 'admin', OWNER: 'owner', STAFF: 'staff' } as const
   export type Role = typeof ROLES[keyof typeof ROLES]
   export const STAFF_ROLES = { CASHIER: 'cashier', BARISTA: 'barista', WAITER: 'waiter', BRANCH_MANAGER: 'branch_manager' }

6. constants/routes.ts
   export const ROUTES = { LOGIN: '/login', DASHBOARD: '/dashboard', POS: '/pos/orders', ... }

7. constants/queryKeys.ts
   Centralized TanStack Query keys cho tất cả modules
   Pattern: { branches: { all, list(params), detail(id) }, staff: {...}, ... }

8. types/api.types.ts
   ApiResponse<T> { data: T; message: string; success: boolean }
   PaginatedResult<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }
   ApiError { code: string; message: string; details?: Record<string,string[]> }

9. hooks/usePermission.ts
   isOwner, isAdmin, isStaff, isBranchManager
   can(action: 'view'|'create'|'update'|'delete', module: string): boolean
   — Đọc permissions từ authStore, fallback safe (return false nếu chưa load)

10. lib/axios.ts
    Axios instance với interceptors:
    - Request: gắn Authorization Bearer token từ authStore
    - Request: gắn X-Tenant-ID và X-Branch-ID từ providers
    - Response 401: clear auth + redirect /login
    - Response lỗi: transform về ApiError format chuẩn
```

---

## 📌 LƯU Ý CHUNG

```
1. Mỗi lần implement feature, tạo/cập nhật file plan:
   src/docs/plans/[tên-feature].md

2. Text hiển thị cho user: LUÔN bằng tiếng Việt
   toast('Tạo chi nhánh thành công')  ✅
   toast('Branch created')            ❌

3. Empty state phải có message rõ ràng theo ngữ cảnh:
   <EmptyState message="Chưa có chi nhánh nào. Nhấn 'Thêm chi nhánh' để bắt đầu." />

4. Skeleton loading thay vì spinner cho list/table:
   <Skeleton className="h-10 w-full" />

5. Confirm trước khi xóa/vô hiệu hóa:
   <ConfirmDialog
     title="Vô hiệu hóa chi nhánh?"
     description="Chi nhánh sẽ không thể nhận đơn mới. Dữ liệu vẫn được giữ nguyên."
     onConfirm={handleToggle}
   />
```
