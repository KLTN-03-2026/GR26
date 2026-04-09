package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

/**
 * JPA Entity cho bảng permissions (danh sách quyền toàn hệ thống — seed data).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity(name = "StaffPermissionJpaEntity")
@Table(name = "permissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PermissionJpaEntity {

    /** ID permission dạng string: ORDER_CREATE, STAFF_VIEW... */
    @Id
    @Column(name = "id", length = 60, nullable = false, updatable = false)
    private String id;

    /** Module thuộc về: POS, INVENTORY, HR, REPORT, SYSTEM... */
    @Column(name = "module", nullable = false, length = 50)
    private String module;

    /** Mô tả quyền hạn bằng tiếng Việt */
    @Column(name = "description", length = 255)
    private String description;
}
