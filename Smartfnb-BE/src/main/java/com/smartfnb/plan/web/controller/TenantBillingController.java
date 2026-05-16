package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.TenantBillingService;
import com.smartfnb.plan.application.dto.*;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller dành cho Tenant (Owner) tự gia hạn và thanh toán gói dịch vụ.
 *
 * <p>Base path: {@code /api/v1/tenant/billing}</p>
 *
 * <p>Khác với AdminBillingController (SYSTEM_ADMIN quản lý hóa đơn),
 * Controller này phục vụ chính Tenant Owner tự phục vụ:
 * <ul>
 *   <li>Tạo hóa đơn gia hạn</li>
 *   <li>Sinh QR thanh toán</li>
 *   <li>Xem lịch sử hóa đơn của mình</li>
 * </ul>
 * </p>
 *
 * @author vutq
 * @since 2026-04-30
 */
@RestController
@RequestMapping("/api/v1/tenant/billing")
@RequiredArgsConstructor
@Slf4j
public class TenantBillingController {

    private final TenantBillingService tenantBillingService;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. TẠO HÓA ĐƠN GIA HẠN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Tạo hóa đơn gia hạn gói dịch vụ.
     * Chỉ Owner mới có quyền tạo hóa đơn cho tenant của mình.
     * tenantId được lấy từ JWT — không nhận từ request body.
     *
     * <p>POST /api/v1/tenant/billing/renew</p>
     *
     * @param request planId, months, note
     * @return InvoiceResponse hóa đơn UNPAID vừa tạo + HTTP 201
     */
    @PostMapping("/renew")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createRenewalInvoice(
            @Valid @RequestBody TenantRenewRequest request) {

        log.info("Owner yêu cầu gia hạn gói {} trong {} tháng", request.planId(), request.months());
        InvoiceResponse invoice = tenantBillingService.createRenewalInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(invoice));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SINH QR THANH TOÁN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sinh mã QR để thanh toán hóa đơn gói dịch vụ.
     * Gateway sẽ callback về /webhook/qr khi User hoàn tất thanh toán.
     *
     * <p>POST /api/v1/tenant/billing/invoices/{invoiceId}/pay-qr</p>
     *
     * @param invoiceId UUID hóa đơn cần thanh toán
     * @param request   phương thức QR: VIETQR | MOMO
     * @return PlanQRPaymentResponse chứa QR URL, data, và thời gian hết hạn
     */
    @PostMapping("/invoices/{invoiceId}/pay-qr")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<PlanQRPaymentResponse>> generatePaymentQR(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody PayQRRequest request) {

        log.info("Owner yêu cầu QR {} cho hóa đơn {}", request.method(), invoiceId);
        PlanQRPaymentResponse response = tenantBillingService.generatePaymentQR(invoiceId, request.method());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Hủy hóa đơn gói đang chờ thanh toán để Owner chọn lại gói.
     * Không nhận body vì đây là thao tác kỹ thuật hủy invoice/QR cũ trước khi đổi gói.
     *
     * <p>POST /api/v1/tenant/billing/invoices/{invoiceId}/cancel</p>
     *
     * @param invoiceId UUID hóa đơn cần hủy
     * @return trạng thái hóa đơn sau khi hủy
     *
     * author: Hoàng | date: 2026-05-16 | note: Chỉ owner của tenant hiện tại được hủy invoice UNPAID.
     */
    @PostMapping("/invoices/{invoiceId}/cancel")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<CancelTenantInvoiceResponse>> cancelInvoice(
            @PathVariable UUID invoiceId) {

        log.info("Owner yêu cầu hủy hóa đơn gói {}", invoiceId);
        CancelTenantInvoiceResponse response = tenantBillingService.cancelTenantInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. DANH SÁCH HÓA ĐƠN CỦA TENANT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách hóa đơn gói dịch vụ của Tenant hiện tại.
     * Chỉ hiển thị hóa đơn thuộc tenantId lấy từ JWT — không thể xem của tenant khác.
     *
     * <p>GET /api/v1/tenant/billing/invoices</p>
     *
     * @param page số trang (mặc định 0)
     * @param size kích thước trang (mặc định 10)
     * @return Page<InvoiceResponse>
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getMyInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<InvoiceResponse> invoices = tenantBillingService.getMyInvoices(pageable);
        return ResponseEntity.ok(ApiResponse.ok(invoices));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. WEBHOOK — NHẬN CALLBACK TỪ PAYMENT GATEWAY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Webhook nhận callback từ payment gateway (VietQR/MoMo) sau khi User hoàn tất thanh toán.
     * Endpoint này KHÔNG yêu cầu JWT — gateway bên ngoài sẽ POST vào đây.
     * Bảo mật thông qua: invoice ID ngẫu nhiên (UUID) + khớp amount.
     *
     * <p>POST /api/v1/tenant/billing/webhook/qr</p>
     *
     * @param request payload từ payment gateway
     * @return HTTP 200 nếu xử lý thành công
     */
    @PostMapping("/webhook/qr")
    public ResponseEntity<ApiResponse<Void>> handleQRWebhook(
            @Valid @RequestBody PlanPaymentWebhookRequest request) {

        log.info("Nhận webhook plan payment: invoiceId={}, status={}, method={}",
                request.invoiceId(), request.status(), request.paymentMethod());
        try {
            tenantBillingService.processWebhookPayment(
                    request.invoiceId(),
                    request.transactionId(),
                    request.status(),
                    request.paymentMethod()
            );
            return ResponseEntity.ok(ApiResponse.ok());
        } catch (Exception e) {
            log.error("Lỗi xử lý webhook plan payment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("WEBHOOK_PROCESSING_ERROR", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. WEBHOOK PAYOS BILLING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Webhook nhận callback từ PayOS sau khi user thanh toán gói dịch vụ.
     * Endpoint PUBLIC — PayOS gọi trực tiếp, không cần JWT.
     * Bảo mật: verify payload qua providerReference (paymentLinkId) khớp với attempt trong DB.
     *
     * <p>POST /api/v1/tenant/billing/webhook/payos</p>
     *
     * @author Hoàng | date: 2026-05-16
     */
    @PostMapping("/webhook/payos")
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(
            @RequestBody java.util.Map<String, Object> payload) {

        log.info("Nhận PayOS billing webhook");
        try {
            // Trích xuất fields từ payload PayOS
            // Cấu trúc PayOS webhook: { "code": "00", "data": { "paymentLinkId": "...", "orderCode": ..., "amount": ... } }
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> data = (java.util.Map<String, Object>) payload.get("data");
            String code = String.valueOf(payload.getOrDefault("code", ""));
            if (data == null) {
                log.warn("PayOS billing webhook: thiếu 'data' trong payload");
                return ResponseEntity.ok(ApiResponse.ok());
            }
            String paymentLinkId = String.valueOf(data.getOrDefault("paymentLinkId", ""));
            long orderCode = Long.parseLong(String.valueOf(data.getOrDefault("orderCode", "0")));
            java.math.BigDecimal amount = data.get("amount") != null
                    ? new java.math.BigDecimal(String.valueOf(data.get("amount")))
                    : null;

            tenantBillingService.processPayOSWebhook(paymentLinkId, orderCode, amount, code);
            return ResponseEntity.ok(ApiResponse.ok());
        } catch (Exception e) {
            log.error("Lỗi xử lý PayOS billing webhook: {}", e.getMessage());
            // Trả 200 để PayOS không retry liên tục — lỗi đã được log
            return ResponseEntity.ok(ApiResponse.ok());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. POLLING / SYNC PAYMENT STATUS (dev & fallback)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Owner chủ động kiểm tra trạng thái PayOS qua PayOS API.
     * Dùng khi webhook không chạy (dev/local) hoặc user muốn xác nhận ngay.
     * Chỉ Owner của tenant hiện tại mới gọi được.
     *
     * <p>POST /api/v1/tenant/billing/invoices/{invoiceId}/sync-payment</p>
     *
     * @author Hoàng | date: 2026-05-16
     */
    @PostMapping("/invoices/{invoiceId}/sync-payment")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> syncPaymentStatus(
            @PathVariable UUID invoiceId) {

        log.info("Owner yêu cầu sync PayOS payment status cho invoice {}", invoiceId);
        boolean justPaid = tenantBillingService.syncPaymentStatus(invoiceId);
        java.util.Map<String, Object> result = java.util.Map.of(
                "invoiceId", invoiceId,
                "justPaid", justPaid,
                "message", justPaid ? "Thanh toán đã được xác nhận" : "Hóa đơn chưa được thanh toán"
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
