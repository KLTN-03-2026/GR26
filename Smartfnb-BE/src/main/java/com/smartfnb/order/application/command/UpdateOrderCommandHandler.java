package com.smartfnb.order.application.command;

import com.smartfnb.order.domain.event.OrderUpdatedEvent;
import com.smartfnb.order.domain.exception.OrderNotFoundException;
import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.domain.model.OrderItem;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.infrastructure.external.MenuInventoryAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Xử lý lệnh cập nhật đơn hàng.
 * 
 * @author SmartF&B Team
 * @since 2026-04-11
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateOrderCommandHandler {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MenuInventoryAdapter inventoryAdapter;

    /**
     * Handle cập nhật đơn hàng.
     * 1. Tìm đơn hàng
     * 2. Map command items sang domain items
     * 3. Gọi domain logic update
     * 4. Lưu và bắn event
     */
    @Transactional
    public Order handle(UpdateOrderCommand command) {
        log.info("Bắt đầu cập nhật đơn hàng: {} bởi nhân viên: {}", command.orderId(), command.staffId());

        Order order = orderRepository.findByIdAndTenantIdAndBranchId(
                command.orderId(), command.tenantId(), command.branchId())
                .orElseThrow(() -> new OrderNotFoundException(command.orderId()));

        List<OrderItem> domainItems = command.items().stream()
                .map(item -> OrderItem.builder()
                        .id(item.id())
                        .itemId(item.itemId())
                        .itemName(item.itemName())
                        .quantity(item.quantity())
                        .unitPrice(item.unitPrice())
                        .addons(item.addons())
                        .notes(item.notes())
                        .build())
                .collect(Collectors.toList());

        // Kiểm tra tồn kho trước khi update (để tránh order món hết hàng hoặc bán lố tồn kho)
        inventoryAdapter.checkStock(command.branchId(), domainItems);

        order.update(command.tableId(), command.notes(), domainItems);

        Order savedOrder = orderRepository.save(order);

        // Phát domain event để các module khác cập nhật (thông báo bếp, báo cáo...)
        eventPublisher.publishEvent(new OrderUpdatedEvent(
                savedOrder.getId(),
                savedOrder.getTenantId(),
                savedOrder.getBranchId(),
                command.staffId(),
                savedOrder.getOrderNumber(),
                savedOrder.getTotalAmount(),
                Instant.now()
        ));

        log.info("Cập nhật đơn hàng {} thành công. Tổng tiền mới: {}", savedOrder.getOrderNumber(), savedOrder.getTotalAmount());
        return savedOrder;
    }
}
