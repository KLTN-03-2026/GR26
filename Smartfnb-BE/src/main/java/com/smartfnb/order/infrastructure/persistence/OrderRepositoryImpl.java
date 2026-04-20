package com.smartfnb.order.infrastructure.persistence;

import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.domain.model.OrderItem;
import com.smartfnb.order.domain.model.OrderItemStatus;
import com.smartfnb.order.domain.model.OrderSource;
import com.smartfnb.order.domain.model.OrderStatus;
import com.smartfnb.order.domain.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {

    private final OrderJpaRepository jpaRepository;

    @Override
    public Order save(Order order) {
        OrderJpaEntity entity = toEntity(order);
        OrderJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Order> findByIdAndTenantId(UUID id, UUID tenantId) {
        return jpaRepository.findByIdAndTenantId(id, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<Order> findByIdAndTenantIdAndBranchId(UUID id, UUID tenantId, UUID branchId) {
        return jpaRepository.findByIdAndTenantIdAndBranchId(id, tenantId, branchId).map(this::toDomain);
    }

    @Override
    public Page<Order> findByTenantIdAndBranchId(UUID tenantId, UUID branchId, Pageable pageable) {
        return jpaRepository.findByTenantIdAndBranchId(tenantId, branchId, pageable).map(this::toDomain);
    }

    private OrderJpaEntity toEntity(Order domain) {
        OrderJpaEntity entity = new OrderJpaEntity(domain.getTenantId());
        
        // BaseAggregateRoot reflection-like logic requires caution, but we just use set methods if available, 
        // however BaseAggregateRoot properties usually immutable on entity except by JPA.
        // We will just copy standard fields.
        try {
            if (domain.getVersion() != null) {
                java.lang.reflect.Field idField = com.smartfnb.shared.domain.BaseAggregateRoot.class.getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(entity, domain.getId());
            }
            
            java.lang.reflect.Field createdAtField = com.smartfnb.shared.domain.BaseAggregateRoot.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(entity, domain.getCreatedAt());
        } catch (Exception e) {}

        entity.setBranchId(domain.getBranchId());
        entity.setPosSessionId(domain.getPosSessionId());
        entity.setUserId(domain.getUserId());
        entity.setTableId(domain.getTableId());
        entity.setOrderNumber(domain.getOrderNumber());
        entity.setSource(domain.getSource() != null ? domain.getSource().name() : null);
        entity.setStatus(domain.getStatus() != null ? domain.getStatus().name() : null);
        entity.setSubtotal(domain.getSubtotal());
        entity.setDiscountAmount(domain.getDiscountAmount());
        entity.setTaxAmount(domain.getTaxAmount());
        entity.setTotalAmount(domain.getTotalAmount());
        entity.setNotes(domain.getNotes());
        entity.setCompletedAt(domain.getCompletedAt());
        entity.setVersion(domain.getVersion());

        // map items
        if (domain.getItems() != null) {
            List<OrderItemJpaEntity> itemEntities = domain.getItems().stream().map(item -> {
                OrderItemJpaEntity i = new OrderItemJpaEntity();
                i.setId(item.getId());
                i.setOrder(entity);
                i.setItemId(item.getItemId());
                i.setItemName(item.getItemName());
                i.setQuantity(item.getQuantity());
                i.setUnitPrice(item.getUnitPrice());
                i.setTotalPrice(item.getTotalPrice());
                i.setAddons(item.getAddons());
                i.setNotes(item.getNotes());
                i.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
                return i;
            }).collect(Collectors.toList());
            entity.setItems(itemEntities);
        }

        return entity;
    }

    private Order toDomain(OrderJpaEntity entity) {
        List<OrderItem> items = entity.getItems().stream().map(i -> OrderItem.builder()
                .id(i.getId())
                .itemId(i.getItemId())
                .itemName(i.getItemName())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .totalPrice(i.getTotalPrice())
                .addons(i.getAddons())
                .notes(i.getNotes())
                .status(i.getStatus() != null ? OrderItemStatus.valueOf(i.getStatus()) : null)
                .build()
        ).collect(Collectors.toList());

        Order domain = Order.reconstruct(
                entity.getId(),
                entity.getTenantId(),
                entity.getBranchId(),
                entity.getPosSessionId(),
                entity.getUserId(),
                entity.getTableId(),
                entity.getOrderNumber(),
                entity.getSource() != null ? OrderSource.valueOf(entity.getSource()) : null,
                entity.getStatus() != null ? OrderStatus.valueOf(entity.getStatus()) : null,
                entity.getSubtotal(),
                entity.getDiscountAmount(),
                entity.getTaxAmount(),
                entity.getTotalAmount(),
                entity.getNotes(),
                entity.getCompletedAt(),
                entity.getCreatedAt(),
                entity.getVersion(),
                items
        );
        return domain;
    }
}
