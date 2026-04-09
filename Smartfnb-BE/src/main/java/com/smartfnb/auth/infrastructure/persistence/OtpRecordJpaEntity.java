package com.smartfnb.auth.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng otp_records.
 * Lưu trữ OTP (đã hash) dùng cho quên mật khẩu / xác thực email.
 * OTP chỉ sử dụng một lần (is_used) và có thời hạn sử dụng (expires_at).
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Entity
@Table(name = "otp_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpRecordJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** ID người dùng yêu cầu OTP */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * Mã OTP đã hash bằng BCrypt.
     * Không bao giờ lưu OTP dạng plaintext.
     */
    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    /**
     * Mục đích sử dụng OTP.
     * RESET_PASSWORD — đặt lại mật khẩu
     * VERIFY_EMAIL   — xác thực email đăng ký
     */
    @Column(name = "purpose", nullable = false, length = 30)
    private String purpose;

    /** Thời điểm OTP hết hạn — thường 10 phút sau khi tạo */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * OTP đã được sử dụng chưa.
     * Sau khi dùng, set true ngay để chặn reuse.
     */
    @Column(name = "is_used")
    @Builder.Default
    private boolean isUsed = false;

    /** Thời điểm tạo OTP */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
