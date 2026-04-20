package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * JPA Entity cho bảng roles (vai trò theo tenant).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity(name = "StaffRoleJpaEntity")
@Table(
    name = "roles",
    indexes = {
        @Index(name = "idx_roles_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** UUID tenant */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Tên vai trò — unique trong tenant */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Mô tả vai trò */
    @Column(name = "description", length = 255)
    private String description;

    /**
     * Factory method tạo vai trò mới.
     *
     * @param tenantId    UUID tenant
     * @param name        Tên vai trò
     * @param description Mô tả
     * @return RoleJpaEntity mới
     */
    public static RoleJpaEntity create(UUID tenantId, String name, String description) {
        RoleJpaEntity entity = new RoleJpaEntity();

        entity.tenantId = tenantId;
        entity.name = name;
        entity.description = description;
        return entity;
    }
}
