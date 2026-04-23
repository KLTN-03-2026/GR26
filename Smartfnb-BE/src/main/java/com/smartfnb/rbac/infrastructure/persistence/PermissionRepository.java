package com.smartfnb.rbac.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho bảng permissions.
 * Được dùng bởi PermissionService để load danh sách quyền của user.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Repository
public interface PermissionRepository extends JpaRepository<PermissionJpaEntity, String> {

    /**
     * Tải toàn bộ permission codes của user thông qua chuỗi:
     * user → user_roles → roles → role_permissions → permissions.
     * Đây là query trung tâm của hệ thống RBAC.
     *
     * @param userId   UUID người dùng
     * @param tenantId UUID tenant (đảm bảo role thuộc đúng tenant)
     * @return danh sách mã quyền (VD: ["ORDER_CREATE", "PAYMENT_VIEW"])
     */
    @Query("""
        SELECT DISTINCT p.id
        FROM PermissionJpaEntity p
        JOIN RolePermissionJpaEntity rp ON rp.permissionId = p.id
        JOIN RoleJpaEntity r ON r.id = rp.roleId
        JOIN UserRoleJpaEntity ur ON ur.roleId = r.id
        WHERE ur.userId = :userId
          AND r.tenantId = :tenantId
        ORDER BY p.id
        """)
    List<String> findPermissionCodesByUserAndTenant(UUID userId, UUID tenantId);

    /**
     * Tải tên các role của user trong tenant.
     *
     * @param userId   UUID người dùng
     * @param tenantId UUID tenant
     * @return danh sách tên role (VD: ["OWNER", "MANAGER"])
     */
    @Query("""
        SELECT DISTINCT r.name
        FROM RoleJpaEntity r
        JOIN UserRoleJpaEntity ur ON ur.roleId = r.id
        WHERE ur.userId = :userId
          AND r.tenantId = :tenantId
        """)
    List<String> findRoleNamesByUserAndTenant(UUID userId, UUID tenantId);
}
