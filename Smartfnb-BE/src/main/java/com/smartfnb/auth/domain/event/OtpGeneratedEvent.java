package com.smartfnb.auth.domain.event;

import java.util.UUID;

/**
 * Domain Event được phát ra khi mã OTP được sinh ra và lưu thành công.
 * Các module khác hoặc listener có thể bắt event này để gửi Email, SMS...
 *
 * @param userId   ID người dùng nhận OTP
 * @param email    Email người dùng
 * @param rawOtp   Mã OTP gốc (chưa hash) để gửi đi
 * @param purpose  Mục đích (ví dụ: RESET_PASSWORD)
 */
public record OtpGeneratedEvent(
        UUID userId,
        String email,
        String rawOtp,
        String purpose
) {
}
