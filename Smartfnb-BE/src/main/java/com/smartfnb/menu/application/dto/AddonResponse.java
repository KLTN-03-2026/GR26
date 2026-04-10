package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.AddonJpaEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO response trả về thông tin Addon/Topping.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record AddonResponse(

        /** ID addon */
        UUID id,

        /** Tên addon */
        String name,

        /** Giá cộng thêm */
        BigDecimal extraPrice,

        /** Trạng thái kích hoạt */
        Boolean isActive
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity addon
     * @return DTO response
     */
    public static AddonResponse from(AddonJpaEntity entity) {
        return new AddonResponse(
                entity.getId(),
                entity.getName(),
                entity.getExtraPrice(),
                entity.getIsActive()
        );
    }
}
