package com.smartfnb.inventory.application.dto;

import com.smartfnb.inventory.domain.model.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO yêu cầu (Request payload) để tạo mới một mặt hàng trong kho.
 * Chứa các ràng buộc dữ liệu đầu vào (Validation).
 * 
 * @param name        Tên nguyên liệu (bắt buộc, không để trống)
 * @param sku         Mã định danh kho (SKU)
 * @param type        Loại mặt hàng (INGREDIENT: Nguyên liệu, SUB_ASSEMBLY: Bán thành phẩm)
 * @param unit        Đơn vị tính (ví dụ: kg, gram, cái)
 * @param categoryId  ID danh mục phân loại mặt hàng
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record CreateInventoryItemRequest(
    @NotBlank(message = "Tên nguyên liệu không được để trống")
    String name,
    
    String sku,
    
    @NotNull(message = "Loại item không được để trống")
    ItemType type,
    
    String unit,
    
    UUID categoryId
) {}
