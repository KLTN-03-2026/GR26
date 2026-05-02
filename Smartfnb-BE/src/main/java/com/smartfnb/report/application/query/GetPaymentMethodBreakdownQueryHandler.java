package com.smartfnb.report.application.query;

import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult;
import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult.PaymentMethodDto;
import com.smartfnb.report.domain.model.DailyRevenueSummary.PaymentBreakdown;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaRepository;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaEntity;
import com.smartfnb.payment.infrastructure.persistence.PaymentJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * QueryHandler: Lấy chi tiết thanh toán theo phương thức (Cash, MOMO, VIETQR, Banking).
 *
 * @author vutq
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetPaymentMethodBreakdownQueryHandler {
    
    private final DailyRevenueSummaryJpaRepository dailyRevenueSummaryRepo;
    private final PaymentJpaRepository paymentJpaRepository;
    
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
        
        // BUG FIX: Lấy transactionCount thực tế từ bảng payments thay vì tính estimate sai sót
        Map<String, Integer> actualCounts = fetchActualTransactionCounts(query.branchId(), query.date().toString());
        
        // Tính phần trăm cho mỗi phương thức
        return new PaymentMethodBreakdownResult(
            query.date(),
            "Branch Name",  // TODO: Lấy tên branch
            buildPaymentMethodDto("CASH", breakdown.cash(), actualCounts.getOrDefault("CASH", 0), totalRevenue),
            buildPaymentMethodDto("MOMO", breakdown.momo(), actualCounts.getOrDefault("MOMO", 0), totalRevenue),
            buildPaymentMethodDto("VIETQR", breakdown.vietqr(), actualCounts.getOrDefault("VIETQR", 0), totalRevenue),
            buildPaymentMethodDto("BANKING", breakdown.banking(), actualCounts.getOrDefault("BANKING", 0), totalRevenue),
            buildPaymentMethodDto("OTHER", breakdown.other(), actualCounts.getOrDefault("OTHER", 0), totalRevenue),
            buildPaymentMethodDto("PAYOS", breakdown.payos(), actualCounts.getOrDefault("PAYOS", 0), totalRevenue),
            totalRevenue,
            totalOrders
        );
    }
    
    /**
     * Lấy số lượng giao dịch thực tế từ bảng payments (tránh đoán count từ average order value).
     */
    private Map<String, Integer> fetchActualTransactionCounts(java.util.UUID branchId, String date) {
        List<Object[]> aggregates = paymentJpaRepository.aggregateByMethodForBranchAndDate(branchId, date);
        return aggregates.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> ((Number) row[1]).intValue()
            ));
    }
    
    private PaymentMethodDto buildPaymentMethodDto(String method, BigDecimal amount, int transactionCount, BigDecimal totalRevenue) {
        BigDecimal percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0 ?
            amount.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
            BigDecimal.ZERO;
        
        return new PaymentMethodDto(method, amount, transactionCount, percentage);
    }
    
    private PaymentMethodBreakdownResult buildEmptyBreakdown(GetPaymentMethodBreakdownQuery query) {
        BigDecimal zero = BigDecimal.ZERO;
        return new PaymentMethodBreakdownResult(
            query.date(),
            "Branch Name",
            new PaymentMethodDto("CASH", zero, 0, zero),
            new PaymentMethodDto("MOMO", zero, 0, zero),
            new PaymentMethodDto("VIETQR", zero, 0, zero),
            new PaymentMethodDto("BANKING", zero, 0, zero),
            new PaymentMethodDto("OTHER", zero, 0, zero),
            new PaymentMethodDto("PAYOS", zero, 0, zero),
            zero,
            0
        );
    }
}
