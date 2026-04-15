package com.smartfnb.inventory.domain.model;

import lombok.Getter;

/**
 * Phân loại mặt hàng trong hệ thống kho.
 * 
 * Nghiệp vụ:
 * - INGREDIENT: Phục vụ cho các nguyên liệu đầu vào được mua từ nhà cung cấp.
 * - SUB_ASSEMBLY: Phục vụ cho các sản phẩm tự chế biến từ nguyên liệu khác, dùng làm thành phần cho món khác.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Getter
public enum ItemType {
    /** Nguyên liệu thô nhập từ nhà cung cấp */
    INGREDIENT("NGUYÊN LIỆU"),
    
    /** Bán thành phẩm do quán tự sản xuất/chế biến */
    SUB_ASSEMBLY("BÁN THÀNH PHẨM");

    private final String description;

    ItemType(String description) {
        this.description = description;
    }
}
