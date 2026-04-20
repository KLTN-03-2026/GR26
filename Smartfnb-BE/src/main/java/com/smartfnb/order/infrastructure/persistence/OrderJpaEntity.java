package com.smartfnb.order.infrastructure.persistence;

import com.smartfnb.shared.domain.BaseAggregateRoot;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders", uniqueConstraints = {
    @UniqueConstraint(name = "uq_order_number_branch", columnNames = {"branch_id", "order_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderJpaEntity extends BaseAggregateRoot {
    
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "pos_session_id")
    private UUID posSessionId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "table_id")
    private UUID tableId;

    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @Column(name = "source", length = 20)
    private String source;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "tax_amount")
    private BigDecimal taxAmount;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Version
    @Column(name = "version")
    private Long version;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemJpaEntity> items = new ArrayList<>();

    public OrderJpaEntity(UUID tenantId) {
        super(tenantId);
    }
}
