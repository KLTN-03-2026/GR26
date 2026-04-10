package com.smartfnb.inventory.web.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Request body cho API nhập kho.
 * tenantId và branchId KHÔNG nhận từ request — lấy từ JWT.
 *
 * @param itemId      UUID nguyên liệu cần nhập (bắt buộc)
 * @param supplierId  UUID nhà cung cấp (tùy chọn)
 * @param quantity    số lượng nhập (phải > 0)
 * @param costPerUnit đơn giá nhập (>= 0)
 * @param expiresAt   hạn sử dụng lô hàng (tùy chọn)
 * @param note        ghi chú
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public record ImportStockRequest(
    @NotNull UUID itemId,
    UUID supplierId,
    @NotNull @DecimalMin("0.0001") BigDecimal quantity,
    @NotNull @DecimalMin("0.0") BigDecimal costPerUnit,
    Instant expiresAt,
    String note
) {}
