package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.HourlyRevenueStat;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity cho bảng hourly_revenue_stats (heatmap).
 *
 * @author vutq
 * @since 2026-04-16
 */
@Entity
@Table(name = "hourly_revenue_stats",
    indexes = {
        @Index(name = "idx_hourly_branch_date", columnList = "branch_id, date DESC")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_hourly_branch_date_hour", 
            columnNames = {"branch_id", "date", "hour"})
    }
)
@Data @NoArgsConstructor @AllArgsConstructor
@Builder
public class HourlyRevenueStatJpaEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "hour", nullable = false)
    private short hour;
    
    @Column(name = "order_count")
    private int orderCount;
    
    @Column(name = "revenue", precision = 12, scale = 2)
    private BigDecimal revenue;
    
    public HourlyRevenueStat toDomain() {
        return new HourlyRevenueStat(
            id, branchId, date, (int) hour, orderCount, revenue
        );
    }
    
    public static HourlyRevenueStatJpaEntity fromDomain(HourlyRevenueStat domain) {
        return HourlyRevenueStatJpaEntity.builder()
            .id(domain.id())
            .branchId(domain.branchId())
            .date(domain.date())
            .hour((short) domain.hour())
            .orderCount(domain.orderCount())
            .revenue(domain.revenue())
            .build();
    }
}
