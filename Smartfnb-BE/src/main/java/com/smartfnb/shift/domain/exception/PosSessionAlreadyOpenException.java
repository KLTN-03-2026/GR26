package com.smartfnb.shift.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Exception khi chi nhánh đã có phiên POS đang mở.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public class PosSessionAlreadyOpenException extends SmartFnbException {
    public PosSessionAlreadyOpenException() {
        super("POS_SESSION_ALREADY_OPEN",
              "Chi nhánh hiện đang có phiên POS mở. Vui lòng đóng phiên cũ trước khi mở phiên mới.");
    }
}
