package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.order.domain.exception.OrderNotFoundException;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.domain.model.Order;
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
}
