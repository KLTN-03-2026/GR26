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
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Xử lý xác nhận thanh toán thủ công từ Thu Ngân cho các GD chuyển khoản.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ManualConfirmQRPaymentCommandHandler {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final OrderAdapter orderAdapter;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void handle(ManualConfirmQRPaymentCommand command) {
        log.info("Thu ngân {} xác nhận thủ công QR Payment {}", 
            command.cashierId(), command.paymentId());

        Payment payment = paymentRepository.findById(command.paymentId())
            .orElseThrow(() -> new PaymentNotFoundException(command.paymentId()));

        if (!payment.getTenantId().equals(command.tenantId())) {
            throw new SmartFnbException("ACCESS_DENIED", "Không có quyền thao tác trên payment này", 403);
        }
        
        if (payment.getStatus().name().equals("COMPLETED")) {
            throw new SmartFnbException("PAYMENT_ALREADY_COMPLETED", "Thanh toán này đã hoàn tất", 400);
        }

        // Tạo một mã giao dịch giả định cho việc xác nhận thủ công
        String transactionId = "MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        payment.markCompleted(transactionId);
        paymentRepository.save(payment);

        createInvoiceAndPublishEvents(payment, transactionId);
    }

    private void createInvoiceAndPublishEvents(Payment payment, String transactionId) {
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
        log.info("Đã tạo Invoice {} cho QR Payment confirmed manual {}", 
            savedInvoice.getInvoiceNumber(), payment.getId());

        orderAdapter.completeOrder(order.id(), payment.getTenantId(), order.branchId(), payment.getCashierUserId());

        eventPublisher.publishEvent(new PaymentCompletedEvent(
            payment.getId(), payment.getTenantId(), order.branchId(), payment.getOrderId(),
            order.orderNumber(), payment.getAmount(), payment.getMethod().name(),
            transactionId, Instant.now()
        ));

        eventPublisher.publishEvent(new InvoiceCreatedEvent(
            savedInvoice.getId(), payment.getTenantId(), order.branchId(), order.id(),
            savedInvoice.getInvoiceNumber(), savedInvoice.getTotal(), order.tableId(), Instant.now()
        ));
    }
}
