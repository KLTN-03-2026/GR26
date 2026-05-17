package com.smartfnb.plan.infrastructure.persistence;

// author: Hoàng | date: 2026-05-16
// note: Repository cho subscription_payment_attempts.
//       Dùng để tạo attempt mới khi tạo QR, tra cứu khi webhook về,
//       và lấy attempt mới nhất khi polling trạng thái.

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bảng subscription_payment_attempts.
 *
 * @author Hoàng
 * @since 2026-05-16
 */
@Repository
public interface SubscriptionPaymentAttemptJpaRepository extends JpaRepository<SubscriptionPaymentAttemptJpaEntity, UUID> {

    /**
     * Tìm attempt theo paymentLinkId (providerReference) từ PayOS.
     * Dùng khi PayOS webhook gọi về để tìm đúng attempt cần đánh PAID.
     *
     * @param providerReference paymentLinkId từ PayOS webhook payload
     * @return Optional<SubscriptionPaymentAttemptJpaEntity>
     */
    Optional<SubscriptionPaymentAttemptJpaEntity> findByProviderReference(String providerReference);

    /**
     * Tìm attempt theo orderCode từ PayOS.
     * Dùng khi polling PayOS API theo orderCode.
     *
     * @param providerOrderCode orderCode gửi lên PayOS khi tạo payment link
     * @return Optional<SubscriptionPaymentAttemptJpaEntity>
     */
    Optional<SubscriptionPaymentAttemptJpaEntity> findByProviderOrderCode(Long providerOrderCode);

    /**
     * Lấy attempt mới nhất của một invoice theo thứ tự tạo.
     * Dùng để polling status của lần tạo QR gần nhất.
     *
     * @param invoiceId ID hóa đơn
     * @return Optional<SubscriptionPaymentAttemptJpaEntity> attempt mới nhất
     */
    Optional<SubscriptionPaymentAttemptJpaEntity> findFirstByInvoiceIdOrderByCreatedAtDesc(UUID invoiceId);
}
