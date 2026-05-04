package com.smartfnb.report.application.dto.financial;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancialInvoiceDto(
    UUID id,
    String type,          // INCOME, EXPENSE
    String referenceCode, // invoiceNumber, categoryName
    BigDecimal amount,
    Instant transactionDate,
    String paymentMethod,
    String description
) {
}
