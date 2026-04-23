package com.smartfnb.shift.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy ca làm việc.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class ShiftNotFoundException extends SmartFnbException {
    public ShiftNotFoundException(UUID scheduleId) {
        super("SHIFT_NOT_FOUND", "Không tìm thấy ca làm việc với ID: " + scheduleId);
    }
}
