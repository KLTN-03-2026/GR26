package com.smartfnb.payment.application.command;

import com.smartfnb.payment.domain.exception.PaymentNotFoundException;
import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.model.PaymentMethod;
import com.smartfnb.payment.domain.model.PaymentStatus;
import com.smartfnb.payment.domain.repository.InvoiceRepository;
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

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Handler hủy QR payment pending để nhân viên quay lại sửa đơn.
 *
 * author: Hoàng | date: 2026-05-16 | note: Chỉ hủy payment PENDING, nếu gateway đã PAID thì đồng bộ thành COMPLETED.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CancelPaymentCommandHandler {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderAdapter orderAdapter;
    private final ConfirmQRPaymentCommandHandler confirmQRPaymentCommandHandler;
    private final Map<String, QRCodeProvider> qrProviders;

    /**
     * Hủy payment QR đang chờ xử lý để order có thể quay lại bước sửa món.
     *
     * <p>Luồng chính:
     * 1. Validate tenant/branch và trạng thái payment.
     * 2. Kiểm tra gateway trước khi hủy để tránh hủy nhầm payment đã PAID.
     * 3. Gọi provider hủy QR/payment link nếu có hỗ trợ.
     * 4. Nếu gateway vẫn chưa PAID thì đánh payment nội bộ là CANCELLED.</p>
     *
     * @param command paymentId cần hủy
     * @return payment sau khi hủy, hoặc payment đã được sync COMPLETED nếu gateway đã thanh toán
     */
    @Transactional
    public Payment handle(CancelPaymentCommand command) {
        Payment payment = paymentRepository.findById(command.paymentId())
                .orElseThrow(() -> new PaymentNotFoundException(command.paymentId()));

        validateTenantAccess(payment);

        if (payment.isCancelled()) {
            log.info("Payment đã hủy trước đó, trả về idempotent: paymentId={}", payment.getId());
            return payment;
        }

        if (invoiceRepository.existsByPaymentId(payment.getId()) || payment.isCompleted()) {
            throw new SmartFnbException("PAYMENT_ALREADY_COMPLETED",
                    "Thanh toán đã hoàn tất nên không thể hủy. Vui lòng kiểm tra hóa đơn.", 409);
        }

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new SmartFnbException("PAYMENT_CANNOT_CANCEL",
                    "Chỉ có thể hủy thanh toán đang chờ xử lý. Trạng thái hiện tại: " + payment.getStatus(), 409);
        }

        if (payment.getMethod() == PaymentMethod.CASH) {
            throw new SmartFnbException("PAYMENT_CANCEL_NOT_SUPPORTED",
                    "Thanh toán tiền mặt không hỗ trợ hủy bằng API hủy QR.", 400);
        }

        OrderDto order = orderAdapter.getOrderById(payment.getOrderId(), payment.getTenantId());
        if (order == null) {
            throw new SmartFnbException("ORDER_NOT_FOUND",
                    "Không tìm thấy đơn hàng của thanh toán này", 404);
        }
        validateBranchAccess(order);

        QRCodeProvider provider = resolveProvider(payment);
        QRCodeProvider.QRStatusResponse gatewayStatus = checkGatewayStatus(provider, payment, order);

        if ("success".equalsIgnoreCase(gatewayStatus.status())) {
            log.warn("Không hủy payment vì gateway đã báo thanh toán thành công: paymentId={}, transactionId={}",
                    payment.getId(), gatewayStatus.transactionId());
            confirmQRPaymentCommandHandler.handle(new ConfirmQRPaymentCommand(
                    payment.getId(),
                    gatewayStatus.transactionId(),
                    gatewayStatus.status(),
                    gatewayStatus.amount() != null ? gatewayStatus.amount() : payment.getAmount()
            ));
            return paymentRepository.findById(payment.getId())
                    .orElseThrow(() -> new PaymentNotFoundException(payment.getId()));
        }

        QRCodeProvider.QRStatusResponse postCancelStatus = cancelGatewayPayment(provider, payment, order);
        if (postCancelStatus != null && "success".equalsIgnoreCase(postCancelStatus.status())) {
            log.warn("Không hủy nội bộ vì gateway đã PAID trong lúc cancel: paymentId={}, transactionId={}",
                    payment.getId(), postCancelStatus.transactionId());
            confirmQRPaymentCommandHandler.handle(new ConfirmQRPaymentCommand(
                    payment.getId(),
                    postCancelStatus.transactionId(),
                    postCancelStatus.status(),
                    postCancelStatus.amount() != null ? postCancelStatus.amount() : payment.getAmount()
            ));
            return paymentRepository.findById(payment.getId())
                    .orElseThrow(() -> new PaymentNotFoundException(payment.getId()));
        }

        payment.markCancelled();
        Payment saved = paymentRepository.save(payment);
        log.info("Đã hủy QR payment pending: paymentId={}, orderId={}, method={}, status={}",
                saved.getId(), saved.getOrderId(), saved.getMethod(), saved.getStatus());
        return saved;
    }

    /**
     * Đảm bảo payment thuộc tenant hiện tại trong JWT.
     *
     * @param payment payment cần kiểm tra quyền tenant
     */
    private void validateTenantAccess(Payment payment) {
        UUID currentTenantId = TenantContext.getCurrentTenantId();
        if (currentTenantId == null || !currentTenantId.equals(payment.getTenantId())) {
            throw new SmartFnbException("ACCESS_DENIED",
                    "Không có quyền hủy thanh toán này", 403);
        }
    }

    /**
     * Đảm bảo nhân viên chỉ hủy payment của chi nhánh đang làm việc.
     *
     * @param order thông tin order gắn với payment
     */
    private void validateBranchAccess(OrderDto order) {
        UUID currentBranchId = TenantContext.getCurrentBranchId();
        if (currentBranchId != null && !currentBranchId.equals(order.branchId())) {
            throw new SmartFnbException("ACCESS_DENIED",
                    "Không có quyền hủy thanh toán của chi nhánh khác", 403);
        }
    }

    /**
     * Lấy QR provider theo phương thức thanh toán của payment.
     *
     * @param payment payment QR cần hủy
     * @return provider tương ứng với VIETQR, MOMO hoặc PAYOS
     */
    private QRCodeProvider resolveProvider(Payment payment) {
        QRCodeProvider provider = qrProviders.get(payment.getMethod().name().toLowerCase());
        if (provider == null) {
            throw new SmartFnbException("QR_PROVIDER_NOT_FOUND",
                    "Chưa cấu hình provider cho phương thức thanh toán " + payment.getMethod(), 500);
        }
        return provider;
    }

    /**
     * Kiểm tra trạng thái gateway trước khi hủy.
     *
     * <p>Nếu gateway đã PAID thì handler sẽ chuyển sang luồng confirm payment,
     * không đánh CANCELLED nội bộ để tránh lệch tiền.</p>
     *
     * @param provider provider gateway của payment
     * @param payment payment cần kiểm tra
     * @param order order dùng để set branch context cho provider PayOS
     * @return trạng thái gateway, fallback PENDING nếu không kiểm tra được
     */
    private QRCodeProvider.QRStatusResponse checkGatewayStatus(
            QRCodeProvider provider, Payment payment, OrderDto order) {
        TenantContext.setCurrentTenantId(payment.getTenantId());
        TenantContext.setCurrentBranchId(order.branchId());
        try {
            return provider.checkPaymentStatus(payment.getId());
        } catch (Exception e) {
            log.warn("Không kiểm tra được trạng thái gateway trước khi hủy payment: paymentId={}, error={}",
                    payment.getId(), e.getMessage());
            return new QRCodeProvider.QRStatusResponse("pending", null, BigDecimal.ZERO);
        }
    }

    /**
     * Gọi gateway hủy QR/payment link.
     *
     * <p>Provider legacy có thể no-op. Nếu PayOS cancel lỗi, handler kiểm tra lại
     * trạng thái gateway; nếu gateway đã PAID thì không hủy nội bộ.</p>
     *
     * @param provider provider gateway của payment
     * @param payment payment cần hủy
     * @param order order dùng để set branch context cho provider PayOS
     * @return trạng thái gateway sau khi cancel lỗi, hoặc null nếu cancel thành công/không cần kiểm tra
     */
    private QRCodeProvider.QRStatusResponse cancelGatewayPayment(QRCodeProvider provider, Payment payment, OrderDto order) {
        TenantContext.setCurrentTenantId(payment.getTenantId());
        TenantContext.setCurrentBranchId(order.branchId());
        try {
            provider.cancelQRCode(payment.getId());
            return null;
        } catch (Exception e) {
            log.warn("Gateway không hủy được QR payment, tiếp tục hủy nội bộ nếu chưa PAID: paymentId={}, method={}, error={}",
                    payment.getId(), payment.getMethod(), e.getMessage());
            try {
                return provider.checkPaymentStatus(payment.getId());
            } catch (Exception checkError) {
                log.warn("Không kiểm tra lại được trạng thái gateway sau khi cancel lỗi: paymentId={}, error={}",
                        payment.getId(), checkError.getMessage());
                return null;
            }
        }
    }
}
