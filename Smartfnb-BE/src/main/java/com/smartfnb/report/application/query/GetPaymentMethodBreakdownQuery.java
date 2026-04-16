package com.smartfnb.report.application.query;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query: Lấy chi tiết thanh toán theo phương thức.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record GetPaymentMethodBreakdownQuery(
    UUID branchId,
    LocalDate date
) {
}
