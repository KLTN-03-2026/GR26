package com.smartfnb.branch.web.controller;

import com.smartfnb.branch.application.BranchService;
import com.smartfnb.branch.application.dto.BranchRequest;
import com.smartfnb.branch.application.dto.BranchResponse;
import com.smartfnb.branch.application.dto.PaymentConfigRequest;
import com.smartfnb.branch.application.dto.PaymentConfigResponse;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller quản lý chi nhánh của Tenant.
 *
 * @author vutq
 * @since 2026-03-27
 */
@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    /**
     * Lấy danh sách toàn bộ chi nhánh của Tenant.
     * Nhân viên thường (có BRANCH_VIEW) cũng có thể xem để hiển thị tên chi nhánh trên UI.
     * Quản lý (có BRANCH_EDIT) có toàn quyền CRUD.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'BRANCH_VIEW') or hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAllBranches() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        String currentRole = TenantContext.getCurrentRole();
        
        // Nếu là OWNER hoặc chưa có role cụ thể (super_admin) thì lấy tất cả, ngược lại chỉ lấy branch được gán
        if ("OWNER".equals(currentRole) || "SUPER_ADMIN".equals(currentRole)) {
            return ResponseEntity.ok(ApiResponse.ok(
                    branchService.getAllBranchesByTenant(tenantId)
            ));
        } else {
            UUID userId = TenantContext.getCurrentUserId();
            return ResponseEntity.ok(ApiResponse.ok(
                    branchService.getAssignedBranches(tenantId, userId)
            ));
        }
    }

    /**
     * Tạo mới một chi nhánh.
     * Cần quyền MANAGE_BRANCH. Logic validate quota gói cước được xử lý tại Service.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody BranchRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        BranchResponse branch = branchService.createBranch(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.ok(branch)
        );
    }

    /**
     * Chỉnh sửa thông tin chi nhánh.
     */
    @PutMapping("/{branchId}")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranch(
            @PathVariable UUID branchId, 
            @Valid @RequestBody BranchRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        BranchResponse branch = branchService.updateBranch(tenantId, branchId, request);
        return ResponseEntity.ok(
                ApiResponse.ok(branch)
        );
    }

    /**
     * Gán nhân viên vào làm việc tại chi nhánh.
     * Quyền: OWNER hoặc MANAGE_BRANCH.
     */
    @PostMapping("/{branchId}/users")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<Void>> assignUserToBranch(
            @PathVariable UUID branchId,
            @Valid @RequestBody com.smartfnb.branch.application.dto.AssignUserRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        branchService.assignUserToBranch(tenantId, branchId, request.userId());

        return ResponseEntity.ok(ApiResponse.ok());
    }

    // =========================================================================
    // author: Hoàng
    // date: 27-04-2026
    // note: Hai endpoint quản lý cấu hình PayOS per-branch.
    //       Chỉ Owner (BRANCH_EDIT) mới được truy cập.
    // =========================================================================

    /**
     * Lấy cấu hình PayOS của chi nhánh (masked key).
     * GET /api/v1/branches/{branchId}/payment-config
     */
    @GetMapping("/{branchId}/payment-config")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<PaymentConfigResponse>> getPaymentConfig(
            @PathVariable UUID branchId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        PaymentConfigResponse response = branchService.getPaymentConfig(tenantId, branchId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Lưu (hoặc cập nhật) cấu hình PayOS cho chi nhánh.
     * PUT /api/v1/branches/{branchId}/payment-config
     */
    @PutMapping("/{branchId}/payment-config")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<PaymentConfigResponse>> savePaymentConfig(
            @PathVariable UUID branchId,
            @Valid @RequestBody PaymentConfigRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        PaymentConfigResponse response = branchService.savePaymentConfig(tenantId, branchId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
