package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho InvoiceJpaEntity.
 *
 * @author vutq
 * @since 2026-04-01
 */
public interface InvoiceJpaRepository extends JpaRepository<InvoiceJpaEntity, UUID>,
                                               JpaSpecificationExecutor<InvoiceJpaEntity> {
    /**
     * Tìm Invoice theo ID (Overridden để lấy luôn items).
     */
    @EntityGraph(attributePaths = {"items"})
    Optional<InvoiceJpaEntity> findById(UUID id);

    /**
     * Tìm Invoice theo Order ID.
     */
    @EntityGraph(attributePaths = {"items"})
    Optional<InvoiceJpaEntity> findByOrderId(UUID orderId);

    /**
     * Kiểm tra invoice đã được tạo từ Payment chưa.
     * author: Hoàng | date: 2026-05-16 | note: Hỗ trợ guard cho API hủy thanh toán pending.
     */
    boolean existsByPaymentId(UUID paymentId);

    /**
     * Tìm Invoice theo invoice_number (unique).
     */
    @EntityGraph(attributePaths = {"items"})
    Optional<InvoiceJpaEntity> findByInvoiceNumber(String invoiceNumber);

    /**
     * Kiểm tra invoice_number đã tồn tại hay chưa.
     */
    boolean existsByInvoiceNumber(String invoiceNumber);
}
