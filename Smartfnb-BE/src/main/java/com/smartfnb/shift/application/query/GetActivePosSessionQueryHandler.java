package com.smartfnb.shift.application.query;

import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Query handler lấy thông tin phiên POS (S-16).
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetActivePosSessionQueryHandler {

    private final PosSessionJpaRepository posSessionJpaRepository;

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
     *
     * @param entity PosSessionJpaEntity
     * @return PosSessionResult
     */
    private PosSessionResult toResult(PosSessionJpaEntity entity) {
        return new PosSessionResult(
                entity.getId(),
                entity.getBranchId(),
                entity.getOpenedByUserId(),
                entity.getClosedByUserId(),
                entity.getShiftScheduleId(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStartingCash(),
                entity.getEndingCashExpected(),
                entity.getEndingCashActual(),
                entity.getCashDifference(),
                entity.getNote(),
                entity.getStatus()
        );
    }
}
