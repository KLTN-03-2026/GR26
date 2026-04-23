package com.smartfnb.order.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * DTO request batch update vị trí các bàn sau khi Drag & Drop.
 * Nhân viên hoàn tất kéo thả nhiều bàn, client gửi 1 request duy nhất
 * để lưu toàn bộ vị trí — tránh gọi nhiều request riêng lẻ.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateTablePositionsRequest(

        /**
         * Danh sách bàn cần cập nhật vị trí.
         * Mỗi item chứa tableId + position_x + position_y mới.
         */
        @NotEmpty(message = "Danh sách vị trí bàn không được rỗng")
        @Valid
        List<TablePositionItem> positions
) {}
