package com.smartfnb.auth.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng plans.
 * Dùng để tìm gói dịch vụ khi đăng ký tenant mới,
 * và hỗ trợ CRUD đầy đủ cho SYSTEM_ADMIN.
 *
 * @author vutq
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

    /**
     * Danh sách gói dịch vụ có phân trang, lọc theo trạng thái active.
     *
     * @param isActive true = chỉ lấy active, false = chỉ lấy inactive
     * @param pageable thông tin phân trang
     * @return Page of PlanJpaEntity
     */
    Page<PlanJpaEntity> findAllByIsActive(boolean isActive, Pageable pageable);

    /**
     * Kiểm tra slug có bị trùng với gói khác không (dùng khi update plan).
     *
     * @param slug       slug cần kiểm tra
     * @param excludedId id của plan đang update (bỏ qua chính nó)
     * @return true nếu slug đã tồn tại ở plan khác
     */
    boolean existsBySlugAndIdNot(String slug, UUID excludedId);

    /**
     * Đếm số tenant ACTIVE đang dùng gói này.
     * Dùng trước khi deactivate plan để tránh orphan tenants.
     *
     * @param planId id của gói dịch vụ
     * @return số tenant đang sử dụng
     */
    @Query("SELECT COUNT(t) FROM TenantJpaEntity t WHERE t.planId = :planId AND t.status = 'ACTIVE'")
    long countActiveTenantsByPlanId(@Param("planId") UUID planId);

    /**
     * Lấy danh sách tất cả gói active (không phân trang) — dùng cho select dropdown.
     */
    List<PlanJpaEntity> findAllByIsActiveTrue();
}
