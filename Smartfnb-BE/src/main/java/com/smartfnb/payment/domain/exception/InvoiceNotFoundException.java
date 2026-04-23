package com.smartfnb.payment.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception được ném khi Invoice không tồn tại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class InvoiceNotFoundException extends SmartFnbException {
    public InvoiceNotFoundException(UUID invoiceId) {
        super("INVOICE_NOT_FOUND", String.format("Hóa đơn '%s' không tồn tại", invoiceId), 404);
    }

    public InvoiceNotFoundException(String invoiceNumber) {
        super("INVOICE_NOT_FOUND", String.format("Hóa đơn '%s' không tồn tại", invoiceNumber), 404);
    }
}
