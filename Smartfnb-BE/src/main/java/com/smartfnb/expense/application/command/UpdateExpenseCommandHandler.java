package com.smartfnb.expense.application.command;

import com.smartfnb.expense.domain.exception.ExpenseNotFoundException;
import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler cho lệnh cập nhật hóa đơn chi.
 *
 * @author SmartF&B Team
 * @since 2026-04-17
 */
@Service
@RequiredArgsConstructor
public class UpdateExpenseCommandHandler {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public void handle(UpdateExpenseCommand command) {
        Expense expense = expenseRepository.findById(command.id())
            .orElseThrow(() -> new ExpenseNotFoundException(command.id()));

        if (!expense.getTenantId().equals(command.tenantId()) || !expense.getBranchId().equals(command.branchId())) {
            throw new SmartFnbException("ACCESS_DENIED", "Không có quyền sửa phiếu chi này", 403);
        }

        if (expense.isDeleted()) {
            throw new SmartFnbException("INVALID_STATE", "Không thể sửa phiếu chi đã bị xóa.", 400);
        }

        expense.update(
            command.amount(),
            command.categoryName(),
            command.description(),
            command.expenseDate(),
            command.paymentMethod()
        );

        expenseRepository.save(expense);
    }
}
