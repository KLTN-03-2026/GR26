package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * DTO request tạo Addon/Topping mới.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CreateAddonRequest(

        /** Tên addon — unique trong tenant */
        @NotBlank(message = "Tên topping/addon không được để trống")
        @Size(max = 100, message = "Tên topping/addon tối đa 100 ký tự")
        String name,

        /** Giá cộng thêm — phải >= 0 */
        @NotNull(message = "Giá phụ thu không được để trống")
        @DecimalMin(value = "0", message = "Giá phụ thu không được âm")
        BigDecimal extraPrice
) {}
