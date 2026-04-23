package com.smartfnb.payment.domain.exception;

import java.util.UUID;

/**
 * Exception được ném khi QR Payment hết hạn (quá 3 phút).
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class QRPaymentExpiredException extends RuntimeException {
    public QRPaymentExpiredException(UUID paymentId) {
        super(String.format("QR code thanh toán '%s' đã hết hạn (quá 3 phút)", paymentId));
    }
}
