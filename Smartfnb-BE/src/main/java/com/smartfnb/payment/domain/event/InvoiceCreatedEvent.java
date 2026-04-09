package com.smartfnb.payment.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event phát ra khi Invoice được tạo thành công.
 * Dùng để kích hoạt các nghiệp vụ tiếp theo:
 * - Cập nhật Table.status = CLEANING
 * - Ghi log audit
 * - Gửi thông báo cho khách hàng
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record InvoiceCreatedEvent(
    UUID invoiceId,
    UUID tenantId,
    UUID branchId,
    UUID orderId,
    String invoiceNumber,
    java.math.BigDecimal total,
    UUID tableId,           // Để cập nhật Table.status
    Instant occurredAt
) {}
