package com.smartfnb.plan.application.dto;

import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Thông tin chi tiết đầy đủ của một Tenant, dành cho SYSTEM_ADMIN.
 * Dùng cho GET /api/v1/admin/tenants/{id}.
 * Kế thừa logic từ TenantSummaryResponse, bổ sung thêm lịch sử subscription.
 *
 * @author vutq
 * @since 2026-04-24
 */
public record TenantDetailResponse(
        UUID id,
        String name,
        String slug,
        String email,
        String phone,
        String taxCode,
        String logoUrl,

        /** Trạng thái: ACTIVE | SUSPENDED | CANCELLED */
        String status,

        /** Tên gói dịch vụ đang sử dụng */
        String planName,

        /** UUID gói dịch vụ đang sử dụng */
        UUID planId,

        /** Thời điểm hết hạn gói */
        LocalDateTime planExpiresAt,

        /** Số chi nhánh hiện có */
        long branchCount,

        /** Thời điểm tạo tenant */
        LocalDateTime createdAt,

        /** Lịch sử đăng ký gói (mới nhất trước) */
        List<SubscriptionResponse> subscriptionHistory,

        /** Tổng số hóa đơn đã phát sinh */
        long totalInvoices
) {
    /**
     * Tạo response chi tiết từ Entity và dữ liệu liên quan.
     *
     * @param entity              TenantJpaEntity
     * @param planName            Tên gói hiện tại
     * @param branchCount         Số chi nhánh
     * @param subscriptionHistory Lịch sử subscription
     * @param totalInvoices       Tổng số hóa đơn
     * @return TenantDetailResponse
     */
    public static TenantDetailResponse from(TenantJpaEntity entity,
                                             String planName,
                                             long branchCount,
                                             List<SubscriptionResponse> subscriptionHistory,
                                             long totalInvoices) {
        return new TenantDetailResponse(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getTaxCode(),
                entity.getLogoUrl(),
                entity.getStatus(),
                planName,
                entity.getPlanId(),
                entity.getPlanExpiresAt(),
                branchCount,
                entity.getCreatedAt(),
                subscriptionHistory,
                totalInvoices
        );
    }
}
