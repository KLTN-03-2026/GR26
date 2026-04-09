package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy TableZone hoặc zone không thuộc branch của tenant.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class TableZoneNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception với ID zone không tìm thấy.
     *
     * @param zoneId ID của zone không tồn tại
     */
    public TableZoneNotFoundException(UUID zoneId) {
        super("TABLE_ZONE_NOT_FOUND",
              "Không tìm thấy khu vực bàn với ID: " + zoneId,
              404);
    }
}
