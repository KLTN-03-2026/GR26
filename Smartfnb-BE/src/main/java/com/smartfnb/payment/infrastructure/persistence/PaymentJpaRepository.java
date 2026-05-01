package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
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

    /**
     * Tổng tiền CASH đã thu thành công trong một ca POS.
     * author: Hoàng | date: 2026-04-30 | note: Tổng payment CASH COMPLETED thuộc ca POS để cộng vào tiền kỳ vọng cuối ca.
     *
     * @param posSessionId UUID ca POS
     * @return tổng amount, COALESCE trả 0 nếu chưa có giao dịch
     */
    @Query(value = """
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.pos_session_id = :posSessionId
          AND p.method = 'CASH'
          AND p.status = 'COMPLETED'
        """, nativeQuery = true)
    BigDecimal sumCompletedCashByPosSessionId(@Param("posSessionId") UUID posSessionId);

    /**
     * Doanh thu theo từng phương thức thanh toán trong một ca POS.
     * Trả về List của Object[] { method (String), totalAmount (BigDecimal), transactionCount (Long) }.
     * author: Hoàng | date: 2026-04-30 | note: GROUP BY method để FE hiển thị breakdown doanh thu theo ca — query live, không lưu vào DB.
     *
     * @param posSessionId UUID ca POS
     * @return danh sách { method, totalAmount, transactionCount }
     */
    @Query(value = """
        SELECT p.method,
               COALESCE(SUM(p.amount), 0)  AS total_amount,
               COUNT(p.id)                 AS tx_count
        FROM payments p
        WHERE p.pos_session_id = :posSessionId
          AND p.status = 'COMPLETED'
        GROUP BY p.method
        """, nativeQuery = true)
    List<Object[]> sumByMethodForPosSession(@Param("posSessionId") UUID posSessionId);

}
