package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO response trả về thông tin một dòng công thức chế biến.
 *
 * <p>FIX BUG: 16/04/2026 — Author: HOÀNG</p>
 * <p>Bổ sung {@code baseOutputQuantity} và {@code baseOutputUnit} vào response
 * để frontend hiển thị và cho phép user kiểm tra sản lượng chuẩn của SUB_ASSEMBLY recipe.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record RecipeResponse(

        /** ID dòng công thức */
        UUID id,

        /** ID món ăn sử dụng nguyên liệu này */
        UUID targetItemId,

        /** Tên món ăn sử dụng nguyên liệu này */
        String targetItemName,

        /** ID nguyên liệu */
        UUID ingredientItemId,

        /** Tên nguyên liệu */
        String ingredientItemName,

        /** Định lượng cần dùng */
        BigDecimal quantity,

        /** Đơn vị tính */
        String unit,

        // --- FIX BUG: Author: HOÀNG | 16/04/2026 ---
        // Trả thêm 2 field này để FE hiển thị và user có thể kiểm tra công thức SUB_ASSEMBLY.

        /**
         * Sản lượng đầu ra chuẩn của công thức (chỉ có với SUB_ASSEMBLY recipe).
         * Null với SELLABLE recipe.
         */
        BigDecimal baseOutputQuantity,

        /**
         * Đơn vị của sản lượng đầu ra chuẩn (ví dụ: ml, g). Null với SELLABLE recipe.
         */
        String baseOutputUnit
) {

    /**
     * Factory method tạo response với tên món ăn và nguyên liệu.
     *
     * @param entity JPA entity công thức
     * @param targetName Tên món đích
     * @param ingredientName Tên nguyên liệu
     * @return DTO response
     */
    public static RecipeResponse from(RecipeJpaEntity entity, String targetName, String ingredientName) {
        return new RecipeResponse(
                entity.getId(),
                entity.getTargetItemId(),
                targetName,
                entity.getIngredientItemId(),
                ingredientName,
                entity.getQuantity(),
                entity.getUnit(),
                // FIX BUG: Author: HOÀNG | 16/04/2026 — thêm 2 field sản lượng chuẩn
                entity.getBaseOutputQuantity(),
                entity.getBaseOutputUnit()
        );
    }

    /**
     * Factory method tạo response mặc định không có tên.
     * (Deprecated: Nên truyền tên để tránh mất thông tin khi frontend hiển thị, giữ tạm để an toàn với cũ)
     */
    public static RecipeResponse from(RecipeJpaEntity entity) {
        return from(entity, "Chưa xác định", "Chưa xác định");
    }
}
