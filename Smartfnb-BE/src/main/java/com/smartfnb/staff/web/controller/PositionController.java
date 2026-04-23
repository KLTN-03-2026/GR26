package com.smartfnb.staff.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.staff.application.command.*;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import com.smartfnb.staff.web.dto.PositionRequest;
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
 * REST Controller quản lý chức vụ nhân viên (S-15).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET    /api/v1/positions      — Danh sách chức vụ</li>
 *   <li>POST   /api/v1/positions      — Tạo chức vụ mới</li>
 *   <li>PUT    /api/v1/positions/{id} — Cập nhật chức vụ</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
@Tag(name = "Position", description = "Quản lý chức vụ nhân viên — S-15")
public class PositionController {

    private final CreatePositionCommandHandler createPositionCommandHandler;
    private final UpdatePositionCommandHandler updatePositionCommandHandler;
    private final PositionJpaRepository        positionJpaRepository;

    /**
     * Lấy danh sách chức vụ đang hoạt động của tenant.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Danh sách chức vụ")
    public ResponseEntity<ApiResponse<List<PositionJpaEntity>>> listPositions() {
        List<PositionJpaEntity> positions = positionJpaRepository
                .findByTenantIdAndActiveTrue(TenantContext.getCurrentTenantId());
        return ResponseEntity.ok(ApiResponse.ok(positions));
    }

    /**
     * Tạo chức vụ mới.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Tạo chức vụ mới")
    public ResponseEntity<ApiResponse<UUID>> createPosition(
            @Valid @RequestBody PositionRequest request) {
        CreatePositionCommand command = new CreatePositionCommand(
                TenantContext.getCurrentTenantId(),
                request.name(), request.description()
        );
        UUID id = createPositionCommandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(id));
    }

    /**
     * Cập nhật chức vụ.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Cập nhật chức vụ")
    public ResponseEntity<ApiResponse<Void>> updatePosition(
            @PathVariable UUID id,
            @Valid @RequestBody PositionRequest request) {
        UpdatePositionCommand command = new UpdatePositionCommand(
                TenantContext.getCurrentTenantId(), id,
                request.name(), request.description(), null
        );
        updatePositionCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Vô hiệu hoá chức vụ (set active = false).
     */
    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Bật/tắt chức vụ")
    public ResponseEntity<ApiResponse<Void>> togglePosition(
            @PathVariable UUID id,
            @RequestParam boolean active) {
        UpdatePositionCommand command = new UpdatePositionCommand(
                TenantContext.getCurrentTenantId(), id,
                null, null, active
        );
        updatePositionCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
