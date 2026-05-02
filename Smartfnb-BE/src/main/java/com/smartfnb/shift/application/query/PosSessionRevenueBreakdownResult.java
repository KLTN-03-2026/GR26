package com.smartfnb.shift.application.query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Kết quả breakdown doanh thu theo phương thức thanh toán trong một ca POS.
 * Query live từ bảng payments — không lưu vào DB, luôn phản ánh real-time.
 *
 * author: Hoàng | date: 2026-04-30 | note: DTO cho endpoint GET /pos-sessions/{id}/payment-breakdown.
 *   Dùng thay vì thêm cột vào pos_sessions để tránh migration và giữ schema gọn.
 *
 * @param sessionId     UUID ca POS
 * @param methods       Danh sách breakdown theo từng phương thức (chỉ gồm method có giao dịch)
 * @param totalRevenue  Tổng doanh thu tất cả phương thức trong ca
 *
 * @author Hoàng
 * @since 2026-04-30
 */
public record PosSessionRevenueBreakdownResult(
        UUID sessionId,
        List<PaymentMethodEntry> methods,
        BigDecimal totalRevenue
) {

    /**
     * Một dòng trong breakdown.
     *
     * @param method           Tên phương thức: CASH, VIETQR, MOMO, PAYOS, ZALOPAY
     * @param displayName      Tên hiển thị tiếng Việt: Tiền mặt, VietQR, MoMo, PayOS, ZaloPay
     * @param amount           Tổng doanh thu của phương thức này trong ca
     * @param transactionCount Số lượng giao dịch
     */
    // author: Hoàng | date: 2026-04-30 | note: Giữ cả method (để FE map màu/icon) và displayName (để hiển thị).
    public record PaymentMethodEntry(
            String method,
            String displayName,
            BigDecimal amount,
            long transactionCount
    ) {}
}
