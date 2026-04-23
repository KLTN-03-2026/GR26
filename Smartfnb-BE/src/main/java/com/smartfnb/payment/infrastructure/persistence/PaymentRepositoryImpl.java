package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.payment.domain.model.Payment;
import com.smartfnb.payment.domain.model.PaymentMethod;
import com.smartfnb.payment.domain.model.PaymentStatus;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của PaymentRepository.
 * Chuyển đổi giữa Domain Entity Payment và JPA Entity PaymentJpaEntity.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
public class PaymentRepositoryImpl implements PaymentRepository {

    private final PaymentJpaRepository jpaRepository;

    @Override
    public Payment save(Payment payment) {
        PaymentJpaEntity entity = toJpaEntity(payment);
        PaymentJpaEntity saved = jpaRepository.save(entity);
        return toDomainEntity(saved);
    }

    @Override
    public Optional<Payment> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomainEntity);
    }

    @Override
    public Optional<Payment> findByOrderId(UUID orderId) {
        return jpaRepository.findByOrderId(orderId).map(this::toDomainEntity);
    }

    @Override
    public Optional<Payment> findByTransactionId(String transactionId) {
        return jpaRepository.findByTransactionId(transactionId).map(this::toDomainEntity);
    }

    /**
     * Chuyển đổi từ JPA Entity sang Domain Entity.
     */
    private Payment toDomainEntity(PaymentJpaEntity entity) {
        return Payment.reconstruct(
            entity.getId(),
            entity.getTenantId(),
            entity.getOrderId(),
            entity.getAmount(),
            PaymentMethod.valueOf(entity.getMethod()),
            PaymentStatus.valueOf(entity.getStatus()),
            entity.getTransactionId(),
            entity.getCashierUserId(),
            entity.getQrExpiresAt(),
            entity.getPaidAt(),
            entity.getCreatedAt(),
            entity.getVersion()
        );
    }

    /**
     * Chuyển đổi từ Domain Entity sang JPA Entity.
     */
    private PaymentJpaEntity toJpaEntity(Payment domain) {
        PaymentJpaEntity entity = new PaymentJpaEntity();
        entity.setId(domain.getId());
        entity.setTenantId(domain.getTenantId());
        entity.setOrderId(domain.getOrderId());
        entity.setAmount(domain.getAmount());
        entity.setMethod(domain.getMethod().name());
        entity.setStatus(domain.getStatus().name());
        entity.setTransactionId(domain.getTransactionId());
        entity.setCashierUserId(domain.getCashierUserId());
        entity.setQrExpiresAt(domain.getQrExpiresAt());
        entity.setPaidAt(domain.getPaidAt());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setVersion(domain.getVersion());
        return entity;
    }
}

