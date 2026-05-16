package com.smartfnb.payment.domain.repository;

import com.smartfnb.payment.domain.model.Payment;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho Payment Aggregate.
 * Định nghĩa các phương thức truy vấn mà infrastructure phải implement.
 *
 * @author vutq
 * @since 2026-04-01
 */
public interface PaymentRepository {
    /**
     * Lưu hoặc cập nhật Payment.
     */
    Payment save(Payment payment);

    /**
     * Tìm Payment theo ID.
     */
    Optional<Payment> findById(UUID id);

    /**
     * Tìm Payment theo Order ID.
     */
    Optional<Payment> findByOrderId(UUID orderId);

    /**
     * Kiểm tra đơn hàng đã có payment hoàn tất chưa.
     * author: Hoàng | date: 2026-05-16 | note: Một order có thể có nhiều payment CANCELLED/FAILED sau khi hủy QR, nên không dùng findByOrderId.
     */
    boolean existsCompletedPaymentByOrderId(UUID orderId);

    /**
     * Tìm Payment theo transaction ID (dari payment gateway).
     */
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Tổng tiền mặt đã thu thành công trong một ca POS.
     * Dùng để tính endingCashExpected khi đóng ca.
     * author: Hoàng | date: 2026-04-30 | note: Chỉ tính CASH COMPLETED, QR không ảnh hưởng két tiền mặt.
     *
     * @param posSessionId UUID ca POS
     * @return tổng amount, trả về ZERO nếu chưa có giao dịch
     */
    BigDecimal sumCompletedCashPaymentsByPosSessionId(UUID posSessionId);
}
