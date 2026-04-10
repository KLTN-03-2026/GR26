# 🔐 SmartF&B — Security Checklist & Anti-Pattern Catalogue
> Tài liệu này liệt kê các lỗi bảo mật phổ biến trong hệ thống multi-tenant F&B.
> AI phải tự review code theo checklist này TRƯỚC khi trả lời code cho developer.

---

## 🚨 ANTI-PATTERN #1 — IDOR (Insecure Direct Object Reference)
**Mức độ:** 🔴 CRITICAL — Nhân viên chi nhánh A xem được hóa đơn chi nhánh B

```java
// ❌ SAI: Chỉ query theo ID — kẻ tấn công đoán UUID là xem được
@GetMapping("/invoices/{id}")
public Invoice getInvoice(@PathVariable UUID id) {
    return invoiceRepo.findById(id)
        .orElseThrow(() -> new NotFoundException());
}

// ✅ ĐÚNG: Kết hợp ID + tenantId từ JWT
@GetMapping("/invoices/{id}")
public Invoice getInvoice(@PathVariable UUID id) {
    return invoiceRepo
        .findByIdAndTenantId(id, TenantContext.getCurrentTenantId())
        .orElseThrow(() -> new InvoiceNotFoundException(id));
    // Trả NOT_FOUND (không phải FORBIDDEN) để không lộ sự tồn tại
}
```

---

## 🚨 ANTI-PATTERN #2 — ThreadLocal Leak
**Mức độ:** 🔴 CRITICAL — Dữ liệu tenant A bị đọc sang request của tenant B

```java
// ❌ SAI: Không clear ThreadLocal trong filter
@Override
protected void doFilterInternal(...) {
    TenantContext.set(...);
    chain.doFilter(request, response);
    // QUÊN CLEAR → thread pool tái sử dụng thread → leak context!
}

// ✅ ĐÚNG: Luôn clear trong finally
@Override
protected void doFilterInternal(...) {
    try {
        TenantContext.set(...);
        chain.doFilter(request, response);
    } finally {
        TenantContext.clear();         // BẮT BUỘC
        SecurityContextHolder.clearContext();
    }
}
```

---

## 🚨 ANTI-PATTERN #3 — Cross-Branch Data Leak
**Mức độ:** 🔴 CRITICAL — Thu ngân quán A xem đơn hàng quán B trong cùng chuỗi

```java
// ❌ SAI: Chỉ filter tenant, không filter branch
public Page<Order> getOrders(UUID tenantId, Pageable p) {
    return orderRepo.findByTenantId(tenantId, p); // Cashier xem cả chuỗi!
}

// ✅ ĐÚNG: Filter thêm branchId theo role
public Page<Order> getOrders(GetOrderListQuery q) {
    Specification<Order> spec = Specification
        .where(forCurrentTenant());

    // Chỉ Owner mới không cần filter branchId
    if (!isOwnerRole()) {
        spec = spec.and(forBranch(TenantContext.getCurrentBranchId()));
    }
    return orderRepo.findAll(spec, q.pageable());
}
```

---

## 🚨 ANTI-PATTERN #4 — Mass Assignment
**Mức độ:** 🟡 HIGH — Client tự đặt tenantId hoặc branchId trong request body

```java
// ❌ SAI: Nhận tenantId từ request body — client tự set tenant khác
public record CreateOrderRequest(
    UUID tenantId,   // ← NGUY HIỂM: Client tự đặt
    UUID branchId,   // ← NGUY HIỂM: Client tự đặt
    UUID tableId,
    List<OrderItemRequest> items
) {}

// ✅ ĐÚNG: tenantId và branchId lấy từ JWT, client không được gửi
public record CreateOrderRequest(
    UUID tableId,
    List<OrderItemRequest> items,
    String notes
) {}

// Trong CommandHandler:
PlaceOrderCommand command = new PlaceOrderCommand(
    TenantContext.getCurrentTenantId(),  // ← Lấy từ JWT
    TenantContext.getCurrentBranchId(),  // ← Lấy từ JWT
    request.tableId(),
    request.items()
);
```

---

## 🚨 ANTI-PATTERN #5 — Sensitive Data Exposure trong Response
**Mức độ:** 🟡 HIGH — API trả về password_hash, token, dữ liệu tenant khác

```java
// ❌ SAI: Trả thẳng Entity — lộ hết field nhạy cảm
@GetMapping("/staff/{id}")
public Staff getStaff(@PathVariable UUID id) {
    return staffRepo.findById(id).get(); // Lộ: pos_pin, password_hash!
}

// ✅ ĐÚNG: Map sang DTO, chỉ expose field cần thiết
@GetMapping("/staff/{id}")
public StaffDetailResponse getStaff(@PathVariable UUID id) {
    Staff staff = staffRepo
        .findByIdAndTenantId(id, TenantContext.getCurrentTenantId())
        .orElseThrow(() -> new StaffNotFoundException(id));
    return StaffDetailResponse.from(staff); // DTO không có pos_pin
}

// DTO an toàn:
public record StaffDetailResponse(
    UUID id, String fullName, String phone,
    String positionName, String status
    // KHÔNG có: posPin, passwordHash, tenantId nội bộ
) {}
```

---

## 🚨 ANTI-PATTERN #6 — Broken Object Level Authorization
**Mức độ:** 🔴 CRITICAL — Nhân viên hủy đơn của chi nhánh khác

```java
// ❌ SAI: Update không kiểm tra quyền sở hữu
@PutMapping("/orders/{id}/cancel")
public void cancelOrder(@PathVariable UUID id) {
    Order order = orderRepo.findById(id).get(); // Lấy bất kỳ đơn nào!
    order.cancel();
}

// ✅ ĐÚNG: Kiểm tra ownership + branchId trước khi update
@PutMapping("/orders/{id}/cancel")
@PreAuthorize("hasPermission(null, 'order:cancel')")
public void cancelOrder(@PathVariable UUID id, @Valid @RequestBody CancelOrderRequest req) {
    cancelOrderCommandHandler.handle(
        new CancelOrderCommand(
            id,
            TenantContext.getCurrentTenantId(),  // Từ JWT
            TenantContext.getCurrentBranchId(),  // Từ JWT
            TenantContext.getCurrentStaffId(),
            req.reason()
        )
    );
}

// Trong CommandHandler:
Order order = orderRepo
    .findByIdAndTenantIdAndBranchId(
        cmd.orderId(), cmd.tenantId(), cmd.branchId())
    .orElseThrow(() -> new OrderNotFoundException(cmd.orderId()));
// Nếu order không thuộc branch → NOT FOUND (không lộ thông tin)
```

---

## 🚨 ANTI-PATTERN #7 — Missing Rate Limiting trên Auth Endpoints
**Mức độ:** 🟡 HIGH — Brute force tấn công endpoint đăng nhập

```java
// ❌ SAI: Không có rate limiting
@PostMapping("/auth/login")
public TokenResponse login(@RequestBody LoginRequest req) { ... }

// ✅ ĐÚNG: Rate limiting + Account lockout
@PostMapping("/auth/login")
@RateLimit(maxRequests = 5, windowSeconds = 60, keyExtractor = "ip")
public TokenResponse login(@RequestBody LoginRequest req) {
    // Trong service: tăng failed_login_count, khóa sau X lần sai
}

// Business Rule: 5 lần sai → khóa 15 phút (cấu hình trong application.yml)
```

---

## 🚨 ANTI-PATTERN #8 — OTP Bypass & Replay
**Mức độ:** 🟡 HIGH — Tấn công reuse OTP đã dùng

```java
// ❌ SAI: Không đánh dấu OTP đã dùng
public boolean verifyOtp(String email, String otp) {
    OtpRecord record = otpRepo.findByEmailAndOtp(email, otp).get();
    return record.getExpiresAt().isAfter(Instant.now());
    // OTP dùng được nhiều lần!
}

// ✅ ĐÚNG: Kiểm tra is_used + expires_at + đánh dấu đã dùng atomically
@Transactional
public void verifyAndConsumeOtp(String email, String otpCode) {
    OtpRecord record = otpRepo
        .findByEmailAndIsUsedFalse(email)
        .orElseThrow(() -> new InvalidOtpException("Mã OTP không hợp lệ"));

    if (record.getExpiresAt().isBefore(Instant.now())) {
        throw new OtpExpiredException("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới");
    }

    if (!passwordEncoder.matches(otpCode, record.getOtpHash())) {
        throw new InvalidOtpException("Mã OTP không đúng");
    }

    // ✅ Đánh dấu đã dùng ngay lập tức (atomic update)
    record.markAsUsed();
    otpRepo.save(record);
}
```

---

## 🚨 ANTI-PATTERN #9 — Logging nhạy cảm
**Mức độ:** 🟡 HIGH — Log file chứa password, token, số thẻ

```java
// ❌ SAI
log.info("Người dùng đăng nhập: email={}, password={}", email, password);
log.debug("JWT token: {}", token);
log.info("QR payment amount={}, transactionId={}", amount, txId);

// ✅ ĐÚNG
log.info("Người dùng đăng nhập thành công: email={}", email);
log.debug("Đã cấp JWT cho user: {}", userId); // Không log token
log.info("Thanh toán thành công: orderId={}, method={}", orderId, method);
// Không log transactionId đầy đủ nếu không cần
```

---

## 🚨 ANTI-PATTERN #10 — Feature Flag Bypass
**Mức độ:** 🟠 MEDIUM — Tenant dùng Basic plan truy cập tính năng Premium

```java
// ❌ SAI: Không kiểm tra feature flag
@PostMapping("/inventory/import")
public void importStock(...) {
    inventoryService.import(...); // Basic plan không được dùng tính năng này
}

// ✅ ĐÚNG: Check feature flag trước
@PostMapping("/inventory/import")
@CheckFeature("INVENTORY")  // Custom annotation
public void importStock(...) {
    inventoryService.import(...);
}

// Hoặc trong CommandHandler:
@Component
public class ImportStockCommandHandler {
    public void handle(ImportStockCommand cmd) {
        featureFlagService.assertEnabled("INVENTORY", cmd.tenantId());
        // ...
    }
}
```

---

## ✅ CHECKLIST BẮT BUỘC TRƯỚC KHI HOÀN THÀNH MỖI API

```
IDOR Prevention:
☐ GET by ID có kết hợp tenantId không?
☐ UPDATE/DELETE có verify ownership không?
☐ Response có trả NOT_FOUND thay vì FORBIDDEN không?

Multi-Tenant:
☐ Mọi query đều có WHERE tenant_id?
☐ Non-owner query đều có WHERE branch_id?
☐ tenantId lấy từ JWT, không từ request body?

Data Exposure:
☐ Response DTO không có password_hash, pos_pin, token?
☐ Không log dữ liệu nhạy cảm?
☐ Error message không lộ thông tin nội bộ?

Auth:
☐ Endpoint có @PreAuthorize phù hợp?
☐ Rate limiting cho auth endpoints?
☐ OTP được đánh dấu is_used sau khi dùng?

Business:
☐ Feature flag được kiểm tra?
☐ ThreadLocal được clear trong finally?
```
