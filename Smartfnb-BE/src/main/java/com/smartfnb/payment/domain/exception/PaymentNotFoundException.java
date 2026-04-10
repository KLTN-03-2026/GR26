package com.smartfnb.payment.domain.exception;

import java.util.UUID;

/**
 * Exception được ném khi Payment không tồn tại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class PaymentNotFoundException extends RuntimeException {
    public PaymentNotFoundException(UUID paymentId) {
        super(String.format("Giao dịch thanh toán '%s' không tồn tại", paymentId));
    }
}
