package com.smartfnb.plan.application.dto;

import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Thông tin tóm tắt của một Tenant trong danh sách admin.
 * Dùng cho GET /api/v1/admin/tenants (danh sách phân trang).
 *
 * @author vutq
 * @since 2026-04-24
 */
public record TenantSummaryResponse(
        UUID id,
        String name,
        String email,
        String phone,

        /** Trạng thái: ACTIVE | SUSPENDED | CANCELLED */
        String status,

        /** Tên gói dịch vụ đang sử dụng */
        String planName,

        /** Thời điểm hết hạn gói */
        LocalDateTime planExpiresAt,

        /** Số chi nhánh hiện có */
        long branchCount,

        /** Thời điểm tạo tenant */
        LocalDateTime createdAt
) {
    /**
     * Tạo từ Entity, plan name lấy từ service (join phía trên).
     *
     * @param entity     TenantJpaEntity
     * @param planName   Tên gói dịch vụ hiện tại
     * @param branchCount Số chi nhánh
     * @return TenantSummaryResponse
     */
    public static TenantSummaryResponse from(TenantJpaEntity entity,
                                              String planName,
                                              long branchCount) {
        return new TenantSummaryResponse(
                entity.getId(),
                entity.getName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getStatus(),
                planName,
                entity.getPlanExpiresAt(),
                branchCount,
                entity.getCreatedAt()
        );
    }
}
