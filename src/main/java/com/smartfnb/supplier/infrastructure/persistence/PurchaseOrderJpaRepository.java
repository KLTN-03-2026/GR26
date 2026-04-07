package com.smartfnb.supplier.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho PurchaseOrder.
 */
public interface PurchaseOrderJpaRepository extends JpaRepository<PurchaseOrderJpaEntity, UUID> {

    @EntityGraph(attributePaths = "items")
    Optional<PurchaseOrderJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<PurchaseOrderJpaEntity> findByTenantIdAndBranchId(UUID tenantId, UUID branchId, Pageable pageable);

    Page<PurchaseOrderJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    Page<PurchaseOrderJpaEntity> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);

    Page<PurchaseOrderJpaEntity> findByTenantIdAndSupplierId(UUID tenantId, UUID supplierId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM PurchaseOrderJpaEntity p WHERE p.tenantId = :tid AND p.branchId = :bid")
    long countByTenantIdAndBranchId(@Param("tid") UUID tenantId, @Param("bid") UUID branchId);

    boolean existsByTenantIdAndOrderNumber(UUID tenantId, String orderNumber);
}
