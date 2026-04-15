package com.smartfnb.inventory.application.dto;

import com.smartfnb.inventory.domain.model.ItemType;
import com.smartfnb.inventory.infrastructure.persistence.InventoryItemJpaEntity;
import com.smartfnb.inventory.domain.model.InventoryItem;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO chứa thông tin phản hồi chi tiết về một mặt hàng kho.
 * Dùng để trả về dữ liệu cho các API xem danh sách và chi tiết.
 * 
 * @param id          ID duy nhất
 * @param name        Tên nguyên liệu
 * @param sku         Mã SKU
 * @param type        Loại item (Enum)
 * @param typeDescription Mô tả loại (Tiếng Việt)
 * @param unit        Đơn vị tính
 * @param categoryId  ID danh mục
 * @param isActive    Trạng thái hoạt động
 * @param createdAt   Ngày tạo
 * @param updatedAt   Ngày cập nhật cuối
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Builder
public record InventoryItemResponse(
    UUID id,
    String name,
    String sku,
    ItemType type,
    String typeDescription,
    String unit,
    UUID categoryId,
    boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    /**
     * Ánh xạ từ thực thể cơ sở dữ liệu sang DTO phản hồi.
     */
    public static InventoryItemResponse from(InventoryItemJpaEntity entity) {
        return InventoryItemResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .sku(entity.getSku())
                .type(entity.getType())
                .typeDescription(entity.getType().getDescription())
                .unit(entity.getUnit())
                .categoryId(entity.getCategoryId())
                .isActive(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static InventoryItemResponse from(InventoryItem item) {
        return InventoryItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .type(item.getType())
                .typeDescription(item.getType().getDescription())
                .unit(item.getUnit())
                .categoryId(item.getCategoryId())
                .isActive(item.isActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
