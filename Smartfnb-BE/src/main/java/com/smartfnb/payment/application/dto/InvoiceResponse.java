package com.smartfnb.payment.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO thông tin Invoice.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record InvoiceResponse(
    UUID id,
    UUID orderId,
    UUID paymentId,
    String invoiceNumber,
    BigDecimal subtotal,
    BigDecimal discount,
    BigDecimal taxAmount,
    BigDecimal total,
    Instant issuedAt,
    List<InvoiceItemResponse> items
) {
    public record InvoiceItemResponse(
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
    ) {}
}
