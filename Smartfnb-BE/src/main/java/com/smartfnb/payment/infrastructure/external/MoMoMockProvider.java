package com.smartfnb.payment.infrastructure.external;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Mock implementation of QRCodeProvider for MoMo.
 * Used for testing purposes.
 */
@Component("momo")
public class MoMoMockProvider implements QRCodeProvider {

    @Override
    public QRCodeResponse generateQRCode(UUID paymentId, BigDecimal amount, String orderNumber) {
        return new QRCodeResponse(
            "https://mock-momo.com/pay?id=" + paymentId,
            "MOCK_MOMO_DATA_" + paymentId,
            "MOMO-MOCK-" + UUID.randomUUID().toString().substring(0, 8),
            180
        );
    }

    @Override
    public QRStatusResponse checkPaymentStatus(UUID paymentId) {
        return new QRStatusResponse("pending", null, BigDecimal.ZERO);
    }

    // @Override
    // public void cancelQRCode(UUID paymentId) {
    //     // Do nothing
    // }
}
