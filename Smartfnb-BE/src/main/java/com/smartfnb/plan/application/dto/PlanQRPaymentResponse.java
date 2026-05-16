package com.smartfnb.plan.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response chứa thông tin mã QR để thanh toán hóa đơn gói dịch vụ.
 *
 * @param invoiceId        ID hóa đơn
 * @param invoiceNumber    Mã hóa đơn (INV-YYYYMM-NNNNN) — dùng làm description QR
 * @param amount           Số tiền cần chuyển
 * @param qrCodeUrl        URL ảnh QR để hiển thị cho User quét (VietQR/MoMo trả URL ảnh)
 * @param qrCodeData       Chuỗi dữ liệu QR thô (để app tự vẽ QR nếu cần; PayOS trả raw QR string)
 * @param paymentMethod    Phương thức: VIETQR | MOMO | PAYOS
 * @param expiresInSeconds Thời gian hết hạn QR (giây, VD: 900 = 15 phút)
 * @param paymentReference paymentLinkId từ PayOS (null nếu không phải PAYOS)
 * @param orderCode        orderCode PayOS — dùng cho polling (null nếu không phải PAYOS)
 * @param checkoutUrl      URL checkout PayOS — nút "Mở trang thanh toán PayOS" (null nếu không phải PAYOS)
 *
 * @author vutq
 * @since 2026-04-30
 * @author Hoàng | date: 2026-05-16 | note: Thêm paymentReference, orderCode, checkoutUrl cho PAYOS billing
 */
public record PlanQRPaymentResponse(
        UUID invoiceId,
        String invoiceNumber,
        BigDecimal amount,
        String qrCodeUrl,
        String qrCodeData,
        String paymentMethod,
        long expiresInSeconds,
        String paymentReference,   // paymentLinkId từ PayOS
        Long orderCode,            // orderCode PayOS cho polling
        String checkoutUrl         // URL mở trang thanh toán PayOS
) {}

