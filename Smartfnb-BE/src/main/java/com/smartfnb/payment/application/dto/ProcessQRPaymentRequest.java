package com.smartfnb.payment.application.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO để tạo QR Code thanh toán.
 * Thu ngân chọn phương thức QR (VIETQR hoặc MOMO) → tạo QR code.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ProcessQRPaymentRequest(
    @NotNull(message = "orderId không được null")
    UUID orderId,

    @NotNull(message = "amount không được null")
    @Digits(integer = 12, fraction = 2, message = "amount phải là số với tối đa 12 chữ số và 2 chữ số thập phân")
    BigDecimal amount,

    @NotBlank(message = "qrMethod không được trống")
    String qrMethod  // VIETQR hoặc MOMO
) {}
