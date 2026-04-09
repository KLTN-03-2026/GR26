package com.smartfnb.shift.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Kết quả query ca làm việc thực tế (S-16).
 *
 * @param id              UUID shift schedule
 * @param userId          UUID nhân viên
 * @param shiftTemplateId UUID ca mẫu
 * @param branchId        UUID chi nhánh
 * @param date            Ngày làm việc
 * @param status          Trạng thái: SCHEDULED | CHECKED_IN | COMPLETED | ABSENT | CANCELLED
 * @param checkedInAt     Thời điểm check-in (null nếu chưa)
 * @param checkedOutAt    Thời điểm check-out (null nếu chưa)
 * @param actualStartTime Giờ check-in thực tế
 * @param actualEndTime   Giờ check-out thực tế
 * @param overtimeMinutes Thời gian tăng ca (phút, âm = về sớm)
 * @param note            Ghi chú
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record ShiftScheduleResult(
        UUID id,
        UUID userId,
        UUID shiftTemplateId,
        UUID branchId,
        LocalDate date,
        String status,
        Instant checkedInAt,
        Instant checkedOutAt,
        LocalTime actualStartTime,
        LocalTime actualEndTime,
        int overtimeMinutes,
        String note
) {}
