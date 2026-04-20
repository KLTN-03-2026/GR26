package com.smartfnb.auth.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng plans.
 * Dùng để tìm gói dịch vụ khi đăng ký tenant mới.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Repository
public interface PlanRepository extends JpaRepository<PlanJpaEntity, UUID> {

    /**
     * Tìm gói dịch vụ theo slug.
     * Dùng khi tenant đăng ký chọn gói "basic", "standard", "premium".
     *
     * @param slug slug URL-friendly của gói
     * @return Optional plan
     */
    Optional<PlanJpaEntity> findBySlug(String slug);

    /**
     * Tìm gói dịch vụ đang active theo slug.
     *
     * @param slug     slug gói
     * @param isActive trạng thái kích hoạt
     * @return Optional plan
     */
    Optional<PlanJpaEntity> findBySlugAndIsActive(String slug, boolean isActive);
}
