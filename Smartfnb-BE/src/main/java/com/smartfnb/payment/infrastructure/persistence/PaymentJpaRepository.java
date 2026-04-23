package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho PaymentJpaEntity.
 *
 * @author vutq
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

    /**
     * Aggregate số lượng giao dịch thực theo từng payment method cho một chi nhánh và ngày.
     * JOIN với bảng orders để lấy branch_id (payment không lưu branch_id trực tiếp).
     *
     * <p>BUG FIX: thay thế cách tính estimate sai trong GetPaymentMethodBreakdownQueryHandler.</p>
     *
     * @param branchId UUID chi nhánh
     * @param date     ngày cần query (dùng như date string vì paidAt là Instant)
     * @return List của Object[] {method (String), count (Long), amount (BigDecimal)}
     */
    @org.springframework.data.jpa.repository.Query(value = """
        SELECT p.method, COUNT(p.id) AS cnt, COALESCE(SUM(p.amount), 0) AS total
        FROM payments p
        JOIN orders o ON o.id = p.order_id
        WHERE o.branch_id = :branchId
          AND p.status = 'COMPLETED'
          AND CAST(p.paid_at AS date) = CAST(:date AS date)
        GROUP BY p.method
        """, nativeQuery = true)
    java.util.List<Object[]> aggregateByMethodForBranchAndDate(
            @org.springframework.data.repository.query.Param("branchId") UUID branchId,
            @org.springframework.data.repository.query.Param("date") String date);

}
