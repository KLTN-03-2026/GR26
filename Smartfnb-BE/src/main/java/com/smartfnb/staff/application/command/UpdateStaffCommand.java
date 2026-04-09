package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Lệnh cập nhật thông tin nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdateStaffCommand(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** UUID người cập nhật — lấy từ TenantContext */
        UUID updatedByUserId,
        /** UUID nhân viên cần cập nhật */
        UUID staffId,
        /** Họ tên đầy đủ mới */
        String fullName,
        /** Số điện thoại mới (nullable — không thay đổi nếu null) */
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ")
        String phone,
        /** Email mới (nullable) */
        String email,
        /** UUID chức vụ mới (nullable) */
        UUID positionId,
        /** Mã nhân viên mới (nullable) */
        @Size(max = 50)
        String employeeCode,
        /** Ngày vào làm mới */
        LocalDate hireDate,
        /** Ngày sinh */
        LocalDate dateOfBirth,
        /** Giới tính */
        String gender,
        /** Địa chỉ */
        String address
) {}
