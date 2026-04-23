package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.CategoryJpaEntity;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO response trả về thông tin danh mục.
 * Không expose tenantId nội bộ.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CategoryResponse(

        /** ID danh mục */
        UUID id,

        /** Tên danh mục */
        String name,

        /** Mô tả */
        String description,

        /** Thứ tự hiển thị */
        Integer displayOrder,

        /** Trạng thái kích hoạt */
        Boolean isActive,

        /** Thời điểm tạo */
        Instant createdAt
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity danh mục
     * @return DTO response
     */
    public static CategoryResponse from(CategoryJpaEntity entity) {
        return new CategoryResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getDisplayOrder(),
                entity.getIsActive(),
                entity.getCreatedAt()
        );
    }
}
