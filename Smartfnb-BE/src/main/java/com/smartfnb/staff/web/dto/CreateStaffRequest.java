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
 * @author vutq
 * @since 2026-04-06
 */
import com.fasterxml.jackson.annotation.JsonAlias;

public record CreateStaffRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        @JsonAlias({"full_name", "fullName"})
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ (9-11 chữ số)")
        String phone,

        String email,
        
        @JsonAlias({"position_id", "positionId"})
        UUID positionId,

        @Size(max = 50)
        @JsonAlias({"employee_code", "employeeCode"})
        String employeeCode,

        @JsonAlias({"hire_date", "hireDate"})
        LocalDate hireDate,
        
        @JsonAlias({"date_of_birth", "dateOfBirth"})
        LocalDate dateOfBirth,

        @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
        String gender,

        String address,

        @Size(min = 8, max = 255, message = "Mật khẩu phải từ 8 đến 255 ký tự")
        String password,

        @Pattern(regexp = "^[0-9]{4,6}$", message = "Mã PIN phải từ 4 đến 6 chữ số")
        @JsonAlias({"pos_pin", "posPin"})
        String posPin
) {}
