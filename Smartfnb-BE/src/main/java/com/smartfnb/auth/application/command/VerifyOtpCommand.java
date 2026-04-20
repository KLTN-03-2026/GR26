package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Lệnh xác thực OTP sau khi người dùng nhận được qua email.
 * Trả về một reset token tạm thời (dùng trong bước đặt mật khẩu mới).
 *
 * @param email  địa chỉ email tài khoản
 * @param otp    mã OTP 6 số nhận được
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record VerifyOtpCommand(

        @NotBlank(message = "Email không được để trống")
        String email,

        @NotBlank(message = "Mã OTP không được để trống")
        @Size(min = 6, max = 6, message = "Mã OTP phải đúng 6 số")
        String otp

) {}
