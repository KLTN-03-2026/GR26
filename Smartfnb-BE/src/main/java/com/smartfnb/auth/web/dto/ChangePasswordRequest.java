package com.smartfnb.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body cho PUT /api/v1/account/me/password.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record ChangePasswordRequest(

        /** Mật khẩu hiện tại để xác thực danh tính — bắt buộc */
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        String currentPassword,

        /** Mật khẩu mới — tối thiểu 8 ký tự, phải khác mật khẩu cũ */
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự")
        @Pattern(regexp = ".*[A-Z].*",
                 message = "Mật khẩu mới phải chứa ít nhất 1 chữ hoa")
        @Pattern(regexp = ".*[0-9].*",
                 message = "Mật khẩu mới phải chứa ít nhất 1 chữ số")
        String newPassword
) {}
