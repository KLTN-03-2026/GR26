package com.smartfnb.staff.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Kết quả chi tiết một nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record StaffDetailResult(
        UUID id,
        String fullName,
        String phone,
        String email,
        String employeeCode,
        String status,
        String gender,
        String address,
        String avatarUrl,
        LocalDate dateOfBirth,
        LocalDate hireDate,
        UUID positionId,
        String positionName,
        Instant createdAt,
        /** Danh sách roles được gán */
        List<RoleInfo> roles
) {
    /**
     * Thông tin role tóm tắt.
     */
    public record RoleInfo(UUID id, String name) {}
}
