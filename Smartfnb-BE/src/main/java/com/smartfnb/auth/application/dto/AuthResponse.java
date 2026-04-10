package com.smartfnb.auth.application.dto;

/**
 * Response trả về sau khi đăng ký hoặc đăng nhập thành công.
 * Chứa JWT access token và refresh token.
 *
 * @param accessToken   JWT access token — gửi kèm mỗi request (Authorization: Bearer)
 * @param refreshToken  JWT refresh token — dùng để lấy access token mới
 * @param tokenType     loại token (mặc định "Bearer")
 * @param expiresIn     thời gian hết hạn access token tính bằng giây
 * @param userId        UUID người dùng vừa đăng ký/đăng nhập
 * @param tenantId      UUID tenant sở hữu người dùng
 * @param role          role của người dùng trong tenant
 * @author SmartF&amp;B Team
 * @since 2026-03-26
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        String userId,
        String tenantId,
        String role,
        String branchId
) {
    /**
     * Tạo AuthResponse với tokenType mặc định là "Bearer".
     *
     * @param accessToken  JWT access token
     * @param refreshToken JWT refresh token
     * @param expiresIn    thời gian hết hạn (giây)
     * @param userId       UUID user dạng string
     * @param tenantId     UUID tenant dạng string
     * @param role         role hiện tại
     * @return AuthResponse hoàn chỉnh
     */
    public static AuthResponse of(String accessToken, String refreshToken,
                                  long expiresIn, String userId,
                                  String tenantId, String role, String branchId) {
        return new AuthResponse(accessToken, refreshToken, "Bearer",
                expiresIn, userId, tenantId, role, branchId);
    }
    
    public static AuthResponse of(String accessToken, String refreshToken,
                                  long expiresIn, String userId,
                                  String tenantId, String role) {
        return new AuthResponse(accessToken, refreshToken, "Bearer",
                expiresIn, userId, tenantId, role, null);
    }
}
