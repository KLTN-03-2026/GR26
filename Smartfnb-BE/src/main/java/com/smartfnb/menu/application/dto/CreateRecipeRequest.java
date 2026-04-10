package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request tạo công thức chế biến (một dòng nguyên liệu).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CreateRecipeRequest(

        /** ID món ăn đích (phải là type = SELLABLE) */
        @NotNull(message = "ID món ăn không được để trống")
        UUID targetItemId,

        /** ID nguyên liệu (type = INGREDIENT hoặc SUB_ASSEMBLY) */
        @NotNull(message = "ID nguyên liệu không được để trống")
        UUID ingredientItemId,

        /** Định lượng nguyên liệu cần dùng — phải > 0 */
        @NotNull(message = "Định lượng không được để trống")
        @DecimalMin(value = "0.0001", message = "Định lượng phải lớn hơn 0")
        BigDecimal quantity,

        /** Đơn vị tính của nguyên liệu trong công thức */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit
) {}
