package com.smartfnb.staff.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Kết quả trả về cho API danh sách nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record StaffSummaryResult(
        UUID id,
        String fullName,
        String phone,
        String email,
        String employeeCode,
        String status,
        UUID positionId,
        String positionName,
        LocalDate hireDate,
        Instant createdAt,
        /** Danh sách tên roles của nhân viên */
        List<String> roles
) {}
