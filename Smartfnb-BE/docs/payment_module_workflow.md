# 📊 Payment Module (S-11 & S-12) — Workflows & Logic Flow

## 📋 Tổng Quan Mô-đun

Payment module xử lý 2 loại thanh toán chính:

- **S-11: Cash & Invoice** — Thanh toán tiền mặt + tự động tạo hóa đơn
- **S-12: QR & Search Invoice** — Thanh toán QR code (VietQR/MoMo) + tìm kiếm hóa đơn

---

## 🏗️ Kiến Trúc Lớp

```
┌─────────────────────────────────────────┐
│  Web Layer (REST Controller)            │
│  PaymentController                      │
├─────────────────────────────────────────┤
│  Application Layer (Use Cases)          │
│  - ProcessCashPaymentCommandHandler     │
│  - ProcessQRPaymentCommandHandler       │
│  - ConfirmQRPaymentCommandHandler       │
│  - SearchInvoiceQueryHandler            │
├─────────────────────────────────────────┤
│  Domain Layer (Business Logic)          │
│  - Payment, Invoice, InvoiceItem        │
│  - PaymentMethod, PaymentStatus         │
│  - Events: InvoiceCreatedEvent, ...     │
├─────────────────────────────────────────┤
│  Infrastructure Layer                   │
│  - PaymentRepository, InvoiceRepository │
│  - JPA Entities & Adapters              │
│  - Event Listeners                      │
│  - Redis (Invoice Number Generator)     │
└─────────────────────────────────────────┘
```

---

## 🔄 S-11: Luồng Thanh Toán Tiền Mặt (Cash Payment)

### 📊 Sequence Diagram

```
Cashier              Controller           Handler              Domain              Repository        Event Bus
  |                    |                    |                    |                    |                  |
  |--POST /cash------->|                    |                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |---ProcessCash----->|                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Payment.         |                    |                  |
  |                    |                    |  createCash()----->|                    |                  |
  |                    |                    |                    |--Payment Object    |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---genInvoiceNum--->|                    |                  |
  |                    |                    |   (Redis)----------|--INV-BRANCH-      |                  |
  |                    |                    |<--Return-----------|  DATE-COUNTER     |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Invoice.create-->|                    |                  |
  |                    |                    |   (với items)      |                    |                  |
  |                    |                    |                    |--Invoice Object   |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---save()-----------|----save to DB----->|                  |
  |                    |                    |                    |                    |--OK              |
  |                    |                    |<--Entities Saved---|<--Return-----------|                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Publish---------|----publish Invoice|                  |
  |                    |                    |   InvoiceCreatedEvent (async)          |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |                    |                    |      Update Table
  |                    |                    |                    |                    |      status=CLEANING
  |                    |                    |                    |                    |          (async)
  |                    |                    |                    |                    |                  |
  |<--PaymentResponse--|<--Return-----------|                    |                    |                  |
  |                    |                    |                    |                    |                  |
```

### 🎯 Chi Tiết Luồng

#### **Bước 1: Thu ngân gửi yêu cầu thanh toán**

```http
POST /api/v1/payments/cash
Content-Type: application/json

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 250000.00
}
```

#### **Bước 2: Controller xử lý request**

```java
PaymentController.processCashPayment(request)
  ├─ Lấy staffId từ TenantContext
  ├─ Tạo ProcessCashPaymentCommand
  └─ Gọi cashPaymentHandler.handle()
```

#### **Bước 3: Command Handler xử lý logic**

```
ProcessCashPaymentCommandHandler.handle(command)
  ├─ Fetch Order từ Order module (verify order tồn tại)
  ├─ Tạo Payment aggregate
  │  └─ Payment.createCash(
  │       orderId, amount, staffId
  │     )
  ├─ Tạo InvoiceNumberGenerator (Redis-based)
  │  ├─ Số hóa đơn format: INV-{BRANCH}-{YYYYMMDD}-{COUNTER}
  │  ├─ COUNTER tăng lên từ Redis (atomic increment)
  │  ├─ Reset về 0 vào nửa đêm hôm sau
  │  └─ Ví dụ: INV-BRA-20260401-000001
  ├─ Lấy OrderItems từ Order
  ├─ Tạo Invoice aggregate
  │  └─ Invoice.create(
  │       invoiceNumber, paymentId,
  │       orderId, items, ...
  │     )
  ├─ Save Payment & Invoice tới repository
  │  └─ JPA persist entities
  ├─ Publish InvoiceCreatedEvent
  │  └─ Event chứa: invoiceId, invoiceNumber,
  │      orderId, tableId, branchId...
  └─ Return Payment object
```

#### **Bước 4: Event Publishing (Async)**

```
InvoiceCreatedEventListener nhận event
  └─ Cập nhật Table.status = CLEANING
     (Đánh dấu bàn đã xong phục vụ)
```

#### **Bước 5: Controller trả response**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "paymentId": "660e8400-e29b-41d4-a716-446655440001",
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 250000.0,
    "method": "CASH",
    "status": "COMPLETED",
    "transactionId": null,
    "paidAt": "2026-04-01T14:30:00.000Z",
    "createdAt": "2026-04-01T14:30:00.000Z"
  }
}
```

### 🔑 Các Domain Models Chính

#### **Payment Aggregate**

```java
public class Payment {
  UUID id;                    // Unique payment ID
  UUID tenantId;              // Tenant isolation
  UUID branchId;              // Branch identifier
  UUID orderId;               // Liên kết tới Order
  BigDecimal amount;          // Số tiền thanh toán
  PaymentMethod method;       // CASH, VIETQR, MOMO
  PaymentStatus status;       // PENDING, COMPLETED, FAILED, CANCELLED
  String transactionId;       // ID from payment gateway (for QR)
  LocalDateTime paidAt;       // Thời điểm thanh toán
  LocalDateTime qrExpiresAt;  // Hết hạn QR (for QR payments)
  UUID processedBy;           // Staff ID who processed

  // Factory methods
  static Payment createCash(...) { ... }
  static Payment createQR(...) { ... }
}

enum PaymentMethod { CASH, VIETQR, MOMO }
enum PaymentStatus { PENDING, COMPLETED, FAILED, CANCELLED }
```

#### **Invoice Aggregate**

```java
public class Invoice {
  UUID id;                    // Unique invoice ID
  UUID tenantId;              // Tenant isolation
  UUID branchId;              // Branch identifier
  UUID orderId;               // Liên kết tới Order
  UUID paymentId;             // Liên kết tới Payment
  String invoiceNumber;       // INV-BRA-20260401-000001 (UNIQUE, IMMUTABLE)
  List<InvoiceItem> items;    // Line items
  BigDecimal subtotal;        // Tổng tiền hàng trước giảm giá
  BigDecimal discount;        // Số tiền giảm giá
  BigDecimal taxAmount;       // Thuế (nếu có)
  BigDecimal total;           // Tổng cộng
  LocalDateTime issuedAt;     // Thời điểm phát hành
  LocalDateTime createdAt;
  Version version;            // Optimistic locking

  // Immutable: không thể sửa sau khi tạo
  // Chỉ có thể refund (tạo new invoice)
}

public class InvoiceItem {
  UUID id;
  UUID invoiceId;
  String itemName;            // Tên món ăn
  Integer quantity;           // Số lượng
  BigDecimal unitPrice;       // Giá từng cái
  BigDecimal totalPrice;      // quantity * unitPrice (before discount)
}
```

### 📝 Invoice Number Generation Logic

**Format:** `INV-{BRANCH}-{YYYYMMDD}-{COUNTER}`

**Ví dụ:** `INV-BRA-20260401-000001`

**Triển khai:**

```java
public class InvoiceNumberGeneratorImpl {

  private final RedisTemplate<String, String> redis;

  public String generateInvoiceNumber(String branchCode) {
    String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    String key = "invoice:counter:" + branchCode + ":" + today;

    // Atomic increment in Redis
    Long counter = redis.opsForValue().increment(key);

    // Set expiry: tối đa 24 giờ (reset nửa đêm)
    redis.expire(key, Duration.ofDays(1));

    String paddedCounter = String.format("%06d", counter);
    return "INV-" + branchCode + "-" + today + "-" + paddedCounter;
  }
}
```

**Ưu điểm:**

- ✅ Unique across branch & day
- ✅ Auto-increment, không trùng lặp
- ✅ Redis atomic, không race condition
- ✅ Reset tự động vs thời gian
- ✅ Performant (Redis in-memory)

---

## 🎵 S-12: Luồng Thanh Toán QR Code (QR Payment)

### 📊 Sequence Diagram - Part 1: Tạo QR Code

```
Cashier              Controller           Handler              Domain              QRProvider         Redis
  |                    |                    |                    |                    |                  |
  |--POST /qr-------->|                    |                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |---ProcessQR------->|                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Payment.         |                    |                  |
  |                    |                    |  createQR()------->|                    |                  |
  |                    |                    |   (timing: now+180s)|                   |                  |
  |                    |                    |                    |--Payment Object   |                  |
  |                    |                    |<--Return-----------|  (PENDING, QR expires)               |
  |                    |                    |                    |                    |                  |
  |                    |                    |---generateQR()-----|----Call VietQR/MoMo API             |
  |                    |                    |                    |                    |--QR URL+Data    |
  |                    |                    |                    |                    |<--Return--------|
  |                    |                    |                    |<--QR Info---------|                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Store in Redis---|--paymentId: Payment|                 |
  |                    |                    |   (for webhook)    |   Object (TTL 3min)|                 |
  |                    |                    |                    |   status: PENDING  |                 |
  |                    |                    |                    |                    |<--SETEX--------|
  |                    |                    |                    |                    |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |<--QRResponse-------<--Return-----------|                    |                    |                  |
  |                    |                    |                    |                    |                  |
```

### 📊 Sequence Diagram - Part 2: Webhook Confirmation

```
PaymentGateway       Webhook              Handler              Domain              Repository        EventBus
  |                    |                    |                    |                    |                  |
  |--POST /webhook---->|                    |                    |                    |                  |
  | (QR confirmed)     |                    |                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |---ConfirmQR------->|                    |                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Verify---------->|                    |                  |
  |                    |                    |   -paymentId exist?|                    |                  |
  |                    |                    |   -not expired?    |                    |                  |
  |                    |                    |   -amount match?   |                    |                  |
  |                    |                    |                    |--Validation OK    |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Payment.         |                    |                  |
  |                    |                    |  confirmQR()------>|                    |                  |
  |                    |                    |                    |--Update status    |                  |
  |                    |                    |                    |  to COMPLETED     |                  |
  |                    |                    |                    |--Set paidAt time  |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Create Invoice-->|                    |                  |
  |                    |                    |   (like cash flow)  |                    |                  |
  |                    |                    |                    |--Invoice Object   |                  |
  |                    |                    |<--Return-----------|                    |                  |
  |                    |                    |                    |                    |                  |
  |                    |                    |---Save------------|--save to DB------->|                  |
  |                    |                    |                    |                    |--OK              |
  |                    |                    |---Publish---------|----publish---------->InvoiceCreatedEvent
  |                    |                    |   InvoiceCreated  |       (async)       |                  |
  |                    |                    |   PaymentCompleted|                    |    →Update Table|
  |                    |                    |                    |                    |      status     |
  |                    |                    |                    |                    |                  |
  |                    |<--200 OK-----------|                    |                    |                  |
  |<--ACK--------------|                    |                    |                    |                  |
  |                    |                    |                    |                    |                  |
```

### 🎯 Chi Tiết Luồng 1: Tạo QR Code (POST /api/v1/payments/qr)

#### **Bước 1: Thu ngân yêu cầu tạo QR**

```http
POST /api/v1/payments/qr
Content-Type: application/json

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 250000.00,
  "qrMethod": "VIETQR"  // hoặc "MOMO"
}
```

#### **Bước 2: Controller nhận request**

```java
PaymentController.processQRPayment(request)
  ├─ Lấy staffId
  ├─ Tạo ProcessQRPaymentCommand
  └─ Gọi qrPaymentHandler.handle()
```

#### **Bước 3: Command Handler tạo QR**

```
ProcessQRPaymentCommandHandler.handle(command)
  ├─ Fetch Order từ Order module
  ├─ Tạo Payment với QR timeout
  │  └─ Payment.createQR(
  │       orderId, amount, method,
  │       qrExpiresAt = now + 180 seconds  ← 3 phút
  │     )
  ├─ Gọi QRCodeProvider API
  │  ├─ If VIETQR:
  │  │  └─ Call VietQR API
  │  │     ├─ purpose: "Payment"
  │  │     ├─ amount: 250000
  │  │     ├─ accountNo: branch's bank account
  │  │     └─ Return: qrCodeUrl, qrCodeData
  │  │
  │  └─ If MOMO:
  │     └─ Call MoMo API
  │        ├─ orderId: transaction ID
  │        ├─ Amount, description
  │        └─ Return: qrCodeUrl
  │
  ├─ Store Payment to Redis (TTL = 3 minutes)
  │  └─ key = paymentId
  │     value = {
  │       paymentId, orderId, amount,
  │       status, expiresAt, ...
  │     }
  │  └─ SETEX key 180 value
  │
  ├─ Save Payment to repository (database)
  │  └─ Status = PENDING
  │
  └─ Return QR Information
     ├─ qrCodeUrl (for display)
     ├─ qrCodeData (raw QR data)
     ├─ expiresInSeconds: 180
     └─ orderNumber (for reference)
```

#### **Bước 4: Controller trả QR Code URL cho cashier**

```json
{
  "code": 201,
  "message": "Created",
  "data": {
    "paymentId": "770e8400-e29b-41d4-a716-446655440002",
    "qrCodeUrl": "https://api.vietqr.io/qr/image/00010000040...",
    "qrCodeData": "00010000040...",
    "expiresInSeconds": 180,
    "orderNumber": "ORD-20260401-ABC001"
  }
}
```

#### **Bước 5: Cashier hiển thị QR code trên màn hình**

- Customer scan QR code bằng điện thoại
- Chuyển khoản qua VietQR/MoMo
- Payment gateway xác nhận thanh toán

---

### 🎯 Chi Tiết Luồng 2: Webhook Confirmation (POST /api/v1/payments/qr/webhook)

#### **Bước 1: Payment Gateway gửi confirmation**

```http
POST /api/v1/payments/qr/webhook
Content-Type: application/json

{
  "paymentId": "770e8400-e29b-41d4-a716-446655440002",
  "transactionId": "VQ-2026040101001",
  "status": "SUCCESS",
  "amount": 250000.00,
  "paidAtTimestamp": 1743292200000
}
```

#### **Bước 2: Webhook Handler verify**

```
ConfirmQRPaymentCommandHandler.handle(command)
  ├─ Lookup Payment from Redis بواسطة paymentId
  ├─ Validations:
  │  ├─ ✓ Payment tồn tại
  │  ├─ ✓ Chưa hết hạn (now < qrExpiresAt)
  │  ├─ ✓ Amount khớp
  │  ├─ ✓ Status hiện tại là PENDING
  │  └─ ✓ Tenant match
  │
  ├─ Nếu lỗi:
  │  └─ Raise exception, không cập nhật
  │
  └─ Nếu OK:
     ├─ Update Payment status → COMPLETED
     ├─ Set Payment.paidAt = webhook timestamp
     ├─ Set Payment.transactionId = VQ-2026040101001
     │
     ├─ Tạo Invoice (y hệt cash flow)
     │  ├─ Generate invoice_number
     │  ├─ Fetch OrderItems
     │  └─ Create Invoice + InvoiceItems
     │
     ├─ Save Payment & Invoice to DB
     │
     ├─ Publish Events:
     │  ├─ PaymentCompletedEvent
     │  └─ InvoiceCreatedEvent
     │
     └─ Clean up Redis (optional)
        └─ DEL paymentId
```

#### **Bước 3: Event Listeners (Async)**

```
InvoiceCreatedEventListener
  └─ Update Table.status = CLEANING
     (Bàn đã thanh toán, sẵn sàng phục vụ khách khác)

PaymentCompletedEventListener (nếu cần)
  └─ Update Order.status = COMPLETED
     └─ Log to analytics system
```

---

## 🔍 S-12: Luồng Search Invoice (GET /api/v1/payments/invoices/search)

### 📊 Sequence Diagram

```
Client               Controller           Handler              Repository          Database
  |                    |                    |                    |                    |
  |--GET /search------>|                    |                    |                    |
  | ?invoiceNumber=    |                    |                    |                    |
  | INV-BRA-...&       |                    |                    |                    |
  | page=0&size=20     |                    |                    |                    |
  |                    |                    |                    |                    |
  |                    |---SearchInvoice--->|                    |                    |
  |                    |Query(branchId,     |                    |                    |
  |                    | invoiceNumber)     |                    |                    |
  |                    |                    |                    |                    |
  |                    |                    |---Build Spec------>|                    |
  |                    |                    |  branchId = ?      |                    |
  |                    |                    |  tenantId = ?      |                    |
  |                    |                    |  issuedAt >= 90days|                    |
  |                    |                    |  invoiceNumber like|                    |
  |                    |                    |                    |                    |
  |                    |                    |---Query-----------|----SELECT * FROM   |
  |                    |                    |   findAll(spec)   |    invoice         |
  |                    |                    |                   |    WHERE tenant_id = ?
  |                    |                    |                   |    AND branch_id = ?
  |                    |                    |                   |    AND issued_at >= ?
  |                    |                    |                   |    AND invoice_number LIKE ?
  |                    |                    |                   |    LIMIT 20 OFFSET 0
  |                    |                    |                    |                    |
  |                    |                    |                    |--Return Invoices--|
  |                    |                    |<--List<Invoice>---|<--Results---------|
  |                    |                    |                    |                    |
  |                    |                    |--Build Response--->|                    |
  |                    |                    |  Map to DTO        |                    |
  |                    |                    |  Calculate Total   |                    |
  |                    |                    |<--Return-----------|                    |
  |                    |                    |                    |                    |
  |<--SearchResponse---<--Return-----------|                    |                    |
  |                    |                    |                    |                    |
```

### 🎯 Chi Tiết Luồng

#### **Bước 1: Client gửi search request**

```http
GET /api/v1/payments/invoices/search?invoiceNumber=INV-BRA&page=0&size=20&branchId=...
```

**Parameters:**

- `invoiceNumber` (optional): Partial search
- `page` (default: 0): Page number for pagination
- `size` (default: 20): Items per page
- **Tự động lấy branchId từ TenantContext**

#### **Bước 2: Controller validate & route**

```java
PaymentController.searchInvoices()
  ├─ Lấy branchId từ TenantContext
  ├─ Lấy tenantId từ TenantContext
  ├─ Validate pagination params
  │  ├─ size > 0
  │  ├─ page >= 0
  │  └─ size <= 100 (max 100 items/page)
  ├─ Tạo SearchInvoiceQuery
  └─ Gọi searchInvoiceHandler.handle()
```

#### **Bước 3: Query Handler xây dựng Specification**

```
SearchInvoiceQueryHandler.handle(query)
  ├─ Tạo InvoiceSpecifications
  │  └─ Xây dựng CriteriaBuilder query:
  │
  │     List<Predicate> predicates = [];
  │
  │     1. WHERE tenant_id = getCurrentTenantId()
  │        predicates.add(root.get("tenantId").equal(tenantId))
  │
  │     2. WHERE branch_id = query.branchId()
  │        predicates.add(root.get("branchId").equal(branchId))
  │
  │     3. WHERE issued_at >= (NOW - 90 days)
  │        predicates.add(
  │          root.get("issuedAt").greaterThanOrEqualTo(
  │            LocalDateTime.now().minusDays(90)
  │          )
  │        )
  │
  │     4. OPTIONAL: WHERE invoice_number LIKE %query%
  │        if (query.invoiceNumber() != null) {
  │          predicates.add(
  │            cb.like(root.get("invoiceNumber"),
  │              "%" + query.invoiceNumber() + "%")
  │          )
  │        }
  │
  │     5. ORDER BY issued_at DESC
  │        query.orderBy(cb.desc(root.get("issuedAt")))
  │
  ├─ Execute query with pagination
  │  └─ repository.findAll(specification, pageRequest)
  │
  ├─ Map results to SearchInvoiceResult
  │  └─ Items list
  │     Total count
  │     Page info
  │
  └─ Return SearchInvoiceResult
```

#### **Bước 4: Controller map & return response**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "invoiceNumber": "INV-BRA-20260401-000005",
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "total": 250000.00,
        "issuedAt": "2026-04-01T14:30:00.000Z"
      },
      { ... }
    ],
    "totalItems": 45,
    "pageNumber": 0,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

### 🔒 Constraints

1. **90-day limit (7776000 seconds)**

   ```java
   LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
   // Only search invoices issued after this date
   ```

2. **Tenant isolation**

   ```java
   WHERE tenant_id = getCurrentTenantId()
   ```

3. **Branch filtering**

   ```java
   WHERE branch_id = getCurrentBranchId()
   ```

4. **Role-based access**
   ```
   CASHIER: Chỉ xem hóa đơn của chi nhánh mình
   BRANCH_MANAGER: Toàn bộ chi nhánh
   OWNER: Tất cả chi nhánh
   ```

---

## 🔐 Bảo Mật

### 1. **Tenant Isolation**

```java
// Mọi query tự động thêm:
WHERE tenant_id = TenantContext.getCurrentTenantId()
AND branch_id = TenantContext.getCurrentBranchId()
```

### 2. **Role-Based Access Control (RBAC)**

```java
@PreAuthorize("hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER')")
```

**Roles hợp lệ:**

- CASHIER: Process payments, view own branch invoices
- BRANCH_MANAGER: Full payment management trong branch
- OWNER: All branches, all operations

### 3. **QR Timeout Protection**

```java
// QR code tự động expire sau 3 phút
qrExpiresAt = LocalDateTime.now().plusSeconds(180)

// Webhook validation
if (LocalDateTime.now().isAfter(payment.getQrExpiresAt())) {
  throw new QRCodeExpiredException()
}
```

### 4. **Optimistic Locking** (trên Payment)

```java
@Version
private Long version;  // Auto-managed by JPA
```

Ngăn concurrent updates gây inconsistency.

### 5. **Invoice Immutability**

```java
// Không thể edit Invoice sau khi tạo
// Chỉ có thể refund (tạo new invoice âm)
```

---

## 📁 Database Schema

### **payment table**

```sql
CREATE TABLE payment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount DECIMAL(19,2) NOT NULL,
  method VARCHAR(20) NOT NULL,        -- CASH, VIETQR, MOMO
  status VARCHAR(20) NOT NULL,        -- PENDING, COMPLETED, FAILED, CANCELLED
  transaction_id VARCHAR(100),        -- From payment gateway
  paid_at TIMESTAMP,
  qr_expires_at TIMESTAMP,            -- For QR payments
  processed_by UUID NOT NULL,         -- Staff ID
  version BIGINT,                     -- Optimistic locking
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,

  UNIQUE(tenant_id, transaction_id),  -- Prevent duplicate gateway txns
  INDEX(tenant_id, branch_id),
  INDEX(tenant_id, order_id),
  INDEX(status, created_at)
);
```

### **invoice table**

```sql
CREATE TABLE invoice (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  order_id UUID NOT NULL,
  payment_id UUID NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  subtotal DECIMAL(19,2) NOT NULL,
  discount DECIMAL(19,2),
  tax_amount DECIMAL(19,2),
  total DECIMAL(19,2) NOT NULL,
  issued_at TIMESTAMP NOT NULL,
  version BIGINT,
  created_at TIMESTAMP NOT NULL,

  UNIQUE(tenant_id, invoice_number),  -- invoice_number must be unique per tenant
  INDEX(tenant_id, branch_id),
  INDEX(tenant_id, order_id),
  INDEX(issued_at),
  FOREIGN KEY(payment_id) REFERENCES payment(id)
);
```

### **invoice_item table**

```sql
CREATE TABLE invoice_item (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(19,2) NOT NULL,
  total_price DECIMAL(19,2) NOT NULL,

  FOREIGN KEY(invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
  INDEX(invoice_id)
);
```

---

## ⏱️ QR Code Timeout Logic

### **Timeline**

```
T0: Cashier requests QR code
    → Payment.qrExpiresAt = T0 + 180 seconds

T0 to T0+180s: QR code is VALID
                Customer can scan & pay

T0+180s: QR code EXPIRES
         → webhook received after this → ERROR
         → Payment.status remains PENDING
         → Table stays OCCUPIED

T0+240s: QR stored in Redis expires (TTL)
         → Auto-cleanup
```

### **Webhook Validation**

```java
if (LocalDateTime.now().isAfter(payment.getQrExpiresAt())) {
  throw new QRCodeExpiredException(
    "QR code đã hết hạn, thời gian chờ tối đa 3 phút"
  );
}
```

---

## 🔄 Event-Driven Communication

### **Events Published**

#### **1. InvoiceCreatedEvent**

```java
public record InvoiceCreatedEvent(
  UUID invoiceId,
  String invoiceNumber,
  UUID orderId,
  UUID tableId,
  UUID branchId,
  UUID tenantId,
  BigDecimal total,
  LocalDateTime issuedAt
) { }
```

**Listeners:**

- `InvoiceCreatedEventListener` → Update `Table.status = CLEANING`

#### **2. PaymentCompletedEvent**

```java
public record PaymentCompletedEvent(
  UUID paymentId,
  UUID orderId,
  String method,
  BigDecimal amount,
  LocalDateTime completedAt
) { }
```

**Listeners:**

- Update analytics
- Log to business intelligence system

---

## 🚀 API Summary

### **POST /api/v1/payments/cash**

- Xử lý thanh toán tiền mặt
- Tự động tạo Invoice
- Response: Payment + Invoice details

### **POST /api/v1/payments/qr**

- Tạo QR code (VietQR/MoMo)
- Timeout 3 phút
- Response: QR URL + expires_in_seconds

### **POST /api/v1/payments/qr/webhook**

- Nhận confirmación từ payment gateway
- Verify QR chưa hết hạn
- Tạo Invoice nếu thanh toán thành công
- Response: 200 OK

### **GET /api/v1/payments/invoices/search**

- Search Invoice với constraints 90 ngày
- Pagination support
- Response: List of invoices + page info

### **GET /api/v1/payments/invoices/{invoiceId}**

- Lấy invoice details
- Response: Invoice + items

### **GET /api/v1/payments/invoices/number/{invoiceNumber}**

- Lấy invoice by invoice_number
- Response: Invoice + items

### **GET /api/v1/payments/{paymentId}**

- Lấy payment details
- Response: Payment info

---

## 📊 Flow Chủ Yếu

```
┌─────────────────────────────────────┐
│ 1. CASH PAYMENT FLOW                │
├─────────────────────────────────────┤
│ POST /cash                          │
│  → Create Payment (CASH)            │
│  → Generate invoice_number (Redis)  │
│  → Create Invoice + Items           │
│  → Save to DB                       │
│  → Publish InvoiceCreatedEvent      │
│  → Update Table.status = CLEANING   │
│  → Return PaymentResponse           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2. QR PAYMENT FLOW (PART 1)         │
├─────────────────────────────────────┤
│ POST /qr                            │
│  → Create Payment (QR, PENDING)     │
│  → Call VietQR/MoMo API             │
│  → Store in Redis (TTL 3min)        │
│  → Save to DB                       │
│  → Return QR URL + expires_in=180s  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3. QR PAYMENT FLOW (PART 2)         │
├─────────────────────────────────────┤
│ POST /qr/webhook                    │
│ (from payment gateway)              │
│  → Verify Payment exists            │
│  → Check QR not expired             │
│  → Check amount match               │
│  → Update Payment.status = COMPLETED│
│  → Create Invoice (same as cash)    │
│  → Publish Events                   │
│  → Update Table.status = CLEANING   │
│  → Return 200 OK                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 4. SEARCH INVOICE FLOW              │
├─────────────────────────────────────┤
│ GET /invoices/search                │
│  → Build Specification              │
│    +tenant_id filter                │
│    +branch_id filter                │
│    +90-day limit                    │
│    +optional: invoiceNumber like    │
│  → Query with pagination            │
│  → Return paginated results         │
└─────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

✅ **S-11 (Cash & Invoice)**

- Thanh toán tiền mặt là simplest flow
- Invoice tự động tạo via InvoiceCreatedEvent
- invoice_number unique + auto-increment via Redis

✅ **S-12 (QR & Search)**

- QR code timeout strictly 3 phút, validate on webhook
- Search Invoice giới hạn 90 ngày, filter by tenant+branch
- Event-driven: update Table.status async

✅ **Architecture**

- Multi-tenant isolation on every query
- RBAC enforcement via @PreAuthorize
- Immutable aggregates (Invoice cannot be edited)
- Event sourcing pattern for consistency

✅ **Performance**

- Redis for invoice number generation (atomic)
- Specification pattern for flexible search
- Pagination support for large datasets
- Optimistic locking prevent race conditions

---

## 🔧 Troubleshooting

| Issue                     | Cause                 | Solution                         |
| ------------------------- | --------------------- | -------------------------------- |
| QR code ngay hết hạn      | System time mismatch  | Verify server time sync          |
| invoice_number duplicate  | Redis key expired     | Check Redis TTL settings         |
| Search returns no results | Date > 90 days ago    | Filter by recent dates           |
| Payment stuck PENDING     | Webhook timeout       | Implement retry logic in gateway |
| Table not updating        | Event listener failed | Check event logging              |
