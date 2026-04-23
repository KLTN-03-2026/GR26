package com.smartfnb.auth.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng tenants.
 * Tất cả query PHẢI đảm bảo không rò rỉ dữ liệu chéo tenant.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Repository
public interface TenantRepository extends JpaRepository<TenantJpaEntity, UUID> {

    /**
     * Tìm tenant theo email — dùng khi kiểm tra email unique toàn hệ thống.
     *
     * @param email địa chỉ email
     * @return Optional tenant
     */
    Optional<TenantJpaEntity> findByEmail(String email);

    /**
     * Tìm tenant theo slug — dùng cho URL routing.
     *
     * @param slug slug URL-friendly
     * @return Optional tenant
     */
    Optional<TenantJpaEntity> findBySlug(String slug);

    /**
     * Kiểm tra email đã tồn tại chưa — dùng khi đăng ký mới.
     *
     * @param email địa chỉ email
     * @return true nếu đã tồn tại
     */
    boolean existsByEmail(String email);
}
