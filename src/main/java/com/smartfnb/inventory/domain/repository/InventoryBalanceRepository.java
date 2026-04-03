package com.smartfnb.inventory.domain.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho tồn kho hiện tại (inventory_balances).
 * Chỉ interface thuần Java — không import JPA.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public interface InventoryBalanceRepository {

    /**
     * Tìm bản ghi tồn kho theo branchId và itemId.
     * Sử dụng SKIP LOCKED cho concurrent update.
     *
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @return Optional chứa InventoryBalanceEntity
     */
    Optional<com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity>
        findByBranchIdAndItemId(UUID branchId, UUID itemId);

    /**
     * Tìm tồn kho theo tenantId và branchId, có phân trang.
     *
     * @param tenantId UUID tenant
     * @param branchId UUID chi nhánh (null = tất cả chi nhánh — chỉ OWNER)
     * @param page     trang hiện tại (0-indexed)
     * @param size     số phần tử mỗi trang
     * @return danh sách entity tồn kho
     */
    List<com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity>
        findByTenantAndBranch(UUID tenantId, UUID branchId, int page, int size);

    /**
     * Đếm tổng số item trong tồn kho theo branch.
     *
     * @param tenantId UUID tenant
     * @param branchId UUID chi nhánh
     * @return số lượng bản ghi
     */
    long countByTenantAndBranch(UUID tenantId, UUID branchId);

    /**
     * Lưu hoặc cập nhật tồn kho (upsert).
     *
     * @param entity entity tồn kho cần lưu
     */
    void save(com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity entity);

    /**
     * Tăng tồn kho theo số lượng nhập (optimistic lock qua version).
     *
     * @param branchId branchId
     * @param itemId   itemId
     * @param quantity số lượng tăng
     */
    void increaseQuantity(UUID branchId, UUID itemId, BigDecimal quantity);

    /**
     * Giảm tồn kho (optimistic lock qua version).
     * Throw InsufficientStockException nếu không đủ.
     *
     * @param branchId branchId
     * @param itemId   itemId
     * @param quantity số lượng giảm (dương)
     */
    void decreaseQuantity(UUID branchId, UUID itemId, BigDecimal quantity);
}
