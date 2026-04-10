package com.smartfnb.order.application.dto;

import com.smartfnb.order.infrastructure.persistence.TableZoneJpaEntity;

import java.util.UUID;

/**
 * DTO response trả về thông tin khu vực bàn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record TableZoneResponse(

        /** ID khu vực bàn */
        UUID id,

        /** ID chi nhánh */
        UUID branchId,

        /** Tên khu vực */
        String name,

        /** Số tầng */
        Integer floorNumber
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity zone
     * @return DTO response
     */
    public static TableZoneResponse from(TableZoneJpaEntity entity) {
        return new TableZoneResponse(
                entity.getId(),
                entity.getBranchId(),
                entity.getName(),
                entity.getFloorNumber()
        );
    }
}
