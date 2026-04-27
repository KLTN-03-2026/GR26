package com.smartfnb.branch.application.dto;

// author: Hoàng
// date: 27-04-2026
// note: DTO nhận thông tin xác thực PayOS từ Owner.
//       Chứa raw key — BE phải mã hoá ngay trước khi lưu DB, không log.

import jakarta.validation.constraints.NotBlank;

public record PaymentConfigRequest(

    @NotBlank(message = "Client ID không được để trống")
    String clientId,

    @NotBlank(message = "API Key không được để trống")
    String apiKey,

    @NotBlank(message = "Checksum Key không được để trống")
    String checksumKey
) {}
