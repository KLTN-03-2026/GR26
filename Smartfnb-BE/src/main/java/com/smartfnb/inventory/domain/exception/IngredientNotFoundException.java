package com.smartfnb.inventory.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy nguyên liệu / Item trong kho.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public class IngredientNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo với itemId không tìm thấy.
     *
     * @param itemId UUID của item không tồn tại
     */
    public IngredientNotFoundException(UUID itemId) {
        super("INGREDIENT_NOT_FOUND",
              "Không tìm thấy nguyên liệu với ID: " + itemId, 404);
    }
}
