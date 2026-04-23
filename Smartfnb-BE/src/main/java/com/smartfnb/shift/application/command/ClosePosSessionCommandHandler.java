package com.smartfnb.shift.application.command;

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
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClosePosSessionCommandHandler {

    private final PosSessionJpaRepository posSessionJpaRepository;

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

        // 3. Tính ending_cash_expected (hiện tại = starting_cash, sau này cộng cash orders)
        // TODO: Tích hợp Order module để tính tổng cash orders trong ca
        BigDecimal endingCashExpected = session.getStartingCash();

        // 4. Đóng phiên
        session.close(
                command.closedByUserId(),
                command.endingCashActual(),
                endingCashExpected,
                command.note()
        );
        posSessionJpaRepository.save(session);

        log.info("Đóng phiên POS thành công: sessionId={}, cashDiff={}",
                command.sessionId(),
                command.endingCashActual().subtract(endingCashExpected));
    }
}
