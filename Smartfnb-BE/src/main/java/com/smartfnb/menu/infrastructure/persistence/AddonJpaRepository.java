package com.smartfnb.menu.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng addons.
 * Tất cả query đều bao gồm tenantId để đảm bảo multi-tenant isolation.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface AddonJpaRepository extends JpaRepository<AddonJpaEntity, UUID> {

    /**
     * Kiểm tra tên addon đã tồn tại trong tenant chưa.
     *
     * @param tenantId ID tenant
     * @param name     tên cần kiểm tra
     * @return true nếu đã tồn tại
     */
    boolean existsByTenantIdAndName(UUID tenantId, String name);

    /**
     * Kiểm tra tên trùng khi update — loại trừ bản ghi đang sửa.
     *
     * @param tenantId   ID tenant
     * @param name       tên cần kiểm tra
     * @param excludedId ID bản ghi đang update
     * @return true nếu tên đã tồn tại ở bản ghi khác
     */
    boolean existsByTenantIdAndNameAndIdNot(UUID tenantId, String name, UUID excludedId);

    /**
     * Lấy addon theo ID và tenant (chống IDOR).
     *
     * @param id       ID addon
     * @param tenantId ID tenant
     * @return Optional chứa addon hoặc empty
     */
    Optional<AddonJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy danh sách addon theo tenant, hỗ trợ phân trang.
     *
     * @param tenantId ID tenant
     * @param pageable tham số phân trang
     * @return trang danh sách addon
     */
    Page<AddonJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Lấy danh sách addon active theo tenant (không phân trang — POS dropdown).
     *
     * @param tenantId ID tenant
     * @param isActive trạng thái kích hoạt
     * @return danh sách addon đang active
     */
    java.util.List<AddonJpaEntity> findByTenantIdAndIsActive(UUID tenantId, Boolean isActive);
}
