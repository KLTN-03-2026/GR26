package com.smartfnb.shift.application.query;

import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Query handler lấy lịch ca làm việc (S-16).
 * Hỗ trợ filter theo branch+date range hoặc user+date range.
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetShiftScheduleQueryHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;

    /**
     * Lấy lịch ca của toàn branch trong khoảng ngày.
     * Dùng cho manager xem lịch tất cả nhân viên.
     *
     * @param branchId  UUID chi nhánh
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu
     * @param endDate   ngày kết thúc
     * @return Danh sách ca làm việc
     */
    public List<ShiftScheduleResult> handleByBranch(
            UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate) {
        return shiftScheduleJpaRepository
                .findByBranchAndDateRange(branchId, tenantId, startDate, endDate)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Lấy lịch ca của một nhân viên trong khoảng ngày.
     * Dùng cho nhân viên xem lịch cá nhân.
     *
     * @param userId    UUID nhân viên
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu
     * @param endDate   ngày kết thúc
     * @return Danh sách ca của nhân viên
     */
    public List<ShiftScheduleResult> handleByUser(
            UUID userId, UUID tenantId, LocalDate startDate, LocalDate endDate) {
        return shiftScheduleJpaRepository
                .findByUserAndDateRange(userId, tenantId, startDate, endDate)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Chuyển đổi JPA entity sang DTO.
     *
     * @param entity ShiftScheduleJpaEntity
     * @return ShiftScheduleResult
     */
    private ShiftScheduleResult toResult(ShiftScheduleJpaEntity entity) {
        return new ShiftScheduleResult(
                entity.getId(),
                entity.getUserId(),
                entity.getShiftTemplateId(),
                entity.getBranchId(),
                entity.getDate(),
                entity.getStatus(),
                entity.getCheckedInAt(),
                entity.getCheckedOutAt(),
                entity.getActualStartTime(),
                entity.getActualEndTime(),
                entity.getOvertimeMinutes(),
                entity.getNote()
        );
    }
}
