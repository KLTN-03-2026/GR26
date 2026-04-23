package com.smartfnb.inventory.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.math.BigDecimal;

/**
 * Exception khi tồn kho nguyên liệu không đủ để thực hiện thao tác.
 * Sử dụng khi SALE_DEDUCT hoặc EXPORT yêu cầu nhiều hơn tồn kho hiện có.
 *
 * @author vutq
 * @since 2026-04-03
 */
public class InsufficientStockException extends SmartFnbException {

    /**
     * Khởi tạo với thông tin nguyên liệu thiếu.
     *
     * @param ingredientName tên nguyên liệu
     * @param required       số lượng cần
     * @param available      số lượng hiện có
     */
    public InsufficientStockException(String ingredientName,
                                       BigDecimal required,
                                       BigDecimal available) {
        super("INSUFFICIENT_STOCK",
              String.format("Nguyên liệu '%s' không đủ. Cần %.4f, hiện còn %.4f",
                  ingredientName, required, available), 422);
    }
}
