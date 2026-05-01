package com.smartfnb.report.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Kết quả thanh toán theo phương thức.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record PaymentMethodBreakdownResult(
    LocalDate date,
    String branchName,
    PaymentMethodDto cashBreakdown,
    PaymentMethodDto momoBreakdown,
    PaymentMethodDto vietqrBreakdown,
    PaymentMethodDto bankingBreakdown,
    PaymentMethodDto otherBreakdown,
    PaymentMethodDto payosBreakdown,
    BigDecimal totalRevenue,
    int totalOrders
) {
    public record PaymentMethodDto(
        String method,
        BigDecimal amount,
        int transactionCount,
        BigDecimal percentage
    ) {}
}
