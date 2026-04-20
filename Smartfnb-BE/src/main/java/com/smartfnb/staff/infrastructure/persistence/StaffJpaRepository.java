package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng users (Staff context).
 * Mọi truy vấn đều có tenant_id để đảm bảo multi-tenant isolation.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffJpaRepository
        extends JpaRepository<StaffJpaEntity, UUID>,
                JpaSpecificationExecutor<StaffJpaEntity> {

    /**
     * Kiểm tra phone đã tồn tại trong tenant chưa (trừ ID hiện tại — dùng khi update).
     *
     * @param tenantId UUID tenant
     * @param phone    Số điện thoại cần kiểm tra
     * @param excludeId UUID nhân viên loại trừ (null khi tạo mới)
     * @return true nếu phone đã tồn tại
     */
    @Query("""
        SELECT COUNT(s) > 0 FROM StaffJpaEntity s
        WHERE s.tenantId = :tenantId
          AND s.phone = :phone
          AND (:excludeId IS NULL OR s.id <> :excludeId)
        """)
    boolean existsByTenantIdAndPhoneExcluding(
            @Param("tenantId") UUID tenantId,
            @Param("phone") String phone,
            @Param("excludeId") UUID excludeId
    );

    /**
     * Lấy nhân viên theo ID + tenantId (chống IDOR).
     *
     * @param id       UUID nhân viên
     * @param tenantId UUID tenant
     * @return Optional nhân viên
     */
    Optional<StaffJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy tất cả nhân viên của tenant (không bao gồm deleted).
     *
     * @param tenantId UUID tenant
     * @return Danh sách nhân viên
     */
    List<StaffJpaEntity> findByTenantId(UUID tenantId);

    /**
     * Lấy nhân viên theo chức vụ trong tenant.
     *
     * @param tenantId   UUID tenant
     * @param positionId UUID chức vụ
     * @return Danh sách nhân viên có chức vụ đó
     */
    List<StaffJpaEntity> findByTenantIdAndPositionId(UUID tenantId, UUID positionId);

    /**
     * Lấy nhân viên theo trạng thái trong tenant.
     *
     * @param tenantId UUID tenant
     * @param status   Trạng thái: ACTIVE | INACTIVE | LOCKED
     * @return Danh sách nhân viên
     */
    List<StaffJpaEntity> findByTenantIdAndStatus(UUID tenantId, String status);
}
