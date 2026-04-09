package com.smartfnb.payment.application.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO từ webhook payment gateway.
 * Gateway sẽ POST với thông tin xác nhận thanh toán QR.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ConfirmQRPaymentWebhookRequest(
    @NotNull(message = "paymentId không được null")
    UUID paymentId,

    @NotNull(message = "transactionId không được null")
    String transactionId,

    @NotNull(message = "status không được null")
    String status,  // success, failed, expired

    @NotNull(message = "amount không được null")
    BigDecimal amount,

    Long paidAtTimestamp  // Unix timestamp (nullable nếu failed/expired)
) {}
