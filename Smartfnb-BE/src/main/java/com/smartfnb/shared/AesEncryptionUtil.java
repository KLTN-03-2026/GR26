package com.smartfnb.shared;

// author: Hoàng
// date: 27-04-2026
// note: Utility mã hoá/giải mã AES-256-CBC cho API key nhạy cảm.
//       Secret key đọc từ biến môi trường PAYOS_ENCRYPTION_KEY (32 bytes).
//       Mỗi lần encrypt sinh IV ngẫu nhiên — lưu dạng Base64(IV + ciphertext).

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class AesEncryptionUtil {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;

    private final byte[] secretKey;

    public AesEncryptionUtil(@Value("${payos.encryption.secret-key}") String secretKeyBase64) {
        this.secretKey = Base64.getDecoder().decode(secretKeyBase64);
        if (this.secretKey.length != 32) {
            throw new IllegalArgumentException("PAYOS_ENCRYPTION_KEY phải là 32 bytes (256-bit) sau khi decode Base64");
        }
    }

    /**
     * Mã hoá plaintext → Base64(IV || ciphertext).
     * IV ngẫu nhiên mỗi lần → cùng plaintext sẽ cho ciphertext khác nhau.
     */
    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(secretKey, "AES"),
                    new IvParameterSpec(iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Ghép IV + ciphertext rồi encode Base64 để lưu DB
            byte[] combined = new byte[IV_LENGTH + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(ciphertext, 0, combined, IV_LENGTH, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi mã hoá AES", e);
        }
    }

    /**
     * Giải mã Base64(IV || ciphertext) → plaintext gốc.
     */
    public String decrypt(String encryptedBase64) {
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedBase64);

            byte[] iv = new byte[IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(secretKey, "AES"),
                    new IvParameterSpec(iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi giải mã AES", e);
        }
    }
}
