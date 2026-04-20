package com.smartfnb.shift.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request DTO đóng phiên POS cuối ca (S-16).
 *
 * @param endingCashActual Tiền mặt thực tế kiểm đếm (≥ 0)
 * @param note             Ghi chú khi đóng ca (tùy chọn)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record ClosePosSessionRequest(
        @NotNull @DecimalMin("0") BigDecimal endingCashActual,
        String note
) {}
