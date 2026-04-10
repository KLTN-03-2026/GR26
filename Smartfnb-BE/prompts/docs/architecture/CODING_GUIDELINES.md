# 📐 SmartF&B — Hiến Pháp Kiến Trúc & Coding Guidelines
> Tài liệu bắt buộc đọc trước khi implement bất kỳ tính năng nào.
> Mọi code không tuân thủ tài liệu này sẽ bị từ chối trong Code Review.

---

## 🏛️ 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Stack Công nghệ
| Hạng mục | Công nghệ | Ghi chú |
|----------|-----------|---------|
| Runtime | **Java 21** | Virtual Threads, Records, Sealed Classes |
| Framework | **Spring Boot 3.3.x** | Spring Modulith cho module boundaries |
| Security | **Spring Security 6** | JWT + Role-based |
| ORM | **Spring Data JPA + Hibernate 6** | + Specifications cho dynamic query |
| Database | **PostgreSQL 16** | Row-Level Security, Partitioning |
| Realtime | **Spring WebSocket** | Đồng bộ đơn hàng, trạng thái bàn |
| Caching | **Redis** | Session, Feature Flag cache |
| Build | **Maven** | |
| Test | **JUnit 5 + Testcontainers** | PostgreSQL container |

### 1.2 Mô hình kiến trúc tổng thể
```
┌─────────────────────────────────────────────────────────────┐
│                     Spring Boot Application                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │  │
│  │  Auth    │  │  Order   │  │Inventory │  │  Report  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│  ─────┴──────────────┴──────────────┴──────────────┴──────  │
│                    Shared Kernel                             │
│         (TenantContext, BaseEntity, DomainEvent)            │
└─────────────────────────────────────────────────────────────┘
         │                              │
    PostgreSQL                        Redis
```

---

## 🗂️ 2. CẤU TRÚC MODULE (DDD)

### 2.1 Template chuẩn cho mỗi Module
```
com.smartfnb.{module}/
│
├── domain/                          ← TRUNG TÂM — Không phụ thuộc bất cứ gì
│   ├── model/
│   │   ├── {Aggregate}.java         ← Aggregate Root (extends BaseAggregateRoot)
│   │   ├── {Entity}.java            ← Entity con trong aggregate
│   │   └── vo/                      ← Value Objects (record, immutable)
│   │       ├── Money.java
│   │       └── OrderNumber.java
│   ├── event/
│   │   └── {Module}Event.java       ← Domain Events (record)
│   ├── repository/
│   │   └── {Aggregate}Repository.java ← Interface thuần Java (không import JPA)
│   ├── service/
│   │   └── {Module}DomainService.java ← Business logic phức tạp liên nhiều entity
│   └── exception/
│       └── {Module}Exception.java   ← Custom exceptions
│
├── application/                     ← Orchestration Layer
│   ├── command/
│   │   ├── {Action}Command.java     ← record (Java 21)
│   │   └── {Action}CommandHandler.java ← @Component, @Transactional
│   ├── query/
│   │   ├── {View}Query.java         ← record
│   │   ├── {View}QueryHandler.java  ← @Component (READ ONLY — không @Transactional)
│   │   └── result/
│   │       └── {View}Result.java    ← record (dữ liệu trả về)
│   └── port/
│       └── {External}Port.java      ← Interface cho external service (email, payment)
│
├── infrastructure/                  ← Chi tiết kỹ thuật
│   ├── persistence/
│   │   ├── {Aggregate}JpaEntity.java ← @Entity (tách khỏi Domain Entity)
│   │   ├── {Aggregate}JpaRepository.java ← extends JpaRepository
│   │   ├── {Aggregate}RepositoryImpl.java ← implements domain Repository
│   │   └── {Aggregate}Specification.java ← dynamic query
│   └── external/
│       └── {Service}Adapter.java    ← implements domain Port
│
└── web/
    └── controller/
        ├── {Module}Controller.java  ← REST API (chỉ delegate, validate input)
        └── dto/
            ├── {Action}Request.java ← record + Bean Validation
            └── {View}Response.java  ← record (mapping từ Result)
```

### 2.2 Ví dụ cụ thể — Module Order
```java
// ✅ ĐÚNG: Controller chỉ nhận request, chuyển thành Command, trả Response
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final PlaceOrderCommandHandler placeOrderCommandHandler;
    private final GetOrderQueryHandler getOrderQueryHandler;

    /**
     * Tạo đơn hàng mới tại POS.
     * Nhân viên cần quyền CREATE_ORDER tại chi nhánh hiện tại.
     */
    @PostMapping
    @PreAuthorize("hasPermission('order', 'create')")
    public ResponseEntity<PlaceOrderResponse> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request) {

        // 1. Map Request → Command
        PlaceOrderCommand command = new PlaceOrderCommand(
            TenantContext.getCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            TenantContext.getCurrentStaffId(),
            request.tableId(),
            request.items(),
            request.notes()
        );

        // 2. Delegate sang CommandHandler
        PlaceOrderResult result = placeOrderCommandHandler.handle(command);

        // 3. Map Result → Response
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PlaceOrderResponse.from(result));
    }
}
```

```java
// ✅ ĐÚNG: CommandHandler chứa toàn bộ business logic
@Component
@RequiredArgsConstructor
@Slf4j
public class PlaceOrderCommandHandler {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;
    private final InventoryDomainService inventoryDomainService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Xử lý lệnh tạo đơn hàng.
     * Luồng: Validate bàn → Kiểm tra tồn kho → Tạo đơn → Publish event
     *
     * @param command thông tin tạo đơn từ Controller
     * @return kết quả gồm orderId và orderNumber
     * @throws TableNotAvailableException nếu bàn không trống
     * @throws InsufficientStockException nếu nguyên liệu không đủ
     */
    @Transactional
    public PlaceOrderResult handle(PlaceOrderCommand command) {
        log.info("Tạo đơn hàng cho bàn {} tại chi nhánh {}",
            command.tableId(), command.branchId());

        // 1. Kiểm tra bàn còn trống không
        Table table = tableRepository
            .findByIdAndBranchIdAndTenantId(
                command.tableId(), command.branchId(), command.tenantId())
            .orElseThrow(() -> new TableNotFoundException(command.tableId()));

        table.assertIsAvailable(); // Domain logic trong entity

        // 2. Kiểm tra tồn kho nguyên liệu
        inventoryDomainService.assertSufficientStock(
            command.branchId(), command.items());

        // 3. Tạo aggregate Order
        Order order = Order.create(command);

        // 4. Lưu vào DB
        orderRepository.save(order);

        // 5. Publish domain event (sẽ trigger trừ kho)
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));

        log.info("Đã tạo đơn hàng {} thành công", order.getOrderNumber());
        return PlaceOrderResult.from(order);
    }
}
```

---

## 🌐 3. API DESIGN STANDARDS

### 3.1 URL Convention
```
GET    /api/v1/{resource}           # Danh sách (có phân trang, lọc)
POST   /api/v1/{resource}           # Tạo mới
GET    /api/v1/{resource}/{id}      # Chi tiết
PUT    /api/v1/{resource}/{id}      # Cập nhật toàn phần
PATCH  /api/v1/{resource}/{id}      # Cập nhật một phần
PUT    /api/v1/{resource}/{id}/toggle    # Bật/tắt trạng thái
POST   /api/v1/{resource}/{id}/cancel   # Hành động đặc biệt (verb)

# Multi-tenant scope tự động từ JWT — KHÔNG để tenantId trên URL public
```

### 3.2 Response Format chuẩn
```json
// ✅ Success - danh sách có phân trang
{
  "success": true,
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  },
  "timestamp": "2026-03-15T10:30:00Z"
}

// ✅ Success - đối tượng đơn
{
  "success": true,
  "data": { "id": "uuid", "orderNumber": "ORD-001", ... },
  "timestamp": "2026-03-15T10:30:00Z"
}

// ✅ Error - validation hoặc business error
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Nguyên liệu Cà phê Arabica không đủ. Cần 50g, hiện còn 20g.",
    "field": null
  },
  "timestamp": "2026-03-15T10:30:00Z"
}
```

### 3.3 HTTP Status Codes
```
200 OK          → GET thành công, PUT thành công
201 Created     → POST tạo mới thành công
204 No Content  → DELETE thành công
400 Bad Request → Validation lỗi, business rule vi phạm
401 Unauthorized → Chưa đăng nhập / token hết hạn
403 Forbidden   → Không có quyền
404 Not Found   → Resource không tồn tại (trong scope tenant)
409 Conflict    → Duplicate (tên trùng, SĐT trùng)
422 Unprocessable → Business logic reject
500 Internal    → Lỗi server không mong đợi
```

---

## 🔒 4. MULTI-TENANT SECURITY

### 4.1 JWT Token Structure
```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "branchId": "branch-uuid",        // chi nhánh đang làm việc
  "role": "cashier",
  "permissions": ["order:create", "payment:create", "invoice:read"],
  "exp": 1710000000,
  "iat": 1709996400
}
```

### 4.2 TenantContext — Bắt buộc sử dụng
```java
// ✅ Trong CommandHandler/QueryHandler — lấy từ SecurityContext
UUID tenantId  = TenantContext.getCurrentTenantId();
UUID branchId  = TenantContext.getCurrentBranchId();
UUID staffId   = TenantContext.getCurrentStaffId();
String role    = TenantContext.getCurrentRole();

// ✅ Spec mẫu đảm bảo tenant isolation
public static Specification<Order> forCurrentTenant() {
    return (root, query, cb) ->
        cb.equal(root.get("tenantId"), TenantContext.getCurrentTenantId());
}

public static Specification<Order> forBranch(UUID branchId) {
    return (root, query, cb) ->
        cb.equal(root.get("branchId"), branchId);
}
```

### 4.3 Feature Flag Check
```java
// ✅ Kiểm tra feature trước khi thực thi
@PreAuthorize("@featureFlagService.isEnabled('INVENTORY', #tenantId)")
public void updateStock(...) { ... }
```

---

## 📦 5. BASE CLASSES & SHARED KERNEL

### 5.1 BaseAggregateRoot
```java
/**
 * Lớp cha cho tất cả Aggregate Root trong hệ thống SmartF&B.
 * Cung cấp: ID, audit fields, domain event collection.
 */
@MappedSuperclass
public abstract class BaseAggregateRoot {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false, updatable = false)
    private UUID tenantId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    private UUID createdBy;

    @Transient
    private final List<Object> domainEvents = new ArrayList<>();

    protected void registerEvent(Object event) {
        domainEvents.add(event);
    }
}
```

### 5.2 Custom Exceptions
```java
// ✅ Exception có error code để FE xử lý dễ
public class OrderNotFoundException extends SmartFnbException {
    public OrderNotFoundException(UUID orderId) {
        super("ORDER_NOT_FOUND",
              "Không tìm thấy đơn hàng với ID: " + orderId);
    }
}

public class InsufficientStockException extends SmartFnbException {
    public InsufficientStockException(String ingredient, double required, double available) {
        super("INSUFFICIENT_STOCK",
              String.format("Nguyên liệu '%s' không đủ. Cần %.1f, còn %.1f",
                  ingredient, required, available));
    }
}
```

---

## 📊 6. DATABASE CONVENTIONS

### 6.1 Naming Convention
```sql
-- Tables: snake_case, số nhiều
orders, order_items, menu_items, inventory_transactions

-- Columns: snake_case
tenant_id, branch_id, created_at, is_active, order_number

-- Indexes: idx_{table}_{columns}
CREATE INDEX idx_orders_tenant_branch ON orders(tenant_id, branch_id);
CREATE INDEX idx_orders_status ON orders(status) WHERE status != 'completed';

-- Foreign Keys: fk_{table}_{ref_table}
ALTER TABLE orders ADD CONSTRAINT fk_orders_branches
    FOREIGN KEY (branch_id) REFERENCES branches(id);
```

### 6.2 Soft Delete Pattern
```java
// ✅ Không xóa cứng dữ liệu nghiệp vụ
@Column(name = "deleted_at")
private Instant deletedAt;

public boolean isDeleted() { return deletedAt != null; }
public void softDelete() { this.deletedAt = Instant.now(); }

// ✅ Query tự động loại deleted
@Where(clause = "deleted_at IS NULL")   // Hibernate annotation
```

### 6.3 Audit Log bắt buộc cho dữ liệu nhạy cảm
```java
// Các thao tác sau PHẢI ghi audit log:
// - Thay đổi phân quyền (RolePermission)
// - Hủy đơn hàng
// - Hoàn tiền (Refund)
// - Điều chỉnh kho thủ công
// - Xóa nhân viên
```

---

## ⚡ 7. PERFORMANCE GUIDELINES

### 7.1 Query Performance
```java
// ✅ Pagination bắt buộc cho danh sách
Pageable pageable = PageRequest.of(page, Math.min(size, 100));

// ✅ Dùng Projection thay vì load cả Entity khi chỉ cần vài field
interface OrderSummaryProjection {
    UUID getId();
    String getOrderNumber();
    BigDecimal getTotalAmount();
    String getStatus();
}

// ✅ Tránh N+1 — dùng JOIN FETCH hoặc @EntityGraph
@EntityGraph(attributePaths = {"items", "items.menuItem"})
Optional<Order> findWithItemsById(UUID id);

// ✅ Index hint cho query phức tạp
@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "50"))
```

### 7.2 Realtime (WebSocket)
```
- Chỉ broadcast khi state thực sự thay đổi
- Topic theo branchId: /topic/orders/{branchId}
- Dùng Virtual Threads cho WebSocket handlers
```

---

## 🧩 8. MODULE DEPENDENCIES (BẮT BUỘC TUÂN THỦ)

```
auth         → (không phụ thuộc module nào)
subscription → auth
branch       → auth, subscription
staff        → branch
menu         → branch
inventory    → branch, menu
order        → branch, staff, menu, inventory
payment      → order, promotion
promotion    → branch, menu
report       → order, payment, inventory, staff
```

> **Nguyên tắc:** Module cấp thấp KHÔNG được import/phụ thuộc module cấp cao.
> Module `order` KHÔNG được import từ `report`.
> Giao tiếp ngược chiều phải thông qua **Domain Events**.
