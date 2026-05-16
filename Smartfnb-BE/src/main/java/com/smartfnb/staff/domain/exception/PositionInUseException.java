package com.smartfnb.staff.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi chức vụ vẫn đang được gán cho nhân viên.
 */
public class PositionInUseException extends SmartFnbException {

    public PositionInUseException(UUID positionId) {
        super("POSITION_IN_USE",
                "Không thể xóa hoặc vô hiệu hóa chức vụ đang được gán cho nhân viên: " + positionId,
                409);
    }
}
