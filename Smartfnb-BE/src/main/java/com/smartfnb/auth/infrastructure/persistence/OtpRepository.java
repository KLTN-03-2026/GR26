package com.smartfnb.auth.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng otp_records.
 * Mọi query đều filter theo purpose để đảm bảo không nhầm lẫn OTP giữa các chức năng.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Repository
public interface OtpRepository extends JpaRepository<OtpRecordJpaEntity, UUID> {

    /**
     * Tìm OTP mới nhất còn hạn và chưa dùng của user theo mục đích.
     * Partial index trong DB (WHERE is_used = FALSE) đảm bảo query nhanh.
     *
     * @param userId  ID người dùng
     * @param purpose mục đích (RESET_PASSWORD / VERIFY_EMAIL)
     * @return Optional OTP record mới nhất còn hợp lệ
     */
    @Query("""
        SELECT o FROM OtpRecordJpaEntity o
        WHERE o.userId = :userId
          AND o.purpose = :purpose
          AND o.isUsed = false
          AND o.expiresAt > CURRENT_TIMESTAMP
        ORDER BY o.createdAt DESC
        """)
    Optional<OtpRecordJpaEntity> findLatestValid(UUID userId, String purpose);

    /**
     * Vô hiệu hóa tất cả OTP cũ của user theo mục đích trước khi cấp OTP mới.
     * Đảm bảo mỗi user chỉ có 1 OTP active tại một thời điểm.
     *
     * @param userId  ID người dùng
     * @param purpose mục đích OTP
     */
    @Modifying
    @Query("""
        UPDATE OtpRecordJpaEntity o
        SET o.isUsed = true
        WHERE o.userId = :userId AND o.purpose = :purpose AND o.isUsed = false
        """)
    void invalidateAllByUserAndPurpose(UUID userId, String purpose);

    /**
     * Đánh dấu OTP đã sử dụng — gọi ngay sau khi xác thực thành công.
     *
     * @param otpId ID của OTP record
     */
    @Modifying
    @Query("UPDATE OtpRecordJpaEntity o SET o.isUsed = true WHERE o.id = :otpId")
    void markAsUsed(UUID otpId);
}
