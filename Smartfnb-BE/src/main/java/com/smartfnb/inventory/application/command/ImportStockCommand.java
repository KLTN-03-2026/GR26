package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Command nhập kho nguyên liệu — tạo một StockBatch mới.
 * Populated từ ImportStockRequest + TenantContext.
 *
 * @param tenantId    UUID tenant (từ JWT)
 * @param branchId    UUID chi nhánh (từ JWT)
 * @param userId      UUID nhân viên thực hiện (từ JWT)
 * @param itemId      UUID nguyên liệu được nhập
 * @param supplierId  UUID nhà cung cấp (nullable)
 * @param quantity    số lượng nhập (phải > 0)
 * @param costPerUnit đơn giá nhập (>= 0)
 * @param expiresAt   hạn sử dụng (nullable)
 * @param note        ghi chú nhập kho
 *
 * @author vutq
 * @since 2026-04-03
 */
public record ImportStockCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID userId,
    @NotNull UUID itemId,
    UUID supplierId,
    @NotNull @DecimalMin("0.0001") BigDecimal quantity,
    @NotNull @DecimalMin("0.0") BigDecimal costPerUnit,
    Instant expiresAt,
    String note
) {}
