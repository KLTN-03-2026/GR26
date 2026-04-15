package com.smartfnb.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

/**
 * DTO yêu cầu (Request payload) để cập nhật thông tin mặt hàng kho hiện có.
 * 
 * @param name        Tên nguyên liệu mới
 * @param sku         Mã SKU mới (duy nhất trong hệ thống)
 * @param unit        Đơn vị tính mới
 * @param categoryId  ID danh mục mới
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record UpdateInventoryItemRequest(
    @NotBlank(message = "Tên nguyên liệu không được để trống")
    String name,
    
    String sku,
    
    String unit,
    
    UUID categoryId
) {}
