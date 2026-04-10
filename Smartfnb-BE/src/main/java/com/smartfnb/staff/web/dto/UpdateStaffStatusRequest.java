package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO cập nhật trạng thái nhân viên (khóa / mở khóa).
 * Dùng cho PATCH /api/v1/staff/{id}/status — Bug Fix S-15.
 *
 * @author SmartF&B Team
 * @since 2026-04-10
 */
public record UpdateStaffStatusRequest(

        /**
         * Trạng thái mới. Chỉ chấp nhận: ACTIVE | INACTIVE.
         * <ul>
         *   <li>INACTIVE — Khóa nhân viên (vẫn tồn tại trong DB, có thể mở lại)</li>
         *   <li>ACTIVE   — Mở khóa nhân viên</li>
         * </ul>
         */
        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái chỉ được là ACTIVE hoặc INACTIVE")
        String status,

        /**
         * Lý do thay đổi trạng thái (bắt buộc để audit trail).
         * Ví dụ: "Nhân viên vi phạm nội quy", "Phục hồi sau xử lý kỷ luật"
         */
        @NotBlank(message = "Lý do thay đổi trạng thái không được để trống")
        @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự")
        String reason
) {}
