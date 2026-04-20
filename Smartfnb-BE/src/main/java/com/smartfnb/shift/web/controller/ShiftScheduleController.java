package com.smartfnb.shift.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shift.application.command.*;
import com.smartfnb.shift.application.query.*;
import com.smartfnb.shift.web.dto.RegisterShiftRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý lịch ca làm việc (Shift Schedule) — S-16.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/shifts           — Lịch ca theo branch + date range</li>
 *   <li>GET  /api/v1/shifts/my        — Lịch ca cá nhân</li>
 *   <li>POST /api/v1/shifts           — Đăng ký ca làm việc</li>
 *   <li>POST /api/v1/shifts/{id}/checkin  — Check-in ca</li>
 *   <li>POST /api/v1/shifts/{id}/checkout — Check-out ca</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
@Tag(name = "Shift Schedules", description = "Quản lý lịch ca làm việc — S-16")
public class ShiftScheduleController {

    private final RegisterShiftCommandHandler  registerHandler;
    private final CheckInCommandHandler        checkInHandler;
    private final CheckOutCommandHandler       checkOutHandler;
    private final GetShiftScheduleQueryHandler getScheduleHandler;

    /**
     * Lấy toàn bộ lịch ca của branch trong khoảng ngày.
     * OWNER, ADMIN, BRANCH_MANAGER được xem tất cả.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Lịch ca của branch", description = "Xem lịch ca tất cả nhân viên trong khoảng ngày")
    public ResponseEntity<ApiResponse<List<ShiftScheduleResult>>> getBranchSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ShiftScheduleResult> results = getScheduleHandler.handleByBranch(
                TenantContext.getCurrentBranchId(),
                TenantContext.getCurrentTenantId(),
                startDate, endDate
        );
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * Xem lịch ca cá nhân của nhân viên đang đăng nhập.
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lịch ca cá nhân", description = "Nhân viên xem lịch ca của bản thân")
    public ResponseEntity<ApiResponse<List<ShiftScheduleResult>>> getMySchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ShiftScheduleResult> results = getScheduleHandler.handleByUser(
                TenantContext.getCurrentUserId(),
                TenantContext.getCurrentTenantId(),
                startDate, endDate
        );
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * Đăng ký ca làm việc cho nhân viên.
     * OWNER, ADMIN, BRANCH_MANAGER đăng ký cho bất kỳ ai.
     * WAITER, BARISTA, CASHIER chỉ đăng ký cho bản thân.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng ký ca làm việc")
    public ResponseEntity<ApiResponse<UUID>> registerShift(
            @Valid @RequestBody RegisterShiftRequest request) {
        RegisterShiftCommand command = new RegisterShiftCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentBranchId(),
                TenantContext.getCurrentUserId(),
                request.userId(),
                request.shiftTemplateId(),
                request.date()
        );
        UUID scheduleId = registerHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(scheduleId));
    }

    /**
     * Nhân viên check-in bắt đầu ca.
     * Chỉ nhân viên có ca mới được check-in.
     */
    @PostMapping("/{id}/checkin")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check-in ca làm việc")
    public ResponseEntity<ApiResponse<Void>> checkIn(@PathVariable UUID id) {
        CheckInCommand command = new CheckInCommand(
                TenantContext.getCurrentTenantId(),
                id,
                TenantContext.getCurrentUserId()
        );
        checkInHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Nhân viên check-out kết thúc ca.
     */
    @PostMapping("/{id}/checkout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check-out ca làm việc")
    public ResponseEntity<ApiResponse<Void>> checkOut(@PathVariable UUID id) {
        CheckOutCommand command = new CheckOutCommand(
                TenantContext.getCurrentTenantId(),
                id,
                TenantContext.getCurrentUserId()
        );
        checkOutHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
