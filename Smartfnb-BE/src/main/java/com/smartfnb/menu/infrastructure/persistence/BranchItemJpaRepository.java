package com.smartfnb.menu.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng branch_items.
 * Quản lý giá bán và trạng thái của món ăn tại từng chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface BranchItemJpaRepository
        extends JpaRepository<BranchItemJpaEntity, BranchItemJpaEntity.BranchItemId> {

    /**
     * Tìm cài đặt branch item theo branchId và itemId.
     *
     * @param branchId ID chi nhánh
     * @param itemId   ID món ăn
     * @return Optional cài đặt branch item
     */
    Optional<BranchItemJpaEntity> findByIdBranchIdAndIdItemId(UUID branchId, UUID itemId);

    /**
     * Lấy tất cả branch items trong một chi nhánh.
     *
     * @param branchId ID chi nhánh
     * @return danh sách branch items
     */
    List<BranchItemJpaEntity> findByIdBranchId(UUID branchId);

    /**
     * Cập nhật hoặc tạo giá branch item (upsert).
     * Dùng ON CONFLICT DO UPDATE để tránh duplicate.
     *
     * @param branchId   ID chi nhánh
     * @param itemId     ID món ăn
     * @param price      giá tại chi nhánh (null = dùng base price)
     * @param available  trạng thái phục vụ
     */
    @Modifying
    @Query(value = """
            INSERT INTO branch_items (branch_id, item_id, branch_price, is_available)
            VALUES (:branchId, :itemId, :price, :available)
            ON CONFLICT (branch_id, item_id)
            DO UPDATE SET branch_price = :price, is_available = :available
            """, nativeQuery = true)
    void upsertBranchItem(
            @Param("branchId") UUID branchId,
            @Param("itemId") UUID itemId,
            @Param("price") BigDecimal price,
            @Param("available") boolean available);
}
