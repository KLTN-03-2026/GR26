package com.smartfnb.payment.web.controller;

import com.smartfnb.payment.application.command.*;
import com.smartfnb.payment.application.dto.*;
import com.smartfnb.payment.application.query.SearchInvoiceQuery;
import com.smartfnb.payment.application.query.SearchInvoiceQueryHandler;
import com.smartfnb.payment.application.query.SearchInvoiceResult;
import com.smartfnb.payment.domain.model.Invoice;
import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.repository.InvoiceRepository;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.payment.domain.exception.InvoiceNotFoundException;
import com.smartfnb.payment.domain.exception.PaymentNotFoundException;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * REST Controller cho Payment Module.
 * Xử lý các API liên quan đến thanh toán (cash, QR), hóa đơn, và search.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Validated
@Slf4j
public class PaymentController {

    private final ProcessCashPaymentCommandHandler cashPaymentHandler;
    private final ProcessQRPaymentCommandHandler qrPaymentHandler;
    private final ConfirmQRPaymentCommandHandler confirmQRPaymentHandler;
    private final SearchInvoiceQueryHandler searchInvoiceHandler;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * API xử lý thanh toán tiền mặt.
     * Thu ngân nhập số tiền nhận được → tạo Payment + Invoice.
     *
     * POST /api/v1/payments/cash
     */
    @PostMapping("/cash")
    @PreAuthorize("hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processCashPayment(
            @Valid @RequestBody ProcessCashPaymentRequest request) {

        UUID currentStaffId = TenantContext.getCurrentUserId();
        log.info("Thu ngân {} xử lý thanh toán tiền mặt cho đơn {}", currentStaffId, request.orderId());

        ProcessCashPaymentCommand command = new ProcessCashPaymentCommand(
            request.orderId(),
            request.amount(),
            currentStaffId
        );

        Payment payment = cashPaymentHandler.handle(command);
        PaymentResponse response = mapToPaymentResponse(payment);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response));
    }

    /**
     * API tạo QR Code thanh toán.
     * Trả về QR code URL + thời gian hết hạn (3 phút).
     *
     * POST /api/v1/payments/qr
     */
    @PostMapping("/qr")
    @PreAuthorize("hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ProcessQRPaymentResponse>> processQRPayment(
            @Valid @RequestBody ProcessQRPaymentRequest request) {

        UUID currentStaffId = TenantContext.getCurrentUserId();
        log.info("Thu ngân {} tạo QR {} cho đơn {}", currentStaffId, request.qrMethod(), request.orderId());

        ProcessQRPaymentCommand command = new ProcessQRPaymentCommand(
            request.orderId(),
            request.amount(),
            request.qrMethod(),
            currentStaffId
        );

        var result = qrPaymentHandler.handle(command);

        ProcessQRPaymentResponse response = new ProcessQRPaymentResponse(
            result.paymentId(),
            result.qrCodeUrl(),
            result.qrCodeData(),
            result.expiresInSeconds(),
            result.orderNumber()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response));
    }

    /**
     * Webhook endpoint để nhận confirmation từ payment gateway.
     * Payment gateway sẽ POST tới endpoint này khi thanh toán được xác nhận.
     *
     * POST /api/v1/payments/qr/webhook
     */
    @PostMapping("/qr/webhook")
    public ResponseEntity<ApiResponse<Void>> confirmQRPayment(
            @Valid @RequestBody ConfirmQRPaymentWebhookRequest request) {

        log.info("Nhận webhook QR payment confirmation: paymentId={}, status={}", 
            request.paymentId(), request.status());

        ConfirmQRPaymentCommand command = new ConfirmQRPaymentCommand(
            request.paymentId(),
            request.transactionId(),
            request.status(),
            request.amount(),
            request.paidAtTimestamp()
        );

        try {
            confirmQRPaymentHandler.handle(command);
            return ResponseEntity.ok(ApiResponse.ok());
        } catch (Exception e) {
            log.error("Lỗi xác nhận thanh toán QR", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("QR_PAYMENT_ERROR", e.getMessage()));
        }
    }

    /**
     * API search Invoice với constraints:
     * - Giới hạn 90 ngày gần nhất
     * - Optional: tìm kiếm theo invoice_number
     * - Pagination
     *
     * GET /api/v1/payments/invoices/search?invoiceNumber=INV-XYZ&page=0&size=20
     */
    @GetMapping("/invoices/search")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SearchInvoiceResponse>> searchInvoices(
            @RequestParam(required = false) String invoiceNumber,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        UUID branchId = TenantContext.getCurrentBranchId();
        log.info("Search Invoice: branchId={}, invoiceNumber={}, page={}, size={}", 
            branchId, invoiceNumber, page, size);

        SearchInvoiceQuery query = new SearchInvoiceQuery(branchId, invoiceNumber, page, size);
        SearchInvoiceResult result = searchInvoiceHandler.handle(query);

        SearchInvoiceResponse response = new SearchInvoiceResponse(
            result.items().stream()
                .map(item -> new SearchInvoiceResponse.InvoiceItem(
                    item.id(),
                    item.invoiceNumber(),
                    item.orderId(),
                    item.total(),
                    item.issuedAt()
                ))
                .toList(),
            result.totalItems(),
            result.pageNumber(),
            result.pageSize(),
            result.totalPages()
        );

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API lấy thông tin hóa đơn theo ID.
     * GET /api/v1/payments/invoices/{invoiceId}
     */
    @GetMapping("/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(
            @PathVariable UUID invoiceId) {

        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));

        // Validate tenant access
        if (!invoice.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new RuntimeException("Không có quyền truy cập Invoice này");
        }

        InvoiceResponse response = mapToInvoiceResponse(invoice);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API lấy thông tin hóa đơn theo Invoice Number.
     * GET /api/v1/payments/invoices/number/{invoiceNumber}
     */
    @GetMapping("/invoices/number/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByNumber(
            @PathVariable String invoiceNumber) {

        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceNumber));

        // Validate tenant access
        if (!invoice.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new RuntimeException("Không có quyền truy cập Invoice này");
        }

        InvoiceResponse response = mapToInvoiceResponse(invoice);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API lấy thông tin thanh toán theo ID.
     * GET /api/v1/payments/{paymentId}
     */
    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @PathVariable UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentNotFoundException(paymentId));

        // Validate tenant access
        if (!payment.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new RuntimeException("Không có quyền truy cập Payment này");
        }

        PaymentResponse response = mapToPaymentResponse(payment);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Mapper: Payment domain entity → PaymentResponse DTO
     */
    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getOrderId(),
            payment.getAmount(),
            payment.getMethod().name(),
            payment.getStatus().name(),
            payment.getTransactionId(),
            payment.getPaidAt(),
            payment.getCreatedAt()
        );
    }

    /**
     * Mapper: Invoice domain entity → InvoiceResponse DTO
     */
    private InvoiceResponse mapToInvoiceResponse(Invoice invoice) {
        var items = invoice.getItems().stream()
            .map(item -> new InvoiceResponse.InvoiceItemResponse(
                item.getItemName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
            ))
            .toList();

        return new InvoiceResponse(
            invoice.getId(),
            invoice.getOrderId(),
            invoice.getPaymentId(),
            invoice.getInvoiceNumber(),
            invoice.getSubtotal(),
            invoice.getDiscount(),
            invoice.getTaxAmount(),
            invoice.getTotal(),
            invoice.getIssuedAt(),
            items
        );
    }
}
