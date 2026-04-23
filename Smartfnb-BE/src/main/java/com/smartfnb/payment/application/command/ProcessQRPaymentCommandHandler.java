package com.smartfnb.payment.application.command;

import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.model.PaymentMethod;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.payment.infrastructure.external.QRCodeProvider;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Xử lý Command tạo QR Code thanh toán.
 * Luồng:
 * 1. Validate phương thức QR (VIETQR hoặc MOMO)
 * 2. Tạo Payment với method và qr_expires_at = now + 3 phút
 * 3. Gọi QR provider để tạo QR code
 * 4. Trả về QR code URL + Payment info cho frontend
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProcessQRPaymentCommandHandler {

    private final PaymentRepository paymentRepository;
    private final OrderAdapter orderAdapter;
    private final Map<String, QRCodeProvider> qrProviders;  // Inject providers by name

    @Transactional
    public ProcessQRPaymentResult handle(ProcessQRPaymentCommand command) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        UUID branchId = TenantContext.getCurrentBranchId();

        log.info("Tạo QR Code {} thanh toán cho đơn {} bằng {}", 
            command.qrMethod(), command.orderId(), command.amount());

        // 1. Validate QR method
        PaymentMethod qrMethod = validateAndParseQRMethod(command.qrMethod());

        // 2. Fetch Order
        OrderDto order = orderAdapter.getOrderById(command.orderId());
        if (order == null) {
            throw new RuntimeException("Đơn hàng không tìm thấy: " + command.orderId());
        }

        // 3. Kiểm tra số tiền thanh toán
        if (command.amount().compareTo(order.totalAmount()) < 0) {
            throw new RuntimeException(
                String.format("Số tiền thanh toán %.0f thấp hơn tổng cộng %.0f",
                    command.amount(), order.totalAmount()));
        }

        // 4. Tạo Payment mới (status = PENDING)
        Payment payment = Payment.createQRPayment(
            tenantId, command.orderId(), command.amount(), qrMethod, command.cashierUserId());

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Đã tạo Payment {} với QR timeout 3 phút", savedPayment.getId());

        // 5. Gọi QR provider để tạo QR code
        try {
            QRCodeProvider provider = getQRProvider(qrMethod.name());
            QRCodeProvider.QRCodeResponse qrResponse = provider.generateQRCode(
                savedPayment.getId(), command.amount(), order.orderNumber());

            // 6. Cập nhật transaction ID từ gateway
            // Lưu transaction ID trước khi trả response
            // (thực tế nên update payment ở đây)

            log.info("QR Code {} được tạo thành công, expires in {} giây", 
                qrResponse.transactionId(), qrResponse.expiresInSeconds());

            return new ProcessQRPaymentResult(
                savedPayment.getId(),
                qrResponse.qrCodeUrl(),
                qrResponse.qrCodeData(),
                qrResponse.expiresInSeconds(),
                order.orderNumber()
            );

        } catch (Exception e) {
            log.error("Lỗi tạo QR code từ provider", e);
            throw new RuntimeException("Không thể tạo QR code: " + e.getMessage());
        }
    }

    /**
     * Parse và validate QR method.
     */
    private PaymentMethod validateAndParseQRMethod(String methodStr) {
        try {
            PaymentMethod method = PaymentMethod.valueOf(methodStr.toUpperCase());
            if (method != PaymentMethod.VIETQR && method != PaymentMethod.MOMO) {
                throw new IllegalArgumentException("QR method phải là VIETQR hoặc MOMO");
            }
            return method;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Phương thức thanh toán QR không hợp lệ: " + methodStr);
        }
    }

    /**
     * Lấy QR provider theo method.
     */
    private QRCodeProvider getQRProvider(String method) {
        QRCodeProvider provider = qrProviders.get(method.toLowerCase());
        if (provider == null) {
            throw new RuntimeException("QR provider không được setup: " + method);
        }
        return provider;
    }

    /**
     * Result trả về sau khi QR tạo thành công.
     */
    public record ProcessQRPaymentResult(
        UUID paymentId,
        String qrCodeUrl,
        String qrCodeData,
        long expiresInSeconds,
        String orderNumber
    ) {}
}
