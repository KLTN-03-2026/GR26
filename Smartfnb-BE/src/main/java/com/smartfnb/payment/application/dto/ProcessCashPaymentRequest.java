package com.smartfnb.payment.application.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO để xử lý thanh toán tiền mặt.
 * Thu ngân nhập thông tin thanh toán từ POS.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ProcessCashPaymentRequest(
    @NotNull(message = "orderId không được null")
    UUID orderId,

    @NotNull(message = "amount không được null")
    @Digits(integer = 12, fraction = 2, message = "amount phải là số với tối đa 12 chữ số và 2 chữ số thập phân")
    BigDecimal amount
) {}
