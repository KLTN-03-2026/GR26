package com.smartfnb.payment.application.command;

import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.model.PaymentMethod;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.payment.infrastructure.external.QRCodeProvider;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
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
 * @author vutq
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
            throw new SmartFnbException("ORDER_NOT_FOUND", "Đơn hàng không tìm thấy: " + command.orderId(), 404);
        }

        // 3. Kiểm tra số tiền thanh toán
        if (command.amount().compareTo(order.totalAmount()) < 0) {
            throw new SmartFnbException("PAYMENT_AMOUNT_INSUFFICIENT",
                String.format("Số tiền thanh toán %.0f thấp hơn tổng cộng %.0f",
                    command.amount(), order.totalAmount()), 400);
        }

        // 3.5. Kiểm tra trạng thái đơn hàng và lịch sử thanh toán
        if ("COMPLETED".equalsIgnoreCase(order.status()) || "CANCELLED".equalsIgnoreCase(order.status())) {
            throw new SmartFnbException("PAYMENT_INVALID_ORDER_STATUS", 
                "Không thể thanh toán. Đơn hàng đang ở trạng thái: " + order.status(), 400);
        }
        paymentRepository.findByOrderId(command.orderId()).ifPresent(existingPayment -> {
            if (existingPayment.isCompleted()) {
                throw new SmartFnbException("PAYMENT_ALREADY_COMPLETED", 
                    "Đơn hàng này đã được thanh toán thành công trước đó.", 400);
            }
        });

        // 4. Tạo Payment mới (status = PENDING)
        Payment payment = Payment.createQRPayment(
            tenantId, command.orderId(), command.amount(), qrMethod, command.cashierUserId());

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Đã tạo QR Payment pending: paymentId={}, orderId={}, tenantId={}, branchId={}, method={}, amount={}, qrExpiresAt={}",
            savedPayment.getId(), savedPayment.getOrderId(), tenantId, branchId, savedPayment.getMethod(),
            savedPayment.getAmount(), savedPayment.getQrExpiresAt());

        // 5. Gọi QR provider để tạo QR code
        try {
            QRCodeProvider provider = getQRProvider(qrMethod.name());
            log.info("Bắt đầu gọi QR provider: provider={}, paymentId={}, orderNumber={}, amount={}",
                qrMethod.name(), savedPayment.getId(), order.orderNumber(), command.amount());
            QRCodeProvider.QRCodeResponse qrResponse = provider.generateQRCode(
                savedPayment.getId(), command.amount(), order.orderNumber());

            // Lưu paymentLinkId để webhook PayOS tìm lại đúng payment nội bộ.
            savedPayment.attachGatewayTransaction(qrResponse.transactionId());
            paymentRepository.save(savedPayment);

            log.info("QR provider tạo thành công: paymentId={}, transactionId/paymentLinkId={}, expiresInSeconds={}, qrCodeUrlPresent={}, qrCodeDataPresent={}",
                savedPayment.getId(), qrResponse.transactionId(), qrResponse.expiresInSeconds(),
                qrResponse.qrCodeUrl() != null && !qrResponse.qrCodeUrl().isBlank(),
                qrResponse.qrCodeData() != null && !qrResponse.qrCodeData().isBlank());

            return new ProcessQRPaymentResult(
                savedPayment.getId(),
                qrResponse.qrCodeUrl(),
                qrResponse.qrCodeData(),
                qrResponse.expiresInSeconds(),
                order.orderNumber()
            );

        } catch (SmartFnbException e) {
            // author: Hoàng | date: 27-04-2026 | note: Rethrow SmartFnbException thay vì bọc thành
            //   RuntimeException — giữ nguyên HTTP status và error code để GlobalExceptionHandler
            //   trả đúng response cho FE (ví dụ: 400 PAYOS_CONFIG_MISSING, 502 PAYOS_ERROR).
            log.error("Lỗi nghiệp vụ khi tạo QR code: code={}, message={}", e.getErrorCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Lỗi không mong đợi khi tạo QR code từ provider", e);
            throw new SmartFnbException("PAYOS_ERROR", "Không thể tạo QR code: " + e.getMessage(), 502);
        }
    }

    /**
     * Parse và validate QR method.
     * author: Hoàng | date: 27-04-2026 | note: Thêm PAYOS vào danh sách hợp lệ.
     */
    private PaymentMethod validateAndParseQRMethod(String methodStr) {
        try {
            PaymentMethod method = PaymentMethod.valueOf(methodStr.toUpperCase());
            if (method != PaymentMethod.VIETQR
                    && method != PaymentMethod.MOMO
                    && method != PaymentMethod.PAYOS) {
                throw new IllegalArgumentException("QR method phải là VIETQR, MOMO hoặc PAYOS");
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
