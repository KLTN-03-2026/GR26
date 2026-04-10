package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO response trả về thông tin một dòng công thức chế biến.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record RecipeResponse(

        /** ID dòng công thức */
        UUID id,

        /** ID món ăn sử dụng nguyên liệu này */
        UUID targetItemId,

        /** ID nguyên liệu */
        UUID ingredientItemId,

        /** Định lượng cần dùng */
        BigDecimal quantity,

        /** Đơn vị tính */
        String unit
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity công thức
     * @return DTO response
     */
    public static RecipeResponse from(RecipeJpaEntity entity) {
        return new RecipeResponse(
                entity.getId(),
                entity.getTargetItemId(),
                entity.getIngredientItemId(),
                entity.getQuantity(),
                entity.getUnit()
        );
    }
}
