package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;

/**
 * Lệnh làm mới JWT access token từ refresh token hợp lệ.
 * Implement rotate strategy: refresh token cũ bị vô hiệu, cấp token mới.
 *
 * @param refreshToken JWT refresh token hợp lệ còn trong hạn
 * @param branchId     (Tuỳ chọn) UUID chi nhánh đang làm việc — FE nên gửi kèm
 *                     để access_token mới giữ nguyên branch context sau refresh.
 *                     Nếu không gửi, FE cần gọi lại /select-branch để lấy branch context.
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record RefreshTokenCommand(

        @NotBlank(message = "Refresh token không được để trống")
        String refreshToken,

        String branchId   // Tuỳ chọn — null nếu FE chưa chọn branch

) {}
