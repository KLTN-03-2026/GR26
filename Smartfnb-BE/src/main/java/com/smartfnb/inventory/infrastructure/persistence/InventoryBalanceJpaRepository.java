package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho inventory_balances.
 * Dùng pessimistic lock khi update để tránh lost update.
 *
 * @author vutq
 * @since 2026-04-03
 */
@Repository
public interface InventoryBalanceJpaRepository
        extends JpaRepository<InventoryBalanceJpaEntity, UUID> {

    /**
     * Tìm bản ghi tồn kho với lock để update (tránh concurrent write mất dữ liệu).
     *
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @return Optional entity
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBalanceJpaEntity b " +
           "WHERE b.branchId = :branchId AND b.itemId = :itemId")
    Optional<InventoryBalanceJpaEntity> findByBranchIdAndItemIdForUpdate(
            @Param("branchId") UUID branchId,
            @Param("itemId") UUID itemId);

    /**
     * Tìm theo branchId và itemId (không lock — dùng cho read).
     */
    Optional<InventoryBalanceJpaEntity> findByBranchIdAndItemId(UUID branchId, UUID itemId);

    /**
     * Danh sách tồn kho theo chi nhánh (phân quyền OWNER/non-OWNER).
     */
    @Query("SELECT b FROM InventoryBalanceJpaEntity b " +
           "WHERE b.tenantId = :tenantId AND (:branchId IS NULL OR b.branchId = :branchId) " +
           "ORDER BY b.itemName ASC")
    List<InventoryBalanceJpaEntity> findByTenantAndBranch(
            @Param("tenantId") UUID tenantId,
            @Param("branchId") UUID branchId,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Đếm tổng số item trong tồn kho theo tenant và branch.
     */
    @Query("SELECT COUNT(b) FROM InventoryBalanceJpaEntity b " +
           "WHERE b.tenantId = :tenantId AND (:branchId IS NULL OR b.branchId = :branchId)")
    long countByTenantAndBranch(@Param("tenantId") UUID tenantId,
                                 @Param("branchId") UUID branchId);

    /**
     * Upsert: nếu đã có bản ghi thì update quantity, chưa có thì insert.
     * Dùng PostgreSQL ON CONFLICT.
     */
    @Modifying
    @Query(value = """
            INSERT INTO inventory_balances
                (id, tenant_id, branch_id, item_id, item_name, unit, quantity, min_level, version, updated_at)
            VALUES
                (uuid_generate_v4(), :tenantId, :branchId, :itemId, :itemName, :unit, :quantity, COALESCE(:minLevel, 0), 0, NOW())
            ON CONFLICT (branch_id, item_id)
            DO UPDATE SET
                /*
                 * [Hoàng | 2026-04-15 16:14 ICT | comment giữ logic cũ gốc từ dòng 75-78]
                 * quantity = inventory_balances.quantity + EXCLUDED.quantity,
                 * updated_at = NOW()
                 *
                 * Logic cũ không backfill item_name và unit, nên bản ghi đã lỡ null sẽ tiếp tục null mãi.
                 */
                item_name = COALESCE(EXCLUDED.item_name, inventory_balances.item_name),
                unit = COALESCE(EXCLUDED.unit, inventory_balances.unit),
                quantity = inventory_balances.quantity + EXCLUDED.quantity,
                updated_at = NOW()
            """, nativeQuery = true)
    void upsertBalance(@Param("tenantId") UUID tenantId,
                       @Param("branchId") UUID branchId,
                       @Param("itemId") UUID itemId,
                       @Param("itemName") String itemName,
                       @Param("unit") String unit,
                       @Param("quantity") BigDecimal quantity,
                       @Param("minLevel") BigDecimal minLevel);

    /**
     * Cập nhật ngưỡng cảnh báo tồn kho (min_level).
     */
    @Modifying
    @Query("UPDATE InventoryBalanceJpaEntity b SET b.minLevel = :minLevel, b.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE b.id = :id AND b.tenantId = :tenantId AND b.branchId = :branchId")
    int updateThreshold(@Param("id") UUID id, 
                        @Param("tenantId") UUID tenantId, 
                        @Param("branchId") UUID branchId, 
                        @Param("minLevel") BigDecimal minLevel);
}
