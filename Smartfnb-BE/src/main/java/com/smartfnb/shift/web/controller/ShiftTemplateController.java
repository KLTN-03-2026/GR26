package com.smartfnb.shift.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shift.application.command.*;
import com.smartfnb.shift.application.query.*;
import com.smartfnb.shift.web.dto.ShiftTemplateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý ca mẫu (Shift Template) — S-16.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/shift-templates          — Danh sách ca mẫu của branch</li>
 *   <li>POST /api/v1/shift-templates          — Tạo ca mẫu mới</li>
 *   <li>PUT  /api/v1/shift-templates/{id}     — Cập nhật ca mẫu</li>
 *   <li>DELETE /api/v1/shift-templates/{id}   — Deactivate ca mẫu</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/shift-templates")
@RequiredArgsConstructor
@Tag(name = "Shift Templates", description = "Quản lý ca mẫu — S-16")
public class ShiftTemplateController {

    private final CreateShiftTemplateCommandHandler createHandler;
    private final UpdateShiftTemplateCommandHandler updateHandler;
    private final DeleteShiftTemplateCommandHandler deleteHandler;
    private final GetShiftTemplatesQueryHandler getHandler;

    /**
     * Lấy danh sách ca mẫu active của branch hiện tại.
     * Tất cả nhân viên đã xác thực đều được xem.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Danh sách ca mẫu", description = "Lấy tất cả ca mẫu active của chi nhánh")
    public ResponseEntity<ApiResponse<List<ShiftTemplateResult>>> listTemplates() {
        UUID branchId = TenantContext.getCurrentBranchId();
        List<ShiftTemplateResult> results = getHandler.handleByBranch(branchId);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * Tạo ca mẫu mới cho branch.
     * Chỉ OWNER, ADMIN, BRANCH_MANAGER được tạo.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Tạo ca mẫu mới")
    public ResponseEntity<ApiResponse<UUID>> createTemplate(
            @Valid @RequestBody ShiftTemplateRequest request) {
        CreateShiftTemplateCommand command = new CreateShiftTemplateCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentBranchId(),
                TenantContext.getCurrentUserId(),
                request.name(),
                request.startTime(),
                request.endTime(),
                request.minStaff(),
                request.maxStaff(),
                request.color()
        );
        UUID templateId = createHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(templateId));
    }

    /**
     * Cập nhật ca mẫu theo ID.
     * Chỉ OWNER, ADMIN, BRANCH_MANAGER được cập nhật.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Cập nhật ca mẫu")
    public ResponseEntity<ApiResponse<Void>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody ShiftTemplateRequest request) {
        UpdateShiftTemplateCommand command = new UpdateShiftTemplateCommand(
                TenantContext.getCurrentTenantId(),
                id,
                TenantContext.getCurrentUserId(),
                request.name(),
                request.startTime(),
                request.endTime(),
                request.minStaff(),
                request.maxStaff(),
                request.color(),
                request.active()
        );
        updateHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Deactivate (xoá mềm) ca mẫu.
     * Chỉ OWNER, ADMIN được deactivate.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Deactivate ca mẫu")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        DeleteShiftTemplateCommand command = new DeleteShiftTemplateCommand(
                TenantContext.getCurrentTenantId(),
                id,
                TenantContext.getCurrentUserId()
        );
        deleteHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
