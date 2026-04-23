package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi số điện thoại nhân viên đã tồn tại trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class DuplicatePhoneException extends SmartFnbException {

    /**
     * Khởi tạo exception khi phone bị trùng trong tenant.
     *
     * @param phone số điện thoại bị trùng
     */
    public DuplicatePhoneException(String phone) {
        super("DUPLICATE_PHONE",
              "Số điện thoại '" + phone + "' đã được đăng ký trong hệ thống. Vui lòng dùng số khác.");
    }
}
