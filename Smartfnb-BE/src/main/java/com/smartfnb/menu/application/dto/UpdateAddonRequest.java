package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request cập nhật Addon/Topping.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateAddonRequest(

        /** Tên addon mới */
        @NotBlank(message = "Tên topping/addon không được để trống")
        @Size(max = 100, message = "Tên topping/addon tối đa 100 ký tự")
        String name,

        /** Giá cộng thêm mới */
        @NotNull(message = "Giá phụ thu không được để trống")
        @DecimalMin(value = "0", message = "Giá phụ thu không được âm")
        BigDecimal extraPrice,

        /** Trạng thái kích hoạt */
        Boolean isActive,

        /**
         * FK tới items(id) — INGREDIENT hoặc SUB_ASSEMBLY.
         * Gửi null để xóa liên kết kho (addon trở về thuần giá).
         */
        UUID itemId,

        /**
         * Định lượng tiêu hao mới. Bắt buộc > 0 khi itemId != null.
         */
        @DecimalMin(value = "0.0001", message = "Định lượng tiêu hao phải lớn hơn 0")
        BigDecimal itemQuantity,

        /** Đơn vị tính mới (g, ml, cái...). */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String itemUnit
) {}
