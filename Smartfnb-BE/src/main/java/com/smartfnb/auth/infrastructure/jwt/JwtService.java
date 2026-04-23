package com.smartfnb.auth.infrastructure.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dịch vụ tạo và xác thực JWT token cho SmartF&B.
 * Token chứa các claims: tenantId, userId, role, permissions.
 *
 * <p>Sử dụng JJWT 0.12.x với thuật toán HMAC-SHA256.</p>
 * <p>Access token: 1 giờ | Refresh token: 7 ngày</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
public class JwtService {

    /** Claim key lưu UUID tenant */
    public static final String CLAIM_TENANT_ID   = "tenantId";
    /** Claim key lưu role người dùng */
    public static final String CLAIM_ROLE        = "role";
    /** Claim key lưu danh sách quyền */
    public static final String CLAIM_PERMISSIONS = "permissions";
    /** Claim key lưu UUID chi nhánh đang làm việc */
    public static final String CLAIM_BRANCH_ID   = "branchId";

    private final SecretKey secretKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    /**
     * Khởi tạo JwtService với config từ application.yml.
     *
     * @param secret             chuỗi secret key (ít nhất 32 ký tự)
     * @param accessExpirationMs thời gian hết hạn access token (ms)
     * @param refreshExpirationMs thời gian hết hạn refresh token (ms)
     */
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long accessExpirationMs,
            @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    /**
     * Tạo JWT access token từ thông tin người dùng.
     * Subject là userId — dùng để lấy userId trong filter.
     *
     * @param userId      UUID người dùng
     * @param tenantId    UUID tenant
     * @param role        vai trò (VD: OWNER, CASHIER)
     * @param permissions danh sách quyền (VD: ["ORDER_CREATE", "PAYMENT_CREATE"])
     * @param branchId    UUID chi nhánh đang làm việc (có thể null)
     * @return JWT access token string
     */
    public String generateAccessToken(UUID userId, UUID tenantId, String role,
                                      List<String> permissions, UUID branchId) {
        Instant now = Instant.now();
        Map<String, Object> claims = buildClaims(tenantId, role, permissions, branchId);

        return Jwts.builder()
                .subject(userId.toString())
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpirationMs)))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Tạo JWT refresh token — chỉ chứa userId, không có claims nghiệp vụ.
     *
     * @param userId UUID người dùng
     * @return JWT refresh token string
     */
    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshExpirationMs)))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Xác thực token và trả về Claims nếu hợp lệ.
     * Throw JwtException nếu token không hợp lệ hoặc hết hạn.
     *
     * @param token JWT token string
     * @return Claims object chứa tất cả claims
     * @throws JwtException nếu token không hợp lệ
     */
    public Claims validateAndExtractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Lấy userId (subject) từ token.
     *
     * @param token JWT token string
     * @return UUID userId
     */
    public UUID extractUserId(String token) {
        Claims claims = validateAndExtractClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Lấy tenantId từ claims token.
     *
     * @param claims JWT claims đã parse
     * @return UUID tenantId hoặc null
     */
    public UUID extractTenantId(Claims claims) {
        String tenantIdStr = claims.get(CLAIM_TENANT_ID, String.class);
        return tenantIdStr != null ? UUID.fromString(tenantIdStr) : null;
    }

    /**
     * Lấy role từ claims token.
     *
     * @param claims JWT claims đã parse
     * @return tên role hoặc null
     */
    public String extractRole(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    /**
     * Lấy danh sách permissions từ claims token.
     *
     * @param claims JWT claims đã parse
     * @return danh sách quyền
     */
    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(Claims claims) {
        Object perms = claims.get(CLAIM_PERMISSIONS);
        if (perms instanceof List<?> list) {
            return (List<String>) list;
        }
        return List.of();
    }

    /**
     * Lấy branchId từ claims token.
     *
     * @param claims JWT claims đã parse
     * @return UUID branchId hoặc null
     */
    public UUID extractBranchId(Claims claims) {
        String branchIdStr = claims.get(CLAIM_BRANCH_ID, String.class);
        return branchIdStr != null ? UUID.fromString(branchIdStr) : null;
    }

    /**
     * Lấy thời gian hết hạn access token tính bằng giây.
     *
     * @return số giây
     */
    public long getAccessExpirationSeconds() {
        return accessExpirationMs / 1000;
    }

    /**
     * Kiểm tra token có hết hạn chưa.
     *
     * @param token JWT token string
     * @return true nếu đã hết hạn
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateAndExtractClaims(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    // ========================== PRIVATE METHODS ==========================

    /**
     * Xây dựng map claims nghiệp vụ cho JWT.
     *
     * @param tenantId    UUID tenant
     * @param role        vai trò
     * @param permissions danh sách quyền
     * @param branchId    UUID chi nhánh (nullable)
     * @return map claims
     */
    private Map<String, Object> buildClaims(UUID tenantId, String role,
                                            List<String> permissions, UUID branchId) {
        var builder = new java.util.HashMap<String, Object>();
        builder.put(CLAIM_TENANT_ID, tenantId.toString());
        builder.put(CLAIM_ROLE, role);
        builder.put(CLAIM_PERMISSIONS, permissions);
        if (branchId != null) {
            builder.put(CLAIM_BRANCH_ID, branchId.toString());
        }
        return builder;
    }
}
