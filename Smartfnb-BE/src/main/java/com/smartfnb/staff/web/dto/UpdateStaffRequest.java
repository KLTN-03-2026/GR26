package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO cập nhật thông tin nhân viên.
 * Tất cả fields nullable — chỉ cập nhật field được gửi.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdateStaffRequest(
        @Size(max = 255) String fullName,

        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ")
        String phone,

        String email,
        UUID positionId,

        @Size(max = 50) String employeeCode,
        LocalDate hireDate,
        LocalDate dateOfBirth,

        @Pattern(regexp = "^(MALE|FEMALE|OTHER)$")
        String gender,

        String address
) {}
