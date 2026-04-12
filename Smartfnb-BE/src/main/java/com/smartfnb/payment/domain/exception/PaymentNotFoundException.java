package com.smartfnb.payment.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception được ném khi Payment không tồn tại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class PaymentNotFoundException extends SmartFnbException {
    public PaymentNotFoundException(UUID paymentId) {
        super("PAYMENT_NOT_FOUND", String.format("Giao dịch thanh toán '%s' không tồn tại", paymentId), 404);
    }
}
