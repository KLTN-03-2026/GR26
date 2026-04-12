package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.order.domain.exception.OrderNotFoundException;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.application.command.UpdateOrderStatusCommand;
import com.smartfnb.order.application.command.UpdateOrderStatusCommandHandler;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Triển khai OrderAdapter để giao tiếp với Order Module.
 * Lấy dữ liệu trực tiếp qua OrderRepository thay vì API call (vì Modular Monolith).
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAdapterImpl implements OrderAdapter {

    private final OrderRepository orderRepository;
    private final UpdateOrderStatusCommandHandler updateOrderStatusCommandHandler;

    @Override
    public OrderDto getOrderById(UUID orderId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        
        log.debug("Payment Module đang lấy Order {} từ Order Module", orderId);
        
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        return new OrderDto(
                order.getId(),
                order.getTenantId(),
                order.getBranchId(),
                order.getTableId(),
                order.getOrderNumber(),
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getItems().stream().map(item -> new OrderDto.OrderItemDto(
                        item.getItemId(),
                        item.getItemName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTotalPrice()
                )).collect(Collectors.toList())
        );
    }

    @Override
    public void completeOrder(UUID orderId, UUID tenantId, UUID branchId, UUID staffId) {
        log.info("Payment Module gọi sang Order Module để hoàn tất đơn hàng {}", orderId);

        // Kiểm tra trước để tránh nhảy vào CommandHandler rồi văng exception làm failed transaction
        orderRepository.findByIdAndTenantId(orderId, tenantId).ifPresent(order -> {
            String status = order.getStatus().name();
            if ("COMPLETED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) {
                log.info("Đơn hàng {} đã ở trạng thái {}, bỏ qua việc gọi chốt đơn lần nữa.", orderId, status);
                return;
            }

            // Gọi logic chuyển trạng thái chính thức nếu đơn chưa COMPLETED
            updateOrderStatusCommandHandler.handle(new UpdateOrderStatusCommand(
                orderId, tenantId, branchId, staffId, "COMPLETED", "Thanh toán thành công"
            ));
        });
    }
}
