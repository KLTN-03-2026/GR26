package com.smartfnb.supplier.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho Supplier.
 */
public interface SupplierJpaRepository extends JpaRepository<SupplierJpaEntity, UUID> {

    Optional<SupplierJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<SupplierJpaEntity> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Page<SupplierJpaEntity> findByTenantIdAndNameContainingIgnoreCaseAndActiveTrue(
            UUID tenantId, String name, Pageable pageable);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
