package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO response trả về thông tin món ăn.
 * Không expose tenantId nội bộ.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record MenuItemResponse(

        /** ID món ăn */
        UUID id,

        /** ID danh mục */
        UUID categoryId,

        /** Tên món ăn */
        String name,

        /** Giá bán mặc định */
        BigDecimal basePrice,

        /** Đơn vị tính */
        String unit,

        /** URL ảnh */
        String imageUrl,

        /** Trạng thái kích hoạt */
        Boolean isActive,

        /** Có đồng bộ lên app giao hàng không */
        Boolean isSyncDelivery,

        /** Thời điểm tạo */
        Instant createdAt
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity món ăn
     * @return DTO response
     */
    public static MenuItemResponse from(MenuItemJpaEntity entity) {
        return new MenuItemResponse(
                entity.getId(),
                entity.getCategoryId(),
                entity.getName(),
                entity.getBasePrice(),
                entity.getUnit(),
                entity.getImageUrl(),
                entity.getIsActive(),
                entity.getIsSyncDelivery(),
                entity.getCreatedAt()
        );
    }
}
