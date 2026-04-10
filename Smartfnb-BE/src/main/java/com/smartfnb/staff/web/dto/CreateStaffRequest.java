package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO tạo nhân viên mới.
 * tenantId và createdByUserId được lấy từ JWT, không nhận từ client.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreateStaffRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ (9-11 chữ số)")
        String phone,

        String email,
        UUID positionId,

        @Size(max = 50)
        String employeeCode,

        LocalDate hireDate,
        LocalDate dateOfBirth,

        @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
        String gender,

        String address
) {}
