package com.smartfnb.branch.application.dto;

import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record BranchResponse(
        UUID id,
        String name,
        String code,
        String address,
        String phone,
        java.math.BigDecimal latitude,
        java.math.BigDecimal longitude,
        String status,
        LocalDateTime createdAt
) {
    public static BranchResponse fromEntity(BranchJpaEntity entity) {
        return new BranchResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getAddress(),
                entity.getPhone(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
