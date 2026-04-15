package com.smartfnb.inventory.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception nghiệp vụ quăng ra khi Tên hoặc Mã SKU của nguyên liệu đã tồn tại trong Tenant.
 * Giúp ngăn chặn việc tạo dữ liệu trùng lặp gây xung đột trong quản lý kho.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public class InventoryItemAlreadyExistsException extends SmartFnbException {
    
    public InventoryItemAlreadyExistsException(String message) {
        // Trả về mã lỗi định danh INVENTORY_ITEM_ALREADY_EXISTS và HTTP 409 Conflict
        super("INVENTORY_ITEM_ALREADY_EXISTS", message, 409);
    }
}
