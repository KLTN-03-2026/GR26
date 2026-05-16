package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho DailyRevenueSummaryJpaEntity.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Repository
public interface DailyRevenueSummaryJpaRepository extends JpaRepository<DailyRevenueSummaryJpaEntity, UUID> {
    
    Optional<DailyRevenueSummaryJpaEntity> findByBranchIdAndDate(UUID branchId, LocalDate date);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT d FROM DailyRevenueSummaryJpaEntity d WHERE d.branchId = :branchId AND d.date = :date")
    Optional<DailyRevenueSummaryJpaEntity> findByBranchIdAndDateForUpdate(@org.springframework.data.repository.query.Param("branchId") UUID branchId, @org.springframework.data.repository.query.Param("date") LocalDate date);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = """
        INSERT INTO daily_revenue_summaries (id, tenant_id, branch_id, date, total_revenue, total_orders, avg_order_value, payment_breakdown, cost_of_goods)
        VALUES (:id, :tenantId, :branchId, :date, 0, 0, 0, '{"cash": 0, "momo": 0, "vietqr": 0, "banking": 0, "other": 0, "payos": 0}'::jsonb, 0)
        ON CONFLICT (branch_id, date) DO NOTHING
        """, nativeQuery = true)
    void initIfNotExists(
        @org.springframework.data.repository.query.Param("id") UUID id,
        @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
        @org.springframework.data.repository.query.Param("branchId") UUID branchId,
        @org.springframework.data.repository.query.Param("date") LocalDate date
    );
}
