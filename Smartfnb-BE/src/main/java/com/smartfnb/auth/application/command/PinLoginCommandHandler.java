package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.infrastructure.jwt.JwtService;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.rbac.domain.service.PermissionService;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Xử lý đăng nhập POS nhanh bằng PIN 4-6 số.
 * Dùng cho nhân viên tại quầy không cần nhập email/mật khẩu đầy đủ.
 *
 * <p>Flow: Nhân viên chọn tên → nhập PIN → nhận JWT với branchId đã chọn.</p>
 * <p>Cơ chế lockout: áp dụng tương tự login thường (5 lần sai → khóa 30 phút).</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PinLoginCommandHandler {

    private static final int MAX_FAILED_ATTEMPTS  = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    private final UserRepository  userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtService       jwtService;
    private final PermissionService permissionService;

    /**
     * Xác thực đăng nhập POS bằng PIN.
     *
     * <p><b>Bảo mật:</b> tenantId lấy từ TenantContext (JWT), KHÔNG từ command body.
     * Điều này ngăn client tự đặt tenantId để truy cập tenant khác.</p>
     *
     * @param command lệnh PIN login — chỉ gồm userId và pin
     * @return AuthResponse với JWT chứa branchId (nếu có)
     * @throws SmartFnbException PIN_INVALID nếu PIN sai
     * @throws SmartFnbException ACCOUNT_LOCKED nếu tài khoản bị khóa
     * @throws SmartFnbException USER_NOT_FOUND nếu userId không thuộc tenant hiện tại
     */
    @Transactional
    public AuthResponse handle(PinLoginCommand command) {
        // ✅ SECURITY: tenantId lấy từ JWT (TenantContext), không từ request body
        // Ngăn Mass Assignment — client không thể tự set tenant khác
        UUID tenantId = com.smartfnb.shared.TenantContext.getCurrentTenantId();
        UUID userId   = UUID.fromString(command.userId());

        // 1. Tìm user theo userId + tenantId (bắt buộc filter theo tenant)
        UserJpaEntity user = userRepository.findById(userId)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new SmartFnbException("USER_NOT_FOUND",
                        "Không tìm thấy nhân viên trong chi nhánh này", 404));

        // 2. Kiểm tra tài khoản có PIN chưa
        if (user.getPosPin() == null) {
            throw new SmartFnbException("PIN_NOT_SET",
                    "Tài khoản chưa có PIN POS. Vui lòng liên hệ quản lý để cài đặt.", 400);
        }

        // 3. Kiểm tra bị khóa
        if ("LOCKED".equals(user.getStatus())
                && user.getLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            long minutesLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
            throw new SmartFnbException("ACCOUNT_LOCKED",
                    "Tài khoản tạm thời bị khóa. Thử lại sau " + minutesLeft + " phút.", 403);
        }

        // 4. Kiểm tra trạng thái ACTIVE
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new SmartFnbException("ACCOUNT_INACTIVE",
                    "Tài khoản đã bị vô hiệu hóa", 403);
        }

        // 5. Verify PIN BCrypt
        if (!passwordEncoder.matches(command.pin(), user.getPosPin())) {
            handleFailedLogin(user);
            throw new SmartFnbException("PIN_INVALID", "PIN không đúng", 401);
        }

        // 6. Đăng nhập thành công
        userRepository.updateLastLoginAt(userId, LocalDateTime.now());

        // 7. Lấy role và permissions thực tế từ DB qua PermissionService
        List<String> roleNames  = permissionService.getRoleNames(user.getId(), user.getTenantId());
        String       primaryRole = roleNames.isEmpty() ? "STAFF" : roleNames.get(0);
        List<String> permissions = permissionService.getPermissionCodes(user.getId(), user.getTenantId());

        String accessToken  = jwtService.generateAccessToken(
                userId, tenantId, primaryRole, permissions, null);
        String refreshToken = jwtService.generateRefreshToken(userId);

        log.info("PIN đăng nhập POS thành công — userId: {}", userId);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessExpirationSeconds(),
                userId.toString(),
                tenantId.toString(),
                primaryRole
        );
    }

    /**
     * Xử lý khi nhập PIN sai: tăng failedLoginCount, khóa nếu đạt ngưỡng.
     *
     * @param user entity người dùng
     */
    private void handleFailedLogin(UserJpaEntity user) {
        int newCount = user.getFailedLoginCount() + 1;
        userRepository.incrementFailedLoginCount(user.getId());
        if (newCount >= MAX_FAILED_ATTEMPTS) {
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
            userRepository.lockUser(user.getId(), lockUntil);
            log.warn("Khóa tài khoản POS userId={} do sai PIN {} lần", user.getId(), newCount);
        }
    }
}
