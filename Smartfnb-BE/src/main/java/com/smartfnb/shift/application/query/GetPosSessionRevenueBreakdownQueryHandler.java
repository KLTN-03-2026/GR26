package com.smartfnb.shift.application.query;

import com.smartfnb.payment.infrastructure.persistence.PaymentJpaRepository;
import com.smartfnb.shift.application.query.PosSessionRevenueBreakdownResult.PaymentMethodEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Query live breakdown doanh thu theo phương thức thanh toán trong một ca POS.
 * Không đọc từ pos_sessions — query trực tiếp bảng payments GROUP BY method.
 *
 * author: Hoàng | date: 2026-04-30 | note: Dùng endpoint riêng thay vì thêm cột vào DB
 *   để tránh migration V27 và giữ schema gọn. Dữ liệu luôn real-time.
 *
 * @author Hoàng
 * @since 2026-04-30
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetPosSessionRevenueBreakdownQueryHandler {

    private final PaymentJpaRepository paymentJpaRepository;

    // author: Hoàng | date: 2026-04-30 | note: Map method → displayName tiếng Việt để FE không cần tự dịch.
    private static final Map<String, String> DISPLAY_NAMES = Map.of(
            "CASH",    "Tiền mặt",
            "VIETQR",  "VietQR",
            "MOMO",    "MoMo",
            "PAYOS",   "PayOS",
            "ZALOPAY", "ZaloPay"
    );

    /**
     * Lấy breakdown doanh thu theo phương thức cho một ca POS.
     *
     * @param sessionId UUID ca POS
     * @return PosSessionRevenueBreakdownResult chứa list methods và totalRevenue
     */
    public PosSessionRevenueBreakdownResult handle(UUID sessionId) {
        log.info("Query breakdown doanh thu theo phương thức: sessionId={}", sessionId);

        // author: Hoàng | date: 2026-04-30 | note: Query live — GROUP BY method, chỉ lấy COMPLETED.
        List<Object[]> rows = paymentJpaRepository.sumByMethodForPosSession(sessionId);

        List<PaymentMethodEntry> methods = rows.stream()
                .map(row -> {
                    String method = (String) row[0];
                    BigDecimal amount = row[1] instanceof BigDecimal bd ? bd
                            : new BigDecimal(row[1].toString());
                    long count = ((Number) row[2]).longValue();
                    String displayName = DISPLAY_NAMES.getOrDefault(method, method);
                    return new PaymentMethodEntry(method, displayName, amount, count);
                })
                // author: Hoàng | date: 2026-04-30 | note: Sắp xếp CASH lên đầu, các method QR theo sau.
                .sorted((a, b) -> {
                    int orderA = methodOrder(a.method());
                    int orderB = methodOrder(b.method());
                    return Integer.compare(orderA, orderB);
                })
                .toList();

        BigDecimal totalRevenue = methods.stream()
                .map(PaymentMethodEntry::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Breakdown: sessionId={}, methods={}, totalRevenue={}", sessionId, methods.size(), totalRevenue);

        return new PosSessionRevenueBreakdownResult(sessionId, methods, totalRevenue);
    }

    // author: Hoàng | date: 2026-04-30 | note: Thứ tự hiển thị: CASH → VIETQR → MOMO → PAYOS → ZALOPAY → OTHER.
    private int methodOrder(String method) {
        return switch (method) {
            case "CASH"    -> 0;
            case "VIETQR"  -> 1;
            case "MOMO"    -> 2;
            case "PAYOS"   -> 3;
            case "ZALOPAY" -> 4;
            default        -> 99;
        };
    }
}
