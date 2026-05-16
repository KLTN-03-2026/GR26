package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho DailyItemStatJpaEntity.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Repository
public interface DailyItemStatJpaRepository extends JpaRepository<DailyItemStatJpaEntity, UUID> {
    
    Optional<DailyItemStatJpaEntity> findByBranchIdAndItemIdAndDate(UUID branchId, UUID itemId, LocalDate date);
    
    List<DailyItemStatJpaEntity> findByBranchIdAndDateOrderByRevenueDesc(UUID branchId, LocalDate date);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = """
        INSERT INTO daily_item_stats (id, tenant_id, branch_id, item_id, item_name, date, qty_sold, revenue, cost)
        VALUES (:id, :tenantId, :branchId, :itemId, :itemName, :date, :qtySold, :revenue, :cost)
        ON CONFLICT (branch_id, item_id, date) DO UPDATE SET
            qty_sold = daily_item_stats.qty_sold + EXCLUDED.qty_sold,
            revenue = daily_item_stats.revenue + EXCLUDED.revenue,
            cost = daily_item_stats.cost + EXCLUDED.cost,
            item_name = CASE
                            WHEN daily_item_stats.item_name IS NULL OR daily_item_stats.item_name = 'Chưa xác định' THEN EXCLUDED.item_name
                            ELSE daily_item_stats.item_name
                        END
        """, nativeQuery = true)
    void upsertItemStat(
        @org.springframework.data.repository.query.Param("id") UUID id,
        @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
        @org.springframework.data.repository.query.Param("branchId") UUID branchId,
        @org.springframework.data.repository.query.Param("itemId") UUID itemId,
        @org.springframework.data.repository.query.Param("itemName") String itemName,
        @org.springframework.data.repository.query.Param("date") LocalDate date,
        @org.springframework.data.repository.query.Param("qtySold") int qtySold,
        @org.springframework.data.repository.query.Param("revenue") java.math.BigDecimal revenue,
        @org.springframework.data.repository.query.Param("cost") java.math.BigDecimal cost
    );
}
