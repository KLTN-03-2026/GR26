package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command mở phiên POS (pos_session) đầu ca (S-16).
 * Mỗi branch chỉ có 1 session OPEN tại 1 thời điểm.
 *
 * @param tenantId        UUID tenant
 * @param branchId        UUID chi nhánh
 * @param openedByUserId  UUID cashier mở quầy
 * @param startingCash    Tiền mặt đầu ca (≥ 0)
 * @param shiftScheduleId UUID ca làm việc liên kết (tuỳ chọn)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record OpenPosSessionCommand(
        @NotNull UUID tenantId,
        @NotNull UUID branchId,
        @NotNull UUID openedByUserId,
        @DecimalMin("0") BigDecimal startingCash,
        UUID shiftScheduleId
) {}
