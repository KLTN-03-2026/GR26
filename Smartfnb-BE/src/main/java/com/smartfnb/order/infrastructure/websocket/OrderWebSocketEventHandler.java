package com.smartfnb.order.infrastructure.websocket;

import com.smartfnb.order.application.dto.OrderResponse;
import com.smartfnb.order.domain.event.OrderCancelledEvent;
import com.smartfnb.order.domain.event.OrderCompletedEvent;
import com.smartfnb.order.domain.event.OrderCreatedEvent;
import com.smartfnb.order.domain.event.OrderStatusChangedEvent;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Lắng nghe các Domain Events từ module Order và broadcast qua WebSocket.
 * Đảm bảo mọi broadcast đều mang đầy đủ dữ liệu đơn hàng bao gồm tên bàn và nhân viên.
 *
 * @author vutq
 * @since 2026-03-31
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderWebSocketEventHandler {

    private final OrderStatusBroadcaster orderStatusBroadcaster;
    private final OrderRepository orderRepository;
    private final TableJpaRepository tableJpaRepository;
    private final StaffJpaRepository staffJpaRepository;

    /**
     * Xử lý sự kiện đơn hàng mới được tạo.
     */
    @EventListener
    @Async
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Nhận sự kiện đơn hàng mới: {} tại chi nhánh {}", event.orderId(), event.branchId());
        enrichAndBroadcast(event.orderId(), event.tenantId(), event.branchId(), true);
    }

    /**
     * Xử lý sự kiện trạng thái đơn hàng thay đổi.
     */
    @EventListener
    @Async
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {
        log.info("Nhận sự kiện thay đổi trạng thái đơn {} sang {}", event.orderId(), event.newStatus());
        enrichAndBroadcast(event.orderId(), event.tenantId(), event.branchId(), false);
    }

    /**
     * Xử lý sự kiện đơn hàng hoàn tất.
     */
    @EventListener
    @Async
    public void handleOrderCompleted(OrderCompletedEvent event) {
        log.info("Nhận sự kiện đơn hàng hoàn tất: {}", event.orderNumber());
        enrichAndBroadcast(event.orderId(), event.tenantId(), event.branchId(), false);
    }

    /**
     * Xử lý sự kiện đơn hàng bị hủy.
     */
    @EventListener
    @Async
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("Nhận sự kiện đơn hàng bị hủy: {}", event.orderId());
        enrichAndBroadcast(event.orderId(), event.tenantId(), event.branchId(), false);
    }

    /**
     * Load đầy đủ thông tin đơn hàng từ DB và thực hiện broadcast.
     * Cung cấp dữ liệu đầy đủ (Items, Table Name, Staff Name) cho Frontend.
     *
     * @param orderId ID đơn hàng
     * @param tenantId ID tenant
     * @param branchId ID chi nhánh
     * @param isNew true nếu là đơn hàng mới tạo
     */
    private void enrichAndBroadcast(UUID orderId, UUID tenantId, UUID branchId, boolean isNew) {
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
            .orElse(null);

        if (order == null) {
            log.warn("Không tìm thấy Order {} trong DB khi broadcast WebSocket — bỏ qua", orderId);
            return;
        }

        // Fetch Table Name
        String tableName = null;
        if (order.getTableId() != null) {
            tableName = tableJpaRepository.findById(order.getTableId())
                .map(t -> t.getName())
                .orElse("Bàn không xác định");
        } else {
            tableName = "Takeaway";
        }

        // Fetch Staff Name
        String staffName = null;
        if (order.getUserId() != null) {
            staffName = staffJpaRepository.findById(order.getUserId())
                .map(s -> s.getFullName())
                .orElse("Nhân viên không xác định");
        } else {
            staffName = "Unknown";
        }

        OrderResponse response = OrderResponse.from(order, tableName, staffName);
        
        if (isNew) {
            orderStatusBroadcaster.broadcastNewOrder(branchId, response);
        } else {
            orderStatusBroadcaster.broadcastOrderStatus(branchId, response);
        }

        log.debug("Đã broadcast thông tin đầy đủ cho đơn {} tới WebSocket topic", order.getOrderNumber());
    }
}
