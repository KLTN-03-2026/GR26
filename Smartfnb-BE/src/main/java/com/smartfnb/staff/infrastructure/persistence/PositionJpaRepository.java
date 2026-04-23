package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng positions (chức vụ nhân viên).
 * Mọi truy vấn đều filter theo tenantId.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface PositionJpaRepository extends JpaRepository<PositionJpaEntity, UUID> {

    /**
     * Lấy tất cả chức vụ đang hoạt động của tenant.
     *
     * @param tenantId UUID tenant
     * @return Danh sách chức vụ active
     */
    List<PositionJpaEntity> findByTenantIdAndActiveTrue(UUID tenantId);

    /**
     * Lấy tất cả chức vụ của tenant (kể cả inactive).
     *
     * @param tenantId UUID tenant
     * @return Danh sách chức vụ
     */
    List<PositionJpaEntity> findByTenantId(UUID tenantId);

    /**
     * Lấy chức vụ theo ID + tenantId (chống IDOR).
     *
     * @param id       UUID chức vụ
     * @param tenantId UUID tenant
     * @return Optional chức vụ
     */
    Optional<PositionJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Kiểm tra tên chức vụ đã tồn tại trong tenant chưa.
     *
     * @param tenantId UUID tenant
     * @param name     Tên chức vụ cần kiểm tra
     * @return true nếu đã tồn tại
     */
    boolean existsByTenantIdAndName(UUID tenantId, String name);
}
