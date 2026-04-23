package com.smartfnb.payment.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event phát ra khi QR Payment được xác nhận thành công qua webhook.
 * Dùng để broadcast tới frontend qua WebSocket.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record PaymentCompletedEvent(
    UUID paymentId,
    UUID tenantId,
    UUID branchId,
    UUID orderId,
    String orderNumber,
    java.math.BigDecimal amount,
    String paymentMethod,    // CASH, VIETQR, MOMO
    String transactionId,
    Instant occurredAt
) {}
