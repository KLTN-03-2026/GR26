package com.smartfnb.payment.application.command;

import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.model.Invoice;
import com.smartfnb.payment.domain.model.InvoiceItem;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.payment.domain.repository.InvoiceRepository;
import com.smartfnb.payment.domain.repository.InvoiceNumberGenerator;
import com.smartfnb.payment.domain.event.InvoiceCreatedEvent;
import com.smartfnb.payment.domain.event.PaymentCompletedEvent;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Xử lý Command thanh toán tiền mặt.
 * Luồng:
 * 1. Tạo Payment với method=CASH từ orderId
 * 2. Tạo Invoice từ Order + Payment
 * 3. Publish InvoiceCreatedEvent
 *
 * @author vutq
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProcessCashPaymentCommandHandler {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final OrderAdapter orderAdapter;
    private final ApplicationEventPublisher eventPublisher;
    // author: Hoàng | date: 2026-04-30 | note: Dùng để lấy active POS session khi thanh toán tiền mặt, gắn posSessionId vào payment.
    private final PosSessionJpaRepository posSessionJpaRepository;

    @Transactional
    public Payment handle(ProcessCashPaymentCommand command) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        UUID branchId = TenantContext.getCurrentBranchId();

        log.info("Xử lý thanh toán tiền mặt cho đơn {} bằng {}", command.orderId(), command.amount());

        // 1. Fetch Order từ Order Module
        OrderDto order = orderAdapter.getOrderById(command.orderId());
        if (order == null) {
            throw new SmartFnbException("ORDER_NOT_FOUND", "Đơn hàng không tìm thấy: " + command.orderId(), 404);
        }

        // 2. Kiểm tra số tiền thanh toán
        if (command.amount().compareTo(order.totalAmount()) < 0) {
            throw new SmartFnbException("PAYMENT_AMOUNT_INSUFFICIENT", 
                String.format("Số tiền thanh toán %.0f thấp hơn tổng cộng %.0f",
                    command.amount(), order.totalAmount()), 400);
        }

        // 2.5. Kiểm tra trạng thái đơn hàng và lịch sử thanh toán
        if ("COMPLETED".equalsIgnoreCase(order.status()) || "CANCELLED".equalsIgnoreCase(order.status())) {
            throw new SmartFnbException("PAYMENT_INVALID_ORDER_STATUS", 
                "Không thể nhận tiền mặt. Đơn hàng đang ở trạng thái: " + order.status(), 400);
        }
        paymentRepository.findByOrderId(command.orderId()).ifPresent(existingPayment -> {
            if (existingPayment.isCompleted()) {
                throw new SmartFnbException("PAYMENT_ALREADY_COMPLETED", 
                    "Đơn hàng này đã được thanh toán thành công trước đó thông qua: " + existingPayment.getMethod(), 400);
            }
        });

        // 3. Lấy active POS session để gắn posSessionId vào payment
        // author: Hoàng | date: 2026-04-30 | note: Payment tiền mặt tại quầy phải thuộc ca POS đang mở để đối soát cuối ca.
        UUID posSessionId = posSessionJpaRepository
                .findByBranchIdAndStatus(branchId, "OPEN")
                .map(session -> session.getId())
                .orElse(null);
        if (posSessionId == null) {
            log.warn("Không tìm thấy ca POS đang mở cho branch {} — payment CASH sẽ không được tính vào đối soát ca", branchId);
        }

        // 4. Tạo Payment mới
        Payment payment = Payment.createCashPayment(
            tenantId, command.orderId(), command.amount(), command.cashierUserId(), posSessionId);

        // 5. Xác nhận thanh toán thành công
        payment.markCompleted(generateTransactionId());

        // 6. Lưu Payment
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Đã tạo Payment {} thành công", savedPayment.getId());

        // 7. Tạo Invoice
        String invoiceNumber = invoiceNumberGenerator.generateInvoiceNumber(branchId);
        List<InvoiceItem> invoiceItems = order.items().stream()
            .map(item -> InvoiceItem.create(
                item.itemName(), item.quantity(), item.unitPrice(), item.totalPrice()))
            .toList();

        Invoice invoice = Invoice.create(
            tenantId, branchId, order.id(), savedPayment.getId(),
            invoiceNumber,
            order.subtotal(), order.discountAmount(), order.taxAmount(), order.totalAmount(),
            invoiceItems
        );

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Đã tạo Invoice {} thành công", savedInvoice.getInvoiceNumber());

        // 8. Gọi Order Module để chốt đơn
        orderAdapter.completeOrder(order.id(), tenantId, branchId, command.cashierUserId());

        // 9. Publish PaymentCompletedEvent — để RevenueReportEventHandler cập nhật payment_breakdown.cash
        // BUG FIX: Trước đây thiếu event này nên breakdown.cash luôn = 0
        eventPublisher.publishEvent(new PaymentCompletedEvent(
            savedPayment.getId(),
            tenantId,
            branchId,
            order.id(),
            order.orderNumber(),
            savedPayment.getAmount(),
            savedPayment.getMethod().name(),  // "CASH"
            savedPayment.getTransactionId(),
            Instant.now()
        ));

        // 10. Publish InvoiceCreatedEvent
        eventPublisher.publishEvent(new InvoiceCreatedEvent(
            savedInvoice.getId(),
            tenantId,
            branchId,
            order.id(),
            savedInvoice.getInvoiceNumber(),
            savedInvoice.getTotal(),
            order.tableId(),
            Instant.now()
        ));

        log.info("Thanh toán tiền mặt hoàn tất: {} → Invoice {}", command.orderId(), invoiceNumber);
        return savedPayment;
    }

    /**
     * Sinh ra transaction ID duy nhất cho giao dịch tiền mặt.
     * Format: CASH-{timestamp}-{random}
     */
    private String generateTransactionId() {
        long timestamp = System.currentTimeMillis();
        long random = (long) (Math.random() * 1_000_000);
        return String.format("CASH-%d-%06d", timestamp, random);
    }
}
