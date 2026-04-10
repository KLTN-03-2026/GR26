package com.smartfnb.payment.application.command;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command xử lý tạo QR Code thanh toán.
 * VietQR, MoMo, ZaloPay QR được khởi tạo với timeout 3 phút.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ProcessQRPaymentCommand(
    UUID orderId,
    BigDecimal amount,
    String qrMethod,       // VIETQR hoặc MOMO
    UUID cashierUserId
) {}
