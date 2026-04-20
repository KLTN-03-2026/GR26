package com.smartfnb.branch.application.dto;

import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record BranchResponse(
        UUID id,
        UUID tenantId,
        String name,
        String code,
        String address,
        String phone,
        String status,
        LocalDateTime createdAt
) {
    public static BranchResponse fromEntity(BranchJpaEntity entity) {
        return new BranchResponse(
                entity.getId(),
                entity.getTenantId(),
                entity.getName(),
                entity.getCode(),
                entity.getAddress(),
                entity.getPhone(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
