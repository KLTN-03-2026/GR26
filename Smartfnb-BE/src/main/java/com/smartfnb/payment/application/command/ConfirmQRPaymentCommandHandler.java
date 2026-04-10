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
import com.smartfnb.payment.domain.exception.QRPaymentExpiredException;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Xử lý webhook confirmation từ payment gateway (VietQR, MoMo).
 * Luồng:
 * 1. Tìm Payment theo paymentId
 * 2. Kiểm tra QR chưa hết hạn
 * 3. Xác nhận thanh toán thành công
 * 4. Tạo Invoice (giống như cash payment)
 * 5. Publish events
 *
 * @author SmartF&B Team
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
        log.info("Xác nhận QR Payment {} từ webhook: status={}", 
            command.paymentId(), command.status());

        // 1. Tìm Payment
        Payment payment = paymentRepository.findById(command.paymentId())
            .orElseThrow(() -> new PaymentNotFoundException(command.paymentId()));

        // 2. Kiểm tra QR chưa hết hạn
        if (payment.isQRExpired()) {
            payment.markFailed("QR code đã hết hạn (quá 3 phút)");
            paymentRepository.save(payment);
            throw new QRPaymentExpiredException(command.paymentId());
        }

        // 3. Kiểm tra status từ gateway
        if ("success".equalsIgnoreCase(command.status())) {
            // Xác nhận thành công
            payment.markCompleted(command.transactionId());
            paymentRepository.save(payment);
            log.info("QR Payment {} xác nhận thành công", command.paymentId());

            // 4. Tạo Invoice (giống cash payment)
            try {
                createInvoice(payment, command);

                // 5. Publish PaymentCompletedEvent để broadcast qua WebSocket
                OrderDto order = orderAdapter.getOrderById(payment.getOrderId());
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
                log.error("Lỗi tạo Invoice sau QR payment confirmation", e);
                throw new RuntimeException("Lỗi tạo Invoice: " + e.getMessage());
            }
        } else if ("failed".equalsIgnoreCase(command.status())) {
            payment.markFailed("Gateway trả về status FAILED");
            paymentRepository.save(payment);
            log.warn("QR Payment {} thất bại", command.paymentId());
        } else if ("expired".equalsIgnoreCase(command.status())) {
            payment.markFailed("QR code đã hết hạn");
            paymentRepository.save(payment);
            log.warn("QR Payment {} hết hạn", command.paymentId());
        }
    }

    /**
     * Tạo Invoice cho QR payment.
     */
    private void createInvoice(Payment payment, ConfirmQRPaymentCommand command) {
        OrderDto order = orderAdapter.getOrderById(payment.getOrderId());
        if (order == null) {
            throw new RuntimeException("Đơn hàng không tìm thấy: " + payment.getOrderId());
        }

        String invoiceNumber = invoiceNumberGenerator.generateInvoiceNumber(order.branchId());
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

        // Publish InvoiceCreatedEvent
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
