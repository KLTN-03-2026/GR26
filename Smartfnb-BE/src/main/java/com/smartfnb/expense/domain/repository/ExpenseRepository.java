package com.smartfnb.expense.domain.repository;

import com.smartfnb.expense.domain.model.Expense;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository {
    Expense save(Expense expense);
    Optional<Expense> findById(UUID id);

    /**
     * Tổng chi tiền mặt từ két POS trong một ca.
     * Chỉ tính expense: posSessionId = sessionId, paymentMethod = 'CASH', deleted = false.
     * author: Hoàng | date: 2026-04-30 | note: Tổng chi tiền mặt từ két POS trong ca để trừ khỏi tiền kỳ vọng cuối ca.
     *
     * @param posSessionId UUID ca POS
     * @return tổng amount, trả về ZERO nếu chưa có khoản chi
     */
    BigDecimal sumCashExpensesByPosSessionId(UUID posSessionId);
}
