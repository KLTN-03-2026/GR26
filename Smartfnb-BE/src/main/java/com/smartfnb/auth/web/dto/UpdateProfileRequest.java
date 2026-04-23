package com.smartfnb.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body cho PUT /api/v1/account/me.
 * Email không được phép thay đổi qua endpoint này.
 *
 * @author vutq
 * @since 2026-04-23
 */
public record UpdateProfileRequest(

        /** Họ tên đầy đủ — bắt buộc, tối đa 100 ký tự */
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        /** Số điện thoại — tuỳ chọn, định dạng Việt Nam */
        @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$",
                 message = "Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)")
        String phone
) {}
