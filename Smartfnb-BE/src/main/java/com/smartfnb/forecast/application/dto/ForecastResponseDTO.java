package com.smartfnb.forecast.application.dto;

import java.util.List;

/**
 * Response đầy đủ kết quả dự báo cho 1 chi nhánh.
 *
 * @param branchId         UUID chi nhánh
 * @param branchName       tên chi nhánh
 * @param generatedAt      thời điểm tạo response (ISO string)
 * @param lastTrainedAt    thời điểm train gần nhất (null nếu chưa train)
 * @param ingredients      danh sách nguyên liệu đã được sắp xếp theo mức độ cấp bách
 * @param confidenceStars  độ tin cậy mô hình từ 1–5 sao
 * @param confidenceLabel  nhãn mô tả độ tin cậy
 *
 * @author Hoàng
 * @since 2026-04-23
 */
public record ForecastResponseDTO(
        String branchId,
        String branchName,
        String generatedAt,
        String lastTrainedAt,
        List<IngredientForecastDTO> ingredients,
        Integer confidenceStars,
        String confidenceLabel
) {

    /**
     * Tạo response rỗng khi chi nhánh chưa có dữ liệu dự báo.
     *
     * @param branchId UUID chi nhánh
     * @return response rỗng với confidenceStars = 1
     */
    public static ForecastResponseDTO empty(String branchId) {
        return new ForecastResponseDTO(
                branchId,
                null,
                java.time.LocalDateTime.now().toString(),
                null,
                List.of(),
                1,
                "Mới bắt đầu"
        );
    }
}
