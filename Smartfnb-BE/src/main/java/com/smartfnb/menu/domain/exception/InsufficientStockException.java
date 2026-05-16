package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tồn kho nguyên liệu không đủ để phục vụ đơn hàng.
 * Dùng trong InventoryCheckService trước khi đặt đơn.
 *
 * @author vutq
 * @since 2026-03-28
 */
public class InsufficientStockException extends SmartFnbException {

    /**
     * Khởi tạo exception với thông tin nguyên liệu thiếu hụt.
     *
     * @param ingredientName tên nguyên liệu
     * @param required       số lượng cần thiết
     * @param available      số lượng hiện có
     * @param unit           đơn vị tính
     */
    public InsufficientStockException(String ingredientName,
                                      double required,
                                      double available,
                                      String unit) {
        super("INSUFFICIENT_STOCK", buildMessage(ingredientName, required, available, unit));
    }

    // Author: Hoàng
    // Date: 2026-05-09
    // Note: Không chèn unit rỗng vào message để tránh output dạng "Cần 25.0000 , hiện còn 0.0000 .".
    private static String buildMessage(String ingredientName,
                                       double required,
                                       double available,
                                       String unit) {
        String normalizedUnit = unit == null ? "" : unit.trim();

        if (normalizedUnit.isBlank()) {
            return String.format("Nguyên liệu '%s' không đủ. Cần %.4f, hiện còn %.4f.",
                    ingredientName, required, available);
        }

        return String.format("Nguyên liệu '%s' không đủ. Cần %.4f %s, hiện còn %.4f %s.",
                ingredientName, required, normalizedUnit, available, normalizedUnit);
    }
}
