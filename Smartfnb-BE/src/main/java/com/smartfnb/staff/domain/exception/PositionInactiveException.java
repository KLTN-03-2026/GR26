package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi chức vụ đã bị vô hiệu hóa.
 */
public class PositionInactiveException extends SmartFnbException {

    public PositionInactiveException(UUID positionId) {
        super("POSITION_INACTIVE",
                "Chức vụ đã bị vô hiệu hóa, không thể gán cho nhân viên: " + positionId,
                409);
    }
}
