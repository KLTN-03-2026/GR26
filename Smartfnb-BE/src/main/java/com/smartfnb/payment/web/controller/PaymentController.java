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
import com.smartfnb.payment.infrastructure.external.PayOSProvider;
import com.smartfnb.payment.infrastructure.persistence.OrderAdapter;
import com.smartfnb.payment.infrastructure.persistence.OrderDto;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import jakarta.validation.Valid;
import java.util.UUID;

/**
 * REST Controller cho Payment Module.
 * Xử lý các API liên quan đến thanh toán (cash, QR), hóa đơn, và search.
 *
 * @author vutq
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
    private final SyncQRPaymentStatusCommandHandler syncQRPaymentStatusHandler;
    private final ManualConfirmQRPaymentCommandHandler manualConfirmQRPaymentHandler;
    private final SearchInvoiceQueryHandler searchInvoiceHandler;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderAdapter orderAdapter;
    private final PayOSProvider payOSProvider;

    /**
     * API xử lý thanh toán tiền mặt.
     * Thu ngân nhập số tiền nhận được → tạo Payment + Invoice.
     *
     * POST /api/v1/payments/cash
     */
    @PostMapping("/cash")
    @PreAuthorize("hasPermission(null, 'PAYMENT_CREATE') or hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER') or hasRole('SUPER_ADMIN')")
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
    @PreAuthorize("hasPermission(null, 'PAYMENT_CREATE') or hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER') or hasRole('SUPER_ADMIN')")
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
    // @PostMapping("/qr/webhook")
    public ResponseEntity<ApiResponse<Void>> confirmQRPayment(
            @Valid @RequestBody ConfirmQRPaymentWebhookRequest request) {

        log.info("Nhận webhook QR payment confirmation: paymentId={}, status={}",
            request.paymentId(), request.status());

        ConfirmQRPaymentCommand command = new ConfirmQRPaymentCommand(
            request.paymentId(),
            request.transactionId(),
            request.status(),
            request.amount()
            // request.paidAtTimestamp()
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
     * API xác nhận thanh toán thủ công.
     * Dành cho Thu ngân tự kiểm tra sổ phụ ngân hàng và bấm xác nhận khi App không báo webhook.
     *
     * POST /api/v1/payments/{paymentId}/confirm
     */
    @PostMapping("/{paymentId}/confirm")
    @PreAuthorize("hasPermission(null, 'PAYMENT_CREATE') or hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> manualConfirmQRPayment(@PathVariable UUID paymentId) {

        UUID currentStaffId = TenantContext.getCurrentUserId();
        log.info("Thu ngân {} xác nhận thủ công thanh toán {}", currentStaffId, paymentId);

        ManualConfirmQRPaymentCommand command = new ManualConfirmQRPaymentCommand(
            paymentId,
            TenantContext.getCurrentTenantId(),
            currentStaffId
        );

        try {
            manualConfirmQRPaymentHandler.handle(command);
            return ResponseEntity.ok(ApiResponse.ok());
        } catch (Exception e) {
            log.error("Lỗi xác nhận thanh toán thủ công", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("MANUAL_CONFIRM_ERROR", e.getMessage()));
        }
    }

    /**
     * API search Invoice với constraints:
     * - Giới hạn 90 ngày gần nhất
     * - Optional: tìm kiếm theo invoice_number
     * - Pagination
     *
     * GET /api/v1/payments/invoices?invoiceNumber=INV-XYZ&page=0&size=20
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasPermission(null, 'PAYMENT_VIEW') or hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'SUPER_ADMIN')")
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
    @PreAuthorize("hasPermission(null, 'PAYMENT_VIEW') or hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(
            @PathVariable UUID invoiceId) {

        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));

        // Validate tenant access
        if (!invoice.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new com.smartfnb.shared.exception.SmartFnbException("ACCESS_DENIED", "Không có quyền truy cập Invoice này", 403);
        }

        InvoiceResponse response = mapToInvoiceResponse(invoice);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API lấy thông tin hóa đơn theo Invoice Number.
     * GET /api/v1/payments/invoices/number/{invoiceNumber}
     */
    @GetMapping("/invoices/number/{invoiceNumber}")
    @PreAuthorize("hasPermission(null, 'PAYMENT_VIEW') or hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByNumber(
            @PathVariable String invoiceNumber) {

        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceNumber));

        // Validate tenant access
        if (!invoice.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new com.smartfnb.shared.exception.SmartFnbException("ACCESS_DENIED", "Không có quyền truy cập Invoice này", 403);
        }

        InvoiceResponse response = mapToInvoiceResponse(invoice);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API lấy thông tin thanh toán theo ID.
     * GET /api/v1/payments/{paymentId}
     */
    @GetMapping("/{paymentId}")
    @PreAuthorize("hasPermission(null, 'PAYMENT_VIEW') or hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @PathVariable UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentNotFoundException(paymentId));

        // Validate tenant access
        if (!payment.getTenantId().equals(TenantContext.getCurrentTenantId())) {
            throw new com.smartfnb.shared.exception.SmartFnbException("ACCESS_DENIED", "Không có quyền truy cập Payment này", 403);
        }

        PaymentResponse response = mapToPaymentResponse(payment);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * API đồng bộ trạng thái QR payment từ gateway.
     * Dùng cho local/dev khi PayOS webhook chưa có HTTPS public URL để callback.
     *
     * author: Hoàng | date: 27-04-2026 | note: FE polling endpoint này cho PayOS local/dev thay vì chờ webhook public.
     *
     * POST /api/v1/payments/{paymentId}/sync-status
     */
    @PostMapping("/{paymentId}/sync-status")
    @PreAuthorize("hasPermission(null, 'PAYMENT_CREATE') or hasRole('CASHIER') or hasRole('BRANCH_MANAGER') or hasRole('OWNER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> syncPaymentStatus(
            @PathVariable UUID paymentId) {

        log.info("Đồng bộ trạng thái QR payment từ gateway: paymentId={}", paymentId);
        Payment payment = syncQRPaymentStatusHandler.handle(paymentId);
        PaymentResponse response = mapToPaymentResponse(payment);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // =========================================================================
    // author: Hoàng
    // date: 27-04-2026
    // note: Webhook endpoint nhận callback từ PayOS khi khách thanh toán xong.
    //       Verify chữ ký qua SDK PayOS 2.0.1 bằng payOS.webhooks().verify(webhook).
    //       SDK throw Exception nếu signature không hợp lệ — trả 400.
    //       Sau khi verify, gọi ConfirmQRPaymentCommandHandler để cập nhật Payment → COMPLETED.
    //       Luôn trả 200 cho mọi lỗi xử lý sau khi verify để PayOS không retry.
    // =========================================================================

    /**
     * Webhook nhận xác nhận thanh toán từ PayOS.
     * PayOS POST tới endpoint này sau khi giao dịch hoàn tất.
     *
     * POST /api/v1/payments/qr/webhook/payos
     */
    @PostMapping("/qr/webhook/payos")
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(
            @RequestBody Webhook webhook) {

        log.info("Nhận PayOS webhook: code={}, success={}, hasData={}",
            webhook.getCode(), webhook.getSuccess(), webhook.getData() != null);
        try {
            String rawPaymentLinkId = webhook.getData() != null
                ? webhook.getData().getPaymentLinkId()
                : null;
            Long rawOrderCode = webhook.getData() != null
                ? webhook.getData().getOrderCode()
                : null;
            Long rawAmount = webhook.getData() != null
                ? webhook.getData().getAmount()
                : null;
            String rawCode = webhook.getData() != null
                ? webhook.getData().getCode()
                : null;

            if (rawPaymentLinkId == null || rawPaymentLinkId.isBlank()) {
                log.warn("PayOS webhook thiếu paymentLinkId: orderCode={}, amount={}, dataCode={}",
                    rawOrderCode, rawAmount, rawCode);
                return ResponseEntity.ok(ApiResponse.ok());
            }

            log.info("PayOS webhook payload: paymentLinkId={}, orderCode={}, amount={}, dataCode={}",
                rawPaymentLinkId, rawOrderCode, rawAmount, rawCode);

            // Tìm Payment theo transactionId (paymentLinkId được lưu khi tạo QR)
            Payment payment = paymentRepository.findByTransactionId(rawPaymentLinkId).orElse(null);

            if (payment == null) {
                log.warn("PayOS webhook: không tìm thấy payment với paymentLinkId={}, orderCode={}",
                    rawPaymentLinkId, rawOrderCode);
                // Trả 200 để PayOS không retry — không phải lỗi có thể xử lý bằng retry
                return ResponseEntity.ok(ApiResponse.ok());
            }

            log.info("PayOS webhook matched payment: paymentId={}, orderId={}, tenantId={}, method={}, status={}, transactionId={}, qrExpiresAt={}",
                payment.getId(), payment.getOrderId(), payment.getTenantId(), payment.getMethod(),
                payment.getStatus(), payment.getTransactionId(), payment.getQrExpiresAt());

            OrderDto order = orderAdapter.getOrderById(payment.getOrderId(), payment.getTenantId());
            log.info("PayOS webhook matched order: orderId={}, branchId={}, orderNumber={}, orderStatus={}",
                order.id(), order.branchId(), order.orderNumber(), order.status());

            // Verify webhook bằng đúng bộ key PayOS của chi nhánh tạo QR.
            log.info("PayOS webhook bắt đầu verify signature: paymentId={}, branchId={}, rawPaymentLinkId={}",
                payment.getId(), order.branchId(), rawPaymentLinkId);
            WebhookData webhookData = payOSProvider
                .resolvePayOS(payment.getTenantId(), order.branchId())
                .webhooks()
                .verify(webhook);

            String paymentLinkId = webhookData.getPaymentLinkId();
            String payosCode     = webhookData.getCode();
            Long verifiedOrderCode = webhookData.getOrderCode();
            Long verifiedAmount = webhookData.getAmount();

            log.info("PayOS webhook verify thành công: paymentId={}, paymentLinkId={}, orderCode={}, amount={}, code={}, desc={}",
                payment.getId(), paymentLinkId, verifiedOrderCode, verifiedAmount, payosCode, webhookData.getDesc());

            if (!rawPaymentLinkId.equals(paymentLinkId)) {
                log.warn("PayOS webhook paymentLinkId không khớp: raw={}, verified={}",
                    rawPaymentLinkId, paymentLinkId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("WEBHOOK_INVALID", "PayOS webhook không hợp lệ"));
            }

            // "00" là mã thành công của PayOS
            boolean isPaid = "00".equals(payosCode);
            log.info("PayOS webhook mapped status: paymentId={}, payosCode={}, internalStatus={}",
                payment.getId(), payosCode, isPaid ? "success" : "failed");

            ConfirmQRPaymentCommand command = new ConfirmQRPaymentCommand(
                payment.getId(),
                paymentLinkId,
                isPaid ? "success" : "failed",
                payment.getAmount()
                // isPaid ? System.currentTimeMillis() : null
            );

            confirmQRPaymentHandler.handle(command);
            log.info("PayOS webhook xử lý xong: paymentId={}, paymentLinkId={}, code={}",
                payment.getId(), paymentLinkId, payosCode);

            return ResponseEntity.ok(ApiResponse.ok());

        } catch (Exception e) {
            log.error("Lỗi xử lý PayOS webhook: type={}, message={}", e.getClass().getSimpleName(), e.getMessage(), e);
            // Trả 400 nếu chữ ký không hợp lệ, 500 cho lỗi khác — nhưng không để PayOS retry vô hạn
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("WEBHOOK_ERROR", "Lỗi xử lý webhook: " + e.getMessage()));
        }
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

        String paymentMethod = paymentRepository.findById(invoice.getPaymentId())
            .map(p -> p.getMethod().name())
            .orElse("UNKNOWN");

        return new InvoiceResponse(
            invoice.getId(),
            invoice.getOrderId(),
            paymentMethod,
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
