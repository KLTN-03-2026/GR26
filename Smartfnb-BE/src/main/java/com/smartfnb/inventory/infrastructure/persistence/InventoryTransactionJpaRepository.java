package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho inventory_transactions.
 * Chỉ INSERT — không UPDATE (audit trail bất biến).
 * Hỗ trợ query phân trang cho lịch sử giao dịch kho.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Repository
public interface InventoryTransactionJpaRepository
        extends JpaRepository<InventoryTransactionJpaEntity, UUID> {

    // Chỉ dùng save() để ghi log — audit trail bất biến

    /**
     * Lấy lịch sử giao dịch có filter, phân trang — dùng cho FE audit kho.
     * Các filter đều tùy chọn, nếu null thì không áp dụng.
     *
     * @param tenantId ID tenant (bắt buộc — multi-tenant)
     * @param branchId ID chi nhánh (bắt buộc)
     * @param type     loại giao dịch: IMPORT | SALE_DEDUCT | WASTE | ADJUSTMENT | PRODUCTION_IN | PRODUCTION_OUT
     * @param from     từ thời điểm (incl.)
     * @param to       đến thời điểm (incl.)
     * @param pageable phân trang + sort
     * @return trang lịch sử giao dịch
     */
    @Query("SELECT t FROM InventoryTransactionJpaEntity t " +
           "WHERE t.tenantId = :tenantId AND t.branchId = :branchId " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND t.createdAt >= :from " +
           "AND t.createdAt <= :to " +
           "ORDER BY t.createdAt DESC")
    Page<InventoryTransactionJpaEntity> findFiltered(
            @Param("tenantId") UUID tenantId,
            @Param("branchId") UUID branchId,
            @Param("type") String type,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);
}
