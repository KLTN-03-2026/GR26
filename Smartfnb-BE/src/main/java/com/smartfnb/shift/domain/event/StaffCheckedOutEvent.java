package com.smartfnb.shift.domain.event;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain event phát ra khi nhân viên check-out ca làm việc.
 * Consumer: ReportModule tính tổng giờ làm, overtime.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record StaffCheckedOutEvent(
        UUID tenantId,
        UUID branchId,
        UUID staffId,
        UUID shiftScheduleId,
        LocalDate shiftDate,
        Instant checkedInAt,
        Instant checkedOutAt,
        /** Số phút overtime (âm = về sớm) */
        int overtimeMinutes
) {}
