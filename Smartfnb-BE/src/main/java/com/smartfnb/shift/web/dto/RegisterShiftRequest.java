package com.smartfnb.shift.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO đăng ký ca làm việc thực tế (S-16).
 *
 * @param userId          UUID nhân viên (manager đăng ký có thể chỉ định người khác)
 * @param shiftTemplateId UUID ca mẫu
 * @param date            Ngày làm việc
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record RegisterShiftRequest(
        @NotNull UUID userId,
        @NotNull UUID shiftTemplateId,
        @NotNull LocalDate date
) {}
