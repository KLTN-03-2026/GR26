package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.domain.model.DailyRevenueSummary.PaymentBreakdown;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng daily_revenue_summaries.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Entity
@Table(name = "daily_revenue_summaries",
    indexes = {
        @Index(name = "idx_daily_rev_branch_date", columnList = "branch_id, date DESC"),
        @Index(name = "idx_daily_rev_tenant_date", columnList = "tenant_id, date DESC")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_daily_rev_branch_date", columnNames = {"branch_id", "date"})
    }
)
@Data @NoArgsConstructor @AllArgsConstructor
@Builder
public class DailyRevenueSummaryJpaEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "total_revenue", precision = 12, scale = 2)
    private BigDecimal totalRevenue;
    
    @Column(name = "total_orders")
    private int totalOrders;
    
    @Column(name = "avg_order_value", precision = 12, scale = 2)
    private BigDecimal avgOrderValue;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payment_breakdown", columnDefinition = "jsonb")
    private PaymentBreakdownDto paymentBreakdown;
    
    @Column(name = "cost_of_goods", precision = 12, scale = 2)
    private BigDecimal costOfGoods;
    
    @Column(name = "gross_profit", precision = 12, scale = 2)
    private BigDecimal grossProfit;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    /**
     * Map từ Entity sang Domain Model.
     */
    public DailyRevenueSummary toDomain() {
        PaymentBreakdown breakdown = null;
        if (paymentBreakdown != null) {
            breakdown = new PaymentBreakdown(
                paymentBreakdown.cash(),
                paymentBreakdown.momo(),
                paymentBreakdown.vietqr(),
                paymentBreakdown.banking(),
                paymentBreakdown.other()
            );
        }
        
        return new DailyRevenueSummary(
            id, tenantId, branchId, date,
            totalRevenue, totalOrders, avgOrderValue,
            breakdown,
            costOfGoods, grossProfit
        );
    }
    
    /**
     * Map từ Domain Model sang Entity.
     */
    public static DailyRevenueSummaryJpaEntity fromDomain(DailyRevenueSummary domain) {
        PaymentBreakdownDto dto = null;
        if (domain.paymentBreakdown() != null) {
            dto = new PaymentBreakdownDto(
                domain.paymentBreakdown().cash(),
                domain.paymentBreakdown().momo(),
                domain.paymentBreakdown().vietqr(),
                domain.paymentBreakdown().banking(),
                domain.paymentBreakdown().other()
            );
        }
        
        return DailyRevenueSummaryJpaEntity.builder()
            .id(domain.id())
            .tenantId(domain.tenantId())
            .branchId(domain.branchId())
            .date(domain.date())
            .totalRevenue(domain.totalRevenue())
            .totalOrders(domain.totalOrders())
            .avgOrderValue(domain.avgOrderValue())
            .paymentBreakdown(dto)
            .costOfGoods(domain.costOfGoods())
            .grossProfit(domain.grossProfit())
            .updatedAt(Instant.now())
            .build();
    }
    
    /**
     * DTO cho payment_breakdown JSONB.
     */
    public record PaymentBreakdownDto(
        BigDecimal cash,
        BigDecimal momo,
        BigDecimal vietqr,
        BigDecimal banking,
        BigDecimal other
    ) {}
}
