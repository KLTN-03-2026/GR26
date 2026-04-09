package com.smartfnb.auth.web.controller;

import com.smartfnb.auth.application.command.*;
import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.application.dto.OtpVerifyResponse;
import com.smartfnb.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý tất cả API xác thực SmartF&B.
 * Bao gồm: đăng ký, đăng nhập, refresh token, quên mật khẩu (OTP), PIN POS.
 *
 * <p>Quy tắc: Controller KHÔNG chứa logic nghiệp vụ.
 * Chỉ nhận request, @Valid validate input, delegate sang Handler.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Xác thực — Đăng ký, Đăng nhập, OTP, POS PIN")
public class AuthController {

    private final RegisterTenantCommandHandler registerTenantCommandHandler;
    private final LoginCommandHandler          loginCommandHandler;
    private final RefreshTokenCommandHandler   refreshTokenCommandHandler;
    private final ForgotPasswordCommandHandler forgotPasswordCommandHandler;
    private final PinLoginCommandHandler       pinLoginCommandHandler;
    private final SelectBranchCommandHandler   selectBranchCommandHandler;

    // ======================== ĐỔI CHI NHÁNH ========================

    @PostMapping("/select-branch")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Chọn chi nhánh làm việc",
               description = "Cấp lại JWT chứa branchId để thao tác trên dữ liệu chi nhánh")
    public ResponseEntity<ApiResponse<AuthResponse>> selectBranch(
            @Valid @RequestBody SelectBranchCommand command) {
        java.util.UUID currentUserId = com.smartfnb.shared.TenantContext.getCurrentUserId();
        java.util.UUID currentTenantId = com.smartfnb.shared.TenantContext.getCurrentTenantId();
        
        AuthResponse response = selectBranchCommandHandler.handle(currentUserId, currentTenantId, command);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== ĐĂNG KÝ ========================

    /**
     * Đăng ký tenant mới (chủ quán tạo tài khoản SaaS lần đầu).
     * Trả JWT ngay sau khi đăng ký thành công.
     *
     * @param command thông tin đăng ký: tenantName, email, password, ownerName, planSlug
     * @return 201 Created + JWT token
     */
    @PostMapping("/register")
    @Operation(summary = "Đăng ký tenant mới",
               description = "Chủ quán tạo tài khoản, chọn gói dịch vụ, nhận JWT ngay")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterTenantCommand command) {
        AuthResponse response = registerTenantCommandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ======================== ĐĂNG NHẬP ========================

    /**
     * Đăng nhập bằng email + mật khẩu.
     * Cơ chế lockout: sai 5 lần liên tiếp → khóa 30 phút.
     *
     * @param command email và mật khẩu
     * @return 200 OK + JWT access + refresh token
     */
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập email/mật khẩu",
               description = "Xác thực và cấp JWT. Sai 5 lần → khóa 30 phút.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginCommand command) {
        AuthResponse response = loginCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== REFRESH TOKEN ========================

    /**
     * Làm mới JWT access token từ refresh token hợp lệ.
     *
     * @param command refresh token
     * @return 200 OK + JWT access token mới
     */
    @PostMapping("/refresh")
    @Operation(summary = "Làm mới JWT access token",
               description = "Cấp access token mới từ refresh token còn hạn")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenCommand command) {
        AuthResponse response = refreshTokenCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== QUÊN MẬT KHẨU ========================

    /**
     * Bước 1: Gửi OTP quên mật khẩu đến email.
     * Luôn trả 200 OK dù email có tồn tại hay không (tránh user enumeration).
     *
     * @param command email yêu cầu quên mật khẩu
     * @return 200 OK (luôn luôn)
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Gửi OTP quên mật khẩu",
               description = "Bước 1: Gửi mã OTP 6 số qua email (hết hạn sau 10 phút)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordCommand command) {
        forgotPasswordCommandHandler.sendOtp(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Bước 2: Xác thực OTP, nhận reset token tạm thời (15 phút).
     *
     * @param command email + OTP 6 số
     * @return 200 OK + reset token
     */
    @PostMapping("/verify-otp")
    @Operation(summary = "Xác thực OTP quên mật khẩu",
               description = "Bước 2: Nhập OTP nhận được → nhận reset token để đặt mật khẩu mới")
    public ResponseEntity<ApiResponse<OtpVerifyResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpCommand command) {
        OtpVerifyResponse response = forgotPasswordCommandHandler.verifyOtp(command);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Bước 3: Đặt lại mật khẩu mới bằng reset token.
     * Mật khẩu mới không được trùng mật khẩu cũ.
     *
     * @param command email + resetToken + newPassword
     * @return 200 OK nếu thành công
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu mới",
               description = "Bước 3: Đặt mật khẩu mới sau khi OTP đã xác thực")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordCommand command) {
        forgotPasswordCommandHandler.resetPassword(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== POS PIN LOGIN ========================

    /**
     * Đăng nhập nhanh tại POS bằng PIN 4-6 số.
     * Dành cho nhân viên (cashier, barista, waiter) thao tác tại quầy.
     *
     * @param command tenantId + userId + pin
     * @return 200 OK + JWT token với role nhân viên
     */
    @PostMapping("/pin-login")
    @Operation(summary = "Đăng nhập POS bằng PIN",
               description = "Đăng nhập nhanh tại màn hình POS không cần email/mật khẩu")
    public ResponseEntity<ApiResponse<AuthResponse>> pinLogin(
            @Valid @RequestBody PinLoginCommand command) {
        AuthResponse response = pinLoginCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
