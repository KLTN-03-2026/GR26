package com.smartfnb.branch.web.controller;

import com.smartfnb.branch.application.BranchService;
import com.smartfnb.branch.application.dto.BranchRequest;
import com.smartfnb.branch.application.dto.BranchResponse;
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
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    /**
     * Lấy danh sách toàn bộ chi nhánh.
     * Cần quyền MANAGE_BRANCH hoặc VIEW_BRANCH.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAllBranches() {
        UUID tenantId = TenantContext.getCurrentTenantId();
         return ResponseEntity.ok(ApiResponse.ok(
                branchService.getAllBranchesByTenant(tenantId)
        ));
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
}
