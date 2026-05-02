package com.smartfnb.shift.application.query;

import com.smartfnb.expense.domain.repository.ExpenseRepository;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Query handler lấy thông tin phiên POS (S-16).
 * READ ONLY — không @Transactional.
 *
 * @author vutq
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetActivePosSessionQueryHandler {

    private final PosSessionJpaRepository posSessionJpaRepository;
    // author: Hoàng | date: 2026-04-30 | note: Tính động cashSales/cashExpenses cho session OPEN để FE hiển thị breakdown trước khi đóng ca.
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;

    /**
     * Lấy phiên POS đang OPEN tại branch.
     * Dùng cho Cashier kiểm tra trước khi thao tác.
     *
     * @param branchId UUID chi nhánh
     * @return Optional POS session đang mở
     */
    public Optional<PosSessionResult> handleActive(UUID branchId) {
        return posSessionJpaRepository.findByBranchIdAndStatus(branchId, "OPEN")
                .map(this::toResult);
    }

    /**
     * Lấy lịch sử sessions của branch (tất cả trạng thái).
     *
     * @param branchId UUID chi nhánh
     * @param tenantId UUID tenant
     * @return Danh sách sessions (mới nhất trước)
     */
    public List<PosSessionResult> handleHistory(UUID branchId, UUID tenantId) {
        return posSessionJpaRepository.findByBranchIdOrderByStartTimeDesc(branchId, tenantId)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Chuyển đổi entity sang DTO.
     * author: Hoàng | date: 2026-04-30 | note: Session OPEN tính cashSales/cashExpenses động; CLOSED dùng giá trị đã lưu.
     *
     * @param entity PosSessionJpaEntity
     * @return PosSessionResult
     */
    private PosSessionResult toResult(PosSessionJpaEntity entity) {
        BigDecimal cashSales;
        BigDecimal cashExpenses;
        BigDecimal endingCashExpected;

        if (entity.isOpen()) {
            // Session đang mở — tính động để FE hiển thị preview trước khi đóng ca
            // author: Hoàng | date: 2026-04-30 | note: Tính động cashSales, cashExpenses và endingCashExpected cho session OPEN.
            cashSales = paymentRepository.sumCompletedCashPaymentsByPosSessionId(entity.getId());
            cashExpenses = expenseRepository.sumCashExpensesByPosSessionId(entity.getId());
            // endingCashExpected = startingCash + cashSales - cashExpenses (tính động, chưa lưu DB)
            endingCashExpected = entity.getStartingCash()
                    .add(cashSales)
                    .subtract(cashExpenses);
        } else {
            // Session đã đóng — dùng giá trị đã lưu tại thời điểm đóng ca (không tính lại)
            cashSales = entity.getCashSales() != null ? entity.getCashSales() : BigDecimal.ZERO;
            cashExpenses = entity.getCashExpenses() != null ? entity.getCashExpenses() : BigDecimal.ZERO;
            endingCashExpected = entity.getEndingCashExpected();
        }

        return new PosSessionResult(
                entity.getId(),
                entity.getBranchId(),
                entity.getOpenedByUserId(),
                entity.getClosedByUserId(),
                entity.getShiftScheduleId(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStartingCash(),
                endingCashExpected,
                entity.getEndingCashActual(),
                entity.getCashDifference(),
                entity.getNote(),
                entity.getStatus(),
                cashSales,
                cashExpenses
        );
    }
}
