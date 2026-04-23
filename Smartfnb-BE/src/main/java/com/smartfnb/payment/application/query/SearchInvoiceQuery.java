package com.smartfnb.payment.application.query;

import java.util.UUID;

/**
 * Query tìm kiếm Invoice với các điều kiện lọc.
 * Bao gồm: date range (90 ngày), invoice number, status.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record SearchInvoiceQuery(
    UUID branchId,
    String invoiceNumber,           // Optional: tìm kiếm theo số hóa đơn
    Integer pageNumber,
    Integer pageSize
) {
    public SearchInvoiceQuery {
        if (pageNumber == null || pageNumber < 0) pageNumber = 0;
        if (pageSize == null || pageSize <= 0) pageSize = 20;
        if (pageSize > 100) pageSize = 100;  // Limit max pageSize
    }
}
