package com.smartfnb.plan.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionJpaRepository extends JpaRepository<SubscriptionJpaEntity, UUID> {
    
    /**
     * Lấy subscription đang ACTIVE của một Tenant.
     */
    Optional<SubscriptionJpaEntity> findFirstByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    /**
     * Lấy subscription theo danh sách trạng thái (VD: ACTIVE hoặc PENDING_PAYMENT).
     */
    Optional<SubscriptionJpaEntity> findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(UUID tenantId, List<String> statuses);

    /**
     * Lấy toàn bộ lịch sử subscription của Tenant, mới nhất trước.
     * Dùng trong TenantAdminService.getTenantDetail().
     */
    List<SubscriptionJpaEntity> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
