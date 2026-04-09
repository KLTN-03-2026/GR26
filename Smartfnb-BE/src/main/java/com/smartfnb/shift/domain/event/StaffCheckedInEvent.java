package com.smartfnb.shift.domain.event;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain event phát ra khi nhân viên check-in ca làm việc.
 * Consumer: ReportModule ghi nhận giờ vào, ShiftModule cập nhật status.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record StaffCheckedInEvent(
        UUID tenantId,
        UUID branchId,
        UUID staffId,
        UUID shiftScheduleId,
        UUID shiftTemplateId,
        LocalDate shiftDate,
        String shiftName,
        Instant checkedInAt
) {}
