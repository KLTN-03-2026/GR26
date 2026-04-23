package com.smartfnb.auth.application.command;

import com.smartfnb.auth.domain.event.PasswordChangedEvent;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Xử lý lệnh đổi mật khẩu tài khoản cá nhân.
 *
 * <p>Luồng:</p>
 * <ol>
 *   <li>Tìm user kết hợp userId + tenantId (chống IDOR)</li>
 *   <li>Xác thực mật khẩu hiện tại bằng BCrypt</li>
 *   <li>Kiểm tra mật khẩu mới không trùng mật khẩu cũ</li>
 *   <li>Hash mật khẩu mới và lưu DB</li>
 *   <li>Publish PasswordChangedEvent cho audit</li>
 * </ol>
 *
 * @author vutq
 * @since 2026-04-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChangePasswordCommandHandler {

    private final UserRepository          userRepository;
    private final PasswordEncoder         passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Đổi mật khẩu tài khoản cá nhân.
     *
     * @param command chứa userId, tenantId (từ JWT), currentPassword, newPassword
     * @throws SmartFnbException USER_NOT_FOUND (404) nếu user không tồn tại
     * @throws SmartFnbException WRONG_PASSWORD (400) nếu mật khẩu hiện tại sai
     * @throws SmartFnbException PASSWORD_SAME (400) nếu mật khẩu mới trùng mật khẩu cũ
     */
    @Transactional
    public void handle(ChangePasswordCommand command) {
        log.info("Đổi mật khẩu — userId={}", command.userId());

        // 1. Tìm user — kết hợp userId + tenantId để ngăn IDOR
        UserJpaEntity user = userRepository
                .findByIdAndTenantId(command.userId(), command.tenantId())
                .orElseThrow(() -> new SmartFnbException(
                        "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản người dùng",
                        404));

        // 2. Xác thực mật khẩu hiện tại
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(command.currentPassword(), user.getPasswordHash())) {
            throw new SmartFnbException(
                    "WRONG_PASSWORD",
                    "Mật khẩu hiện tại không đúng");
        }

        // 3. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        if (passwordEncoder.matches(command.newPassword(), user.getPasswordHash())) {
            throw new SmartFnbException(
                    "PASSWORD_SAME",
                    "Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        // 4. Hash và lưu mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(command.newPassword()));
        userRepository.save(user);

        // 5. Publish event cho audit (không block transaction chính)
        eventPublisher.publishEvent(new PasswordChangedEvent(
                command.userId(),
                command.tenantId(),
                Instant.now()));

        log.info("Đổi mật khẩu thành công — userId={}", command.userId());
    }
}
