package com.smartfnb.auth.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng users.
 * Mọi query PHẢI filter theo tenantId để đảm bảo data isolation.
 *
 * @author vutq
 * @since 2026-03-26
 */
@Repository
public interface UserRepository extends JpaRepository<UserJpaEntity, UUID> {

    /**
     * Tìm user theo email trong một tenant cụ thể.
     * Dùng trong luồng đăng nhập và kiểm tra email unique.
     *
     * @param email    địa chỉ email
     * @param tenantId ID tenant
     * @return Optional user
     */
    Optional<UserJpaEntity> findByEmailAndTenantId(String email, UUID tenantId);

    /**
     * Tìm user theo email trên toàn hệ thống — chỉ dùng khi đăng ký tenant mới.
     * KHÔNG dùng trong các trường hợp khác để tránh rò rỉ chéo tenant.
     *
     * @param email địa chỉ email
     * @return Optional user
     */
    Optional<UserJpaEntity> findByEmail(String email);

    /**
     * Tìm user theo phone trong một tenant.
     *
     * @param phone    số điện thoại
     * @param tenantId ID tenant
     * @return Optional user
     */
    Optional<UserJpaEntity> findByPhoneAndTenantId(String phone, UUID tenantId);

    /**
     * Kiểm tra email đã tồn tại trong tenant chưa.
     *
     * @param email    địa chỉ email
     * @param tenantId ID tenant
     * @return true nếu đã tồn tại
     */
    boolean existsByEmailAndTenantId(String email, UUID tenantId);

    /**
     * Cập nhật thời điểm đăng nhập và reset failed login count.
     *
     * @param userId      ID người dùng
     * @param lastLoginAt thời điểm đăng nhập mới nhất
     */
    @Modifying
    @Query("UPDATE UserJpaEntity u SET u.lastLoginAt = :lastLoginAt, u.failedLoginCount = 0 WHERE u.id = :userId")
    void updateLastLoginAt(UUID userId, LocalDateTime lastLoginAt);

    /**
     * Tăng số lần đăng nhập sai.
     *
     * @param userId ID người dùng
     */
    @Modifying
    @Query("UPDATE UserJpaEntity u SET u.failedLoginCount = u.failedLoginCount + 1 WHERE u.id = :userId")
    void incrementFailedLoginCount(UUID userId);

    /**
     * Khóa tài khoản người dùng tạm thời.
     *
     * @param userId      ID người dùng
     * @param lockedUntil thời điểm tài khoản hết bị khóa
     */
    @Modifying
    @Query("UPDATE UserJpaEntity u SET u.status = 'LOCKED', u.lockedUntil = :lockedUntil WHERE u.id = :userId")
    void lockUser(UUID userId, LocalDateTime lockedUntil);

    // ===================== ACCOUNT MANAGEMENT =====================

    /**
     * Tìm user theo ID và tenantId — dùng trong Account Management để ngăn IDOR.
     * Trả NOT FOUND nếu userId không thuộc tenant hiện tại.
     *
     * @param id       UUID user
     * @param tenantId UUID tenant
     * @return Optional user
     */
    Optional<UserJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Kiểm tra phone đã dùng bởi user khác trong cùng tenant.
     * Dùng khi cập nhật profile để tránh duplicate phone.
     *
     * @param phone     số điện thoại cần kiểm tra
     * @param tenantId  tenant scope
     * @param excludeId ID user hiện tại (loại trừ khỏi kết quả)
     * @return true nếu phone đã tồn tại ở user khác
     */
    boolean existsByPhoneAndTenantIdAndIdNot(String phone, UUID tenantId, UUID excludeId);
}
