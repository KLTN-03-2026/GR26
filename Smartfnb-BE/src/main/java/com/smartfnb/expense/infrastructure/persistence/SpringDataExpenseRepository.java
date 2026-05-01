package com.smartfnb.expense.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataExpenseRepository extends JpaRepository<ExpenseJpaEntity, UUID> {
    
    Optional<ExpenseJpaEntity> findByIdAndDeletedFalse(UUID id);

    @Query("SELECT e FROM ExpenseJpaEntity e WHERE e.tenantId = :tenantId AND e.branchId = :branchId AND e.deleted = false " +
           "AND (:categoryName IS NULL OR LOWER(e.categoryName) LIKE :categoryName) " +
           "ORDER BY e.expenseDate DESC")
    Page<ExpenseJpaEntity> searchExpenses(UUID tenantId, UUID branchId, String categoryName, Pageable pageable);

    /**
     * Tổng chi tiền mặt từ két POS trong một ca POS.
     * author: Hoàng | date: 2026-04-30 | note: Chỉ tính expense CASH có posSessionId — expense từ nguồn khác (chuyển khoản, v.v.) không được tính.
     *
     * @param posSessionId UUID ca POS
     * @return tổng amount, COALESCE trả 0 nếu chưa có khoản chi
     */
    @Query(value = """
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenses e
        WHERE e.pos_session_id = :posSessionId
          AND e.payment_method = 'CASH'
          AND e.deleted = false
        """, nativeQuery = true)
    BigDecimal sumCashExpensesByPosSessionId(@Param("posSessionId") UUID posSessionId);
}
