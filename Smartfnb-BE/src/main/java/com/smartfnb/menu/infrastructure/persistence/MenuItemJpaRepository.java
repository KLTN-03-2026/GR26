package com.smartfnb.menu.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng items (menu items).
 * Hỗ trợ Specification để tìm kiếm động và pg_trgm search.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface MenuItemJpaRepository
        extends JpaRepository<MenuItemJpaEntity, UUID>,
                JpaSpecificationExecutor<MenuItemJpaEntity> {

    /**
     * Kiểm tra tên món ăn đã tồn tại trong tenant chưa (kể cả đã soft delete).
     *
     * @param tenantId ID tenant
     * @param name     tên cần kiểm tra
     * @return true nếu đã tồn tại
     */
    boolean existsByTenantIdAndNameAndDeletedAtIsNull(UUID tenantId, String name);

    /**
     * Kiểm tra tên trùng khi update — loại trừ bản ghi đang sửa.
     *
     * @param tenantId   ID tenant
     * @param name       tên cần kiểm tra
     * @param excludedId ID bản ghi đang update
     * @return true nếu tên đã tồn tại ở bản ghi khác
     */
    boolean existsByTenantIdAndNameAndIdNotAndDeletedAtIsNull(
            UUID tenantId, String name, UUID excludedId);

    /**
     * Lấy tất cả món ăn chưa xóa theo tenant và loại, hỗ trợ phân trang.
     *
     * @param tenantId ID tenant
     * @param type     loại item (SELLABLE | INGREDIENT | SUB_ASSEMBLY)
     * @param pageable tham số phân trang
     * @return trang danh sách món ăn
     */
    Page<MenuItemJpaEntity> findByTenantIdAndTypeAndDeletedAtIsNull(
            UUID tenantId, String type, Pageable pageable);

    /**
     * Lấy món ăn theo ID và tenant (chống IDOR), chỉ lấy chưa xóa.
     *
     * @param id       ID món ăn
     * @param tenantId ID tenant
     * @return Optional chứa món ăn hoặc empty
     */
    Optional<MenuItemJpaEntity> findByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    /**
     * Lấy tất cả món ăn đang active trong danh mục — dùng khi deactivate category.
     *
     * @param categoryId ID danh mục
     * @param tenantId   ID tenant
     * @return danh sách món ăn trong danh mục
     */
    List<MenuItemJpaEntity> findByCategoryIdAndTenantIdAndDeletedAtIsNull(
            UUID categoryId, UUID tenantId);

    /**
     * Tìm kiếm món bằng pg_trgm similarity — tìm kiếm mờ (fuzzy search).
     * Sử dụng native query để tận dụng GIN index pg_trgm.
     *
     * @param tenantId ID tenant
     * @param keyword  từ khóa tìm kiếm
     * @param pageable tham số phân trang
     * @return trang kết quả tìm kiếm
     */
    @Query(value = """
            SELECT i.* FROM items i
            WHERE i.tenant_id = :tenantId
              AND i.deleted_at IS NULL
              AND i.type = 'SELLABLE'
              AND (i.name ILIKE '%' || :keyword || '%'
                   OR similarity(i.name, :keyword) > 0.2)
            ORDER BY similarity(i.name, :keyword) DESC
            """,
            countQuery = """
            SELECT count(*) FROM items i
            WHERE i.tenant_id = :tenantId
              AND i.deleted_at IS NULL
              AND i.type = 'SELLABLE'
              AND (i.name ILIKE '%' || :keyword || '%'
                   OR similarity(i.name, :keyword) > 0.2)
            """,
            nativeQuery = true)
    Page<MenuItemJpaEntity> searchByNameTrgm(
            @Param("tenantId") UUID tenantId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * Lấy tất cả món ăn active không phân trang — dùng cho dropdown picker tại POS.
     *
     * @param tenantId ID tenant
     * @return danh sách món ăn active
     */
    @Query("SELECT m FROM MenuItemJpaEntity m WHERE m.tenantId = :tenantId " +
           "AND m.type = 'SELLABLE' AND m.isActive = true AND m.deletedAt IS NULL " +
           "ORDER BY m.name ASC")
    List<MenuItemJpaEntity> findAllActiveByTenant(@Param("tenantId") UUID tenantId);
}
