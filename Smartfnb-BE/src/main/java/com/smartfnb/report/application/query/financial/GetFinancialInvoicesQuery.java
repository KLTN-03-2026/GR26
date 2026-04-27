package com.smartfnb.report.application.query.financial;

import lombok.Builder;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record GetFinancialInvoicesQuery(
    UUID tenantId,
    UUID branchId,
    LocalDate startDate,
    LocalDate endDate,
    // Author: Hoàng | Date: 2026-04-26 | Bug: BUG-financial-invoices-type-filter - Lọc sổ thu chi theo ALL/INCOME/EXPENSE
    String type,
    int page,
    int pageSize
) {
}
