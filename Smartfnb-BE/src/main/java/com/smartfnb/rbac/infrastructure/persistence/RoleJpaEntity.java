package com.smartfnb.rbac.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * JPA Entity cho bảng roles.
 * Role có thể là hệ thống (is_system = true — seed từ Flyway, không xóa được)
 * hoặc do tenant tạo tùy chỉnh (is_system = false).
 *
 * <p>Mỗi role thuộc về một tenant cụ thể (tenantId).
 * Các role hệ thống chuẩn: OWNER, MANAGER, CASHIER, BARISTA, WAITER.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu role này — dùng để filter RBAC theo tenant */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /**
     * Tên role dạng UPPER_SNAKE — dùng trong hasRole() và JWT claim.
     * VD: OWNER, MANAGER, CASHIER
     */
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /**
     * Mô tả vai trò — hiển thị trên UI quản lý nhân viên.
     * VD: "Thu ngân — quản lý đơn hàng và thanh toán"
     */
    @Column(name = "description")
    private String description;

    /**
     * Role hệ thống mặc định — không cho phép xóa qua API.
     * true: OWNER, MANAGER, CASHIER, BARISTA, WAITER
     * false: role tự tạo bởi quản trị viên tenant
     */
    @Column(name = "is_system")
    @Builder.Default
    private boolean isSystem = false;
}
