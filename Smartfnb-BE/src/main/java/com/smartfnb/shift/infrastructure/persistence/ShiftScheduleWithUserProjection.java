package com.smartfnb.shift.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Spring Data Native SQL Projection cho kết quả JOIN shift_schedules ↔ users.
 *
 * <p>Dùng bởi {@link ShiftScheduleJpaRepository} để lấy thông tin ca làm việc kèm tên nhân viên
 * mà không cần import cross-module entity từ auth module.
 *
 * @author vutq
 * @since 2026-04-25
 */
public interface ShiftScheduleWithUserProjection {

    UUID getId();
    UUID getUserId();
    String getUserName();       // users.full_name
    UUID getShiftTemplateId();
    UUID getBranchId();
    LocalDate getDate();
    String getStatus();
    Instant getCheckedInAt();
    Instant getCheckedOutAt();
    LocalTime getActualStartTime();
    LocalTime getActualEndTime();
    int getOvertimeMinutes();
    String getNote();
}
