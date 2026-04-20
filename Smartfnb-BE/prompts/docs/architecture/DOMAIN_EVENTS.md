# 📡 SmartF&B — Domain Events Catalogue
> Danh mục các Domain Event trong hệ thống. AI phải publish/consume event đúng theo tài liệu này.
> Đây là "hợp đồng" giao tiếp giữa các module — không được thay đổi tùy tiện.

---

## 📖 NGUYÊN TẮC DOMAIN EVENTS

```
1. Event là sự kiện đã xảy ra — đặt tên theo thì QUÁ KHỨ
   ✅ OrderCreatedEvent, PaymentCompletedEvent
   ❌ CreateOrderEvent, CompletePaymentEvent

2. Event là IMMUTABLE — dùng Java Record
3. Event chứa đủ dữ liệu để consumer xử lý mà không cần query thêm (nếu có thể)
4. Event phải có timestamp để debug và audit
5. Publisher không quan tâm ai consume — loose coupling
```

---

## 📋 DANH SÁCH ĐẦY ĐỦ DOMAIN EVENTS

### 🔑 Module Auth
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `TenantRegisteredEvent` | auth | subscription | Chủ quán đăng ký → tạo subscription |
| `UserLockedEvent` | auth | notification | Tài khoản bị khóa do sai mật khẩu nhiều lần |
| `PasswordResetEvent` | auth | audit | Mật khẩu đã được reset |

```java
/**
 * Phát ra khi chủ quán đăng ký tenant mới thành công.
 * Consumer: SubscriptionModule tạo subscription mặc định.
 */
public record TenantRegisteredEvent(
    UUID tenantId,
    UUID ownerUserId,
    String planSlug,         // Gói được chọn khi đăng ký
    Instant occurredAt
) {}
```

---

### 📋 Module Order (QUAN TRỌNG NHẤT)
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `OrderCreatedEvent` | order | notification | Đơn mới được tạo → thông báo bếp |
| `OrderStatusChangedEvent` | order | websocket, notification | Trạng thái đơn thay đổi |
| `OrderCompletedEvent` | order | inventory, report | Đơn hoàn tất → trừ kho + cập nhật báo cáo |
| `OrderCancelledEvent` | order | inventory, report | Đơn bị hủy → hoàn kho nếu cần |
| `OrderItemReadyEvent` | order | websocket | Món ăn đã hoàn thành pha chế |

```java
/**
 * Phát ra khi đơn hàng hoàn tất thanh toán thành công.
 * Consumer:
 * - InventoryModule: trừ nguyên liệu theo Recipe × quantity
 * - ReportModule: cập nhật DailySummary, ProductStat
 */
public record OrderCompletedEvent(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    String orderNumber,
    List<CompletedOrderItem> items,   // Đủ dữ liệu để consumer không cần query thêm
    BigDecimal totalAmount,
    Instant occurredAt
) {
    public record CompletedOrderItem(
        UUID menuItemId,
        int quantity,
        BigDecimal unitPrice
    ) {}
}
```

```java
/**
 * Phát ra khi trạng thái đơn hàng thay đổi.
 * Consumer: WebSocket gateway broadcast tới /topic/orders/{branchId}
 */
public record OrderStatusChangedEvent(
    UUID orderId,
    UUID branchId,
    String orderNumber,
    String oldStatus,
    String newStatus,
    UUID changedByStaffId,
    Instant occurredAt
) {}
```

---

### 💳 Module Payment
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `PaymentInitiatedEvent` | payment | qr-service | Bắt đầu tạo QR thanh toán |
| `PaymentCompletedEvent` | payment | order, invoice, table | Thanh toán thành công |
| `PaymentFailedEvent` | payment | notification | Thanh toán thất bại / timeout |
| `InvoiceCreatedEvent` | payment | notification, report | Hóa đơn đã tạo |
| `RefundProcessedEvent` | payment | order, report, audit | Hoàn tiền thành công |

```java
/**
 * Phát ra ngay sau khi thanh toán xác nhận thành công.
 * Consumer:
 * - OrderModule: cập nhật order.status = COMPLETED
 * - TableModule: cập nhật table.status = CLEANING
 * - InvoiceModule: tạo Invoice tự động
 */
public record PaymentCompletedEvent(
    UUID paymentId,
    UUID orderId,
    UUID tableId,
    UUID branchId,
    UUID tenantId,
    BigDecimal amount,
    String paymentMethod,    // cash | vietqr | momo | zalopay
    String transactionId,    // transaction ID từ payment gateway
    Instant occurredAt
) {}
```

---

### 📦 Module Inventory
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `StockImportedEvent` | inventory | report, supplier | Nhập kho mới |
| `StockDepletedEvent` | inventory | notification | Nguyên liệu về 0 |
| `LowStockAlertEvent` | inventory | notification | Tồn kho dưới ngưỡng cảnh báo |
| `StockAdjustedEvent` | inventory | audit, report | Điều chỉnh kho thủ công |
| `WasteRecordedEvent` | inventory | report | Ghi nhận hao hụt |

```java
/**
 * Phát ra khi tồn kho nguyên liệu xuống dưới ngưỡng cảnh báo (low_stock_threshold).
 * Consumer: NotificationModule → gửi cảnh báo cho Branch Manager
 */
public record LowStockAlertEvent(
    UUID branchId,
    UUID tenantId,
    UUID ingredientId,
    String ingredientName,
    double currentQuantity,
    double threshold,
    String unit,
    Instant occurredAt
) {}
```

---

### 👤 Module Staff
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `StaffCheckedInEvent` | staff | report, shift | Nhân viên check-in ca |
| `StaffCheckedOutEvent` | staff | report, shift | Nhân viên check-out ca |
| `ShiftAbsentEvent` | staff | report, notification | Nhân viên vắng không phép |
| `PermissionChangedEvent` | staff | audit, auth | Phân quyền bị thay đổi |

---

### 🎁 Module Promotion
| Event | Publisher | Consumer | Mô tả |
|-------|-----------|----------|-------|
| `VoucherAppliedEvent` | promotion | order, report | Voucher được áp dụng vào đơn |
| `VoucherExpiredEvent` | promotion | notification | Voucher sắp hết hạn |
| `PromotionEndedEvent` | promotion | notification | Chương trình khuyến mãi kết thúc |

---

## 🔧 CÁCH IMPLEMENT EVENT HANDLER

```java
/**
 * Consumer xử lý sự kiện đơn hàng hoàn tất.
 * Tự động trừ nguyên liệu theo công thức chế biến.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCompletedEventHandler {

    private final InventoryDeductionService inventoryDeductionService;

    /**
     * Lắng nghe sự kiện đơn hàng hoàn tất và trừ kho tương ứng.
     * Chú ý: @Async để không block thread của Order module.
     *
     * @param event sự kiện chứa danh sách món đã bán
     */
    @EventListener
    @Async
    @Transactional    // Transaction riêng cho Inventory module
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Bắt đầu trừ kho cho đơn hàng: {}", event.orderNumber());
        try {
            inventoryDeductionService.deductStock(
                event.branchId(),
                event.tenantId(),
                event.items()
            );
            log.info("Trừ kho thành công cho đơn hàng: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Lỗi trừ kho cho đơn hàng {}: {}",
                event.orderNumber(), e.getMessage());
            // TODO Phase 2: Gửi vào Dead Letter Queue để retry
        }
    }
}
```

---

## 📊 FLOW HOÀN CHỈNH — Từ Tạo Đơn đến Trừ Kho

```
[Waiter]
    │ POST /api/v1/orders
    ▼
[OrderController]
    │ PlaceOrderCommand
    ▼
[PlaceOrderCommandHandler]
    │ 1. Validate bàn
    │ 2. Check tồn kho (SYNC - reject nếu thiếu)
    │ 3. Save Order
    │ 4. Publish OrderCreatedEvent
    ▼
[NotificationModule] ←── OrderCreatedEvent
    │ Broadcast WebSocket → Màn hình bếp hiển thị đơn mới
    
[Bếp làm xong]
    │ PUT /api/v1/orders/{id}/status (processing → completed)
    ▼
[UpdateOrderStatusCommandHandler]
    │ 1. Validate transition hợp lệ
    │ 2. Update status
    │ 3. Publish OrderStatusChangedEvent + OrderCompletedEvent
    ▼
    ├─ [WebSocketGateway] ← OrderStatusChangedEvent → Broadcast realtime
    └─ [InventoryModule] ← OrderCompletedEvent → Trừ kho ASYNC

[Cashier thanh toán]
    │ POST /api/v1/payments
    ▼
[ProcessPaymentCommandHandler]
    │ 1. Xử lý thanh toán
    │ 2. Publish PaymentCompletedEvent
    ▼
    ├─ [OrderModule] ← PaymentCompletedEvent → order.status = PAID
    ├─ [TableModule] ← PaymentCompletedEvent → table.status = CLEANING
    └─ [InvoiceModule] ← PaymentCompletedEvent → Tạo Invoice + số hóa đơn
```
