package com.smartfnb.shift.application.query;

import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleWithUserProjection;
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
 * @author vutq
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetShiftScheduleQueryHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;

    /**
     * Lấy lịch ca của toàn branch trong khoảng ngày, kèm tên nhân viên.
     * Dùng cho manager xem lịch tất cả nhân viên.
     *
     * @param branchId  UUID chi nhánh
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu
     * @param endDate   ngày kết thúc
     * @return Danh sách ca làm việc kèm userName
     */
    public List<ShiftScheduleResult> handleByBranch(
            UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate) {
        return shiftScheduleJpaRepository
                .findByBranchAndDateRangeWithUser(branchId, tenantId, startDate, endDate)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Lấy lịch ca của một nhân viên trong khoảng ngày, kèm tên nhân viên.
     * Dùng cho nhân viên xem lịch cá nhân.
     *
     * @param userId    UUID nhân viên
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu
     * @param endDate   ngày kết thúc
     * @return Danh sách ca của nhân viên kèm userName
     */
    public List<ShiftScheduleResult> handleByUser(
            UUID userId, UUID tenantId, LocalDate startDate, LocalDate endDate) {
        return shiftScheduleJpaRepository
                .findByUserAndDateRangeWithUser(userId, tenantId, startDate, endDate)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Chuyển đổi projection sang DTO.
     *
     * @param p ShiftScheduleWithUserProjection
     * @return ShiftScheduleResult
     */
    private ShiftScheduleResult toResult(ShiftScheduleWithUserProjection p) {
        return new ShiftScheduleResult(
                p.getId(),
                p.getUserId(),
                p.getUserName(),        // full_name từ bảng users
                p.getShiftTemplateId(),
                p.getBranchId(),
                p.getDate(),
                p.getStatus(),
                p.getCheckedInAt(),
                p.getCheckedOutAt(),
                p.getActualStartTime(),
                p.getActualEndTime(),
                p.getOvertimeMinutes(),
                p.getNote()
        );
    }
}
