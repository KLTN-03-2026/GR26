package com.smartfnb.auth.application.dto;

/**
 * Response sau khi xác thực OTP thành công.
 * Chứa reset token tạm thời dùng trong bước đặt lại mật khẩu.
 *
 * @param resetToken  token tạm thời (UUID string) — có hiệu lực 15 phút
 * @param message     thông điệp xác nhận
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record OtpVerifyResponse(
        String resetToken,
        String message
) {}
