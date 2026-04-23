package com.smartfnb.auth.web.dto;

import com.smartfnb.auth.application.query.result.UserProfileResult;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response cho GET /api/v1/account/me và PUT /api/v1/account/me.
 * Không chứa passwordHash, posPin hoặc thông tin nhạy cảm khác.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record UserProfileResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        String status,
        LocalDateTime createdAt
) {
    /**
     * Map từ UserProfileResult sang Response.
     *
     * @param result kết quả từ query/command handler
     * @return UserProfileResponse
     */
    public static UserProfileResponse from(UserProfileResult result) {
        return new UserProfileResponse(
                result.id(),
                result.fullName(),
                result.email(),
                result.phone(),
                result.status(),
                result.createdAt()
        );
    }
}
