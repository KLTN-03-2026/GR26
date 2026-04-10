package com.smartfnb.order.application.dto;

import com.smartfnb.order.infrastructure.persistence.TableJpaEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO response trả về thông tin bàn.
 * Dùng cho cả danh sách sơ đồ bàn và chi tiết bàn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record TableResponse(

        /** ID bàn */
        UUID id,

        /** ID chi nhánh */
        UUID branchId,

        /** ID khu vực (null nếu chưa phân zone) */
        UUID zoneId,

        /** Tên bàn */
        String name,

        /** Số chỗ ngồi */
        Integer capacity,

        /**
         * Trạng thái bàn hiện tại.
         * AVAILABLE | OCCUPIED | CLEANING
         */
        String status,

        /** Tọa độ X trên sơ đồ */
        BigDecimal positionX,

        /** Tọa độ Y trên sơ đồ */
        BigDecimal positionY,

        /** Hình dạng: square | round */
        String shape,

        /** Trạng thái kích hoạt */
        Boolean isActive
) {

    /**
     * Factory method tạo response từ JPA entity.
     *
     * @param entity JPA entity bàn
     * @return DTO response
     */
    public static TableResponse from(TableJpaEntity entity) {
        return new TableResponse(
                entity.getId(),
                entity.getBranchId(),
                entity.getZoneId(),
                entity.getName(),
                entity.getCapacity(),
                entity.getStatus(),
                entity.getPositionX(),
                entity.getPositionY(),
                entity.getShape(),
                entity.getIsActive()
        );
    }
}
