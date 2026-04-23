package com.smartfnb.payment.application.dto;

import java.util.List;

/**
 * Response DTO cho search Invoice API.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record SearchInvoiceResponse(
    List<InvoiceItem> items,
    int totalItems,
    int pageNumber,
    int pageSize,
    int totalPages
) {
    public record InvoiceItem(
        java.util.UUID id,
        String invoiceNumber,
        java.util.UUID orderId,
        java.math.BigDecimal total,
        java.time.Instant issuedAt
    ) {}
}
