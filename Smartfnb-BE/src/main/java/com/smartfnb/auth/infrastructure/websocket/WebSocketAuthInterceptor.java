package com.smartfnb.auth.infrastructure.websocket;

import com.smartfnb.auth.infrastructure.jwt.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * STOMP ChannelInterceptor xác thực JWT trên WebSocket layer.
 *
 * <p><b>BUG FIX (BUG-2026-05-03 — BUG 2):</b></p>
 * <p>Root cause: {@code JwtAuthFilter} là HTTP Servlet filter — chỉ chạy trên HTTP request thread
 * (bao gồm WebSocket handshake). Sau khi handshake, filter gọi {@code TenantContext.clear()}
 * trong {@code finally} block. Khi client gửi STOMP message, Spring xử lý trên WebSocket
 * message thread khác — {@code TenantContext} trên thread này là {@code null}.</p>
 *
 * <p>Giải pháp: Interceptor này:</p>
 * <ol>
 *   <li>Xác thực JWT tại STOMP CONNECT frame (reject ngay nếu không có token hợp lệ)</li>
 *   <li>Lưu claims (tenantId, userId, branchId, role) vào STOMP session attributes</li>
 *   <li>{@code OrderWebSocketController} đọc từ session attributes thay vì {@code TenantContext}</li>
 * </ol>
 *
 * <p><b>FE phải gửi JWT trong STOMP CONNECT headers:</b></p>
 * <pre>
 *   connectHeaders: { Authorization: "Bearer &lt;token&gt;" }
 * </pre>
 *
 * @author vutq
 * @since 2026-05-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor
            .getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // Chỉ xác thực tại CONNECT frame — claims được cache vào session để dùng ở messages sau
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket CONNECT bị từ chối: thiếu Authorization header");
                throw new org.springframework.messaging.MessageDeliveryException(
                    "Thiếu JWT token trong STOMP CONNECT header — FE phải gửi Authorization: Bearer <token>");
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = jwtService.validateAndExtractClaims(token);

                UUID tenantId = jwtService.extractTenantId(claims);
                UUID userId   = UUID.fromString(claims.getSubject());
                UUID branchId = jwtService.extractBranchId(claims);
                String role   = jwtService.extractRole(claims);

                // Lưu vào STOMP session attributes — tồn tại suốt session
                Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                if (sessionAttrs == null) {
                    log.warn("WebSocket CONNECT: sessionAttributes null — không thể lưu claims");
                    throw new org.springframework.messaging.MessageDeliveryException(
                        "Internal error: STOMP session attributes unavailable");
                }

                sessionAttrs.put("tenantId", tenantId);
                sessionAttrs.put("userId",   userId);
                sessionAttrs.put("branchId", branchId);
                sessionAttrs.put("role",     role);

                log.info("WebSocket CONNECT xác thực thành công — userId={}, tenantId={}, role={}",
                    userId, tenantId, role);

            } catch (JwtException e) {
                log.warn("WebSocket CONNECT bị từ chối: JWT không hợp lệ — {}", e.getMessage());
                throw new org.springframework.messaging.MessageDeliveryException(
                    "JWT không hợp lệ hoặc đã hết hạn: " + e.getMessage());
            }
        }

        return message;
    }
}
