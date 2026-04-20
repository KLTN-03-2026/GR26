package com.smartfnb.shift.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shift.application.command.*;
import com.smartfnb.shift.application.query.*;
import com.smartfnb.shift.web.dto.ClosePosSessionRequest;
import com.smartfnb.shift.web.dto.OpenPosSessionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller quản lý phiên POS (POS Session) — S-16.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/pos-sessions/active   — Phiên POS đang mở tại branch</li>
 *   <li>GET  /api/v1/pos-sessions          — Lịch sử phiên POS</li>
 *   <li>POST /api/v1/pos-sessions/open     — Mở phiên POS đầu ca</li>
 *   <li>POST /api/v1/pos-sessions/{id}/close — Đóng phiên POS cuối ca</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/pos-sessions")
@RequiredArgsConstructor
@Tag(name = "POS Sessions", description = "Quản lý phiên POS (tiền mặt đầu/cuối ca) — S-16")
public class PosSessionController {

    private final OpenPosSessionCommandHandler  openHandler;
    private final ClosePosSessionCommandHandler closeHandler;
    private final GetActivePosSessionQueryHandler getHandler;

    /**
     * Lấy phiên POS đang OPEN tại branch hiện tại.
     * CASHIER cần biết session hiện tại trước khi thao tác.
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER','CASHIER')")
    @Operation(summary = "Phiên POS đang mở", description = "Lấy phiên POS đang OPEN tại branch")
    public ResponseEntity<ApiResponse<PosSessionResult>> getActiveSession() {
        Optional<PosSessionResult> result = getHandler.handleActive(
                TenantContext.getCurrentBranchId());
        return ResponseEntity.ok(ApiResponse.ok(result.orElse(null)));
    }

    /**
     * Lấy lịch sử các phiên POS của branch.
     * Quản lý và OWNER xem được.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Lịch sử phiên POS", description = "Xem toàn bộ lịch sử sessions của branch")
    public ResponseEntity<ApiResponse<List<PosSessionResult>>> getSessionHistory() {
        List<PosSessionResult> results = getHandler.handleHistory(
                TenantContext.getCurrentBranchId(),
                TenantContext.getCurrentTenantId()
        );
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * Mở phiên POS đầu ca.
     * Chỉ CASHIER được mở (và branch chưa có session đang mở).
     */
    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER','CASHIER')")
    @Operation(summary = "Mở phiên POS", description = "Cashier mở phiên POS đầu ca, khai báo tiền mặt ban đầu")
    public ResponseEntity<ApiResponse<UUID>> openSession(
            @Valid @RequestBody OpenPosSessionRequest request) {
        OpenPosSessionCommand command = new OpenPosSessionCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentBranchId(),
                TenantContext.getCurrentUserId(),
                request.startingCash(),
                request.shiftScheduleId()
        );
        UUID sessionId = openHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(sessionId));
    }

    /**
     * Đóng phiên POS cuối ca.
     * Cashier nhập tiền mặt thực tế, hệ thống tính toán chênh lệch.
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER','CASHIER')")
    @Operation(summary = "Đóng phiên POS", description = "Cashier đóng phiên POS cuối ca, kiểm đếm tiền mặt")
    public ResponseEntity<ApiResponse<Void>> closeSession(
            @PathVariable UUID id,
            @Valid @RequestBody ClosePosSessionRequest request) {
        ClosePosSessionCommand command = new ClosePosSessionCommand(
                TenantContext.getCurrentTenantId(),
                id,
                TenantContext.getCurrentUserId(),
                request.endingCashActual(),
                request.note()
        );
        closeHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
