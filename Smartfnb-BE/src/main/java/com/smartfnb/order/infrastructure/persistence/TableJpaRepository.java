package com.smartfnb.order.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng tables.
 * Hỗ trợ soft delete, batch position update và query theo trạng thái bàn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface TableJpaRepository extends JpaRepository<TableJpaEntity, UUID> {

    /**
     * Lấy tất cả bàn chưa xóa của một chi nhánh, sắp xếp theo zone và tên.
     * Dùng cho màn hình sơ đồ bàn.
     *
     * @param branchId ID chi nhánh
     * @param tenantId ID tenant (multi-tenant isolation)
     * @return danh sách bàn chưa soft delete
     */
    List<TableJpaEntity> findByBranchIdAndTenantIdAndDeletedAtIsNullOrderByZoneIdAscNameAsc(
            UUID branchId, UUID tenantId);

    /**
     * Lấy bàn theo ID kết hợp tenantId (chống IDOR), chỉ lấy bàn chưa xóa.
     *
     * @param id       ID bàn
     * @param tenantId ID tenant
     * @return Optional bàn
     */
    Optional<TableJpaEntity> findByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    /**
     * Kiểm tra tên bàn đã tồn tại trong zone của chi nhánh chưa.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone (null-safe — dùng cho bàn chưa phân zone)
     * @param name     tên bàn
     * @return true nếu đã tồn tại
     */
    boolean existsByBranchIdAndZoneIdAndNameAndDeletedAtIsNull(
            UUID branchId, UUID zoneId, String name);

    /**
     * Kiểm tra tên bàn trùng khi update, loại trừ bản ghi đang sửa.
     *
     * @param branchId   ID chi nhánh
     * @param zoneId     ID zone
     * @param name       tên bàn mới
     * @param excludedId ID bàn đang sửa
     * @return true nếu tên đã tồn tại ở bàn khác
     */
    boolean existsByBranchIdAndZoneIdAndNameAndIdNotAndDeletedAtIsNull(
            UUID branchId, UUID zoneId, String name, UUID excludedId);

    /**
     * Lấy tất cả bàn trong một zone cụ thể — dùng khi xóa zone (kiểm tra còn bàn không).
     *
     * @param zoneId   ID zone
     * @param tenantId ID tenant
     * @return danh sách bàn chưa xóa trong zone
     */
    List<TableJpaEntity> findByZoneIdAndTenantIdAndDeletedAtIsNull(UUID zoneId, UUID tenantId);

    /**
     * Cập nhật vị trí X, Y của một bàn trong sơ đồ (dùng cho Drag & Drop single).
     * Dùng @Modifying native UPDATE để tránh load entity không cần thiết.
     *
     * @param tableId   ID bàn cần cập nhật
     * @param tenantId  ID tenant (chống IDOR)
     * @param positionX tọa độ X mới
     * @param positionY tọa độ Y mới
     */
    @Modifying
    @Query(value = "UPDATE tables SET position_x = :positionX, position_y = :positionY WHERE id = :tableId AND tenant_id = :tenantId AND deleted_at IS NULL", nativeQuery = true)
    void updatePosition(
            @Param("tableId") UUID tableId,
            @Param("tenantId") UUID tenantId,
            @Param("positionX") BigDecimal positionX,
            @Param("positionY") BigDecimal positionY);

    /**
     * Đếm số bàn đang OCCUPIED trong một chi nhánh.
     * Dùng cho dashboard thống kê nhanh.
     *
     * @param branchId ID chi nhánh
     * @param tenantId ID tenant
     * @return số bàn đang có khách
     */
    @Query("""
            SELECT COUNT(t) FROM TableJpaEntity t
            WHERE t.branchId = :branchId AND t.tenantId = :tenantId
              AND t.status = 'OCCUPIED' AND t.deletedAt IS NULL
            """)
    long countOccupiedTables(@Param("branchId") UUID branchId, @Param("tenantId") UUID tenantId);
}
