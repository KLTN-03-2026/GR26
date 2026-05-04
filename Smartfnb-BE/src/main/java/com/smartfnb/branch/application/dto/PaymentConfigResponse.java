package com.smartfnb.branch.application.dto;

// author: Hoàng
// date: 27-04-2026
// note: DTO trả về trạng thái cấu hình PayOS cho FE.
//       Chỉ trả về masked key — không bao giờ trả raw key.

public record PaymentConfigResponse(

    /** true nếu chi nhánh đã cấu hình PayOS */
    boolean isConfigured,

    /** Client ID (không nhạy cảm — trả về plaintext) */
    String clientId,

    /** API Key đã che bớt, VD: "sk_****ef89" */
    String apiKeyMasked,

    /** Checksum Key đã che bớt, VD: "****5678" */
    String checksumKeyMasked
) {
    /** Factory method tạo response khi chưa có config */
    public static PaymentConfigResponse notConfigured() {
        return new PaymentConfigResponse(false, null, null, null);
    }

    /**
     * Factory method tạo response từ entity đã lưu.
     * Che 4 ký tự cuối — đủ để owner nhận biết mà không lộ key.
     */
    public static PaymentConfigResponse from(String clientId, String rawApiKey, String rawChecksumKey) {
        return new PaymentConfigResponse(
            true,
            clientId,
            mask(rawApiKey),
            mask(rawChecksumKey)
        );
    }

    private static String mask(String value) {
        if (value == null || value.length() <= 4) return "****";
        return "****" + value.substring(value.length() - 4);
    }
}
