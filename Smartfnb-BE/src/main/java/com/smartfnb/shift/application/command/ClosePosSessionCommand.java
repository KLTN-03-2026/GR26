package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command đóng phiên POS cuối ca (S-16).
 * Tính toán chênh lệch tiền mặt: actual - expected.
 *
 * @param tenantId          UUID tenant
 * @param sessionId         UUID phiên POS cần đóng
 * @param closedByUserId    UUID cashier đóng quầy
 * @param endingCashActual  Tiền mặt thực tế kiểm đếm
 * @param note              Ghi chú khi đóng ca (tuỳ chọn)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record ClosePosSessionCommand(
        @NotNull UUID tenantId,
        @NotNull UUID sessionId,
        @NotNull UUID closedByUserId,
        @NotNull @DecimalMin("0") BigDecimal endingCashActual,
        String note
) {}
