package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command thực hiện lệnh bật/tắt trạng thái hoạt động của một mặt hàng kho.
 * 
 * @param id        ID của nguyên liệu cần chuyển đổi (bắt buộc)
 * @param tenantId  ID của tenant sở hữu (bắt buộc)
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record ToggleInventoryItemCommand(
    @NotNull UUID id,
    @NotNull UUID tenantId
) {}
