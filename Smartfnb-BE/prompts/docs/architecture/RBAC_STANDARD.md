# 🛡️ SmartF&B — Chuẩn RBAC & Lọc Dữ Liệu Multi-Tenant
> Tài liệu này quy định cách AI phải viết code liên quan đến phân quyền và truy vấn dữ liệu.
> Mọi vi phạm tài liệu này là lỗi bảo mật nghiêm trọng.

---

## 🗺️ 1. MÔ HÌNH PHÂN CẤP DỮ LIỆU

```
SaaS Platform (SmartF&B)
└── Tenant (Chuỗi / Chain)          ← Chủ quán sở hữu
    └── Branch (Chi nhánh / Store)   ← Nhân viên làm việc tại đây
        ├── Order (Đơn hàng)
        ├── Table (Bàn)
        ├── Inventory (Kho)
        └── Shift (Ca làm việc)
```

**Quy tắc vàng:**
- Mỗi query ĐỀU phải có `tenant_id` trong điều kiện WHERE
- Nhân viên chỉ xem dữ liệu của `branch_id` được gán
- Owner xem tất cả `branch_id` trong `tenant_id` của mình

---

## 👤 2. MA TRẬN PHÂN QUYỀN (RBAC)

### 2.1 Vai trò và phạm vi quyền
| Role | Phạm vi xem | Ghi chú |
|------|------------|---------|
| `SUPER_ADMIN` | Toàn hệ thống | Quản trị platform, không thuộc tenant |
| `OWNER` | Toàn bộ tenant | Tất cả chi nhánh, tất cả báo cáo |
| `ADMIN` | Chi nhánh được gán | Quản lý vận hành |
| `BRANCH_MANAGER` | Chi nhánh đang quản lý | Xem + phê duyệt |
| `CASHIER` | Chi nhánh đang làm việc | POS, thanh toán, hóa đơn |
| `BARISTA` | Chi nhánh đang làm việc | Cập nhật trạng thái pha chế |
| `WAITER` | Chi nhánh đang làm việc | Tạo order, phục vụ bàn |

### 2.2 Ma trận quyền theo Module
```
Module          | OWNER | ADMIN | BRANCH_MGR | CASHIER | BARISTA | WAITER
----------------|-------|-------|------------|---------|---------|-------
Auth            | CRUD  | R     | R          | R       | R       | R
Subscription    | CRUD  | R     | -          | -       | -       | -
Branch          | CRUD  | RU    | R          | -       | -       | -
Staff           | CRUD  | CRU   | R          | -       | -       | -
Shift           | CRUD  | CRUD  | CRU        | R       | R       | CR
Menu            | CRUD  | CRU   | R          | R       | R       | R
Order           | CRUD  | CRUD  | CRUD       | CRUD    | RU      | CRU
Payment         | CRUD  | CRUD  | CRU        | CRUD    | -       | -
Invoice         | CR    | CR    | CR         | CR      | -       | -
Inventory       | CRUD  | CRUD  | CRU        | -       | -       | -
Supplier        | CRUD  | CRUD  | R          | -       | -       | -
Promotion       | CRUD  | CRUD  | R          | R       | -       | -
Report Revenue  | R     | R     | R(branch)  | -       | -       | -
Report Inventory| R     | R     | R(branch)  | -       | -       | -
Report HR       | R     | R     | R(branch)  | R(self) | R(self) | R(self)
```
> R=Read, C=Create, U=Update, D=Delete, -=Không có quyền

---

## 🔑 3. TENANTCONTEXT — CÁCH DÙNG ĐÚNG

### 3.1 Cài đặt TenantContext
```java
/**
 * Lưu trữ context của phiên làm việc hiện tại.
 * Được populate từ JWT token bởi JwtAuthFilter.
 * Dùng InheritableThreadLocal để hỗ trợ Virtual Threads con.
 */
public final class TenantContext {

    // Dùng InheritableThreadLocal cho Virtual Threads (Java 21)
    private static final ThreadLocal<UUID> TENANT_ID = new InheritableThreadLocal<>();
    private static final ThreadLocal<UUID> BRANCH_ID = new InheritableThreadLocal<>();
    private static final ThreadLocal<UUID> STAFF_ID  = new InheritableThreadLocal<>();
    private static final ThreadLocal<String> ROLE     = new InheritableThreadLocal<>();

    public static UUID getCurrentTenantId() {
        UUID id = TENANT_ID.get();
        if (id == null) throw new TenantContextMissingException(
            "TenantContext chưa được khởi tạo — kiểm tra JwtAuthFilter");
        return id;
    }

    public static UUID getCurrentBranchId() { return BRANCH_ID.get(); }
    public static UUID getCurrentStaffId()  { return STAFF_ID.get(); }
    public static String getCurrentRole()   { return ROLE.get(); }

    public static void set(UUID tenantId, UUID branchId, UUID staffId, String role) {
        TENANT_ID.set(tenantId);
        BRANCH_ID.set(branchId);
        STAFF_ID.set(staffId);
        ROLE.set(role);
    }

    /** Phải gọi sau mỗi request để tránh memory leak */
    public static void clear() {
        TENANT_ID.remove(); BRANCH_ID.remove();
        STAFF_ID.remove();  ROLE.remove();
    }
}
```

### 3.2 JwtAuthFilter — Cách đúng populate context
```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        try {
            String token = extractBearerToken(request);
            if (token != null) {
                JwtClaims claims = jwtService.validateAndExtract(token);

                // ✅ Populate TenantContext từ JWT claims
                TenantContext.set(
                    claims.tenantId(),
                    claims.branchId(),
                    claims.staffId(),
                    claims.role()
                );

                // ✅ Set SecurityContext cho Spring Security
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        claims.staffId(), null,
                        mapRoleToAuthorities(claims.role(), claims.permissions()));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            chain.doFilter(request, response);
        } finally {
            // ✅ BẮT BUỘC: Xóa context sau mỗi request
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
```

---

## 🔍 4. QUERY PATTERN — LỌC DỮ LIỆU AN TOÀN

### 4.1 Pattern 1: Repository Method với tenantId (Đơn giản)
```java
// ✅ ĐÚNG: tenantId bắt buộc trong tất cả finders
public interface OrderRepository extends JpaRepository<OrderJpaEntity, UUID> {

    /** Lấy đơn hàng của 1 chi nhánh trong tenant — dùng cho CASHIER */
    Page<OrderJpaEntity> findByTenantIdAndBranchIdAndStatus(
        UUID tenantId, UUID branchId, OrderStatus status, Pageable pageable);

    /** Lấy đơn hàng toàn chuỗi — dùng cho OWNER */
    Page<OrderJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    // ❌ SAI: Không có tenantId — RỦI RO RÒ RỈ DỮ LIỆU
    // Page<OrderJpaEntity> findByBranchId(UUID branchId, Pageable pageable);
}
```

### 4.2 Pattern 2: Specification (Query phức tạp, nhiều filter)
```java
/**
 * Các Specification dùng để build dynamic query cho Order.
 * Tất cả đều BẮT BUỘC kết hợp với tenantSpec() trước.
 */
public class OrderSpecifications {

    /**
     * BẮT BUỘC: Filter theo tenant hiện tại.
     * Spec này phải có mặt trong MỌI query.
     */
    public static Specification<OrderJpaEntity> belongsToCurrentTenant() {
        return (root, query, cb) ->
            cb.equal(root.get("tenantId"), TenantContext.getCurrentTenantId());
    }

    /**
     * Filter theo chi nhánh.
     * CASHIER/BARISTA/WAITER bắt buộc dùng spec này.
     * OWNER không cần (nhưng có thể chọn).
     */
    public static Specification<OrderJpaEntity> belongsToBranch(UUID branchId) {
        return branchId == null ? Specification.where(null) :
            (root, query, cb) -> cb.equal(root.get("branchId"), branchId);
    }

    public static Specification<OrderJpaEntity> hasStatus(OrderStatus status) {
        return status == null ? Specification.where(null) :
            (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<OrderJpaEntity> createdBetween(Instant from, Instant to) {
        return (root, query, cb) ->
            cb.between(root.get("createdAt"), from, to);
    }
}
```

```java
// ✅ ĐÚNG: Cách dùng trong QueryHandler
@Component
@RequiredArgsConstructor
public class GetOrderListQueryHandler {

    private final OrderJpaRepository orderJpaRepository;

    public Page<OrderSummaryResult> handle(GetOrderListQuery query) {

        // ✅ LUÔN bắt đầu với belongsToCurrentTenant()
        Specification<OrderJpaEntity> spec = Specification
            .where(OrderSpecifications.belongsToCurrentTenant())
            .and(OrderSpecifications.hasStatus(query.status()))
            .and(OrderSpecifications.createdBetween(query.from(), query.to()));

        // ✅ Tự động thêm branchId filter nếu không phải Owner
        if (!TenantContext.isOwner()) {
            UUID branchId = TenantContext.getCurrentBranchId();
            spec = spec.and(OrderSpecifications.belongsToBranch(branchId));
        }

        return orderJpaRepository.findAll(spec, query.pageable())
            .map(OrderSummaryResult::from);
    }
}
```

### 4.3 Pattern 3: Kiểm tra quyền sở hữu resource (IDOR Prevention)
```java
/**
 * Kiểm tra một resource có thuộc tenant/branch hiện tại không.
 * Dùng trước khi trả dữ liệu hoặc cho phép chỉnh sửa.
 *
 * @throws OrderNotFoundException nếu không tìm thấy HOẶC không thuộc tenant
 */
private Order assertOrderAccessible(UUID orderId) {
    // ✅ Query kết hợp ID + tenantId — kẻ tấn công không thể đoán được tenant
    return orderRepository
        .findByIdAndTenantId(orderId, TenantContext.getCurrentTenantId())
        .orElseThrow(() -> new OrderNotFoundException(orderId));
    // Trả về NOT FOUND (không phải FORBIDDEN) để tránh lộ ID hợp lệ
}
```

---

## 🎭 5. PHÂN QUYỀN THEO ROLE — @PreAuthorize

### 5.1 Custom Permission Evaluator
```java
// ✅ Dùng permission string thay vì hardcode role
@PreAuthorize("hasPermission(null, 'order:create')")
public ResponseEntity<?> createOrder(...) {}

@PreAuthorize("hasPermission(null, 'report:read')")
public ResponseEntity<?> getRevenue(...) {}

// Với Owner: xem tất cả; Cashier: chỉ xem branch mình
@PreAuthorize("hasPermission(#branchId, 'branch:read')")
public ResponseEntity<?> getBranchData(@PathVariable UUID branchId) {}
```

### 5.2 Custom annotation cho tiện dùng
```java
// ✅ Tạo annotation tùy chỉnh cho nghiệp vụ F&B
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('OWNER') or hasRole('ADMIN') or hasRole('BRANCH_MANAGER')")
public @interface RequireManagementRole {}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('CASHIER')")
public @interface RequireCashierRole {}

// Dùng:
@RequireManagementRole
public ResponseEntity<?> updateStaff(...) {}
```

---

## 📊 6. VÍ DỤ ĐỦ BỘ — API Danh sách Hóa Đơn

```java
// ✅ QueryHandler lọc hóa đơn theo role — đủ các lớp bảo vệ
@Component
@RequiredArgsConstructor
public class GetInvoiceListQueryHandler {

    private final InvoiceJpaRepository invoiceJpaRepository;

    /**
     * Lấy danh sách hóa đơn theo quyền hạn của người dùng hiện tại.
     * - OWNER: Xem toàn bộ tenant
     * - Các role khác: Chỉ xem chi nhánh đang làm việc
     * - Giới hạn tìm kiếm tối đa 90 ngày
     */
    public Page<InvoiceSummaryResult> handle(GetInvoiceListQuery query) {

        // 1. Validate khoảng thời gian không quá 90 ngày
        if (ChronoUnit.DAYS.between(query.from(), query.to()) > 90) {
            throw new InvalidQueryRangeException(
                "Khoảng thời gian tìm kiếm không được vượt quá 90 ngày");
        }

        // 2. Bắt đầu với tenant filter bắt buộc
        Specification<InvoiceJpaEntity> spec = Specification
            .where(InvoiceSpecifications.belongsToCurrentTenant())
            .and(InvoiceSpecifications.issuedBetween(query.from(), query.to()));

        // 3. Tự động giới hạn branchId nếu không phải Owner
        String currentRole = TenantContext.getCurrentRole();
        if (!Set.of("OWNER", "SUPER_ADMIN").contains(currentRole)) {
            UUID branchId = Objects.requireNonNull(
                TenantContext.getCurrentBranchId(),
                "branchId bắt buộc cho role: " + currentRole);
            spec = spec.and(InvoiceSpecifications.belongsToBranch(branchId));
        }

        // 4. Các filter tùy chọn từ request
        if (query.paymentMethod() != null) {
            spec = spec.and(InvoiceSpecifications.withPaymentMethod(query.paymentMethod()));
        }

        return invoiceJpaRepository.findAll(spec, query.pageable())
            .map(InvoiceSummaryResult::from);
    }
}
```

---

## ⚠️ 7. CHECKLIST SECURITY TRƯỚC KHI SUBMIT CODE

Trước khi commit code có query dữ liệu, tự hỏi:

```
☐ Query có filter theo tenantId không?
☐ Query có filter theo branchId dựa trên role không?
☐ GET by ID có kết hợp tenantId để chống IDOR không?
☐ Response DTO có lộ dữ liệu nhạy cảm không? (password_hash, tenant info)
☐ Có log thông tin nhạy cảm không?
☐ ThreadLocal có được clear sau request không?
☐ Owner mới được xem cross-branch, code có kiểm tra đúng không?
```
