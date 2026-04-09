package com.smartfnb.rbac.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho bảng roles.
 * Dùng để tải danh sách role của tenant và quản lý role tùy chỉnh.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Repository
public interface RoleRepository extends JpaRepository<RoleJpaEntity, UUID> {

    /**
     * Lấy tất cả role của một tenant.
     *
     * @param tenantId UUID tenant
     * @return danh sách role
     */
    List<RoleJpaEntity> findByTenantId(UUID tenantId);

    /**
     * Tìm role theo tên trong tenant.
     *
     * @param name     tên role (OWNER, CASHIER...)
     * @param tenantId UUID tenant
     * @return role nếu tồn tại
     */
    java.util.Optional<RoleJpaEntity> findByNameAndTenantId(String name, UUID tenantId);

    /**
     * Kiểm tra role có tồn tại trong tenant không.
     *
     * @param name     tên role
     * @param tenantId UUID tenant
     * @return true nếu tồn tại
     */
    boolean existsByNameAndTenantId(String name, UUID tenantId);
}
