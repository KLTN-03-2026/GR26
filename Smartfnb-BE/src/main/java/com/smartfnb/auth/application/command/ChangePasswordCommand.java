package com.smartfnb.auth.application.command;

import java.util.UUID;

/**
 * Command đổi mật khẩu tài khoản cá nhân.
 * Yêu cầu nhập mật khẩu hiện tại để xác thực danh tính trước khi đổi.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record ChangePasswordCommand(
        /** ID user đang đăng nhập — từ TenantContext.getCurrentUserId() */
        UUID userId,

        /** ID tenant — từ TenantContext.requireCurrentTenantId() */
        UUID tenantId,

        /** Mật khẩu hiện tại (dùng để verify danh tính) */
        String currentPassword,

        /** Mật khẩu mới — phải khác mật khẩu hiện tại */
        String newPassword
) {}
