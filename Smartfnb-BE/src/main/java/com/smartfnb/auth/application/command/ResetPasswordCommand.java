package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Lệnh đặt lại mật khẩu sau khi OTP đã được xác thực.
 * Reset token là chuỗi tạm thời trả về từ VerifyOtpCommand.
 *
 * <p>Validation: mật khẩu mới phải khác mật khẩu cũ (kiểm tra BCrypt trong handler).</p>
 *
 * @param email       địa chỉ email tài khoản
 * @param resetToken  token tạm thời từ bước verify OTP
 * @param newPassword mật khẩu mới tối thiểu 8 ký tự
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record ResetPasswordCommand(

        @NotBlank(message = "Email không được để trống")
        String email,

        @NotBlank(message = "Reset token không được để trống")
        String resetToken,

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới tối thiểu 8 ký tự")
        String newPassword

) {}
