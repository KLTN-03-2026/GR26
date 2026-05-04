package com.smartfnb.shift.application.command;

import com.smartfnb.expense.domain.repository.ExpenseRepository;
import com.smartfnb.payment.domain.repository.PaymentRepository;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Handler đóng phiên POS cuối ca (S-16).
 *
 * <p>Business rule:
 * <ul>
 *   <li>Chỉ được đóng session đang OPEN</li>
 *   <li>Tính cash_difference = ending_cash_actual - ending_cash_expected</li>
 *   <li>ending_cash_expected = starting_cash (đơn giản hoá — cần tích hợp Order module
 *       để cộng dồn cash orders trong tương lai)</li>
 * </ul>
 *
 * @author vutq
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClosePosSessionCommandHandler {

    private final PosSessionJpaRepository posSessionJpaRepository;
    // author: Hoàng | date: 2026-04-30 | note: Tính tổng CASH payments và chi phí tiền mặt trong ca để tính endingCashExpected đúng.
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;

    /**
     * Đóng phiên POS và ghi nhận tiền cuối ca.
     *
     * @param command thông tin đóng phiên
     * @throws IllegalArgumentException nếu session không tồn tại hoặc đã đóng
     */
    @Transactional
    public void handle(ClosePosSessionCommand command) {
        log.info("Đóng phiên POS: sessionId={}", command.sessionId());

        // 1. Tìm session
        PosSessionJpaEntity session = posSessionJpaRepository
                .findByIdAndTenantId(command.sessionId(), command.tenantId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy phiên POS: " + command.sessionId()));

        // 2. Validate đang OPEN
        if (!session.isOpen()) {
            throw new IllegalStateException(
                    "Phiên POS đã được đóng hoặc không tồn tại: sessionId=" + command.sessionId());
        }

        // 3. Tính breakdown tiền mặt trong ca
        // author: Hoàng | date: 2026-04-30 | note: Tính tiền kỳ vọng cuối ca từ tiền đầu ca và dòng tiền mặt phát sinh trong ca POS.
        BigDecimal cashSales = paymentRepository.sumCompletedCashPaymentsByPosSessionId(session.getId());
        BigDecimal cashExpenses = expenseRepository.sumCashExpensesByPosSessionId(session.getId());

        // endingCashExpected = startingCash + cashSales - cashExpenses
        // Không trừ cashRefunds vì chưa có module refund.
        // author: Hoàng | date: 2026-04-30 | note: cashRefunds tạm thời = 0 vì chưa có module hoàn tiền.
        BigDecimal endingCashExpected = session.getStartingCash()
                .add(cashSales)
                .subtract(cashExpenses);

        log.info("Breakdown đóng ca: sessionId={}, startingCash={}, cashSales={}, cashExpenses={}, endingCashExpected={}",
                session.getId(), session.getStartingCash(), cashSales, cashExpenses, endingCashExpected);

        // 4. Đóng phiên và lưu breakdown
        session.close(
                command.closedByUserId(),
                command.endingCashActual(),
                endingCashExpected,
                cashSales,
                cashExpenses,
                command.note()
        );
        posSessionJpaRepository.save(session);

        log.info("Đóng phiên POS thành công: sessionId={}, cashDiff={}",
                command.sessionId(),
                command.endingCashActual().subtract(endingCashExpected));
    }
}
