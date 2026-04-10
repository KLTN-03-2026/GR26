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
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller quản lý nhân viên (S-15).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET    /api/v1/staff            — Danh sách nhân viên (phân trang, filter)</li>
 *   <li>POST   /api/v1/staff            — Tạo nhân viên mới</li>
 *   <li>GET    /api/v1/staff/{id}       — Chi tiết nhân viên</li>
 *   <li>PUT    /api/v1/staff/{id}       — Cập nhật nhân viên</li>
 *   <li>DELETE /api/v1/staff/{id}       — Vô hiệu hoá nhân viên (soft delete)</li>
 *   <li>PUT    /api/v1/staff/{id}/roles — Gán roles cho nhân viên</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@Tag(name = "Staff", description = "Quản lý nhân viên — S-15")
public class StaffController {

    private final CreateStaffCommandHandler      createStaffCommandHandler;
    private final UpdateStaffCommandHandler      updateStaffCommandHandler;
    private final DeactivateStaffCommandHandler  deactivateStaffCommandHandler;
    private final AssignRoleToStaffCommandHandler assignRoleCommandHandler;
    private final GetStaffListQueryHandler       getStaffListQueryHandler;
    private final GetStaffDetailQueryHandler     getStaffDetailQueryHandler;

    /**
     * Lấy danh sách nhân viên có phân trang và filter.
     * OWNER xem toàn bộ tenant, ADMIN/BRANCH_MANAGER xem chi nhánh được gán.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Danh sách nhân viên", description = "Lấy danh sách nhân viên có filter và phân trang")
    public ResponseEntity<ApiResponse<Page<StaffSummaryResult>>> listStaff(
            @RequestParam(required = false) UUID positionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        GetStaffListQuery query = new GetStaffListQuery(
                TenantContext.getCurrentTenantId(),
                positionId, status, keyword, page, size
        );
        Page<StaffSummaryResult> result = getStaffListQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một nhân viên theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Chi tiết nhân viên")
    public ResponseEntity<ApiResponse<StaffDetailResult>> getStaff(@PathVariable UUID id) {
        StaffDetailResult result = getStaffDetailQueryHandler.handle(
                id, TenantContext.getCurrentTenantId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo nhân viên mới trong tenant.
     * Chỉ OWNER và ADMIN được phép.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Tạo nhân viên mới")
    public ResponseEntity<ApiResponse<UUID>> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        CreateStaffCommand command = new CreateStaffCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentUserId(),
                request.fullName(), request.phone(), request.email(),
                request.positionId(), request.employeeCode(), request.hireDate(),
                request.dateOfBirth(), request.gender(), request.address()
        );
        UUID staffId = createStaffCommandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(staffId));
    }

    /**
     * Cập nhật thông tin nhân viên.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Cập nhật nhân viên")
    public ResponseEntity<ApiResponse<Void>> updateStaff(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStaffRequest request) {
        UpdateStaffCommand command = new UpdateStaffCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentUserId(),
                id,
                request.fullName(), request.phone(), request.email(),
                request.positionId(), request.employeeCode(), request.hireDate(),
                request.dateOfBirth(), request.gender(), request.address()
        );
        updateStaffCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Vô hiệu hoá nhân viên (soft delete).
     * Chỉ OWNER được xoá nhân viên.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Vô hiệu hoá nhân viên (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deactivateStaff(
            @PathVariable UUID id,
            @Valid @RequestBody DeactivateStaffRequest request) {
        DeactivateStaffCommand command = new DeactivateStaffCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentUserId(),
                id, request.reason()
        );
        deactivateStaffCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Gán vai trò cho nhân viên (replace-all).
     * Chỉ OWNER được thay đổi roles.
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Gán roles cho nhân viên")
    public ResponseEntity<ApiResponse<Void>> assignRoles(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRolesRequest request) {
        AssignRoleToStaffCommand command = new AssignRoleToStaffCommand(
                TenantContext.getCurrentTenantId(),
                id, request.roleIds()
        );
        assignRoleCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
