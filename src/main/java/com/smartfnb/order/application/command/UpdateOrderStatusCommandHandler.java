package com.smartfnb.order.application.command;

import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.domain.exception.OrderNotFoundException;
import com.smartfnb.order.infrastructure.persistence.OrderStatusLogJpaEntity;
import com.smartfnb.order.infrastructure.persistence.OrderStatusLogJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateOrderStatusCommandHandler {

    private final OrderRepository orderRepository;
    private final OrderStatusLogJpaRepository statusLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Order handle(UpdateOrderStatusCommand command) {
        log.info("Cập nhật trạng thái đơn {} sang {}", command.orderId(), command.newStatus());

        Order order = orderRepository.findByIdAndTenantIdAndBranchId(command.orderId(), command.tenantId(), command.branchId())
            .orElseThrow(() -> new OrderNotFoundException(command.orderId()));

        String oldStatus = order.getStatus().name();

        if ("PROCESSING".equalsIgnoreCase(command.newStatus())) {
            order.process();
            // Lẽ ra cần pass staffId để emit OrderStatusChangedEvent, 
            // hiện tại mình viết logic chuyển trạng thái trong Order
        } else if ("COMPLETED".equalsIgnoreCase(command.newStatus())) {
            order.complete();
        } else {
            throw new IllegalArgumentException("Không hỗ trợ chuyển sang trạng thái: " + command.newStatus());
        }

        // Lưu Order (trigger optimistic lock check nếu version thay đổi)
        Order savedOrder = orderRepository.save(order);

        // Ghi log
        OrderStatusLogJpaEntity logEntity = new OrderStatusLogJpaEntity();
        logEntity.setOrderId(order.getId());
        logEntity.setOldStatus(oldStatus);
        logEntity.setNewStatus(order.getStatus().name());
        logEntity.setChangedByUserId(command.staffId());
        logEntity.setReason(command.reason());
        statusLogRepository.save(logEntity);

        // Phát các domain event từ Aggregate
        // Vì trong Order aggregate mình đã đăng ký domain event, nhưng không có Spring Data AbstractAggregateRoot
        // nên ta cần phát event tay ở đây hoặc dùng Reflection lấy ra từ list. 
        // Trong dự án thực tế, BaseAggregateRoot có public method `getDomainEvents()` và `clearDomainEvents()`.
        // Ở đây mình sẽ tự bắn event.
        
        eventPublisher.publishEvent(new com.smartfnb.order.domain.event.OrderStatusChangedEvent(
                savedOrder.getId(), savedOrder.getBranchId(), savedOrder.getOrderNumber(),
                oldStatus, savedOrder.getStatus().name(), command.staffId(), Instant.now()
        ));

        if ("COMPLETED".equalsIgnoreCase(command.newStatus())) {
             List<com.smartfnb.order.domain.event.OrderCompletedEvent.CompletedOrderItem> completedItems = 
                savedOrder.getItems().stream()
                .map(item -> new com.smartfnb.order.domain.event.OrderCompletedEvent.CompletedOrderItem(
                    item.getItemId(), item.getQuantity(), item.getUnitPrice()))
                .toList();
                
            eventPublisher.publishEvent(new com.smartfnb.order.domain.event.OrderCompletedEvent(
                savedOrder.getId(), savedOrder.getTenantId(), savedOrder.getBranchId(), command.staffId(),
                savedOrder.getOrderNumber(), completedItems, savedOrder.getTotalAmount(), Instant.now()
            ));
        }

        return savedOrder;
    }
}
