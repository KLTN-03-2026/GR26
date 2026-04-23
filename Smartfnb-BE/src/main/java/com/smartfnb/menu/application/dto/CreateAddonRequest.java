package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

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
        BigDecimal extraPrice,

        /**
         * FK tới items(id) — INGREDIENT hoặc SUB_ASSEMBLY.
         * NULL = addon thuần giá, không trừ kho.
         */
        UUID itemId,

        /**
         * Định lượng tiêu hao cho mỗi 1 addon bán ra.
         * Bắt buộc > 0 khi itemId != null. Mặc định 1 nếu không truyền.
         */
        @DecimalMin(value = "0.0001", message = "Định lượng tiêu hao phải lớn hơn 0")
        BigDecimal itemQuantity,

        /** Đơn vị tính của itemQuantity (g, ml, cái...). */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String itemUnit
) {}
