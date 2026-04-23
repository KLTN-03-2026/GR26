package com.smartfnb.payment.application.command;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command xử lý thanh toán bằng tiền mặt.
 * Thu ngân nhập số tiền nhận được → tạo Payment + Invoice.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ProcessCashPaymentCommand(
    UUID orderId,
    BigDecimal amount,
    UUID cashierUserId
) {}
