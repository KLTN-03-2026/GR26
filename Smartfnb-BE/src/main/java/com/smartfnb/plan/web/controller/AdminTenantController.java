package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.TenantAdminService;
import com.smartfnb.plan.application.dto.ChangeTenantPlanRequest;
import com.smartfnb.plan.application.dto.SubscriptionResponse;
import com.smartfnb.plan.application.dto.TenantDetailResponse;
import com.smartfnb.plan.application.dto.TenantSummaryResponse;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller Admin quản lý người thuê (Tenants).
 * Tất cả endpoint yêu cầu role SYSTEM_ADMIN.
 *
 * <p>Base path: {@code /api/v1/admin/tenants}</p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@RestController
@RequestMapping("/api/v1/admin/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminTenantController {

    private final TenantAdminService tenantAdminService;

    /**
     * Lấy danh sách tenant có phân trang và filter.
     *
     * @param page     số trang (mặc định 0)
     * @param size     kích thước trang (mặc định 10)
     * @param status   filter trạng thái: ACTIVE | SUSPENDED | CANCELLED
     * @param planId   filter theo gói dịch vụ
     * @param keyword  từ khóa tìm trong tên hoặc email
     * @return Page TenantSummaryResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TenantSummaryResponse>>> getTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID planId,
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TenantSummaryResponse> result =
                tenantAdminService.getTenants(status, planId, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy thông tin chi tiết đầy đủ của một tenant.
     *
     * @param tenantId UUID của tenant
     * @return TenantDetailResponse
     */
    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> getTenantDetail(
            @PathVariable UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.ok(tenantAdminService.getTenantDetail(tenantId)));
    }

    /**
     * Tạm khóa tenant (SUSPENDED).
     * Body: {"reason": "Quá hạn thanh toán 30 ngày"}
     *
     * @param tenantId UUID của tenant
     * @param body     map chứa "reason"
     * @return HTTP 200 + thông báo
     */
    @PutMapping("/{tenantId}/suspend")
    public ResponseEntity<ApiResponse<Void>> suspendTenant(
            @PathVariable UUID tenantId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Suspend bởi SYSTEM_ADMIN") : "Suspend bởi SYSTEM_ADMIN";
        tenantAdminService.suspendTenant(tenantId, reason);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Mở khóa tenant (trở về ACTIVE).
     *
     * @param tenantId UUID của tenant
     * @return HTTP 200
     */
    @PutMapping("/{tenantId}/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivateTenant(@PathVariable UUID tenantId) {
        tenantAdminService.reactivateTenant(tenantId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Đổi/nâng cấp gói dịch vụ cho tenant.
     * Expire subscription cũ → tạo subscription ACTIVE mới.
     *
     * @param tenantId UUID của tenant
     * @param request  gói mới và ngày hết hạn
     * @return SubscriptionResponse sau khi đổi gói
     */
    @PutMapping("/{tenantId}/plan")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> changePlan(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ChangeTenantPlanRequest request) {
        SubscriptionResponse response = tenantAdminService.changeTenantPlan(tenantId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
