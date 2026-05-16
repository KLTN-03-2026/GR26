package com.smartfnb.shift.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public record CheckInRequest(
    @DecimalMin(value = "-90.0", message = "Vĩ độ không hợp lệ") 
    @DecimalMax(value = "90.0", message = "Vĩ độ không hợp lệ")
    Double latitude,
    
    @DecimalMin(value = "-180.0", message = "Kinh độ không hợp lệ") 
    @DecimalMax(value = "180.0", message = "Kinh độ không hợp lệ")
    Double longitude
) {}
