package com.smartfnb.shared.infrastructure.email;

import com.smartfnb.shared.application.port.out.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

/**
 * Adapter gửi email sử dụng JavaMailSender và render HTML bằng Thymeleaf.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThymeleafEmailService implements EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    @Override
    public void sendOtpEmail(String to, String otp) {
        try {
            log.info("Bắt đầu gửi email OTP tới {}", to);

            // 1. Chuẩn bị biến cho Thymeleaf template
            Context context = new Context();
            context.setVariable("otp", otp);
            // Có thể thêm biến year, appName...
            context.setVariable("appName", "SmartF&B");

            // 2. Render HTML từ template: src/main/resources/templates/email/otp-email.html
            String htmlContent = templateEngine.process("email/otp-email", context);

            // 3. Tạo MimeMessage
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, "SmartF&B System");
            helper.setTo(to);
            helper.setSubject("[SmartF&B] Mã xác nhận lấy lại mật khẩu");
            helper.setText(htmlContent, true); // true = HTML format

            // 4. Gửi email
            javaMailSender.send(message);

            log.info("Đã gửi email OTP thành công tới {}", to);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email OTP tới {}: {}", to, e.getMessage(), e);
            // Tùy chọn: Thêm retry mechanism ở đây hoặc ném exception để xử lý ở tầng trên
        }
    }
}
