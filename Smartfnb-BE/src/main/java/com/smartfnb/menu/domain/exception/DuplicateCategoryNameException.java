package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tên danh mục đã tồn tại trong tenant.
 * Trả về 409 Conflict.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class DuplicateCategoryNameException extends SmartFnbException {

    /**
     * Khởi tạo exception với tên danh mục bị trùng.
     *
     * @param name tên danh mục đã tồn tại
     */
    public DuplicateCategoryNameException(String name) {
        super("DUPLICATE_CATEGORY_NAME",
              "Danh mục '" + name + "' đã tồn tại trong thực đơn của bạn");
    }
}
