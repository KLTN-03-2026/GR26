package com.smartfnb.branch.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BranchJpaRepository extends JpaRepository<BranchJpaEntity, UUID> {
    
    /**
     * Đếm số chi nhánh hiện có của 1 Tenant (để validate max_branches).
     */
    long countByTenantId(UUID tenantId);

    /**
     * Lấy danh sách toàn bộ chi nhánh của Tenant.
     */
    List<BranchJpaEntity> findByTenantId(UUID tenantId);
}
