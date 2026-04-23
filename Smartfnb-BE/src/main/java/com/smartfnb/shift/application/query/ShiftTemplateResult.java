package com.smartfnb.shift.application.query;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Kết quả trả về khi query ca mẫu (S-16).
 *
 * @param id              UUID ca mẫu
 * @param branchId        UUID chi nhánh
 * @param name            Tên ca
 * @param startTime       Giờ bắt đầu ca
 * @param endTime         Giờ kết thúc ca
 * @param minStaff        Số NV tối thiểu
 * @param maxStaff        Số NV tối đa
 * @param color           Màu hex hiển thị (#FF5733)
 * @param active          Trạng thái hoạt động
 * @param durationMinutes Thời lượng ca (phút)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record ShiftTemplateResult(
        UUID id,
        UUID branchId,
        String name,
        LocalTime startTime,
        LocalTime endTime,
        int minStaff,
        int maxStaff,
        String color,
        boolean active,
        int durationMinutes
) {}
