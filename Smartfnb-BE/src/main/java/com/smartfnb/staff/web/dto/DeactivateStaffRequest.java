package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO vô hiệu hoá nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record DeactivateStaffRequest(
        @NotBlank(message = "Lý do vô hiệu hoá không được để trống")
        @Size(max = 500)
        String reason
) {}
