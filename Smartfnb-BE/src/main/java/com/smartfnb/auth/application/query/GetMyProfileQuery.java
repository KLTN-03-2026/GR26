package com.smartfnb.auth.application.query;

import java.util.UUID;

/**
 * Query để lấy thông tin profile của người dùng hiện tại.
 * userId và tenantId được lấy từ JWT — không nhận từ request body.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record GetMyProfileQuery(
        /** ID người dùng hiện tại — lấy từ TenantContext.getCurrentUserId() */
        UUID userId,

        /** ID tenant hiện tại — lấy từ TenantContext.requireCurrentTenantId() */
        UUID tenantId
) {}
