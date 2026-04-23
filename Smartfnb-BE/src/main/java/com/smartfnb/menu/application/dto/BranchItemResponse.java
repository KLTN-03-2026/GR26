package com.smartfnb.menu.application.dto;

import com.smartfnb.menu.infrastructure.persistence.BranchItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO response trả về thông tin món ăn kết hợp với giá chi nhánh.
 * effective_price = branchPrice nếu có, ngược lại dùng basePrice.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record BranchItemResponse(

        /** ID chi nhánh */
        UUID branchId,

        /** ID món ăn */
        UUID itemId,

        /** Tên món ăn */
        String itemName,

        /** Giá gốc của món */
        BigDecimal basePrice,

        /** Giá riêng tại chi nhánh — null nếu chưa cài */
        BigDecimal branchPrice,

        /** Giá thực tế hiển thị */
        BigDecimal effectivePrice,

        /** Trạng thái phục vụ tại chi nhánh */
        Boolean isAvailable
) {

    /**
     * Factory method tạo response kết hợp item + branch setting.
     *
     * @param item        JPA entity món ăn
     * @param branchItem  JPA entity branch setting (có thể null nếu chưa cài)
     * @return DTO response
     */
    public static BranchItemResponse from(MenuItemJpaEntity item,
                                          BranchItemJpaEntity branchItem,
                                          UUID branchId) {
        BigDecimal branchPrice = branchItem != null ? branchItem.getBranchPrice() : null;
        BigDecimal effectivePrice = (branchPrice != null) ? branchPrice : item.getBasePrice();
        boolean isAvailable = branchItem == null || Boolean.TRUE.equals(branchItem.getIsAvailable());

        return new BranchItemResponse(
                branchId,
                item.getId(),
                item.getName(),
                item.getBasePrice(),
                branchPrice,
                effectivePrice,
                isAvailable
        );
    }
}
