package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * DTO request cập nhật định lượng công thức chế biến.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateRecipeRequest(

        /** Định lượng nguyên liệu mới — phải > 0 */
        @NotNull(message = "Định lượng không được để trống")
        @DecimalMin(value = "0.0001", message = "Định lượng phải lớn hơn 0")
        BigDecimal quantity,

        /** Đơn vị tính mới */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit
) {}
