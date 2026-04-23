package com.smartfnb.inventory.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho các lô hàng nhập kho (stock_batches).
 * Hỗ trợ FIFO query: lấy batch cũ nhất còn hàng.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public interface StockBatchRepository {

    /**
     * Lấy danh sách batch còn hàng theo thứ tự FIFO (imported_at ASC).
     * Dùng khi xuất kho để trừ batch cũ nhất trước.
     *
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @return danh sách batch có quantity_remaining > 0, sắp xếp imported_at ASC
     */
    List<com.smartfnb.inventory.infrastructure.persistence.StockBatchJpaEntity>
        findAvailableBatchesFifo(UUID branchId, UUID itemId);

    /**
     * Tìm batch theo ID (với tenant check bảo mật IDOR).
     *
     * @param batchId  UUID của batch
     * @param tenantId UUID tenant
     * @return Optional batch entity
     */
    Optional<com.smartfnb.inventory.infrastructure.persistence.StockBatchJpaEntity>
        findByIdAndTenantId(UUID batchId, UUID tenantId);

    /**
     * Lưu một lô hàng nhập kho mới hoặc cập nhật existing.
     *
     * @param entity StockBatchJpaEntity cần lưu
     * @return entity sau khi save (có ID)
     */
    com.smartfnb.inventory.infrastructure.persistence.StockBatchJpaEntity
        save(com.smartfnb.inventory.infrastructure.persistence.StockBatchJpaEntity entity);
}
