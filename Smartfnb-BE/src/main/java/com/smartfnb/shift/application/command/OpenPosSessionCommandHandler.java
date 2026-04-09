package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.exception.PosSessionAlreadyOpenException;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler mở phiên POS đầu ca (S-16).
 *
 * <p>Business rule: Mỗi branch chỉ được có 1 phiên POS OPEN tại 1 thời điểm.
 * Cashier phải đóng phiên cũ trước khi mở phiên mới.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OpenPosSessionCommandHandler {

    private final PosSessionJpaRepository posSessionJpaRepository;

    /**
     * Mở phiên POS mới cho chi nhánh.
     *
     * @param command thông tin mở phiên
     * @return UUID phiên POS vừa mở
     * @throws PosSessionAlreadyOpenException nếu branch đã có phiên đang mở
     */
    @Transactional
    public UUID handle(OpenPosSessionCommand command) {
        log.info("Mở phiên POS: branchId={}, userId={}", command.branchId(), command.openedByUserId());

        // 1. Kiểm tra branch đã có session OPEN chưa
        boolean alreadyOpen = posSessionJpaRepository.existsByBranchIdAndStatus(
                command.branchId(), "OPEN");
        if (alreadyOpen) {
            throw new PosSessionAlreadyOpenException();
        }

        // 2. Tạo phiên POS mới
        PosSessionJpaEntity session = PosSessionJpaEntity.open(
                command.tenantId(),
                command.branchId(),
                command.openedByUserId(),
                command.startingCash(),
                command.shiftScheduleId()
        );
        posSessionJpaRepository.save(session);

        log.info("Mở phiên POS thành công: sessionId={}, startingCash={}",
                session.getId(), command.startingCash());
        return session.getId();
    }
}
