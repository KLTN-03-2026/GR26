package com.smartfnb.plan.application.dto;

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.plan.domain.valueobject.FeatureFlag;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO phản hồi thông tin chi tiết gói dịch vụ (Plan).
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
public record PlanResponse(
        UUID id,
        String name,
        String slug,
        BigDecimal priceMonthly,
        int maxBranches,
        FeatureFlag features,
        boolean isActive
) {
    public static PlanResponse fromEntity(PlanJpaEntity entity) {
        return new PlanResponse(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getPriceMonthly(),
                entity.getMaxBranches(),
                FeatureFlag.fromJson(entity.getFeatures()),
                entity.isActive()
        );
    }
}
