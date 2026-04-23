package com.smartfnb.forecast.application.dto;

/**
 * Trạng thái lần train gần nhất của AI model cho 1 chi nhánh.
 *
 * @param branchId        UUID chi nhánh
 * @param lastTrainedAt   thời điểm train thành công gần nhất (null nếu chưa train)
 * @param status          trạng thái: SUCCESS / FAILED / IN_PROGRESS / null
 * @param seriesCount     số series đã train
 * @param modelExists     true nếu đã có ít nhất 1 lần train thành công
 * @param confidenceStars độ tin cậy mô hình từ 1–5 sao
 * @param confidenceLabel nhãn mô tả độ tin cậy
 *
 * @author Hoàng
 * @since 2026-04-23
 */
public record TrainStatusDTO(
        String branchId,
        String lastTrainedAt,
        String status,
        Integer seriesCount,
        Boolean modelExists,
        Integer confidenceStars,
        String confidenceLabel
) {
}
