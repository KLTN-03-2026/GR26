package com.smartfnb.auth.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event phát ra khi người dùng đổi mật khẩu thành công.
 * Consumer: audit log (ghi nhận thay đổi mật khẩu).
 *
 * @author vutq
 * @since 2026-04-23
 */
public record PasswordChangedEvent(
        /** ID người dùng đổi mật khẩu */
        UUID userId,

        /** Tenant sở hữu tài khoản */
        UUID tenantId,

        /** Thời điểm xảy ra sự kiện */
        Instant occurredAt
) {}
