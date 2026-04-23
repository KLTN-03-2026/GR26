package com.smartfnb.shift.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO mở phiên POS đầu ca (S-16).
 *
 * @param startingCash    Tiền mặt đầu ca (≥ 0)
 * @param shiftScheduleId UUID ca làm việc liên kết (tuỳ chọn)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record OpenPosSessionRequest(
        @NotNull @DecimalMin("0") BigDecimal startingCash,
        UUID shiftScheduleId
) {}
