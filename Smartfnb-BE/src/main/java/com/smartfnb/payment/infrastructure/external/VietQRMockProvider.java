package com.smartfnb.payment.infrastructure.external;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Mock implementation of QRCodeProvider for VietQR.
 * Used for testing purposes.
 */
@Component("vietqr")
public class VietQRMockProvider implements QRCodeProvider {

    @Override
    public QRCodeResponse generateQRCode(UUID paymentId, BigDecimal amount, String orderNumber) {
        return new QRCodeResponse(
            "https://mock-vietqr.com/pay?id=" + paymentId,
            "MOCK_QR_DATA_" + paymentId,
            "TX-MOCK-" + UUID.randomUUID().toString().substring(0, 8),
            180
        );
    }

    @Override
    public QRStatusResponse checkPaymentStatus(UUID paymentId, String transactionId) {
        return new QRStatusResponse("pending", transactionId, BigDecimal.ZERO, null);
    }

    @Override
    public void cancelQRCode(UUID paymentId) {
        // Do nothing
    }
}
