package com.smartfnb.order.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng hoàn tất thanh toán thành công.
 * Consumer:
 * - InventoryModule: trừ nguyên liệu
 * - ReportModule: cập nhật báo cáo
 *
 * @author SmartF&B Team
 */
public record OrderCompletedEvent(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    String orderNumber,
    List<CompletedOrderItem> items,
    BigDecimal totalAmount,
    Instant occurredAt
) {
    public record CompletedOrderItem(
        UUID menuItemId,
        int quantity,
        BigDecimal unitPrice
    ) {}
}
