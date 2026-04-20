package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

/**
 * JPA Entity cho bảng user_roles (nhân viên được gán vai trò).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity(name = "StaffUserRoleJpaEntity")
@Table(name = "user_roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserRoleJpaEntity {

    @EmbeddedId
    private UserRoleId id;

    /**
     * Composite key: (user_id, role_id).
     */
    @Embeddable
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class UserRoleId implements Serializable {
        @Column(name = "user_id")
        private UUID userId;

        @Column(name = "role_id")
        private UUID roleId;
    }

    /**
     * Factory method gán role cho user.
     *
     * @param userId UUID nhân viên
     * @param roleId UUID vai trò
     * @return UserRoleJpaEntity
     */
    public static UserRoleJpaEntity of(UUID userId, UUID roleId) {
        UserRoleJpaEntity entity = new UserRoleJpaEntity();
        entity.id = new UserRoleId(userId, roleId);
        return entity;
    }
}
