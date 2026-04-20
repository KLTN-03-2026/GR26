package com.smartfnb.shift.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi nhân viên đăng ký trùng ca làm việc.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class ShiftConflictException extends SmartFnbException {
    /**
     * Khởi tạo exception khi nhân viên đã có ca trong ngày đó.
     *
     * @param userName tên nhân viên
     * @param date     ngày bị trùng
     */
    public ShiftConflictException(String userName, String date) {
        super("SHIFT_CONFLICT",
              "Nhân viên '" + userName + "' đã có ca làm việc với cùng ca mẫu vào ngày " + date
              + ". Vui lòng chọn ca hoặc ngày khác.");
    }
}
