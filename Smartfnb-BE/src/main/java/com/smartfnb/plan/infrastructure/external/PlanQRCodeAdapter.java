package com.smartfnb.plan.infrastructure.external;

import com.smartfnb.payment.infrastructure.external.QRCodeProvider;
import com.smartfnb.plan.application.port.PlanQRCodePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Adapter trong module plan implements PlanQRCodePort,
 * ủy quyền sang QRCodeProvider của module payment.
 *
 * <p>Đây là nơi DUY NHẤT module plan được phép import từ module payment.
 * Tất cả logic nghiệp vụ trong plan chỉ dùng PlanQRCodePort (interface thuần).</p>
 *
 * <p>Dependency: plan → payment chỉ xảy ra ở tầng infrastructure, không ở application/domain.</p>
 *
 * @author vutq
 * @since 2026-04-30
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanQRCodeAdapter implements PlanQRCodePort {

    /** Inject Map<name, provider> được Spring tự động tạo từ các bean QRCodeProvider */
    private final Map<String, QRCodeProvider> qrProviders;

    /**
     * Sinh QR code cho hóa đơn gói dịch vụ.
     * Chuyển đổi tên method sang lowercase để khớp với bean name ("vietqr", "momo").
     *
     * @param invoiceId     UUID hóa đơn — dùng làm payment reference
     * @param amount        Số tiền cần chuyển
     * @param invoiceNumber Mã hóa đơn — hiển thị trong mô tả giao dịch
     * @param method        "VIETQR" | "MOMO" (case-insensitive)
     * @return QRResult chứa url, data, thời hạn
     * @throws PlanQRCodeException nếu provider không tồn tại hoặc gateway lỗi
     */
    @Override
    public QRResult generateQR(UUID invoiceId, BigDecimal amount, String invoiceNumber, String method) {
        String providerKey = method.toLowerCase();
        QRCodeProvider provider = qrProviders.get(providerKey);

        if (provider == null) {
            throw new PlanQRCodeException("Phương thức QR không được hỗ trợ: " + method
                    + ". Các phương thức hợp lệ: VIETQR, MOMO");
        }

        try {
            QRCodeProvider.QRCodeResponse response = provider.generateQRCode(
                    invoiceId, amount, invoiceNumber);

            // QR plan dùng 15 phút (900s) thay vì 3 phút (180s) của Order payment
            long expires = response.expiresInSeconds() > 0 ? response.expiresInSeconds() : 900L;

            log.info("Sinh QR {} cho hóa đơn {}, expires={}s", method, invoiceNumber, expires);
            return new QRResult(response.qrCodeUrl(), response.qrCodeData(), expires);

        } catch (Exception e) {
            log.error("Lỗi sinh QR từ provider {}: {}", method, e.getMessage());
            throw new PlanQRCodeException("Không thể tạo mã QR từ gateway " + method + ": " + e.getMessage(), e);
        }
    }
}
