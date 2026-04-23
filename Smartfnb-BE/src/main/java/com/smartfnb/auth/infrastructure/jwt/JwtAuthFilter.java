package com.smartfnb.auth.infrastructure.jwt;

import com.smartfnb.shared.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Filter xác thực JWT cho mọi HTTP request.
 * Chạy một lần mỗi request (kế thừa OncePerRequestFilter).
 *
 * <p>Flow:</p>
 * <ol>
 *   <li>Đọc Authorization header</li>
 *   <li>Parse và validate JWT token</li>
 *   <li>Populate TenantContext (tenantId, userId, role, branchId)</li>
 *   <li>Set SecurityContext authentication</li>
 *   <li>Gọi filter tiếp theo</li>
 *   <li>Clear TenantContext trong finally block</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER   = "Authorization";

    private final JwtService jwtService;

    /**
     * Xử lý xác thực JWT cho mỗi request.
     * TenantContext LUÔN được clear trong finally block để tránh memory leak.
     *
     * @param request     HTTP request
     * @param response    HTTP response
     * @param filterChain chuỗi filter tiếp theo
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String token = extractBearerToken(request);
            if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                processToken(token, request);
            }
            filterChain.doFilter(request, response);

        } catch (JwtException e) {
            // Token không hợp lệ — không set authentication, request sẽ bị Spring Security chặn
            log.debug("JWT không hợp lệ cho request {}: {}", request.getRequestURI(), e.getMessage());
            filterChain.doFilter(request, response);
        } finally {
            // BẮT BUỘC: clear context sau mỗi request để tránh data leak giữa các requests
            TenantContext.clear();
        }
    }

    /**
     * Parse và xử lý JWT token hợp lệ.
     * Set TenantContext và Spring SecurityContext.
     *
     * @param token   JWT string đã trích xuất từ header
     * @param request HTTP request hiện tại
     */
    private void processToken(String token, HttpServletRequest request) {
        Claims claims = jwtService.validateAndExtractClaims(token);

        // 1. Lấy thông tin từ claims
        UUID userId   = UUID.fromString(claims.getSubject());
        UUID tenantId = jwtService.extractTenantId(claims);
        String role   = jwtService.extractRole(claims);
        UUID branchId = jwtService.extractBranchId(claims);
        List<String> permissions = jwtService.extractPermissions(claims);

        // 2. Populate TenantContext — dùng trong toàn bộ request lifecycle
        if (tenantId != null) {
            TenantContext.setCurrentTenantId(tenantId);
        }
        TenantContext.setCurrentUserId(userId);
        TenantContext.setCurrentRole(role);
        if (branchId != null) {
            TenantContext.setCurrentBranchId(branchId);
        }

        // 3. Xây dựng authorities từ role + permissions
        List<SimpleGrantedAuthority> authorities = buildAuthorities(role, permissions);

        // 4. Set Spring SecurityContext
        var authentication = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, authorities);
        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("JWT hợp lệ — userId={}, tenantId={}, role={}", userId, tenantId, role);
    }

    /**
     * Trích xuất Bearer token từ Authorization header.
     *
     * @param request HTTP request
     * @return token string hoặc null nếu không có
     */
    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTH_HEADER);
        if (StringUtils.hasText(authHeader) && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    /**
     * Xây dựng danh sách GrantedAuthority từ role và permissions.
     * Role có prefix ROLE_ để tương thích với Spring Security hasRole().
     *
     * @param role        tên role
     * @param permissions danh sách permission codes
     * @return danh sách SimpleGrantedAuthority
     */
    private List<SimpleGrantedAuthority> buildAuthorities(String role, List<String> permissions) {
        var roleAuthority = Stream.of(new SimpleGrantedAuthority("ROLE_" + role));
        var permAuthorities = permissions.stream()
                .map(SimpleGrantedAuthority::new);
        return Stream.concat(roleAuthority, permAuthorities).collect(Collectors.toList());
    }
}
