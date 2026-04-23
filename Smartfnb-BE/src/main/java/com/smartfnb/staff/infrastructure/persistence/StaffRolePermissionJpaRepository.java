package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository cho bảng role_permissions (ma trận role ↔ permission).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffRolePermissionJpaRepository
        extends JpaRepository<RolePermissionJpaEntity, RolePermissionJpaEntity.RolePermissionId> {

    /**
     * Lấy tất cả permission IDs của một role.
     *
     * @param roleId UUID role
     * @return Danh sách permission ID strings
     */
    @Query("SELECT rp.id.permissionId FROM RolePermissionJpaEntity rp WHERE rp.id.roleId = :roleId")
    List<String> findPermissionIdsByRoleId(@Param("roleId") UUID roleId);

    /**
     * Xoá toàn bộ permissions của một role (khi cập nhật ma trận).
     *
     * @param roleId UUID role
     */
    @Modifying
    @Query("DELETE FROM RolePermissionJpaEntity rp WHERE rp.id.roleId = :roleId")
    void deleteAllByRoleId(@Param("roleId") UUID roleId);

    /**
     * Lấy danh sách permission IDs cho nhiều roles (dùng khi load user permissions).
     *
     * @param roleIds danh sách UUID roles
     * @return Danh sách permission ID strings (có thể trùng)
     */
    @Query("SELECT DISTINCT rp.id.permissionId FROM RolePermissionJpaEntity rp WHERE rp.id.roleId IN :roleIds")
    List<String> findPermissionIdsByRoleIdIn(@Param("roleIds") List<UUID> roleIds);
}
