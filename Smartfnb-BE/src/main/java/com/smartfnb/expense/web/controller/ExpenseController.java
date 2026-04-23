package com.smartfnb.expense.web.controller;

import com.smartfnb.expense.application.command.*;
import com.smartfnb.expense.application.dto.ExpenseRequest;
import com.smartfnb.expense.application.dto.ExpenseResponse;
import com.smartfnb.expense.application.query.*;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shared.web.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller quản lý Hóa đơn chi (Expense Module).
 * Xử lý các API liên quan đến các phiếu chi tiêu (mua nguyên liệu, trả lương...).
 *
 * @author SmartF&B Team
 * @since 2026-04-17
 */
@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final CreateExpenseCommandHandler createHandler;
    private final UpdateExpenseCommandHandler updateHandler;
    private final DeleteExpenseCommandHandler deleteHandler;
    private final GetExpenseDetailQueryHandler getDetailHandler;
    private final SearchExpensesQueryHandler searchHandler;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'EXPENSE_MANAGE') or hasAnyRole('OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<UUID>> createExpense(@Valid @RequestBody ExpenseRequest request) {
        CreateExpenseCommand command = new CreateExpenseCommand(
            TenantContext.getCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            request.amount(),
            request.categoryName(),
            request.description(),
            request.expenseDate(),
            request.paymentMethod(),
            TenantContext.getCurrentUserId()
        );
        UUID expenseId = createHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(expenseId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EXPENSE_MANAGE') or hasAnyRole('OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updateExpense(
            @PathVariable UUID id, @Valid @RequestBody ExpenseRequest request) {
        UpdateExpenseCommand command = new UpdateExpenseCommand(
            id,
            TenantContext.getCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            request.amount(),
            request.categoryName(),
            request.description(),
            request.expenseDate(),
            request.paymentMethod()
        );
        updateHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EXPENSE_MANAGE') or hasAnyRole('OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable UUID id) {
        DeleteExpenseCommand command = new DeleteExpenseCommand(
            id,
            TenantContext.getCurrentTenantId(),
            TenantContext.getCurrentBranchId()
        );
        deleteHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EXPENSE_VIEW') or hasAnyRole('OWNER', 'BRANCH_MANAGER', 'CASHIER')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpense(@PathVariable UUID id) {
        ExpenseResponse response = getDetailHandler.handle(
            id, TenantContext.getCurrentTenantId(), TenantContext.getCurrentBranchId()
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'EXPENSE_VIEW') or hasAnyRole('OWNER', 'BRANCH_MANAGER', 'CASHIER')")
    public ResponseEntity<ApiResponse<PageResponse<ExpenseResponse>>> searchExpenses(
            @RequestParam(required = false) String categoryName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        SearchExpensesQuery query = new SearchExpensesQuery(
            TenantContext.getCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            categoryName, page, size
        );
        Page<ExpenseResponse> result = searchHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(result)));
    }
}
