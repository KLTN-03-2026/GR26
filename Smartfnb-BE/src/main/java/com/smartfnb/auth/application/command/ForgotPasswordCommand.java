package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Lệnh yêu cầu gửi OTP quên mật khẩu.
 * Hệ thống tìm user theo email, tạo OTP 6 số (hashed), lưu vào otp_records
 * và gửi qua email (tích hợp email provider ở bước sau).
 *
 * @param email địa chỉ email đã đăng ký tài khoản
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record ForgotPasswordCommand(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email

) {}
