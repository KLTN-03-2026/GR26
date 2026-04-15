package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.model.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command chứa dữ liệu để tạo mới một mặt hàng trong kho (Nguyên liệu/Bán thành phẩm).
 * Được sử dụng trong nội bộ tầng Application để thực thi nghiệp vụ.
 * 
 * @param tenantId  ID của tenant sở hữu (bắt buộc)
 * @param name      Tên nguyên liệu (không được để trống)
 * @param sku       Mã định danh kho (tùy chọn)
 * @param type      Loại item (INGREDIENT hoặc SUB_ASSEMBLY)
 * @param unit      Đơn vị tính (kg, lít, cái...)
 * @param categoryId ID của danh mục phân loại
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record CreateInventoryItemCommand(
    @NotNull UUID tenantId,
    @NotBlank String name,
    String sku,
    @NotNull ItemType type,
    String unit,
    UUID categoryId
) {}
