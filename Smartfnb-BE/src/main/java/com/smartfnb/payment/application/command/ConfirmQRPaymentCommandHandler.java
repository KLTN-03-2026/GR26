package com.smartfnb.payment.application.command;

import com.smartfnb.payment.domain.model.Invoice;
import com.smartfnb.payment.domain.model.InvoiceItem;
import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.event.InvoiceCreatedEvent;
import com.smartfnb.payment.domain.event.PaymentCompletedEvent;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.payment.domain.repository.InvoiceRepository;
import com.smartfnb.payment.domain.repository.InvoiceNumberGenerator;
import com.smartfnb.payment.domain.exception.PaymentNotFoundException;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Xử lý webhook confirmation từ payment gateway (VietQR, MoMo).
 * Luồng:
 * 1. Tìm Payment theo paymentId
 * 2. Kiểm tra QR chưa hết hạn
 * 3. Xác nhận thanh toán thành công
 * 4. Tạo Invoice (giống như cash payment)
 * 5. Publish events
 *
 * @author vutq
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfirmQRPaymentCommandHandler {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final OrderAdapter orderAdapter;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void handle(ConfirmQRPaymentCommand command) {
        log.info("Xác nhận QR Payment từ webhook: paymentId={}, transactionId={}, status={}, amount={}",
            command.paymentId(), command.transactionId(), command.status(), command.amount());

        // 1. Tìm Payment
        Payment payment = paymentRepository.findById(command.paymentId())
            .orElseThrow(() -> new PaymentNotFoundException(command.paymentId()));
        log.info("Webhook load payment: paymentId={}, orderId={}, tenantId={}, method={}, status={}, amount={}, transactionId={}, qrExpiresAt={}, paidAt={}",
            payment.getId(), payment.getOrderId(), payment.getTenantId(), payment.getMethod(), payment.getStatus(),
            payment.getAmount(), payment.getTransactionId(), payment.getQrExpiresAt(), payment.getPaidAt());

        // 1.5. Idempotency Check — gateway có thể retry nhiều lần, trả về thành công thay vì crash 500
        if (payment.isCompleted()) {
            log.info("QR Payment đã hoàn tất trước đó, bỏ qua xử lý webhook: paymentId={}, paidAt={}, transactionId={}",
                command.paymentId(), payment.getPaidAt(), payment.getTransactionId());
            return;
        }

        // Thiết lập TenantContext cho luồng background/webhook này
        TenantContext.setCurrentTenantId(payment.getTenantId());
        try {
            boolean isSuccess = "success".equalsIgnoreCase(command.status());

            // author: Hoàng | date: 27-04-2026 | note: Gateway success đã là nguồn sự thật, không fail payment vì QR local hết hạn.
            // 2. Kiểm tra QR chưa hết hạn. Nếu gateway đã xác nhận success thì vẫn hoàn tất payment.
            if (payment.isQRExpired() && !isSuccess) {
                log.warn("Webhook bị chặn do QR hết hạn: paymentId={}, qrExpiresAt={}, status={}, commandStatus={}",
                    payment.getId(), payment.getQrExpiresAt(), payment.getStatus(), command.status());
                payment.markFailed("QR code đã hết hạn (quá 3 phút)");
                paymentRepository.save(payment);
                return;
            }

            // author: Hoàng | date: 27-04-2026 | note: Chỉ so amount khi gateway báo success; failed/expired không cần amount hợp lệ.
            // 2.5. Kiểm tra số tiền — webhook phải trả đủ hoặc nhiều hơn tổng đơn hàng
            if (isSuccess && command.amount() != null && payment.getAmount().compareTo(command.amount()) > 0) {
                log.warn("Webhook amount mismatch: paymentId={}, expectedAmount={}, receivedAmount={}, transactionId={}",
                    payment.getId(), payment.getAmount(), command.amount(), command.transactionId());
                payment.markFailed("Số tiền " + command.amount() + " không đủ so với đơn " + payment.getAmount());
                paymentRepository.save(payment);
                throw new SmartFnbException("PAYMENT_AMOUNT_MISMATCH",
                    "Số tiền thanh toán không khớp với đơn hàng", 400);
            }

            // 3. Kiểm tra status từ gateway
            if (isSuccess) {
                // Xác nhận thành công
                log.info("Webhook bắt đầu markCompleted: paymentId={}, oldStatus={}, gatewayTransactionId={}",
                    payment.getId(), payment.getStatus(), command.transactionId());
                payment.markCompleted(command.transactionId(), true);
                paymentRepository.save(payment);
                log.info("QR Payment xác nhận thành công: paymentId={}, newStatus={}, paidAt={}, transactionId={}",
                    command.paymentId(), payment.getStatus(), payment.getPaidAt(), payment.getTransactionId());

                // 4. Tạo Invoice (giống cash payment)
                try {
                    log.info("Webhook bắt đầu tạo invoice và complete order: paymentId={}, orderId={}",
                        payment.getId(), payment.getOrderId());
                    createInvoice(payment, command);

                    // 5. Publish PaymentCompletedEvent để broadcast qua WebSocket
                    OrderDto order = orderAdapter.getOrderById(payment.getOrderId(), payment.getTenantId());
                    log.info("Webhook publish PaymentCompletedEvent: paymentId={}, orderId={}, branchId={}, orderNumber={}",
                        payment.getId(), payment.getOrderId(), order.branchId(), order.orderNumber());
                    eventPublisher.publishEvent(new PaymentCompletedEvent(
                        payment.getId(),
                        payment.getTenantId(),
                        order.branchId(),
                        payment.getOrderId(),
                        order.orderNumber(),
                        payment.getAmount(),
                        payment.getMethod().name(),
                        payment.getTransactionId(),
                        Instant.now()
                    ));
                } catch (Exception e) {
                    log.error("Lỗi tạo Invoice/complete order sau QR payment confirmation: paymentId={}, orderId={}, type={}, message={}",
                        payment.getId(), payment.getOrderId(), e.getClass().getSimpleName(), e.getMessage(), e);
                    throw new RuntimeException("Lỗi tạo Invoice: " + e.getMessage());
                }
            } else if ("failed".equalsIgnoreCase(command.status())) {
                log.warn("Webhook đánh dấu payment failed: paymentId={}, transactionId={}",
                    command.paymentId(), command.transactionId());
                payment.markFailed("Gateway trả về status FAILED");
                paymentRepository.save(payment);
                log.warn("QR Payment {} thất bại", command.paymentId());
            } else if ("expired".equalsIgnoreCase(command.status())) {
                log.warn("Webhook đánh dấu payment expired: paymentId={}, transactionId={}",
                    command.paymentId(), command.transactionId());
                payment.markFailed("QR code đã hết hạn");
                paymentRepository.save(payment);
                log.warn("QR Payment {} hết hạn", command.paymentId());
            } else {
                log.warn("Webhook status không được xử lý: paymentId={}, status={}, transactionId={}",
                    command.paymentId(), command.status(), command.transactionId());
            }
        } finally {
            log.info("Webhook clear TenantContext: paymentId={}, tenantId={}", payment.getId(), payment.getTenantId());
            TenantContext.clear();
        }
    }

    /**
     * Tạo Invoice cho QR payment.
     */
    private void createInvoice(Payment payment, ConfirmQRPaymentCommand command) {
        OrderDto order = orderAdapter.getOrderById(payment.getOrderId(), payment.getTenantId());
        if (order == null) {
            log.error("Webhook không tìm thấy order khi tạo invoice: paymentId={}, orderId={}, tenantId={}",
                payment.getId(), payment.getOrderId(), payment.getTenantId());
            throw new RuntimeException("Đơn hàng không tìm thấy: " + payment.getOrderId());
        }
        log.info("Webhook tạo invoice: paymentId={}, orderId={}, branchId={}, orderNumber={}, itemCount={}, total={}",
            payment.getId(), order.id(), order.branchId(), order.orderNumber(), order.items().size(), order.totalAmount());

        String invoiceNumber = invoiceNumberGenerator.generateInvoiceNumber(order.branchId());
        log.info("Webhook generated invoiceNumber: paymentId={}, invoiceNumber={}",
            payment.getId(), invoiceNumber);
        List<InvoiceItem> invoiceItems = order.items().stream()
            .map(item -> InvoiceItem.create(
                item.itemName(), item.quantity(), item.unitPrice(), item.totalPrice()))
            .toList();

        Invoice invoice = Invoice.create(
            payment.getTenantId(), order.branchId(), order.id(), payment.getId(),
            invoiceNumber,
            order.subtotal(), order.discountAmount(), order.taxAmount(), order.totalAmount(),
            invoiceItems
        );

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Đã tạo Invoice {} cho QR Payment {}", 
            savedInvoice.getInvoiceNumber(), payment.getId());

        // Hoàn tất đơn hàng bên Order Module
        log.info("Webhook bắt đầu complete order: paymentId={}, orderId={}, branchId={}, cashierUserId={}",
            payment.getId(), order.id(), order.branchId(), payment.getCashierUserId());
        orderAdapter.completeOrder(order.id(), payment.getTenantId(), order.branchId(), payment.getCashierUserId());
        log.info("Webhook complete order thành công: paymentId={}, orderId={}", payment.getId(), order.id());

        // Publish InvoiceCreatedEvent
        log.info("Webhook publish InvoiceCreatedEvent: invoiceId={}, orderId={}, tableId={}",
            savedInvoice.getId(), order.id(), order.tableId());
        eventPublisher.publishEvent(new InvoiceCreatedEvent(
            savedInvoice.getId(),
            payment.getTenantId(),
            order.branchId(),
            order.id(),
            savedInvoice.getInvoiceNumber(),
            savedInvoice.getTotal(),
            order.tableId(),
            Instant.now()
        ));
    }
}
