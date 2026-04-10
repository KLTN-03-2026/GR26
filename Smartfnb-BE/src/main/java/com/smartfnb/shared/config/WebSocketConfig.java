package com.smartfnb.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP broker cho SmartF&B.
 * Client kết nối qua /ws và subscribe các topic realtime:
 * - /topic/tables/{branchId}  → cập nhật sơ đồ bàn realtime
 * - /topic/orders/{branchId}  → cập nhật trạng thái đơn hàng realtime (S-10)
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Cấu hình simple in-memory message broker.
     * Prefix /topic dành cho broadcast 1-to-many (table map, order status).
     * Prefix /app dành cho client-to-server messages.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker cho /topic/* — đủ dùng cho phase 1
        // Phase 2: thay bằng RabbitMQ/Redis broker để scale horizontal
        registry.enableSimpleBroker("/topic");

        // Prefix cho @MessageMapping endpoints trong Controller
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Đăng ký STOMP endpoint.
     * Client kết nối tới ws://host/ws (hoặc SockJS fallback).
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Cho phép tất cả origin trong development — Thu hẹp trong production
                .setAllowedOriginPatterns("*")
                // SockJS fallback cho browser không hỗ trợ native WebSocket
                .withSockJS();
    }
}
