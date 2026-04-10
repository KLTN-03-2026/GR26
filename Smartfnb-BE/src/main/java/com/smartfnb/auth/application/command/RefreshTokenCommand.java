package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;

/**
 * Lệnh làm mới JWT access token từ refresh token hợp lệ.
 * Implement rotate strategy: refresh token cũ bị vô hiệu, cấp token mới.
 *
 * @param refreshToken JWT refresh token hợp lệ còn trong hạn
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record RefreshTokenCommand(

        @NotBlank(message = "Refresh token không được để trống")
        String refreshToken

) {}
