package com.smartfnb.shift.application.query;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Kết quả query phiên POS (S-16).
 *
 * @param id                   UUID phiên POS
 * @param branchId             UUID chi nhánh
 * @param openedByUserId       UUID cashier mở quầy
 * @param closedByUserId       UUID cashier đóng quầy (null nếu đang OPEN)
 * @param shiftScheduleId      UUID ca làm việc liên kết (nullable)
 * @param startTime            Thời điểm mở quầy
 * @param endTime              Thời điểm đóng quầy (null nếu đang OPEN)
 * @param startingCash         Tiền mặt đầu ca
 * @param endingCashExpected   Tiền mặt kỳ vọng cuối ca
 * @param endingCashActual     Tiền mặt thực tế kiểm đếm
 * @param cashDifference       Chênh lệch (actual - expected)
 * @param note                 Ghi chú khi đóng ca
 * @param status               Trạng thái: OPEN | CLOSED
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record PosSessionResult(
        UUID id,
        UUID branchId,
        UUID openedByUserId,
        UUID closedByUserId,
        UUID shiftScheduleId,
        Instant startTime,
        Instant endTime,
        BigDecimal startingCash,
        BigDecimal endingCashExpected,
        BigDecimal endingCashActual,
        BigDecimal cashDifference,
        String note,
        String status
) {}
