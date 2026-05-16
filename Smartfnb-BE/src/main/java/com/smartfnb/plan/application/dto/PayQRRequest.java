package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request tạo mã QR thanh toán cho hóa đơn gói dịch vụ.
 *
 * @param method Phương thức QR: "VIETQR", "MOMO", hoặc "PAYOS"
 *
 * @author vutq
 * @since 2026-04-30
 * @author Hoàng | date: 2026-05-16 | note: Thêm PAYOS vào danh sách phương thức hợp lệ
 */
public record PayQRRequest(

        @NotBlank(message = "Phương thức thanh toán không được trống")
        @Pattern(regexp = "VIETQR|MOMO|PAYOS", message = "Phương thức phải là VIETQR, MOMO hoặc PAYOS")
        String method
) {}
