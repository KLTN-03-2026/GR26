package com.smartfnb.payment.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO thông tin Payment.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record PaymentResponse(
    UUID id,
    UUID orderId,
    BigDecimal amount,
    String method,         // CASH, VIETQR, MOMO, ZALOPAY
    String status,         // PENDING, COMPLETED, FAILED, REFUNDED
    String transactionId,
    Instant paidAt,
    Instant createdAt
) {}
