package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy món ăn trong thực đơn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class MenuItemNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception với ID món ăn không tìm thấy.
     *
     * @param itemId ID món ăn cần tìm
     */
    public MenuItemNotFoundException(UUID itemId) {
        super("MENU_ITEM_NOT_FOUND",
              "Không tìm thấy món ăn với ID: " + itemId);
    }
}
