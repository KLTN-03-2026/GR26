package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi tên khu vực bàn bị trùng trong cùng chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class DuplicateZoneNameException extends SmartFnbException {

    /**
     * Khởi tạo exception với tên zone bị trùng.
     *
     * @param name tên zone đã tồn tại
     */
    public DuplicateZoneNameException(String name) {
        super("DUPLICATE_ZONE_NAME",
              "Khu vực bàn với tên '" + name + "' đã tồn tại tại chi nhánh này.",
              409);
    }
}
