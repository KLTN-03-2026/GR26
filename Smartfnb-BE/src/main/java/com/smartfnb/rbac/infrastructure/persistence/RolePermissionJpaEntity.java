package com.smartfnb.rbac.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * JPA Entity cho bảng role_permissions.
 * Bảng join giữa Role và Permission — định nghĩa quyền của mỗi role.
 * Admin tenant có thể thêm/bớt quyền cho role tùy chỉnh.
 * Role hệ thống (is_system = true) có phân quyền mặc định từ Flyway seed.
 *
 * <p>Sử dụng @IdClass để ánh xạ Composite Primary Key.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27 (sửa composite PK)
 */
@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermissionJpaEntity {

    /** ID role sở hữu quyền này */
    @Id
    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    /** ID quyền được gán cho role (Kiểu String match với permission.id) */
    @Id
    @Column(name = "permission_id", nullable = false, length = 60)
    private String permissionId;
}
