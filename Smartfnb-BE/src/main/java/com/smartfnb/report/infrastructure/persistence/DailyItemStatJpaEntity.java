package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.DailyItemStat;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity cho bảng daily_item_stats.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Entity
@Table(name = "daily_item_stats",
    indexes = {
        @Index(name = "idx_item_stats_branch_date", columnList = "branch_id, date DESC")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_item_stat_branch_date", columnNames = {"branch_id", "item_id", "date"})
    }
)
@Data @NoArgsConstructor @AllArgsConstructor
@Builder
public class DailyItemStatJpaEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;
    
    @Column(name = "item_id", nullable = false)
    private UUID itemId;
    
    @Column(name = "item_name")
    private String itemName;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "qty_sold")
    private int qtySold;
    
    @Column(name = "revenue", precision = 12, scale = 2)
    private BigDecimal revenue;
    
    @Column(name = "cost", precision = 12, scale = 2)
    private BigDecimal cost;
    
    @Column(name = "gross_margin", precision = 5, scale = 2)
    private BigDecimal grossMargin;
    
    public DailyItemStat toDomain() {
        return new DailyItemStat(
            id, tenantId, branchId, itemId, itemName, date,
            qtySold, revenue, cost, grossMargin
        );
    }
    
    public static DailyItemStatJpaEntity fromDomain(DailyItemStat domain) {
        return DailyItemStatJpaEntity.builder()
            .id(domain.id())
            .tenantId(domain.tenantId())
            .branchId(domain.branchId())
            .itemId(domain.itemId())
            .itemName(domain.itemName())
            .date(domain.date())
            .qtySold(domain.qtySold())
            .revenue(domain.revenue())
            .cost(domain.cost())
            .grossMargin(domain.grossMargin())
            .build();
    }
}
