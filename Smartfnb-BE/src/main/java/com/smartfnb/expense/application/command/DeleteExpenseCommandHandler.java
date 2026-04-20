package com.smartfnb.expense.application.command;

import com.smartfnb.expense.domain.exception.ExpenseNotFoundException;
import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler cho lệnh xóa mềm/hủy hóa đơn chi.
 *
 * @author SmartF&B Team
 * @since 2026-04-17
 */
@Service
@RequiredArgsConstructor
public class DeleteExpenseCommandHandler {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public void handle(DeleteExpenseCommand command) {
        Expense expense = expenseRepository.findById(command.id())
            .orElseThrow(() -> new ExpenseNotFoundException(command.id()));

        if (!expense.getTenantId().equals(command.tenantId()) || !expense.getBranchId().equals(command.branchId())) {
            throw new SmartFnbException("ACCESS_DENIED", "Không có quyền xóa phiếu chi này", 403);
        }
        
        // Kiểm tra nếu đã bị xóa mềm trước đó - không thể xóa lại
        if (expense.isDeleted()) {
            throw new SmartFnbException("INVALID_STATE", "Phiếu chi đã xóa.", 400);
        }

        expense.markDeleted();
        expenseRepository.save(expense);
    }
}
