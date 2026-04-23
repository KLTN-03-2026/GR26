package com.smartfnb.forecast.application.dto;

import java.util.List;

/**
 * Kết quả dự báo cho 1 nguyên liệu, bao gồm tồn kho hiện tại và cảnh báo.
 *
 * @param ingredientId    UUID nguyên liệu
 * @param ingredientName  tên nguyên liệu
 * @param unit            đơn vị tính
 * @param currentStock    tồn kho hiện tại
 * @param forecastDays    danh sách dự báo theo ngày
 * @param stockoutDate    ngày dự kiến hết hàng (null nếu đủ hàng)
 * @param suggestedOrderQty số lượng gợi ý nhập
 * @param suggestedOrderDate ngày nên đặt hàng
 * @param urgency         mức độ: ok / warning / critical
 * @param isFallback      true nếu dùng fallback prediction
 *
 * @author Hoàng
 * @since 2026-04-23
 */
public record IngredientForecastDTO(
        String ingredientId,
        String ingredientName,
        String unit,
        Double currentStock,
        List<DayForecastDTO> forecastDays,
        String stockoutDate,
        Double suggestedOrderQty,
        String suggestedOrderDate,
        String urgency,
        Boolean isFallback
) {
}
