package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository cho bảng user_roles (nhân viên được gán vai trò).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffUserRoleJpaRepository
        extends JpaRepository<UserRoleJpaEntity, UserRoleJpaEntity.UserRoleId> {

    /**
     * Lấy danh sách role IDs của một nhân viên.
     *
     * @param userId UUID nhân viên
     * @return Danh sách UUID roles
     */
    @Query("SELECT ur.id.roleId FROM UserRoleJpaEntity ur WHERE ur.id.userId = :userId")
    List<UUID> findRoleIdsByUserId(@Param("userId") UUID userId);

    /**
     * Xoá tất cả roles của một nhân viên (khi override toàn bộ roles).
     *
     * @param userId UUID nhân viên
     */
    @Modifying
    @Query("DELETE FROM UserRoleJpaEntity ur WHERE ur.id.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);

    /**
     * Xoá một role cụ thể khỏi nhân viên.
     *
     * @param userId UUID nhân viên
     * @param roleId UUID role
     */
    @Modifying
    @Query("DELETE FROM UserRoleJpaEntity ur WHERE ur.id.userId = :userId AND ur.id.roleId = :roleId")
    void deleteByUserIdAndRoleId(@Param("userId") UUID userId, @Param("roleId") UUID roleId);
}
