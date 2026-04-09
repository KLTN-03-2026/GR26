package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Lệnh tạo nhân viên mới.
 * tenantId lấy từ JWT — client không được gửi.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreateStaffCommand(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** UUID người tạo (admin/owner) — lấy từ TenantContext */
        UUID createdByUserId,
        /** Họ tên đầy đủ */
        @NotBlank String fullName,
        /** Số điện thoại — unique trong tenant */
        @NotBlank
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ")
        String phone,
        /** Email (nullable) */
        String email,
        /** UUID chức vụ (nullable — có thể gán sau) */
        UUID positionId,
        /** Mã nhân viên (nullable) */
        @Size(max = 50)
        String employeeCode,
        /** Ngày vào làm (nullable) */
        LocalDate hireDate,
        /** Ngày sinh (nullable) */
        LocalDate dateOfBirth,
        /** Giới tính: MALE | FEMALE | OTHER (nullable) */
        String gender,
        /** Địa chỉ (nullable) */
        String address
) {}
