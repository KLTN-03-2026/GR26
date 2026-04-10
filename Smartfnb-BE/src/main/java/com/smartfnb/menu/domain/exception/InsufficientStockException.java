package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tồn kho nguyên liệu không đủ để phục vụ đơn hàng.
 * Dùng trong InventoryCheckService trước khi đặt đơn.
 *
 * @author SmartF&B Team
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
        super("INSUFFICIENT_STOCK",
              String.format("Nguyên liệu '%s' không đủ. Cần %.4f %s, hiện còn %.4f %s.",
                      ingredientName, required, unit, available, unit));
    }
}
