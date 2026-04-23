package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy vai trò trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class RoleNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception khi không tìm thấy role.
     *
     * @param roleId UUID role không tồn tại
     */
    public RoleNotFoundException(UUID roleId) {
        super("ROLE_NOT_FOUND", "Không tìm thấy vai trò với ID: " + roleId);
    }
}
