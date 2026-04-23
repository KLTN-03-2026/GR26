package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy nhân viên trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class StaffNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception khi không tìm thấy nhân viên theo ID.
     *
     * @param staffId UUID nhân viên không tồn tại
     */
    public StaffNotFoundException(UUID staffId) {
        super("STAFF_NOT_FOUND", "Không tìm thấy nhân viên với ID: " + staffId);
    }
}
