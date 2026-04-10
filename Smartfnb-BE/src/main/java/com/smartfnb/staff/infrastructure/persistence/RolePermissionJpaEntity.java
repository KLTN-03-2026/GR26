package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

/**
 * JPA Entity cho bảng role_permissions (ma trận role ↔ permission).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity(name = "StaffRolePermissionJpaEntity")
@Table(name = "role_permissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RolePermissionJpaEntity {

    /**
     * Composite key: (role_id, permission_id).
     */
    @EmbeddedId
    private RolePermissionId id;

    /**
     * Khóa chính composite cho role_permissions.
     */
    @Embeddable
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class RolePermissionId implements Serializable {
        @Column(name = "role_id")
        private UUID roleId;

        @Column(name = "permission_id", length = 60)
        private String permissionId;
    }

    /**
     * Factory method gán permission cho role.
     *
     * @param roleId       UUID vai trò
     * @param permissionId ID permission (VD: STAFF_VIEW)
     * @return RolePermissionJpaEntity
     */
    public static RolePermissionJpaEntity of(UUID roleId, String permissionId) {
        RolePermissionJpaEntity entity = new RolePermissionJpaEntity();
        entity.id = new RolePermissionId(roleId, permissionId);
        return entity;
    }
}
