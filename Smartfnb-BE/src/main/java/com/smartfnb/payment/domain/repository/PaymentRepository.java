package com.smartfnb.payment.domain.repository;

import com.smartfnb.payment.domain.model.Payment;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho Payment Aggregate.
 * Định nghĩa các phương thức truy vấn mà infrastructure phải implement.
 *
 * @author SmartF&B Team
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
     * Tìm Payment theo transaction ID (dari payment gateway).
     */
    Optional<Payment> findByTransactionId(String transactionId);
}
