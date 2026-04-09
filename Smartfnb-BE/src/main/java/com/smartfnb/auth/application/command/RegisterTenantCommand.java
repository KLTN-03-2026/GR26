package com.smartfnb.auth.application.command;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Lệnh đăng ký tenant mới (chủ quán tạo tài khoản SaaS).
 * Không cần tenantId vì đây là hành động tạo mới tenant.
 *
 * <p>Flow: RegisterTenantCommand → RegisterTenantCommandHandler
 * → tạo Tenant + User owner → trả JWT ngay.</p>
 *
 * @param tenantName  tên chuỗi F&B (VD: "Cà phê Phúc Long")
 * @param email       email đăng nhập — unique toàn hệ thống
 * @param password    mật khẩu gốc — sẽ được hash bằng BCrypt
 * @param ownerName   tên chủ quán
 * @param phone       số điện thoại liên hệ (tùy chọn)
 * @param planSlug    slug gói dịch vụ muốn đăng ký (VD: "basic", "standard", "premium")
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record RegisterTenantCommand(

        @NotBlank(message = "Tên chuỗi F&B không được để trống")
        @Size(max = 255, message = "Tên chuỗi F&B tối đa 255 ký tự")
        String tenantName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
        String password,

        @NotBlank(message = "Tên chủ quán không được để trống")
        @Size(max = 255, message = "Tên chủ quán tối đa 255 ký tự")
        String ownerName,

        String phone,

        @NotBlank(message = "Gói dịch vụ không được để trống")
        String planSlug

) {}
