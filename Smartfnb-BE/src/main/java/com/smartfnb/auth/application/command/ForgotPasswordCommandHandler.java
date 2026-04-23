package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.OtpVerifyResponse;
import com.smartfnb.auth.domain.service.OtpService;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Xử lý luồng quên mật khẩu gồm 3 bước:
 * Bước 1 (ForgotPassword): Gửi OTP → {@link #sendOtp(ForgotPasswordCommand)}
 * Bước 2 (VerifyOtp): Xác thực OTP → {@link #verifyOtp(VerifyOtpCommand)}
 * Bước 3 (ResetPassword): Đặt mật khẩu mới → {@link #resetPassword(ResetPasswordCommand)}
 *
 * <p>Reset token: UUID random được lưu trong memory (ConcurrentHashMap).
 * Trong production nên lưu Redis với TTL 15 phút.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ForgotPasswordCommandHandler {

    /** Thời gian sống reset token tính bằng phút */
    private static final int RESET_TOKEN_TTL_MINUTES = 15;

    private final UserRepository  userRepository;
    private final OtpService      otpService;
    private final PasswordEncoder  passwordEncoder;

    /**
     * Lưu tạm reset token → userId (in-memory).
     * TODO: Thay bằng Redis + TTL 15 phút trong production.
     */
    private final ConcurrentHashMap<String, UUID> resetTokenStore = new ConcurrentHashMap<>();

    // ======================== BƯỚC 1: GỬI OTP ========================

    /**
     * Gửi OTP quên mật khẩu cho email đã đăng ký.
     * Không tiết lộ email có tồn tại hay không để tránh user enumeration attack.
     *
     * @param command lệnh với email người dùng
     */
    @Transactional
    public void sendOtp(ForgotPasswordCommand command) {
        userRepository.findByEmail(command.email()).ifPresent(user -> {
            if ("ACTIVE".equals(user.getStatus())) {
                String rawOtp = otpService.generateAndSave(user.getId(), "RESET_PASSWORD");
                // TODO: Tích hợp Email Service để gửi OTP qua email
                // emailService.sendOtp(command.email(), rawOtp);
                log.info("OTP quên mật khẩu đã tạo cho userId={} — [DEV] OTP: {}",
                        user.getId(), rawOtp);
            }
        });
        // Luôn trả về OK (không tiết lộ email có tồn tại hay không)
    }

    // ======================== BƯỚC 2: XÁC THỰC OTP ========================

    /**
     * Xác thực OTP và trả về reset token tạm thời (15 phút).
     *
     * @param command lệnh chứa email + OTP
     * @return OtpVerifyResponse chứa reset token
     * @throws SmartFnbException USER_NOT_FOUND nếu email không tồn tại
     * @throws SmartFnbException OTP_INVALID nếu OTP sai / hết hạn
     */
    @Transactional
    public OtpVerifyResponse verifyOtp(VerifyOtpCommand command) {
        var user = userRepository.findByEmail(command.email())
                .orElseThrow(() -> new SmartFnbException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản với email này"));

        // Xác thực OTP — throw nếu sai
        otpService.verifyAndConsume(user.getId(), command.otp(), "RESET_PASSWORD");

        // Tạo reset token tạm thời
        String resetToken = UUID.randomUUID().toString();
        resetTokenStore.put(resetToken, user.getId());

        log.info("OTP xác thực thành công — userId={}, reset token đã cấp", user.getId());
        return new OtpVerifyResponse(resetToken,
                "OTP hợp lệ. Vui lòng đặt mật khẩu mới trong vòng 15 phút.");
    }

    // ======================== BƯỚC 3: ĐẶT LẠI MẬT KHẨU ========================

    /**
     * Đặt lại mật khẩu mới sau khi xác thực OTP thành công.
     * Validate: mật khẩu mới không được trùng mật khẩu cũ.
     *
     * @param command lệnh chứa email, resetToken và newPassword
     * @throws SmartFnbException RESET_TOKEN_INVALID nếu token không hợp lệ / hết hạn
     * @throws SmartFnbException PASSWORD_SAME nếu mật khẩu mới trùng mật khẩu cũ
     */
    @Transactional
    public void resetPassword(ResetPasswordCommand command) {
        // 1. Validate reset token
        UUID userId = resetTokenStore.remove(command.resetToken());
        if (userId == null) {
            throw new SmartFnbException("RESET_TOKEN_INVALID",
                    "Reset token không hợp lệ hoặc đã hết hạn", 400);
        }

        // 2. Tìm user
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new SmartFnbException("USER_NOT_FOUND",
                        "Không tìm thấy người dùng"));

        // 3. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        if (user.getPasswordHash() != null
                && passwordEncoder.matches(command.newPassword(), user.getPasswordHash())) {
            throw new SmartFnbException("PASSWORD_SAME",
                    "Mật khẩu mới không được trùng mật khẩu cũ");
        }

        // 4. Hash mật khẩu mới và cập nhật
        String newHash = passwordEncoder.encode(command.newPassword());
        user.setPasswordHash(newHash);
        user.setStatus("ACTIVE");       // Mở khóa nếu đang bị LOCKED
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        log.info("Đặt lại mật khẩu thành công — userId={}", userId);
    }
}
