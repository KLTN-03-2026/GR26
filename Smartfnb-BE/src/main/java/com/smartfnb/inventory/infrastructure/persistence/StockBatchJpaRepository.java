package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho stock_batches.
 * Hỗ trợ truy vấn FIFO — sắp xếp theo imported_at ASC, chỉ lấy batch còn hàng.
 *
 * @author vutq
 * @since 2026-04-03
 */
@Repository
public interface StockBatchJpaRepository
        extends JpaRepository<StockBatchJpaEntity, UUID> {

    /**
     * Lấy danh sách batch còn hàng theo FIFO với PESSIMISTIC WRITE lock.
     * Dùng khi xuất kho để tránh concurrent deduction gây âm kho.
     *
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @return danh sách batch sắp xếp theo imported_at ASC (cũ nhất trước)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM StockBatchJpaEntity b " +
           "WHERE b.branchId = :branchId AND b.itemId = :itemId " +
           "AND b.quantityRemaining > 0 " +
           "ORDER BY b.importedAt ASC")
    List<StockBatchJpaEntity> findAvailableBatchesFifoForUpdate(
            @Param("branchId") UUID branchId,
            @Param("itemId") UUID itemId);

    /**
     * Tìm batch theo ID với tenant check (chống IDOR).
     */
    Optional<StockBatchJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}
