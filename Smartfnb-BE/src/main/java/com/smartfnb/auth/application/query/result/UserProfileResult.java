package com.smartfnb.auth.application.query.result;

import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kết quả trả về khi query profile người dùng.
 * Tuyệt đối không chứa passwordHash, posPin, hay thông tin nhạy cảm khác.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record UserProfileResult(
        UUID id,
        String fullName,
        String email,
        String phone,
        String status,
        LocalDateTime createdAt
) {
    /**
     * Map từ JPA entity sang Result.
     * Chỉ expose các field an toàn cho người dùng.
     *
     * @param entity UserJpaEntity từ DB
     * @return UserProfileResult
     */
    public static UserProfileResult from(UserJpaEntity entity) {
        return new UserProfileResult(
                entity.getId(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
