package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy chức vụ.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class PositionNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception khi không tìm thấy chức vụ theo ID.
     *
     * @param positionId UUID chức vụ không tồn tại
     */
    public PositionNotFoundException(UUID positionId) {
        super("POSITION_NOT_FOUND", "Không tìm thấy chức vụ với ID: " + positionId);
    }
}
