package com.smartfnb.auth.application.event;

import com.smartfnb.auth.domain.event.OtpGeneratedEvent;
import com.smartfnb.shared.application.port.out.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listener xử lý các sự kiện liên quan đến Auth Module.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthEventListener {

    private final EmailService emailService;

    /**
     * Lắng nghe sự kiện OtpGeneratedEvent để gửi email.
     * Sử dụng @TransactionalEventListener (AFTER_COMMIT) để ĐẢM BẢO
     * mã OTP đã được lưu (commit) thành công xuống database trước khi gửi mail.
     * Nếu dùng @EventListener bình thường, mail có thể được gửi đi trước khi DB kịp commit,
     * dẫn đến lỗi user nhập đúng mã nhưng DB báo sai.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOtpGeneratedEvent(OtpGeneratedEvent event) {
        log.info("Nhận sự kiện OtpGeneratedEvent cho userId={}. Đang tiến hành gửi email...", event.userId());
        
        // Gọi infrastructure layer để gửi email. 
        // Lời gọi này sẽ chạy ở thread khác nhờ @Async cấu hình trong EmailService.
        emailService.sendOtpEmail(event.email(), event.rawOtp());
    }
}
