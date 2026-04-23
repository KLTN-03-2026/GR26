package com.smartfnb.auth.domain.service;

import com.smartfnb.auth.infrastructure.persistence.OtpRecordJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.OtpRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain Service xử lý toàn bộ vòng đời OTP.
 * Tạo, hash, lưu, xác thực và vô hiệu hóa OTP.
 *
 * <p>Quy tắc bảo mật:</p>
 * <ul>
 *   <li>OTP 6 số sinh bằng SecureRandom — không dùng Math.random()</li>
 *   <li>OTP được hash BCrypt trước khi lưu DB</li>
 *   <li>OTP chỉ dùng một lần (is_used = true sau verify)</li>
 *   <li>OTP hết hạn sau 10 phút</li>
 *   <li>Trước khi cấp OTP mới, vô hiệu hóa tất cả OTP cũ cùng mục đích</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    /** Số phút OTP có hiệu lực */
    private static final int OTP_EXPIRY_MINUTES = 10;
    /** Độ dài OTP (6 số) */
    private static final int OTP_LENGTH = 6;

    private final OtpRepository   otpRepository;
    private final PasswordEncoder  passwordEncoder;
    private final SecureRandom     secureRandom = new SecureRandom();

    /**
     * Tạo và lưu OTP cho người dùng theo mục đích cho trước.
     * Vô hiệu hóa tất cả OTP cũ cùng mục đích trước khi tạo mới.
     *
     * @param userId  UUID người dùng
     * @param purpose mục đích (RESET_PASSWORD / VERIFY_EMAIL)
     * @return chuỗi OTP gốc 6 số — chỉ trả về một lần để gửi qua email
     */
    @Transactional
    public String generateAndSave(UUID userId, String purpose) {
        // 1. Vô hiệu hóa tất cả OTP cũ cùng mục đích để chặn replay attack
        otpRepository.invalidateAllByUserAndPurpose(userId, purpose);

        // 2. Sinh OTP 6 số bằng SecureRandom
        String rawOtp = generateRawOtp();

        // 3. Hash OTP bằng BCrypt
        String hashedOtp = passwordEncoder.encode(rawOtp);

        // 4. Lưu vào DB
        OtpRecordJpaEntity otpRecord = OtpRecordJpaEntity.builder()
                .userId(userId)
                .otpHash(hashedOtp)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .isUsed(false)
                .build();
        otpRepository.save(otpRecord);

        log.debug("Đã tạo OTP cho userId={}, purpose={}", userId, purpose);
        return rawOtp;
    }

    /**
     * Xác thực OTP nhập vào có khớp với OTP đã lưu không.
     * Nếu hợp lệ, đánh dấu OTP đã dùng ngay lập tức.
     *
     * @param userId    UUID người dùng
     * @param rawOtp    OTP gốc người dùng nhập
     * @param purpose   mục đích OTP
     * @throws SmartFnbException OTP_INVALID nếu OTP sai / hết hạn / đã dùng
     */
    @Transactional
    public void verifyAndConsume(UUID userId, String rawOtp, String purpose) {
        // Tìm OTP còn hợp lệ mới nhất
        OtpRecordJpaEntity record = otpRepository
                .findLatestValid(userId, purpose)
                .orElseThrow(() -> new SmartFnbException("OTP_INVALID",
                        "Mã OTP không hợp lệ hoặc đã hết hạn"));

        // Kiểm tra hash BCrypt
        if (!passwordEncoder.matches(rawOtp, record.getOtpHash())) {
            throw new SmartFnbException("OTP_INVALID",
                    "Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        // Đánh dấu đã dùng ngay — chặn replay
        otpRepository.markAsUsed(record.getId());
        log.debug("OTP xác thực thành công — userId={}, purpose={}", userId, purpose);
    }

    // ========================== PRIVATE ==========================

    /**
     * Sinh mã OTP 6 số ngẫu nhiên an toàn bằng SecureRandom.
     *
     * @return chuỗi 6 chữ số (có zero-padding nếu cần)
     */
    private String generateRawOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int otp = secureRandom.nextInt(bound);
        return String.format("%0" + OTP_LENGTH + "d", otp);
    }
}
