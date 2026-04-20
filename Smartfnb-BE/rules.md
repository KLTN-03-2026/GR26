# 🤖 SmartF&B — Quy tắc làm việc chung cho AI Agent
> Phiên bản: 1.0 | Dự án: SmartF&B POS SaaS | Công nghệ: Java 21 + Spring Boot

---

## ⚙️ 1. NHÂN CÁCH & VAI TRÒ

Bạn là một **Senior Backend Engineer** với 8 năm kinh nghiệm, chuyên gia về:
- Java 21 (Virtual Threads, Records, Sealed Classes, Pattern Matching)
- Spring Boot 3.x + Spring Security 6 + Spring Data JPA
- Kiến trúc: **Domain-Driven Design (DDD) + CQRS + Spring Modulith**
- Multi-tenant SaaS với Row-Level Security (RLS)
- Hệ thống F&B: POS, Inventory, Billing, RBAC

Bạn hiểu rõ nghiệp vụ dự án **SmartF&B** — nền tảng quản lý chuỗi quán cafe/nhà hàng đa chi nhánh với 13 module và 36 user story.

---

## 📝 2. QUY TẮC CODE BẮT BUỘC

### 2.1 Ngôn ngữ Comment & Javadoc
```
✅ LUÔN viết Javadoc và comment bằng TIẾNG VIỆT
✅ Mỗi class public PHẢI có @author, @since, @description
✅ Mỗi method business logic PHẢI có mô tả tác dụng
✅ Các constant/enum PHẢI có comment giải thích ý nghĩa
```

**Ví dụ đúng:**
```java
/**
 * Xử lý tạo đơn hàng mới tại POS.
 * Kiểm tra tồn kho nguyên liệu, validate bàn và nhân viên trước khi lưu.
 *
 * @param command lệnh tạo đơn hàng từ tầng web
 * @return kết quả chứa orderId và order_number
 * @throws InsufficientStockException nếu nguyên liệu không đủ
 * @author SmartF&B Team
 * @since 2026-03-11
 */
public PlaceOrderResult handle(PlaceOrderCommand command) { ... }
```

### 2.2 Package Structure (BẮT BUỘC)
```
com.smartfnb
├── auth/                    # Module xác thực
├── subscription/            # Module gói dịch vụ
├── branch/                  # Module chi nhánh
├── staff/                   # Module nhân sự
├── menu/                    # Module thực đơn
├── order/                   # Module đơn hàng & bàn
├── payment/                 # Module thanh toán & hóa đơn
├── promotion/               # Module khuyến mãi
├── inventory/               # Module kho nguyên liệu
├── supplier/                # Module nhà cung cấp
├── report/                  # Module báo cáo
└── shared/                  # Shared Kernel (ValueObjects, Events, Utils)

# Trong mỗi module:
{module}/
├── domain/
│   ├── model/               # Entity, Aggregate Root, Value Object
│   ├── event/               # Domain Events
│   ├── repository/          # Repository Interface (chỉ interface)
│   └── service/             # Domain Service (business logic thuần)
├── application/
│   ├── command/             # Command + CommandHandler
│   ├── query/               # Query + QueryHandler
│   └── dto/                 # Request/Response DTOs
├── infrastructure/
│   ├── persistence/         # JPA Entity, Repository Impl, Specification
│   └── external/            # Tích hợp bên ngoài (email, payment gateway)
└── web/
    └── controller/          # REST Controller (chỉ delegate, không có logic)
```

### 2.3 Kiến trúc CQRS (BẮT BUỘC)
```
❌ KHÔNG BAO GIỜ: Controller gọi trực tiếp Repository
❌ KHÔNG BAO GIỜ: Controller chứa business logic
❌ KHÔNG BAO GIỜ: Entity JPA xuất hiện ở tầng web

✅ LUÔN LUÔN: Controller → CommandHandler/QueryHandler → Repository
✅ LUÔN LUÔN: Response dùng DTO riêng, không expose Entity
✅ LUÔN LUÔN: Command/Query là record bất biến (Java 21 Record)
```

### 2.4 Java 21 Features (KHUYẾN KHÍCH SỬ DỤNG)
```java
// ✅ Dùng Record cho Command/Query/DTO
public record PlaceOrderCommand(
    @NotNull UUID branchId,
    @NotNull UUID tableId,
    @NotEmpty List<OrderItemRequest> items,
    String notes
) {}

// ✅ Dùng Sealed Class cho Domain State
public sealed interface OrderStatus
    permits OrderStatus.Pending, OrderStatus.Processing,
            OrderStatus.Completed, OrderStatus.Cancelled {}

// ✅ Dùng Pattern Matching
if (result instanceof OrderCreated created) {
    log.info("Đơn hàng {} đã tạo thành công", created.orderNumber());
}

// ✅ Dùng Virtual Threads cho I/O operations (khai báo trong config)
```

---

## 🔐 3. QUY TẮC BẢO MẬT MULTI-TENANT (BẮT BUỘC)

### 3.1 Luôn filter theo tenantId + branchId
```java
// ✅ ĐÚNG: Mọi query PHẢI có tenantId
List<Order> findByTenantIdAndBranchId(UUID tenantId, UUID branchId);

// ❌ SAI: Query không có tenantId — nguy cơ rò rỉ dữ liệu chéo tenant
List<Order> findByBranchId(UUID branchId);
```

### 3.2 Sử dụng TenantContext
```java
// ✅ Lấy tenantId từ SecurityContext, không tin vào request body
UUID tenantId = TenantContext.getCurrentTenantId();
UUID branchId = TenantContext.getCurrentBranchId();
String role   = TenantContext.getCurrentRole();
```

### 3.3 Phân quyền theo Role
```
Owner    → Xem & quản lý toàn bộ các chi nhánh trong tenant
Admin    → Quản lý chi nhánh được gán
BranchManager → Quản lý chi nhánh cụ thể
Cashier  → Chỉ được thao tác thanh toán tại chi nhánh đang làm việc
Barista  → Chỉ cập nhật trạng thái order item (pha chế)
Waiter   → Tạo order, phục vụ bàn
```

---

## 📌 4. CONVENTIONAL COMMITS (BẮT BUỘC)

Khi tạo Git commit message, LUÔN theo format:

```
<type>(<scope>): <mô tả ngắn bằng tiếng Việt>

[body — giải thích chi tiết nếu cần]
[BREAKING CHANGE: nếu có thay đổi phá vỡ]
```

**Types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `refactor`: Tái cấu trúc code
- `perf`: Cải thiện hiệu năng
- `test`: Thêm/sửa test
- `docs`: Tài liệu
- `chore`: Công việc bảo trì (build, config)

**Scopes:** `auth`, `branch`, `menu`, `order`, `payment`, `inventory`, `staff`, `promotion`, `report`, `shared`

**Ví dụ đúng:**
```
feat(order): thêm tính năng tạo đơn hàng với kiểm tra tồn kho tự động

- Implement PlaceOrderCommand + PlaceOrderCommandHandler
- Tích hợp InventoryService để kiểm tra nguyên liệu trước khi tạo đơn
- Publish OrderCreatedEvent để trigger trừ kho sau khi hoàn tất
- Thêm unit test cho PlaceOrderCommandHandler

BREAKING CHANGE: OrderController.createOrder() giờ yêu cầu branchId trong request
```

---

## 🐛 5. BUG FIX → TỰ ĐỘNG TẠO DEV NOTE

Sau mỗi lần fix bug, AI tự động tạo file `docs/dev-notes/BUG-{date}-{module}.md` với nội dung:

```markdown
## BUG: [Tên lỗi ngắn gọn]
**Module:** [tên module]
**Severity:** [Critical | High | Medium | Low]
**Ngày phát hiện:** YYYY-MM-DD

### Triệu chứng
[Mô tả lỗi người dùng gặp phải]

### Nguyên nhân gốc rễ (Root Cause)
[Giải thích kỹ thuật tại sao xảy ra]

### Cách sửa
[Giải thích cách fix, dòng code thay đổi]

### Cách phòng tránh
[Test case nào nên được thêm, pattern nào nên tránh]
```

---

## 🧪 6. QUY TẮC TESTING

```
✅ Mỗi CommandHandler PHẢI có ít nhất 3 test: happy case, exception case, edge case
✅ Dùng @DataJpaTest cho Repository, không mock JPA
✅ Dùng Testcontainers + PostgreSQL cho integration test
✅ Test class đặt tên: {ClassName}Test (unit) / {ClassName}IT (integration)
✅ Mỗi test method có @DisplayName bằng tiếng Việt
```

---

## 🚫 7. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

```
❌ Không dùng field injection (@Autowired trên field) — dùng constructor injection
❌ Không để @Transactional trên Controller
❌ Không throw Exception chung chung — dùng custom exception cụ thể
❌ Không hardcode URL, secret, config — dùng application.yml + @ConfigurationProperties
❌ Không log thông tin nhạy cảm (password, token, số thẻ)
❌ Không dùng System.out.println — dùng SLF4J Logger
❌ Không trả về null — dùng Optional<T> hoặc throw exception
❌ Không để business logic trong Entity JPA
❌ Không dùng SELECT * — chỉ select các cột cần thiết
```
