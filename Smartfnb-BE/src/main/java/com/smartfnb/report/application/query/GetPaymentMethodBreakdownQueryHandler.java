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
        
        // Author: Hoàng | date: 2026-05-02 | note: Lấy cả count lẫn amount từ bảng payments thực tế.
        // Bug gốc: fetchActualTransactionCounts() bỏ qua cột row[2] (amount) → dùng breakdown từ
        // daily_revenue_summaries có thể bị stale/zero khi PaymentCompletedEvent chưa xử lý xong.
        Map<String, long[]> actualData = fetchActualPaymentData(query.branchId(), query.date().toString());

        // Ưu tiên amount từ bảng payments thực tế; fallback sang summary breakdown nếu không có giao dịch nào
        return new PaymentMethodBreakdownResult(
            query.date(),
            "Branch Name",  // TODO: Lấy tên branch
            buildPaymentMethodDtoFromActual("CASH",    actualData, breakdown.cash(),    totalRevenue),
            buildPaymentMethodDtoFromActual("MOMO",    actualData, breakdown.momo(),    totalRevenue),
            buildPaymentMethodDtoFromActual("VIETQR",  actualData, breakdown.vietqr(),  totalRevenue),
            buildPaymentMethodDtoFromActual("BANKING", actualData, breakdown.banking(), totalRevenue),
            buildPaymentMethodDtoFromActual("OTHER",   actualData, breakdown.other(),   totalRevenue),
            buildPaymentMethodDtoFromActual("PAYOS",   actualData, breakdown.payos(),   totalRevenue),
            totalRevenue,
            totalOrders
        );
    }

    /**
     * Lấy count và amount thực tế từ bảng payments.
     * Query trả về: [method (String), count (Number), total (Number)]
     * Author: Hoàng | date: 2026-05-02
     */
    private Map<String, long[]> fetchActualPaymentData(java.util.UUID branchId, String date) {
        List<Object[]> aggregates = paymentJpaRepository.aggregateByMethodForBranchAndDate(branchId, date);
        return aggregates.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> new long[]{
                    ((Number) row[1]).longValue(),                          // [0] = count
                    ((Number) row[2]).longValue()                           // [1] = amount (VND)
                }
            ));
    }

    /**
     * Build PaymentMethodDto: ưu tiên amount từ bảng payments thực tế.
     * Author: Hoàng | date: 2026-05-02
     */
    private PaymentMethodDto buildPaymentMethodDtoFromActual(
            String method, Map<String, long[]> actualData,
            BigDecimal summaryAmount, BigDecimal totalRevenue) {
        long[] data = actualData.get(method);
        int count  = data != null ? (int) data[0] : 0;
        BigDecimal amount = data != null
            ? new BigDecimal(data[1])
            : (summaryAmount != null ? summaryAmount : BigDecimal.ZERO);
        return buildPaymentMethodDto(method, amount, count, totalRevenue);
    }

    /** @deprecated Thay bằng fetchActualPaymentData + buildPaymentMethodDtoFromActual */
    @SuppressWarnings("unused")
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
