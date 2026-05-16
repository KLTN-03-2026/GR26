package com.smartfnb.shift.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

public class GpsCheckInException extends SmartFnbException {

    private final Integer distanceMeters;
    private final Integer allowedRadius;

    public GpsCheckInException(String message) {
        super("INVALID_GPS_LOCATION", message, 422);
        this.distanceMeters = null;
        this.allowedRadius = null;
    }

    public GpsCheckInException(int distanceMeters, int allowedRadius) {
        super("INVALID_GPS_LOCATION", String.format("Bạn đang cách chi nhánh %dm, ngoài phạm vi cho phép (%dm).", distanceMeters, allowedRadius), 422);
        this.distanceMeters = distanceMeters;
        this.allowedRadius = allowedRadius;
    }

    public Integer getDistanceMeters() {
        return distanceMeters;
    }

    public Integer getAllowedRadius() {
        return allowedRadius;
    }
}
