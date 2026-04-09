package com.smartfnb.staff.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.staff.application.command.*;
import com.smartfnb.staff.application.query.*;
import com.smartfnb.staff.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller quản lý vai trò và phân quyền (S-15 — RBAC matrix).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/roles                  — Ma trận role-permission toàn tenant</li>
 *   <li>POST /api/v1/roles                  — Tạo vai trò mới</li>
 *   <li>PUT  /api/v1/roles/{id}/permissions — Cập nhật permissions (+ audit_log)</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Role", description = "Quản lý vai trò và phân quyền RBAC — S-15")
public class RoleController {

    private final CreateRoleCommandHandler            createRoleCommandHandler;
    private final UpdateRolePermissionsCommandHandler updateRolePermissionsCommandHandler;
    private final GetRolePermissionMatrixQueryHandler getRolePermissionMatrixQueryHandler;

    /**
     * Lấy toàn bộ ma trận role-permission của tenant.
     * Dùng để render UI bảng phân quyền.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Ma trận phân quyền", description = "Lấy toàn bộ roles và permissions của tenant")
    public ResponseEntity<ApiResponse<RolePermissionMatrixResult>> getMatrix() {
        RolePermissionMatrixResult result = getRolePermissionMatrixQueryHandler
                .handle(TenantContext.getCurrentTenantId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo vai trò mới.
     * Chỉ OWNER được tạo role.
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Tạo vai trò mới")
    public ResponseEntity<ApiResponse<UUID>> createRole(
            @Valid @RequestBody CreateRoleRequest request) {
        CreateRoleCommand command = new CreateRoleCommand(
                TenantContext.getCurrentTenantId(),
                request.name(), request.description()
        );
        UUID roleId = createRoleCommandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(roleId));
    }

    /**
     * Cập nhật danh sách permissions cho một vai trò (replace-all).
     * BẮT BUỘC ghi audit_log — chỉ OWNER được thực hiện.
     */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(
        summary = "Cập nhật permissions của vai trò",
        description = "Thay thế toàn bộ permissions. Tự động ghi audit_log."
    )
    public ResponseEntity<ApiResponse<Void>> updatePermissions(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRolePermissionsRequest request) {
        UpdateRolePermissionsCommand command = new UpdateRolePermissionsCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentUserId(),
                id, request.permissionIds()
        );
        updateRolePermissionsCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
