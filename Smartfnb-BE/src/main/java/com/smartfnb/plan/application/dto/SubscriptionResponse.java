package com.smartfnb.plan.application.dto;

import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaEntity;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Phản hồi thông tin gói Subscription (đăng ký) của Tenant.
 * Tích hợp sẵn thông tin chi tiết Plan.
 */
public record SubscriptionResponse(
        UUID subscriptionId,
        UUID tenantId,
        PlanResponse plan,
        String status,
        LocalDateTime startedAt,
        LocalDateTime expiresAt
) {
    public static SubscriptionResponse fromEntity(SubscriptionJpaEntity entity, PlanResponse planResponse) {
        return new SubscriptionResponse(
                entity.getId(),
                entity.getTenantId(),
                planResponse,
                entity.getStatus(),
                entity.getStartedAt(),
                entity.getExpiresAt()
        );
    }
}
