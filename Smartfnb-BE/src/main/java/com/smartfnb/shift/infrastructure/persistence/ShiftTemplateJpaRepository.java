package com.smartfnb.shift.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng shift_templates (ca mẫu của chi nhánh).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface ShiftTemplateJpaRepository
        extends JpaRepository<ShiftTemplateJpaEntity, UUID> {

    /**
     * Kiểm tra tên ca đã tồn tại trong branch (trừ ID hiện tại — dùng khi update).
     *
     * @param branchId UUID chi nhánh
     * @param name     Tên ca
     * @param excludeId UUID cần loại trừ (null khi tạo mới)
     * @return true nếu đã tồn tại
     */
    @Query("SELECT COUNT(t) > 0 FROM ShiftTemplateJpaEntity t " +
           "WHERE t.branchId = :branchId AND t.name = :name " +
           "AND (:excludeId IS NULL OR t.id <> :excludeId)")
    boolean existsByBranchIdAndNameExcluding(
            @Param("branchId") UUID branchId,
            @Param("name") String name,
            @Param("excludeId") UUID excludeId);

    /**
     * Lấy tất cả ca mẫu đang active của một branch.
     *
     * @param branchId UUID chi nhánh
     * @return Danh sách ca mẫu active
     */
    List<ShiftTemplateJpaEntity> findByBranchIdAndActiveTrue(UUID branchId);

    /**
     * Lấy tất cả ca mẫu của một tenant (OWNER xem tất cả).
     *
     * @param tenantId UUID tenant
     * @return Danh sách tất cả ca mẫu
     */
    List<ShiftTemplateJpaEntity> findByTenantId(UUID tenantId);

    /**
     * Tìm ca mẫu theo ID và tenant (kiểm tra ownership).
     *
     * @param id       UUID ca mẫu
     * @param tenantId UUID tenant
     * @return Optional ShiftTemplateJpaEntity
     */
    Optional<ShiftTemplateJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}
