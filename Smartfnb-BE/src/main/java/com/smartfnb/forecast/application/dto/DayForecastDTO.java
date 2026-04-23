package com.smartfnb.forecast.application.dto;

/**
 * Dữ liệu dự báo cho 1 ngày.
 *
 * @param forecastDate ngày dự báo (định dạng YYYY-MM-DD)
 * @param predictedQty số lượng tiêu thụ dự báo
 *
 * @author Hoàng
 * @since 2026-04-23
 */
public record DayForecastDTO(
        String forecastDate,
        Double predictedQty
) {
}
