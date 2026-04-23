package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho PaymentJpaEntity.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface PaymentJpaRepository extends JpaRepository<PaymentJpaEntity, UUID> {
    /**
     * Tìm Payment theo Order ID.
     */
    Optional<PaymentJpaEntity> findByOrderId(UUID orderId);

    /**
     * Tìm Payment theo transaction ID.
     */
    Optional<PaymentJpaEntity> findByTransactionId(String transactionId);
}
