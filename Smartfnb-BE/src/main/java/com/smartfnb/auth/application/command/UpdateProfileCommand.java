package com.smartfnb.auth.application.command;

import java.util.UUID;

/**
 * Command cập nhật thông tin profile cá nhân.
 * Email không được phép thay đổi qua endpoint này.
 * userId và tenantId lấy từ JWT — không nhận từ request body.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record UpdateProfileCommand(
        /** ID user đang đăng nhập — từ TenantContext.getCurrentUserId() */
        UUID userId,

        /** ID tenant — từ TenantContext.requireCurrentTenantId() */
        UUID tenantId,

        /** Họ tên đầy đủ mới */
        String fullName,

        /** Số điện thoại mới (có thể null nếu không thay đổi) */
        String phone
) {}
