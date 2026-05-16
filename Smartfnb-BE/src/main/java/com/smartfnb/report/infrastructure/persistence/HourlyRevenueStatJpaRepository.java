package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho HourlyRevenueStatJpaEntity.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Repository
public interface HourlyRevenueStatJpaRepository extends JpaRepository<HourlyRevenueStatJpaEntity, UUID> {
    
    Optional<HourlyRevenueStatJpaEntity> findByBranchIdAndDateAndHour(UUID branchId, LocalDate date, int hour);
    
    List<HourlyRevenueStatJpaEntity> findByBranchIdAndDateOrderByHour(UUID branchId, LocalDate date);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = """
        INSERT INTO hourly_revenue_stats (id, branch_id, date, hour, order_count, revenue)
        VALUES (:id, :branchId, :date, :hour, :orderCount, :revenue)
        ON CONFLICT (branch_id, date, hour) DO UPDATE SET
            order_count = hourly_revenue_stats.order_count + EXCLUDED.order_count,
            revenue = hourly_revenue_stats.revenue + EXCLUDED.revenue
        """, nativeQuery = true)
    void upsertHourlyStat(
        @org.springframework.data.repository.query.Param("id") UUID id,
        @org.springframework.data.repository.query.Param("branchId") UUID branchId,
        @org.springframework.data.repository.query.Param("date") LocalDate date,
        @org.springframework.data.repository.query.Param("hour") int hour,
        @org.springframework.data.repository.query.Param("orderCount") int orderCount,
        @org.springframework.data.repository.query.Param("revenue") java.math.BigDecimal revenue
    );
}
