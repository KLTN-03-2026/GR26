package com.smartfnb.plan.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionJpaRepository extends JpaRepository<SubscriptionJpaEntity, UUID> {
    
    /**
     * Lấy subscription đang ACTIVE của một Tenant.
     */
    Optional<SubscriptionJpaEntity> findFirstByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);
}
