package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.BillingAdminService;
import com.smartfnb.plan.application.dto.CreateRenewalInvoiceRequest;
import com.smartfnb.plan.application.dto.InvoiceResponse;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller Admin quản lý hóa đơn gói dịch vụ (Subscription Billing).
 * Tất cả endpoint yêu cầu role SYSTEM_ADMIN.
 *
 * <p>Base path: {@code /api/v1/admin/billing}</p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@RestController
@RequestMapping("/api/v1/admin/billing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminBillingController {

    private final BillingAdminService billingAdminService;

    /**
     * Tạo hóa đơn gia hạn gói dịch vụ cho Tenant.
     * Hóa đơn được tạo với trạng thái UNPAID.
     *
     * @param request thông tin gia hạn (tenantId, planId, months)
     * @return InvoiceResponse vừa tạo + HTTP 201
     */
    @PostMapping("/invoices")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createRenewalInvoice(
            @Valid @RequestBody CreateRenewalInvoiceRequest request) {
        InvoiceResponse invoice = billingAdminService.createRenewalInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(invoice));
    }

    /**
     * Lấy danh sách tất cả hóa đơn có phân trang.
     * Filter theo status nếu có (UNPAID | PAID | CANCELLED).
     *
     * @param page   số trang (mặc định 0)
     * @param size   kích thước trang (mặc định 10)
     * @param status filter trạng thái, null = tất cả
     * @return Page InvoiceResponse
     */
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getAllInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                billingAdminService.getAllInvoices(status, pageable)));
    }

    /**
     * Lấy danh sách hóa đơn chưa thanh toán (UNPAID) — admin theo dõi hàng ngày.
     *
     * @param page số trang
     * @param size kích thước trang
     * @return Page InvoiceResponse chỉ UNPAID
     */
    @GetMapping("/invoices/unpaid")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getUnpaidInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                billingAdminService.getUnpaidInvoices(pageable)));
    }

    /**
     * Lấy danh sách hóa đơn của một tenant cụ thể.
     *
     * @param tenantId UUID tenant
     * @param page     số trang
     * @param size     kích thước trang
     * @return Page InvoiceResponse của tenant
     */
    @GetMapping("/tenants/{tenantId}/invoices")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getInvoicesByTenant(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                billingAdminService.getInvoicesByTenant(tenantId, pageable)));
    }

    /**
     * Lấy chi tiết một hóa đơn.
     *
     * @param invoiceId UUID hóa đơn
     * @return InvoiceResponse
     */
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceDetail(
            @PathVariable UUID invoiceId) {
        return ResponseEntity.ok(ApiResponse.ok(
                billingAdminService.getInvoiceDetail(invoiceId)));
    }

    /**
     * Admin xác nhận thanh toán hóa đơn (UNPAID → PAID).
     * Tự động gia hạn subscription và cập nhật tenant.plan_expires_at.
     *
     * Body: {"paymentMethod": "BANK_TRANSFER"}
     *
     * @param invoiceId UUID hóa đơn
     * @param body      map chứa "paymentMethod"
     * @return InvoiceResponse sau khi cập nhật
     */
    @PutMapping("/invoices/{invoiceId}/paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markInvoicePaid(
            @PathVariable UUID invoiceId,
            @RequestBody Map<String, String> body) {
        String paymentMethod = body.getOrDefault("paymentMethod", "BANK_TRANSFER");
        return ResponseEntity.ok(ApiResponse.ok(
                billingAdminService.markInvoicePaid(invoiceId, paymentMethod)));
    }

    /**
     * Hủy hóa đơn (chỉ được hủy khi UNPAID).
     *
     * Body: {"reason": "Khách hàng yêu cầu hủy"}
     *
     * @param invoiceId UUID hóa đơn
     * @param body      map chứa "reason"
     * @return HTTP 200
     */
    @PutMapping("/invoices/{invoiceId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelInvoice(
            @PathVariable UUID invoiceId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Admin hủy hóa đơn") : "Admin hủy hóa đơn";
        billingAdminService.cancelInvoice(invoiceId, reason);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
