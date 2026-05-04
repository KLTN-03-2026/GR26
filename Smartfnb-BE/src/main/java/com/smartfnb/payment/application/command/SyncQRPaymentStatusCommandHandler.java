package com.smartfnb.payment.application.command;

// author: Hoàng
// date: 27-04-2026
// note: Handler đồng bộ trạng thái QR payment từ gateway cho môi trường local/dev
//       khi PayOS webhook chưa có HTTPS public URL để callback về backend.

import com.smartfnb.payment.domain.exception.PaymentNotFoundException;
import com.smartfnb.payment.domain.model.Payment;
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

import java.util.Map;
import java.util.UUID;

/**
 * Đồng bộ trạng thái QR Payment từ gateway khi môi trường local/dev không nhận được webhook public.
 * Backend chủ động gọi PayOS/MoMo/VietQR để lấy trạng thái, sau đó tái sử dụng luồng confirm chuẩn.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SyncQRPaymentStatusCommandHandler {

    private final PaymentRepository paymentRepository;
    private final OrderAdapter orderAdapter;
    private final ConfirmQRPaymentCommandHandler confirmQRPaymentCommandHandler;
    private final Map<String, QRCodeProvider> qrProviders;

    @Transactional
    public Payment handle(UUID paymentId) {
        // author: Hoàng | date: 27-04-2026 | note: Entry point cho FE polling PayOS status thay webhook local.
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentNotFoundException(paymentId));

        if (payment.isCompleted()) {
            log.debug("Bỏ qua sync QR Payment vì payment đã COMPLETED: paymentId={}", paymentId);
            return payment;
        }

        if (payment.getTransactionId() == null || payment.getTransactionId().isBlank()) {
            throw new SmartFnbException("PAYMENT_TRANSACTION_MISSING",
                "Payment chưa có mã giao dịch gateway để kiểm tra trạng thái", 400);
        }

        QRCodeProvider provider = resolveProvider(payment);
        OrderDto order = orderAdapter.getOrderById(payment.getOrderId(), payment.getTenantId());

        TenantContext.setCurrentTenantId(payment.getTenantId());
        TenantContext.setCurrentBranchId(order.branchId());
        try {
            QRCodeProvider.QRStatusResponse gatewayStatus = checkGatewayStatus(provider, payment);

            log.info("Sync QR Payment status: paymentId={}, method={}, gatewayStatus={}, transactionId={}, amount={}",
                payment.getId(), payment.getMethod(), gatewayStatus.status(),
                gatewayStatus.transactionId(), gatewayStatus.amount());

            if ("success".equalsIgnoreCase(gatewayStatus.status())
                    // || "failed".equalsIgnoreCase(gatewayStatus.status())
                    // || "expired".equalsIgnoreCase(gatewayStatus.status())
            ) {
                confirmQRPaymentCommandHandler.handle(new ConfirmQRPaymentCommand(
                    payment.getId(),
                    gatewayStatus.transactionId(),
                    gatewayStatus.status(),
                    gatewayStatus.amount()
                ));
            }

            return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException(paymentId));
        } finally {
            TenantContext.clear();
        }
    }

    private QRCodeProvider resolveProvider(Payment payment) {
        // author: Hoàng | date: 27-04-2026 | note: Resolve provider theo PaymentMethod để tái dùng abstraction QR hiện có.
        QRCodeProvider provider = qrProviders.get(payment.getMethod().name().toLowerCase());
        if (provider == null) {
            throw new SmartFnbException("QR_PROVIDER_NOT_FOUND",
                "Chưa cấu hình provider cho phương thức thanh toán " + payment.getMethod(), 500);
        }
        return provider;
    }

    private QRCodeProvider.QRStatusResponse checkGatewayStatus(QRCodeProvider provider, Payment payment) {
        // author: Hoàng | date: 27-04-2026 | note: Bọc checked exception từ SDK/provider thành lỗi nghiệp vụ 502.
        try {
            return provider.checkPaymentStatus(payment.getId());
        } catch (Exception e) {
            log.error("Không thể đồng bộ trạng thái QR payment từ gateway: paymentId={}, method={}, error={}",
                payment.getId(), payment.getMethod(), e.getMessage(), e);
            throw new SmartFnbException("QR_STATUS_SYNC_FAILED",
                "Không thể kiểm tra trạng thái thanh toán từ gateway", 502);
        }
    }
}
