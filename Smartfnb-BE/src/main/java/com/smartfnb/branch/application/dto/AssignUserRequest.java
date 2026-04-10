package com.smartfnb.branch.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignUserRequest(
        @NotNull(message = "ID nhân viên không được để trống")
        UUID userId
) {
}
