package com.smartfnb.order.application.command;

import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.domain.model.OrderSource;
import com.smartfnb.order.domain.model.OrderStatus;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.domain.exception.TableNotAvailableException;
import com.smartfnb.order.domain.exception.TableNotFoundException;
import com.smartfnb.order.infrastructure.persistence.TableJpaEntity;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
import com.smartfnb.order.infrastructure.external.MenuInventoryAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Place Order Command Handler Unit Tests")
class PlaceOrderCommandHandlerTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TableJpaRepository tableRepository;

    @Mock
    private MenuInventoryAdapter inventoryAdapter;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PlaceOrderCommandHandler handler;

    private UUID tenantId;
    private UUID branchId;
    private UUID tableId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        branchId = UUID.randomUUID();
        tableId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Happy Case: Đặt đơn tại bàn thành công")
    void shouldPlaceOrderSuccessfullyWhenTableIsAvailable() {
        // Arrange
        PlaceOrderCommand.OrderItemCommand itemCmd = new PlaceOrderCommand.OrderItemCommand(
                UUID.randomUUID(), "Ca phe", 1, new BigDecimal("20000"), null, null
        );
        PlaceOrderCommand command = new PlaceOrderCommand(
                tenantId, branchId, null, UUID.randomUUID(), tableId, OrderSource.IN_STORE, "Nhanh", List.of(itemCmd)
        );

        TableJpaEntity table = new TableJpaEntity();
        table.setId(tableId);
        table.setStatus("AVAILABLE");

        when(tableRepository.findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)).thenReturn(Optional.of(table));
        
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            return o; // Simulate save
        });

        // Act
        Order savedOrder = handler.handle(command);

        // Assert
        assertThat(savedOrder).isNotNull();
        assertThat(savedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(table.getStatus()).isEqualTo("OCCUPIED");
        
        verify(tableRepository).save(table);
        verify(inventoryAdapter).checkStock(eq(branchId), any());
        verify(orderRepository).save(any(Order.class));
        verify(eventPublisher).publishEvent(any(com.smartfnb.order.domain.event.OrderCreatedEvent.class));
    }

    @Test
    @DisplayName("Exception Case: Khi bàn đang có khách (OCCUPIED)")
    void shouldThrowExceptionWhenTableNotAvailable() {
        // Arrange
        PlaceOrderCommand command = new PlaceOrderCommand(
                tenantId, branchId, null, UUID.randomUUID(), tableId, OrderSource.IN_STORE, "Nhanh", List.of()
        );

        TableJpaEntity table = new TableJpaEntity();
        table.setId(tableId);
        table.setStatus("OCCUPIED"); // Bàn đang bận

        when(tableRepository.findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)).thenReturn(Optional.of(table));

        // Act & Assert
        assertThatExceptionOfType(TableNotAvailableException.class)
                .isThrownBy(() -> handler.handle(command))
                .withMessageContaining("hiện không trống");
                
        verify(inventoryAdapter, never()).checkStock(any(), any());
        verify(orderRepository, never()).save(any());
    }
}
