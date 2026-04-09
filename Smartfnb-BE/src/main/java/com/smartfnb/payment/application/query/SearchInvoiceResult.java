package com.smartfnb.payment.application.query;

import java.util.List;

/**
 * Result khi search Invoice.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record SearchInvoiceResult(
    List<InvoiceSearchItem> items,
    int totalItems,
    int pageNumber,
    int pageSize,
    int totalPages
) {
    public record InvoiceSearchItem(
        java.util.UUID id,
        String invoiceNumber,
        java.util.UUID orderId,
        java.math.BigDecimal total,
        java.time.Instant issuedAt
    ) {}
}
