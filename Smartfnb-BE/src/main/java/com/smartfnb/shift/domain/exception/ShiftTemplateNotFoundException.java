package com.smartfnb.shift.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy ShiftTemplate.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class ShiftTemplateNotFoundException extends SmartFnbException {
    public ShiftTemplateNotFoundException(UUID templateId) {
        super("SHIFT_TEMPLATE_NOT_FOUND", "Không tìm thấy ca mẫu với ID: " + templateId);
    }
}
