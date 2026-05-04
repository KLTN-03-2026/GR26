package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * DTO request cập nhật định lượng công thức chế biến.
 *
 * <p>FIX BUG: 16/04/2026 — Author: HOÀNG</p>
 * <p>Bổ sung {@code baseOutputQuantity} và {@code baseOutputUnit} để cho phép
 * cập nhật sản lượng chuẩn của SUB_ASSEMBLY recipe sau khi tạo.</p>
 *
 * @author vutq
 * @since 2026-03-28
 */
public record UpdateRecipeRequest(

        /** Định lượng nguyên liệu mới — phải > 0 */
        @NotNull(message = "Định lượng không được để trống")
        @DecimalMin(value = "0.0001", message = "Định lượng phải lớn hơn 0")
        BigDecimal quantity,

        /** Đơn vị tính mới */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit,

        // --- FIX BUG: Author: HOÀNG | 16/04/2026 ---
        // Cho phép cập nhật sản lượng chuẩn để sửa lại các recipe SUB_ASSEMBLY đã lưu sai.

        /**
         * Sản lượng đầu ra chuẩn mới (chỉ dùng cho SUB_ASSEMBLY recipe).
         * Null = giữ nguyên giá trị cũ.
         */
        @DecimalMin(value = "0.0001", message = "Sản lượng đầu ra chuẩn phải lớn hơn 0")
        BigDecimal baseOutputQuantity,

        /**
         * Đơn vị sản lượng chuẩn mới. Null = giữ nguyên.
         */
        @Size(max = 30, message = "Đơn vị sản lượng chuẩn tối đa 30 ký tự")
        String baseOutputUnit
) {}
