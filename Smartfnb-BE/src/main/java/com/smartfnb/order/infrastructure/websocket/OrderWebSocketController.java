package com.smartfnb.order.infrastructure.websocket;

import com.smartfnb.order.application.command.UpdateOrderStatusCommand;
import com.smartfnb.order.application.command.UpdateOrderStatusCommandHandler;
import com.smartfnb.order.application.dto.OrderResponse;
import com.smartfnb.shared.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

/**
 * STOMP controller xử lý WebSocket messages từ client.
 *
 * <p><b>BUG FIX (BUG-2026-05-03):</b> Đã chuyển sang dùng session attributes thay vì TenantContext.
 * Thêm thông báo lỗi ngược lại cho user nếu xử lý thất bại.</p>
 *
 * @author vutq
 * @since 2026-03-31
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class OrderWebSocketController {

    private final UpdateOrderStatusCommandHandler updateOrderStatusCommandHandler;
    private final OrderStatusBroadcaster orderStatusBroadcaster;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Xử lý cập nhật trạng thái đơn hàng từ client.
     */
    @MessageMapping("/orders/change-status")
    public void handleChangeOrderStatus(
            @Payload UpdateOrderStatusWebSocketRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        log.info("Nhận WebSocket request cập nhật trạng thái đơn {} sang {}",
            request.orderId(), request.newStatus());

        Map<String, Object> sessionAttrs = headerAccessor.getSessionAttributes();
        if (sessionAttrs == null) {
            log.error("Session attributes null — bỏ qua message");
            return;
        }

        UUID tenantId = (UUID) sessionAttrs.get("tenantId");
        UUID branchId = (UUID) sessionAttrs.get("branchId");
        UUID userId   = (UUID) sessionAttrs.get("userId");

        if (tenantId == null) {
            log.warn("Unauthorized WebSocket message — tenantId missing in session");
            return;
        }

        try {
            UpdateOrderStatusCommand command = new UpdateOrderStatusCommand(
                request.orderId(),
                tenantId,
                branchId,
                userId,
                request.newStatus(),
                request.reason()
            );

            var result = updateOrderStatusCommandHandler.handle(command);
            
            // Note: EventHandler sẽ tự broadcast thông tin đầy đủ sau khi transaction commit
            // Nhưng ở đây mình có thể broadcast ngay kết quả thành công cho client này biết
            // Hoặc để EventHandler lo hết để tránh duplicate broadcast.
            // Tuy nhiên, Controller này gọi CommandHandler -> EventHandler lắng nghe event phát ra từ CommandHandler.
            // Để tránh broadcast 2 lần cùng một nội dung, ta có thể tin tưởng vào EventHandler.
            
            log.info("Cập nhật trạng thái đơn {} thành công", request.orderId());
            
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái đơn {}: {}", request.orderId(), e.getMessage());
            
            // Gửi thông báo lỗi cho riêng user này
            // Client nên subscribe /user/queue/errors
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/errors",
                ApiResponse.fail("WS_ORDER_UPDATE_FAILED", "Lỗi cập nhật trạng thái đơn: " + e.getMessage())
            );
        }
    }

    public record UpdateOrderStatusWebSocketRequest(
        UUID orderId,
        String newStatus,
        String reason
    ) {}
}
