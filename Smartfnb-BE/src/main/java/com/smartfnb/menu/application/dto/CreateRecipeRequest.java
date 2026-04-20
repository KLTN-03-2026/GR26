package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request tạo công thức chế biến (một dòng nguyên liệu).
 *
 * <p>FIX BUG: 16/04/2026 — Author: HOÀNG</p>
 * <p>Bổ sung {@code baseOutputQuantity} và {@code baseOutputUnit} để hệ thống tính đúng
 * hệ số scale khi ghi nhận mẻ sản xuất SUB_ASSEMBLY.
 * Hai field này chỉ bắt buộc với recipe của item type SUB_ASSEMBLY; để null với SELLABLE.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CreateRecipeRequest(

        /** ID món ăn đích (type = SELLABLE hoặc SUB_ASSEMBLY) */
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
        String unit,

        // --- FIX BUG: Author: HOÀNG | 16/04/2026 ---
        // Bug cũ: thiếu field này khiến handler nhân recipe.quantity × expectedOutputQuantity
        // trực tiếp, dẫn đến 1000g × 2000ml = 2,000,000g (sai).
        // Fix: lưu sản lượng chuẩn của công thức để tính scaleFactor đúng.

        /**
         * Sản lượng đầu ra chuẩn của công thức (chỉ dùng cho SUB_ASSEMBLY recipe).
         * Ví dụ: 2000.0 (ml) — công thức này tạo ra 2000 ml mỗi mẻ.
         * Phải > 0 nếu được cung cấp. Để null với SELLABLE recipe.
         */
        @DecimalMin(value = "0.0001", message = "Sản lượng đầu ra chuẩn phải lớn hơn 0")
        BigDecimal baseOutputQuantity,

        /**
         * Đơn vị của sản lượng đầu ra chuẩn (ví dụ: ml, g, cái).
         * Để null với SELLABLE recipe.
         */
        @Size(max = 30, message = "Đơn vị sản lượng chuẩn tối đa 30 ký tự")
        String baseOutputUnit
) {}
