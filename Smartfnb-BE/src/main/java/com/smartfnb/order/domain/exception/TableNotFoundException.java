package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy Table hoặc table đã bị soft delete.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class TableNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception với ID bàn không tìm thấy.
     *
     * @param tableId ID của bàn không tồn tại
     */
    public TableNotFoundException(UUID tableId) {
        super("TABLE_NOT_FOUND",
              "Không tìm thấy bàn với ID: " + tableId,
              404);
    }
}
