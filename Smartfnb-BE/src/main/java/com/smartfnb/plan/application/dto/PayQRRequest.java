package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request tạo mã QR thanh toán cho hóa đơn gói dịch vụ.
 *
 * @param method Phương thức QR: "VIETQR" hoặc "MOMO"
 *
 * @author vutq
 * @since 2026-04-30
 */
public record PayQRRequest(

        @NotBlank(message = "Phương thức thanh toán không được trống")
        @Pattern(regexp = "VIETQR|MOMO", message = "Phương thức phải là VIETQR hoặc MOMO")
        String method
) {}
