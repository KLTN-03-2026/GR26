package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tên món ăn đã tồn tại trong tenant.
 * Trả về 409 Conflict.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class DuplicateMenuItemNameException extends SmartFnbException {

    /**
     * Khởi tạo exception với tên món ăn bị trùng.
     *
     * @param name tên món ăn đã tồn tại
     */
    public DuplicateMenuItemNameException(String name) {
        super("DUPLICATE_MENU_ITEM_NAME",
              "Món ăn '" + name + "' đã tồn tại trong thực đơn của bạn");
    }
}
