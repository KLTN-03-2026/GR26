package com.smartfnb.order.domain.model;

import com.smartfnb.order.domain.exception.InvalidOrderStatusTransitionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Order Model Unit Tests")
class OrderTest {

    @Test
    @DisplayName("Tạo đơn hàng thành công, thuộc tính được gắn đúng")
    void shouldCreateOrderSuccessfully() {
        // Arrange
        UUID tenantId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();
        UUID tableId = UUID.randomUUID();
        
        OrderItem item = OrderItem.builder()
                .itemId(UUID.randomUUID())
                .itemName("Cafe Đá")
                .quantity(2)
                .unitPrice(new BigDecimal("25000"))
                .totalPrice(new BigDecimal("50000"))
                .build();
        
        // Act
        Order order = Order.create(
                tenantId, branchId, null, UUID.randomUUID(), 
                tableId, OrderSource.IN_STORE, List.of(item), "Khong da"
        );
        
        // Assert
        assertThat(order.getTenantId()).isEqualTo(tenantId);
        assertThat(order.getBranchId()).isEqualTo(branchId);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(order.getSubtotal()).isEqualByComparingTo("50000");
        assertThat(order.getTotalAmount()).isEqualByComparingTo("50000");
    }

    @Test
    @DisplayName("State Machine: PENDING -> PROCESSING hợp lệ")
    void shouldTransitionToProcessing() {
        Order order = createDummyOrder();
        
        assertThatCode(() -> order.process())
                .doesNotThrowAnyException();
                
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING);
    }
    
    @Test
    @DisplayName("State Machine: PENDING -> CANCELLED hợp lệ")
    void shouldCancelFromPending() {
        Order order = createDummyOrder();
        
        assertThatCode(() -> order.cancel())
                .doesNotThrowAnyException();
                
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("State Machine: Lỗi khi chuyển CANCELLED -> PROCESSING")
    void shouldThrowExceptionWhenProcessFromCancelled() {
        Order order = createDummyOrder();
        order.cancel();
        
        assertThatExceptionOfType(InvalidOrderStatusTransitionException.class)
                .isThrownBy(() -> order.process());
    }

    private Order createDummyOrder() {
        return Order.create(
                UUID.randomUUID(), UUID.randomUUID(), null, UUID.randomUUID(), 
                null, OrderSource.IN_STORE, List.of(), "test"
        );
    }
}
