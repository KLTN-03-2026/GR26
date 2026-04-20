package com.smartfnb.payment.application.command;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command xác nhận thanh toán QR qua webhook.
 * Payment gateway sẽ gọi callback endpoint với thông tin này.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ConfirmQRPaymentCommand(
    UUID paymentId,
    String transactionId,       // ID từ payment gateway
    String status,               // success, failed, expired
    BigDecimal amount,
    Long paidAtTimestamp        // Unix timestamp khi thanh toán thành công
) {}
