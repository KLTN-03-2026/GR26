package com.smartfnb.order.application.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho một entry trong batch update vị trí bàn (Drag & Drop).
 * Dùng trong danh sách request UpdateTablePositionsRequest.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record TablePositionItem(

        /** ID bàn cần cập nhật vị trí */
        @NotNull(message = "ID bàn không được để trống")
        UUID tableId,

        /** Tọa độ X mới */
        @NotNull(message = "Tọa độ X không được để trống")
        BigDecimal positionX,

        /** Tọa độ Y mới */
        @NotNull(message = "Tọa độ Y không được để trống")
        BigDecimal positionY
) {}
