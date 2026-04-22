package com.smartfnb.report.application.query;

import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult;
import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult.PaymentMethodDto;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaRepository;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * QueryHandler: Lấy chi tiết thanh toán theo phương thức (Cash, MOMO, VIETQR, Banking).
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetPaymentMethodBreakdownQueryHandler {
    
    private final DailyRevenueSummaryJpaRepository dailyRevenueSummaryRepo;
    private final com.smartfnb.report.infrastructure.persistence.ReportDataAccessor reportDataAccessor;
    
    public PaymentMethodBreakdownResult handle(GetPaymentMethodBreakdownQuery query) {
        log.info("Lấy chi tiết thanh toán: branchId={}, date={}", query.branchId(), query.date());
        
        Optional<DailyRevenueSummaryJpaEntity> optionalSummary =
            dailyRevenueSummaryRepo.findByBranchIdAndDate(query.branchId(), query.date());
        
        if (optionalSummary.isEmpty()) {
            return buildEmptyBreakdown(query);
        }
        
        var summary = optionalSummary.get();
        BigDecimal totalRevenue = summary.getTotalRevenue() != null ? summary.getTotalRevenue() : BigDecimal.ZERO;
        int totalOrders = summary.getTotalOrders();
        
        var breakdown = summary.getPaymentBreakdown();
        if (breakdown == null) {
            return buildEmptyBreakdown(query);
        }
        
        // Tính phần trăm cho mỗi phương thức
        return new PaymentMethodBreakdownResult(
            query.date(),
            reportDataAccessor.getBranchName(query.branchId()).orElse("Unknown"),
            buildPaymentMethodDto("CASH", breakdown.cash(), totalOrders, totalRevenue),
            buildPaymentMethodDto("MOMO", breakdown.momo(), totalOrders, totalRevenue),
            buildPaymentMethodDto("VIETQR", breakdown.vietqr(), totalOrders, totalRevenue),
            buildPaymentMethodDto("BANKING", breakdown.banking(), totalOrders, totalRevenue),
            buildPaymentMethodDto("KHÁC (ZaloPay, Thẻ...)", breakdown.other(), totalOrders, totalRevenue),
            totalRevenue,
            totalOrders
        );
    }
    
    private PaymentMethodDto buildPaymentMethodDto(String method, BigDecimal amount, int totalOrders, BigDecimal totalRevenue) {
        BigDecimal percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0 ?
            amount.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
            BigDecimal.ZERO;
        
        // Estimate transaction count (chia by average transaction value)
        // Tạm thời estimate là 1 giao dịch = amount / (totalRevenue / totalOrders)
        int transactionCount = totalOrders > 0 && amount.compareTo(BigDecimal.ZERO) > 0 ?
            (int) Math.round(amount.doubleValue() / (totalRevenue.doubleValue() / totalOrders)) :
            0;
        
        return new PaymentMethodDto(method, amount, transactionCount, percentage);
    }
    
    private PaymentMethodBreakdownResult buildEmptyBreakdown(GetPaymentMethodBreakdownQuery query) {
        BigDecimal zero = BigDecimal.ZERO;
        return new PaymentMethodBreakdownResult(
            query.date(),
            reportDataAccessor.getBranchName(query.branchId()).orElse("Unknown"),
            new PaymentMethodDto("CASH", zero, 0, zero),
            new PaymentMethodDto("MOMO", zero, 0, zero),
            new PaymentMethodDto("VIETQR", zero, 0, zero),
            new PaymentMethodDto("BANKING", zero, 0, zero),
            new PaymentMethodDto("KHÁC (ZaloPay, Thẻ...)", zero, 0, zero),
            zero,
            0
        );
    }
}
