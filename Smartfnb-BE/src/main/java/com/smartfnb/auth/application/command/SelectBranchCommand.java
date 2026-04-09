package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SelectBranchCommand(
        @NotNull(message = "ID chi nhánh không được để trống")
        UUID branchId
) {
}
