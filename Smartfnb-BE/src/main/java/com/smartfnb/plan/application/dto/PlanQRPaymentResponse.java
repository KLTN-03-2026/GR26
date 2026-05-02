package com.smartfnb.plan.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response chứa thông tin mã QR để thanh toán hóa đơn gói dịch vụ.
 *
 * @param invoiceId      ID hóa đơn
 * @param invoiceNumber  Mã hóa đơn (INV-YYYYMM-NNNNN) — dùng làm description QR
 * @param amount         Số tiền cần chuyển
 * @param qrCodeUrl      URL ảnh QR để hiển thị cho User quét
 * @param qrCodeData     Chuỗi dữ liệu QR thô (để app tự vẽ QR nếu cần)
 * @param paymentMethod  Phương thức: VIETQR | MOMO
 * @param expiresInSeconds Thời gian hết hạn QR (giây, VD: 900 = 15 phút)
 *
 * @author vutq
 * @since 2026-04-30
 */
public record PlanQRPaymentResponse(
        UUID invoiceId,
        String invoiceNumber,
        BigDecimal amount,
        String qrCodeUrl,
        String qrCodeData,
        String paymentMethod,
        long expiresInSeconds
) {}
