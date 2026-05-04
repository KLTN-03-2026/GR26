package com.smartfnb.branch.infrastructure.persistence;

// author: Hoàng
// date: 27-04-2026
// note: Repository truy vấn cấu hình PayOS theo branchId + tenantId.
//       Dùng bởi BranchService và PayOSProvider.

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchPaymentConfigJpaRepository extends JpaRepository<BranchPaymentConfigJpaEntity, UUID> {

    /**
     * Tìm cấu hình PayOS của chi nhánh — validate tenant để tránh cross-tenant access.
     */
    Optional<BranchPaymentConfigJpaEntity> findByBranchIdAndTenantId(UUID branchId, UUID tenantId);
}
