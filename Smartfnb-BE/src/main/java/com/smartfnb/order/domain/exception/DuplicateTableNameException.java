package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tên bàn bị trùng trong cùng zone của chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class DuplicateTableNameException extends SmartFnbException {

    /**
     * Khởi tạo exception với tên bàn bị trùng.
     *
     * @param name tên bàn đã tồn tại
     */
    public DuplicateTableNameException(String name) {
        super("DUPLICATE_TABLE_NAME",
              "Bàn với tên '" + name + "' đã tồn tại trong khu vực này.",
              409);
    }
}
