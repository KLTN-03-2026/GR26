package com.smartfnb.expense.infrastructure.persistence;

import com.smartfnb.expense.domain.model.ExpenseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@ToString(exclude = {"createdBy"})
@EqualsAndHashCode(of = "id")
public class ExpenseJpaEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(name = "category_name", nullable = false)
    private String categoryName;
    
    private String description;
    
    @Column(name = "expense_date", nullable = false)
    private Instant expenseDate;
    
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpenseStatus status;
    
    // author: Hoàng | date: 2026-04-30 | note: Liên kết phiếu chi tiền mặt với ca POS để trừ khỏi tiền kỳ vọng cuối ca.
    //   Rule: chỉ expense có posSessionId != null VÀ paymentMethod='CASH' mới được tính vào cashExpenses.
    @Column(name = "pos_session_id")
    private UUID posSessionId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @Column(nullable = false)
    private boolean deleted;
}
