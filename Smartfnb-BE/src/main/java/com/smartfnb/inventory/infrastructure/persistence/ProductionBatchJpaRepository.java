package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository cho ProductionBatchJpaEntity.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
import java.util.Optional;

@Repository
public interface ProductionBatchJpaRepository extends JpaRepository<ProductionBatchJpaEntity, UUID> {
    Optional<ProductionBatchJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProductionBatchJpaEntity p " +
           "WHERE p.tenantId = :tenantId AND p.branchId = :branchId")
    org.springframework.data.domain.Page<ProductionBatchJpaEntity> findByTenantAndBranch(
            @org.springframework.data.repository.query.Param("tenantId") java.util.UUID tenantId,
            @org.springframework.data.repository.query.Param("branchId") java.util.UUID branchId,
            org.springframework.data.domain.Pageable pageable);
}
