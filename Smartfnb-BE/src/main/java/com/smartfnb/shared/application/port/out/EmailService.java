package com.smartfnb.shared.application.port.out;

/**
 * Port định nghĩa các nghiệp vụ gửi email của hệ thống.
 * Tách biệt Application Layer khỏi công nghệ gửi email thực tế (JavaMail, SendGrid, SES...).
 */
public interface EmailService {

    /**
     * Gửi email chứa mã OTP.
     *
     * @param to  Địa chỉ email người nhận
     * @param otp Mã OTP
     */
    void sendOtpEmail(String to, String otp);

}
