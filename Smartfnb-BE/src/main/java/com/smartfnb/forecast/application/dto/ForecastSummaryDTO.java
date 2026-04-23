package com.smartfnb.forecast.application.dto;

/**
 * Tóm tắt trạng thái tồn kho của 1 chi nhánh theo mức độ cấp bách.
 *
 * @param branchId         UUID chi nhánh
 * @param urgentCount      số nguyên liệu ở mức critical
 * @param warningCount     số nguyên liệu ở mức warning
 * @param okCount          số nguyên liệu ở mức ok
 * @param totalIngredients tổng số nguyên liệu có dự báo
 * @param generatedAt      thời điểm tạo response (ISO string)
 * @param confidenceStars  độ tin cậy mô hình từ 1–5 sao
 *
 * @author Hoàng
 * @since 2026-04-23
 */
public record ForecastSummaryDTO(
        String branchId,
        int urgentCount,
        int warningCount,
        int okCount,
        int totalIngredients,
        String generatedAt,
        Integer confidenceStars
) {
}
