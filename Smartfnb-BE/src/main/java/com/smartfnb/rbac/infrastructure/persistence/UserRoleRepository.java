package com.smartfnb.rbac.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho bảng user_roles.
 * Dùng để gán/thu hồi role cho người dùng trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Repository
public interface UserRoleRepository extends JpaRepository<UserRoleJpaEntity, UUID> {

    /**
     * Lấy tất cả UserRole của một user.
     *
     * @param userId UUID người dùng
     * @return danh sách UserRoleJpaEntity
     */
    List<UserRoleJpaEntity> findByUserId(UUID userId);

    /**
     * Xóa tất cả role của user — dùng khi reset phân quyền.
     *
     * @param userId UUID người dùng
     */
    @Modifying
    @Query("DELETE FROM UserRoleJpaEntity ur WHERE ur.userId = :userId")
    void deleteByUserId(UUID userId);

    /**
     * Kiểm tra user đã có role này chưa.
     *
     * @param userId UUID người dùng
     * @param roleId UUID role
     * @return true nếu đã gán
     */
    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);
}
