package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command chứa dữ liệu cập nhật thông tin cho một nguyên liệu/bán thành phẩm hiện có.
 * 
 * @param id        ID của nguyên liệu cần cập nhật (bắt buộc)
 * @param tenantId  ID của tenant sở hữu (bắt buộc)
 * @param name      Tên mới của nguyên liệu
 * @param sku       Mã định danh kho mới
 * @param unit      Đơn vị tính mới
 * @param categoryId ID danh mục mới
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record UpdateInventoryItemCommand(
    @NotNull UUID id,
    @NotNull UUID tenantId,
    @NotBlank String name,
    String sku,
    String unit,
    UUID categoryId
) {}
