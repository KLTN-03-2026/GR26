package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng roles.
 * Kết hợp với role_permissions cho RBAC matrix operations.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffRoleJpaRepository extends JpaRepository<RoleJpaEntity, UUID> {

    /**
     * Lấy tất cả vai trò của một tenant.
     *
     * @param tenantId UUID tenant
     * @return Danh sách roles
     */
    List<RoleJpaEntity> findByTenantId(UUID tenantId);

    /**
     * Lấy role theo ID + tenantId (chống IDOR).
     *
     * @param id       UUID role
     * @param tenantId UUID tenant
     * @return Optional role
     */
    Optional<RoleJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Kiểm tra tên role đã tồn tại trong tenant chưa.
     *
     * @param tenantId UUID tenant
     * @param name     Tên role cần kiểm tra
     * @return true nếu đã tồn tại
     */
    boolean existsByTenantIdAndName(UUID tenantId, String name);
}
