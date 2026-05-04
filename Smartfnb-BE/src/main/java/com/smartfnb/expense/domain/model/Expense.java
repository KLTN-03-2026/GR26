package com.smartfnb.expense.domain.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho Hóa đơn chi.
 * Quản lý các khoản chi tiêu vận hành của chi nhánh.
 *
 * @author vutq
 * @since 2026-04-17
 */
@Getter
@Setter(AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Expense {
    private UUID id;
    private UUID tenantId;
    private UUID branchId;
    private BigDecimal amount;
    private String categoryName;
    private String description;
    private Instant expenseDate;
    private String paymentMethod;
    private ExpenseStatus status;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean deleted;
    // author: Hoàng | date: 2026-04-30 | note: Liên kết phiếu chi với ca POS — null nếu không phải chi từ két POS.
    private UUID posSessionId;

    /**
     * author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId để liên kết phiếu chi tiền mặt với ca POS.
     *   Handler tự lookup active session và truyền vào, null nếu không có ca đang mở.
     */
    public static Expense create(
            UUID tenantId, UUID branchId, BigDecimal amount, String categoryName,
            String description, Instant expenseDate, String paymentMethod, UUID createdBy,
            UUID posSessionId) {

        Expense expense = new Expense();
        expense.id = UUID.randomUUID();
        expense.tenantId = tenantId;
        expense.branchId = branchId;
        expense.amount = amount;
        expense.categoryName = categoryName;
        expense.description = description;
        expense.expenseDate = expenseDate;
        expense.paymentMethod = paymentMethod;
        expense.status = ExpenseStatus.COMPLETED;
        expense.createdBy = createdBy;
        expense.createdAt = Instant.now();
        expense.updatedAt = Instant.now();
        expense.deleted = false;
        // author: Hoàng | date: 2026-04-30 | note: posSessionId null nếu paymentMethod != CASH hoặc không có ca POS đang mở.
        expense.posSessionId = posSessionId;

        return expense;
    }

    // author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId vào reconstruct để đồng bộ với schema V26.
    public static Expense reconstruct(
            UUID id, UUID tenantId, UUID branchId, BigDecimal amount,
            String categoryName, String description, Instant expenseDate,
            String paymentMethod, ExpenseStatus status, UUID createdBy,
            Instant createdAt, Instant updatedAt, boolean deleted, UUID posSessionId) {

        Expense expense = new Expense();
        expense.id = id;
        expense.tenantId = tenantId;
        expense.branchId = branchId;
        expense.amount = amount;
        expense.categoryName = categoryName;
        expense.description = description;
        expense.expenseDate = expenseDate;
        expense.paymentMethod = paymentMethod;
        expense.status = status;
        expense.createdBy = createdBy;
        expense.createdAt = createdAt;
        expense.updatedAt = updatedAt;
        expense.deleted = deleted;
        expense.posSessionId = posSessionId;
        return expense;
    }

    public void update(BigDecimal amount, String categoryName, String description, Instant expenseDate, String paymentMethod) {
        this.amount = amount;
        this.categoryName = categoryName;
        this.description = description;
        this.expenseDate = expenseDate;
        this.paymentMethod = paymentMethod;
        this.updatedAt = Instant.now();
    }

    public void markDeleted() {
        this.deleted = true;
        this.updatedAt = Instant.now();
    }
}
