package com.smartfnb.menu.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng categories.
 * Tất cả query đều bao gồm tenantId để đảm bảo multi-tenant isolation.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface CategoryJpaRepository extends JpaRepository<CategoryJpaEntity, UUID> {

    /**
     * Kiểm tra tên danh mục đã tồn tại trong tenant chưa.
     * Dùng trước khi create/update để validate unique.
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
     * @param excludedId ID bản ghi đang update (loại trừ khỏi check)
     * @return true nếu tên đã tồn tại ở bản ghi khác
     */
    boolean existsByTenantIdAndNameAndIdNot(UUID tenantId, String name, UUID excludedId);

    /**
     * Lấy danh sách danh mục theo tenant, hỗ trợ phân trang.
     *
     * @param tenantId ID tenant
     * @param pageable tham số phân trang
     * @return trang danh sách danh mục
     */
    Page<CategoryJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Lấy danh mục theo ID và tenantId (chống IDOR).
     *
     * @param id       ID danh mục
     * @param tenantId ID tenant
     * @return Optional chứa danh mục hoặc empty
     */
    Optional<CategoryJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy tất cả danh mục đang active trong tenant (không phân trang — dùng cho dropdown).
     *
     * @param tenantId ID tenant
     * @param isActive trạng thái kích hoạt
     * @return danh sách danh mục
     */
    List<CategoryJpaEntity> findByTenantIdAndIsActiveOrderByDisplayOrderAsc(
            UUID tenantId, Boolean isActive);

    /**
     * Tìm kiếm danh mục theo từ khóa tên (ILIKE — không phân biệt hoa thường).
     *
     * @param tenantId ID tenant
     * @param keyword  từ khóa tìm kiếm
     * @param pageable tham số phân trang
     * @return trang kết quả tìm kiếm
     */
    Page<CategoryJpaEntity> findByTenantIdAndNameContainingIgnoreCase(
            UUID tenantId, String keyword, Pageable pageable);
}
