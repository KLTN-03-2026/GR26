package com.smartfnb.rbac.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng user_roles.
 * Bảng join nhiều-nhiều giữa User và Role trong cùng một tenant.
 * Một user có thể có nhiều role (VD: vừa là CASHIER vừa là BARISTA).
 *
 * <p>Sử dụng @IdClass để ánh xạ Composite Primary Key.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27 (sửa composite PK)
 */
@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoleJpaEntity {

    /** ID người dùng được gán role */
    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** ID role được gán */
    @Id
    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    /** Ai gán role này (userId của admin thực hiện) */
    @Column(name = "assigned_by")
    private UUID assignedBy;

    /** Thời điểm gán role */
    @CreationTimestamp
    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;
}
