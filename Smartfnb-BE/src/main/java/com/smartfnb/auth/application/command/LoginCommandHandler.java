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
 * Xử lý lệnh đăng nhập tài khoản bằng email + mật khẩu.
 *
 * <p>Business rules:</p>
 * <ul>
 *   <li>Tìm user theo email trên toàn hệ thống (1 email = 1 tenant)</li>
 *   <li>Kiểm tra tài khoản có bị khóa không (locked_until)</li>
 *   <li>Kiểm tra trạng thái ACTIVE</li>
 *   <li>Verify BCrypt password</li>
 *   <li>Sai 5 lần liên tiếp → khóa tài khoản 30 phút</li>
 *   <li>Đăng nhập thành công → reset failedLoginCount, cập nhật lastLoginAt, cấp JWT</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginCommandHandler {

    /** Số lần đăng nhập sai tối đa trước khi khóa tài khoản */
    private static final int MAX_FAILED_ATTEMPTS = 5;
    /** Thời gian khóa tài khoản tính bằng phút */
    private static final int LOCK_DURATION_MINUTES = 30;

    private final UserRepository   userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtService        jwtService;
    private final PermissionService permissionService;

    /**
     * Thực thi đăng nhập email + mật khẩu với cơ chế lockout.
     *
     * @param command lệnh đăng nhập từ controller
     * @return AuthResponse chứa JWT access token và refresh token
     * @throws SmartFnbException INVALID_CREDENTIALS nếu email/mật khẩu sai
     * @throws SmartFnbException ACCOUNT_LOCKED nếu tài khoản đang bị khóa
     * @throws SmartFnbException ACCOUNT_INACTIVE nếu tài khoản bị vô hiệu hóa
     */
    @Transactional
    public AuthResponse handle(LoginCommand command) {
        log.info("Xử lý đăng nhập — email: {}", command.email());

        // 1. Tìm user theo email (global — sau đó dùng tenantId từ user)
        UserJpaEntity user = userRepository.findByEmail(command.email())
                .orElseThrow(() -> new SmartFnbException("INVALID_CREDENTIALS",
                        "Email hoặc mật khẩu không đúng", 401));

        // 2. Kiểm tra tài khoản bị khóa tạm thời
        if (isAccountLocked(user)) {
            long minutesLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
            throw new SmartFnbException("ACCOUNT_LOCKED",
                    "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. "
                    + "Vui lòng thử lại sau " + minutesLeft + " phút.", 403);
        }

        // 3. Kiểm tra trạng thái ACTIVE
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new SmartFnbException("ACCOUNT_INACTIVE",
                    "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.", 403);
        }

        // 4. Kiểm tra mật khẩu BCrypt
        if (!passwordEncoder.matches(command.password(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new SmartFnbException("INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không đúng", 401);
        }

        // 5. Đăng nhập thành công — reset failed count và cập nhật lastLoginAt
        userRepository.updateLastLoginAt(user.getId(), LocalDateTime.now());

        // 6. Load role và permissions thật từ DB qua PermissionService
        List<String> roleNames  = permissionService.getRoleNames(user.getId(), user.getTenantId());
        String       primaryRole = roleNames.isEmpty() ? "STAFF" : roleNames.get(0);
        List<String> permissions = permissionService.getPermissionCodes(user.getId(), user.getTenantId());

        // 7. Tạo JWT với role và permissions thật
        String accessToken  = jwtService.generateAccessToken(
                user.getId(), user.getTenantId(), primaryRole, permissions, null);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        log.info("Đăng nhập thành công — userId: {}, tenantId: {}, role: {}, permissions: {}",
                user.getId(), user.getTenantId(), primaryRole, permissions.size());

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessExpirationSeconds(),
                user.getId().toString(),
                user.getTenantId().toString(),
                primaryRole
        );
    }

    // ========================== PRIVATE METHODS ==========================

    /**
     * Kiểm tra tài khoản có đang trong thời gian bị khóa không.
     *
     * @param user entity người dùng
     * @return true nếu tài khoản đang bị khóa
     */
    private boolean isAccountLocked(UserJpaEntity user) {
        return "LOCKED".equals(user.getStatus())
                && user.getLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getLockedUntil());
    }

    /**
     * Xử lý khi đăng nhập sai mật khẩu:
     * - Tăng failedLoginCount
     * - Nếu đạt ngưỡng MAX_FAILED_ATTEMPTS → khóa tài khoản LOCK_DURATION_MINUTES phút
     *
     * @param user entity người dùng vừa đăng nhập sai
     */
    private void handleFailedLogin(UserJpaEntity user) {
        int newCount = user.getFailedLoginCount() + 1;
        userRepository.incrementFailedLoginCount(user.getId());

        if (newCount >= MAX_FAILED_ATTEMPTS) {
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
            userRepository.lockUser(user.getId(), lockUntil);
            log.warn("Khóa tài khoản userId={} do sai mật khẩu {} lần — mở khóa lúc {}",
                    user.getId(), newCount, lockUntil);
        } else {
            log.warn("Đăng nhập sai lần {}/{} — userId={}",
                    newCount, MAX_FAILED_ATTEMPTS, user.getId());
        }
    }
}
