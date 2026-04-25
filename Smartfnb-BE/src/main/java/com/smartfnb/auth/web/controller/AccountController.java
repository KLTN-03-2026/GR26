package com.smartfnb.auth.web.controller;

import com.smartfnb.auth.application.command.ChangePasswordCommand;
import com.smartfnb.auth.application.command.ChangePasswordCommandHandler;
import com.smartfnb.auth.application.command.UpdateProfileCommand;
import com.smartfnb.auth.application.command.UpdateProfileCommandHandler;
import com.smartfnb.auth.application.query.GetMyProfileQuery;
import com.smartfnb.auth.application.query.GetMyProfileQueryHandler;
import com.smartfnb.auth.application.query.result.UserProfileResult;
import com.smartfnb.auth.web.dto.ChangePasswordRequest;
import com.smartfnb.auth.web.dto.UpdateProfileRequest;
import com.smartfnb.auth.web.dto.UserProfileResponse;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller quản lý tài khoản cá nhân của người dùng đang đăng nhập.
 *
 * <p>Tất cả endpoint đều yêu cầu xác thực JWT.
 * userId và tenantId được trích xuất từ JWT (TenantContext) —
 * không nhận từ request body để tránh Mass Assignment.</p>
 *
 * <p>Endpoint:</p>
 * <ul>
 *   <li>{@code GET  /api/v1/account/me}          — Xem profile cá nhân</li>
 *   <li>{@code PUT  /api/v1/account/me}          — Cập nhật fullName, phone</li>
 *   <li>{@code PUT  /api/v1/account/me/password} — Đổi mật khẩu</li>
 * </ul>
 *
 * @author vutq
 * @since 2026-04-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Account", description = "Quản lý tài khoản cá nhân — Xem/sửa profile, đổi mật khẩu")
public class AccountController {

    private final GetMyProfileQueryHandler     getMyProfileQueryHandler;
    private final UpdateProfileCommandHandler  updateProfileCommandHandler;
    private final ChangePasswordCommandHandler changePasswordCommandHandler;

    // ===================== GET PROFILE =====================

    /**
     * Lấy thông tin profile cá nhân của người dùng đang đăng nhập.
     *
     * <p>Security: chỉ trả về dữ liệu của chính user đang đăng nhập.
     * userId lấy từ JWT — không thể giả mạo.</p>
     *
     * @return 200 OK + UserProfileResponse (không có passwordHash, posPin)
     */
    @GetMapping("/me")
    @Operation(summary = "Lấy profile cá nhân",
               description = "Trả về thông tin tài khoản của người dùng hiện tại (không có mật khẩu)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        UUID userId   = TenantContext.getCurrentUserId();
        UUID tenantId = TenantContext.requireCurrentTenantId();

        UserProfileResult result = getMyProfileQueryHandler.handle(
                new GetMyProfileQuery(userId, tenantId));

        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(result)));
    }

    // ===================== UPDATE PROFILE =====================

    /**
     * Cập nhật thông tin profile cá nhân.
     * Chỉ cho phép sửa: fullName, phone.
     * Email không được thay đổi qua endpoint này.
     *
     * @param request body chứa fullName và phone (phone là tuỳ chọn)
     * @return 200 OK + UserProfileResponse sau khi cập nhật
     */
    @PutMapping("/me")
    @Operation(summary = "Cập nhật profile cá nhân",
               description = "Cập nhật họ tên và số điện thoại. Email không thể thay đổi ở đây.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {

        UUID userId   = TenantContext.getCurrentUserId();
        UUID tenantId = TenantContext.requireCurrentTenantId();

        UserProfileResult result = updateProfileCommandHandler.handle(
                new UpdateProfileCommand(userId, tenantId, request.fullName(), request.phone()));

        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(result)));
    }

    // ===================== CHANGE PASSWORD =====================

    /**
     * Đổi mật khẩu tài khoản cá nhân.
     * Yêu cầu nhập mật khẩu hiện tại để xác thực danh tính.
     *
     * @param request body chứa currentPassword và newPassword
     * @return 200 OK (không có data body)
     */
    @PutMapping("/me/password")
    @Operation(summary = "Đổi mật khẩu",
               description = "Đổi mật khẩu cá nhân — cần nhập mật khẩu hiện tại để xác nhận")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        UUID userId   = TenantContext.getCurrentUserId();
        UUID tenantId = TenantContext.requireCurrentTenantId();

        changePasswordCommandHandler.handle(
                new ChangePasswordCommand(userId, tenantId,
                        request.currentPassword(), request.newPassword()));

        return ResponseEntity.ok(ApiResponse.ok());
    }
}
