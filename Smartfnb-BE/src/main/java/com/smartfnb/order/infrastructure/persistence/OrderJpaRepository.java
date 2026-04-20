package com.smartfnb.order.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, UUID>, JpaSpecificationExecutor<OrderJpaEntity> {

    /**
     * Tìm đơn hàng theo ID và tenantId, eager-load items tránh LazyInitializationException.
     * Dùng cho lượng operator cần toàn bộ chi tiết (Owner xem across branches).
     */
    @EntityGraph(attributePaths = "items")
    Optional<OrderJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Tìm đơn hàng theo ID + tenant + branch, eager-load items tránh LazyInitializationException.
     * Dùng cho chi tiết đơn hàng trong scope chi nhánh cụ thể.
     */
    @EntityGraph(attributePaths = "items")
    Optional<OrderJpaEntity> findByIdAndTenantIdAndBranchId(UUID id, UUID tenantId, UUID branchId);

    /**
     * Danh sách đơn hàng có phân trang — không eager-load items để tránh tải thừa.
     */
    Page<OrderJpaEntity> findByTenantIdAndBranchId(UUID tenantId, UUID branchId, Pageable pageable);

    /**
     * Danh sách đơn hàng theo status có phân trang — không eager-load items.
     */
    Page<OrderJpaEntity> findByTenantIdAndBranchIdAndStatus(UUID tenantId, UUID branchId, String status, Pageable pageable);
}
