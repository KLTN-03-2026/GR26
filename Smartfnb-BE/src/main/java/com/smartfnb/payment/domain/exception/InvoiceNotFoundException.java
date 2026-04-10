package com.smartfnb.payment.domain.exception;

import java.util.UUID;

/**
 * Exception được ném khi Invoice không tồn tại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class InvoiceNotFoundException extends RuntimeException {
    public InvoiceNotFoundException(UUID invoiceId) {
        super(String.format("Hóa đơn '%s' không tồn tại", invoiceId));
    }

    public InvoiceNotFoundException(String invoiceNumber) {
        super(String.format("Hóa đơn '%s' không tồn tại", invoiceNumber));
    }
}
