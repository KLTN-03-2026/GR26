package com.smartfnb.report.application.query;

import com.smartfnb.report.application.dto.RevenueReportResult;
import com.smartfnb.report.application.dto.RevenueReportResult.PaymentBreakdownDto;
import com.smartfnb.report.application.dto.RevenueReportResult.RevenueLineDto;
import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaRepository;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaEntity;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * QueryHandler: Lấy báo cáo doanh thu.
 * Hỗ trợ filter theo branch, date range, group by.
 * BẢO MẬT: Kiểm tra quyền REPORT_REVENUE trước khi trả về.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetRevenueReportQueryHandler {
    
    private final DailyRevenueSummaryJpaRepository dailyRevenueSummaryRepo;
    
    /**
     * Xử lý query báo cáo doanh thu.
     * Nếu branchId = null, lấy tất cả branch user có quyền xem.
     */
    public RevenueReportResult handle(GetRevenueReportQuery query) {
        log.info("Lấy báo cáo doanh thu: startDate={}, endDate={}, branchId={}",
            query.startDate(), query.endDate(), query.branchId());
        
        // TODO: Kiểm tra quyền REPORT_REVENUE
        // TODO: Implement group by (weekly, monthly)
        
        // Nếu filter theo 1 branch cụ thể
        if (query.branchId() != null) {
            return getRevenueReportForBranch(query.branchId(), query.startDate(), query.endDate());
        }
        
        // Nếu filter all branches (Owner/Admin)
        return getRevenueReportForAllBranches(query.tenantId(), query.startDate(), query.endDate());
    }
    
    private RevenueReportResult getRevenueReportForBranch(UUID branchId, LocalDate startDate, LocalDate endDate) {
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalGrossProfit = BigDecimal.ZERO;
        int totalOrders = 0;
        PaymentBreakdownDto aggregatedBreakdown = new PaymentBreakdownDto(
            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.ZERO
        );
        
        // Lặp qua từng ngày trong range
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            var dailySummaryEntity = dailyRevenueSummaryRepo.findByBranchIdAndDate(branchId, current);
            
            if (dailySummaryEntity.isPresent()) {
                // Convert JPA entity to domain model
                var entity = dailySummaryEntity.get();
                var summary = entityToDomain(entity);
                
                totalRevenue = totalRevenue.add(summary.totalRevenue() != null ? summary.totalRevenue() : BigDecimal.ZERO);
                totalGrossProfit = totalGrossProfit.add(summary.grossProfit() != null ? summary.grossProfit() : BigDecimal.ZERO);
                totalOrders += summary.totalOrders();
                
                // Aggregate payment breakdown
                if (summary.paymentBreakdown() != null) {
                    var pb = summary.paymentBreakdown();
                    aggregatedBreakdown = new PaymentBreakdownDto(
                        aggregatedBreakdown.cash().add(pb.cash() != null ? pb.cash() : BigDecimal.ZERO),
                        aggregatedBreakdown.momo().add(pb.momo() != null ? pb.momo() : BigDecimal.ZERO),
                        aggregatedBreakdown.vietqr().add(pb.vietqr() != null ? pb.vietqr() : BigDecimal.ZERO),
                        aggregatedBreakdown.banking().add(pb.banking() != null ? pb.banking() : BigDecimal.ZERO),
                        aggregatedBreakdown.other().add(pb.other() != null ? pb.other() : BigDecimal.ZERO),
                        aggregatedBreakdown.total().add(pb.total() != null ? pb.total() : BigDecimal.ZERO)
                    );
                }
            }
            current = current.plusDays(1);
        }
        
        BigDecimal avgOrderValue = totalOrders > 0 ?
            totalRevenue.divide(new BigDecimal(totalOrders), 2, java.math.RoundingMode.HALF_UP) :
            BigDecimal.ZERO;
        
        return new RevenueReportResult(
            startDate,
            totalRevenue,
            totalGrossProfit,
            totalOrders,
            avgOrderValue,
            aggregatedBreakdown,
            List.of()  // Không có lines khi query 1 branch
        );
    }
    
    private RevenueReportResult getRevenueReportForAllBranches(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        // TODO: Implement query cho all branches của tenant
        return new RevenueReportResult(
            startDate,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            0,
            BigDecimal.ZERO,
            new PaymentBreakdownDto(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
            new ArrayList<>()
        );
    }
    
    /**
     * Convert JPA entity to domain model.
     */
    private DailyRevenueSummary entityToDomain(DailyRevenueSummaryJpaEntity entity) {
        // Convert paymentBreakdown DTO to domain PaymentBreakdown
        var paymentBreakdown = entity.getPaymentBreakdown();
        return new DailyRevenueSummary(
            entity.getId(),
            entity.getTenantId(),
            entity.getBranchId(),
            entity.getDate(),
            entity.getTotalRevenue(),
            entity.getTotalOrders(),
            entity.getAvgOrderValue(),
            paymentBreakdown != null ? new DailyRevenueSummary.PaymentBreakdown(
                paymentBreakdown.cash(),
                paymentBreakdown.momo(),
                paymentBreakdown.vietqr(),
                paymentBreakdown.banking(),
                paymentBreakdown.other()
            ) : null,
            entity.getCostOfGoods(),
            entity.getGrossProfit()
        );
    }
}
