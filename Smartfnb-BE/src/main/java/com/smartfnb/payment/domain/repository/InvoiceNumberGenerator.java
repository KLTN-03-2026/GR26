package com.smartfnb.payment.domain.repository;

import java.util.UUID;

/**
 * Service để sinh ra invoice_number duy nhất.
 * Có thể implement bằng Redis counter hoặc Database sequence.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface InvoiceNumberGenerator {
    /**
     * Sinh ra invoice_number duy nhất cho chi nhánh.
     * Format: INV-{BRANCH_CODE}-YYYYMMDD-{COUNTER}
     * Ví dụ: INV-ABC-20260401-000123
     */
    String generateInvoiceNumber(UUID branchId);
}
