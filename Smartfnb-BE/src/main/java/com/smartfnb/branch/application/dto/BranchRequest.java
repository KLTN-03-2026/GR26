package com.smartfnb.branch.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BranchRequest(
        @NotBlank(message = "Tên chi nhánh không được để trống")
        @Size(max = 100, message = "Tên chi nhánh không vượt quá 100 ký tự")
        String name,

        @NotBlank(message = "Mã chi nhánh không được để trống")
        @Size(max = 50, message = "Mã chi nhánh không vượt quá 50 ký tự")
        String code,

        @Size(max = 255, message = "Địa chỉ không vượt quá 255 ký tự")
        String address,

        @Size(max = 20, message = "Số điện thoại không hợp lệ")
        String phone
) {
}
