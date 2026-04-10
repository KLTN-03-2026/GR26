package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Lệnh đăng nhập POS nhanh bằng PIN.
 * Dùng cho nhân viên chọn tên mình trên màn hình POS rồi nhập PIN.
 *
 * <p><b>Bảo mật — Anti-Pattern #4:</b> tenantId KHÔNG được nhận từ client body.
 * tenantId được lấy từ TenantContext (JWT) trong handler.
 * Client chỉ gửi userId (chọn từ màn hình POS) và PIN.</p>
 *
 * @param userId UUID nhân viên dạng string (chọn từ danh sách trên màn hình POS)
 * @param pin    PIN 4–6 số gốc — sẽ được verify với BCrypt hash
 * @author SmartF&B Team
 * @since 2026-03-27 (security fix: removed tenantId from body)
 */
public record PinLoginCommand(

        @NotBlank(message = "User ID không được để trống")
        String userId,

        @NotBlank(message = "PIN không được để trống")
        @Size(min = 4, max = 6, message = "PIN phải từ 4-6 số")
        @Pattern(regexp = "\\d+", message = "PIN chỉ được chứa chữ số")
        String pin

) {}
