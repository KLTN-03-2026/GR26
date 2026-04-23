package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;

/**
 * Lệnh đăng nhập tài khoản web (email + mật khẩu).
 * Không nhận tenantId từ body — tenant được xác định qua email toàn hệ thống,
 * sau đó được nhúng vào JWT claim.
 *
 * @param email    email đăng nhập
 * @param password mật khẩu gốc (chưa hash)
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record LoginCommand(

        @NotBlank(message = "Email không được để trống")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password

) {}
