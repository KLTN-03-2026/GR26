package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho InvoiceJpaEntity.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface InvoiceJpaRepository extends JpaRepository<InvoiceJpaEntity, UUID>,
                                               JpaSpecificationExecutor<InvoiceJpaEntity> {
    /**
     * Tìm Invoice theo Order ID.
     */
    Optional<InvoiceJpaEntity> findByOrderId(UUID orderId);

    /**
     * Tìm Invoice theo invoice_number (unique).
     */
    Optional<InvoiceJpaEntity> findByInvoiceNumber(String invoiceNumber);

    /**
     * Kiểm tra invoice_number đã tồn tại hay chưa.
     */
    boolean existsByInvoiceNumber(String invoiceNumber);
}

