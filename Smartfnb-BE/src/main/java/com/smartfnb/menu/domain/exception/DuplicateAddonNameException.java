package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tên Addon/Topping đã tồn tại trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class DuplicateAddonNameException extends SmartFnbException {

    /**
     * Khởi tạo exception với tên addon bị trùng.
     *
     * @param name tên addon đã tồn tại
     */
    public DuplicateAddonNameException(String name) {
        super("DUPLICATE_ADDON_NAME",
              "Topping/Addon '" + name + "' đã tồn tại trong hệ thống của bạn");
    }
}
