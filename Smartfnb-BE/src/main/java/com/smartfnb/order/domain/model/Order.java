package com.smartfnb.order.domain.model;

import com.smartfnb.order.domain.exception.InvalidOrderStatusTransitionException;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho Đơn hàng.
 * Chứa logic trạng thái đơn hàng.
 *
 * @author SmartF&B Team
 * @since 2026-03-30
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {
    private UUID id;
    private UUID tenantId;
    private UUID branchId;
    private UUID posSessionId;
    private UUID userId;
    private UUID tableId;
    
    private String orderNumber;
    private OrderSource source;
    private OrderStatus status;
    
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    
    private String notes;
    private Instant completedAt;
    private LocalDateTime createdAt;
    
    private Long version;
    private List<OrderItem> items = new ArrayList<>();

    // Private constructor cho create
    private Order(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Tạo đơn hàng mới.
     * Tự generate orderNumber theo chi nhánh và định dạng thời gian.
     */
    public static Order create(
            UUID tenantId, UUID branchId, UUID posSessionId, UUID userId,
            UUID tableId, OrderSource source, List<OrderItem> items, String notes) {
        
        Order order = new Order(tenantId);
        order.id = UUID.randomUUID();
        order.branchId = branchId;
        order.posSessionId = posSessionId;
        order.userId = userId;
        order.tableId = tableId;
        order.source = source != null ? source : OrderSource.IN_STORE;
        order.status = OrderStatus.PENDING;
        order.notes = notes;
        
        // Tạo order number format: BranchSuffix-YYYYMMDD-HHmmss
        String timeSuffix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        String branchSuffix = branchId != null ? branchId.toString().substring(0, 4).toUpperCase() : "0000";
        order.orderNumber = "ORD-" + branchSuffix + "-" + timeSuffix;
        
        order.items = items;
        if (order.items != null) {
            order.items.forEach(OrderItem::init);
        }
        
        order.calculateTotals();
        return order;
    }

    private void calculateTotals() {
        this.subtotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.discountAmount = BigDecimal.ZERO;
        this.taxAmount = BigDecimal.ZERO;
        this.totalAmount = this.subtotal.subtract(this.discountAmount).add(this.taxAmount);
    }

    public void process() {
        if (this.status != OrderStatus.PENDING) {
            throw new InvalidOrderStatusTransitionException(this.status, OrderStatus.PROCESSING);
        }
        this.status = OrderStatus.PROCESSING;
    }

    public void complete() {
        if (this.status != OrderStatus.PROCESSING && this.status != OrderStatus.PENDING) {
            throw new InvalidOrderStatusTransitionException(this.status, OrderStatus.COMPLETED);
        }
        this.status = OrderStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void cancel() {
        if (this.status == OrderStatus.COMPLETED || this.status == OrderStatus.CANCELLED) {
            throw new InvalidOrderStatusTransitionException(this.status, OrderStatus.CANCELLED);
        }
        this.status = OrderStatus.CANCELLED;
        // Các items cũng bị cancel
        if (this.items != null) {
            this.items.forEach(item -> item.updateStatus(OrderItemStatus.CANCELLED));
        }
    }

    // Builder methods for reconstituting from Repository/Entity
    public static Order reconstruct(
            UUID id, UUID tenantId, UUID branchId, UUID posSessionId, UUID userId, UUID tableId,
            String orderNumber, OrderSource source, OrderStatus status, BigDecimal subtotal,
            BigDecimal discountAmount, BigDecimal taxAmount, BigDecimal totalAmount, String notes,
            Instant completedAt, LocalDateTime createdAt, Long version, List<OrderItem> items) {
        
        Order order = new Order(tenantId);
        order.id = id;
        order.branchId = branchId;
        order.posSessionId = posSessionId;
        order.userId = userId;
        order.tableId = tableId;
        order.orderNumber = orderNumber;
        order.source = source;
        order.status = status;
        order.subtotal = subtotal;
        order.discountAmount = discountAmount;
        order.taxAmount = taxAmount;
        order.totalAmount = totalAmount;
        order.notes = notes;
        order.completedAt = completedAt;
        order.createdAt = createdAt;
        order.version = version;
        order.items = items != null ? items : new ArrayList<>();
        return order;
    }
}
