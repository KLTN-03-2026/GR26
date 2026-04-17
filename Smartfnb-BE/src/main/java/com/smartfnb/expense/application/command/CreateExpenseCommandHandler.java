package com.smartfnb.expense.application.command;

import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateExpenseCommandHandler {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public UUID handle(CreateExpenseCommand command) {
        log.info("Creating new expense for branch {}: amount={}, category={}", 
            command.branchId(), command.amount(), command.categoryName());

        Expense expense = Expense.create(
            command.tenantId(),
            command.branchId(),
            command.amount(),
            command.categoryName(),
            command.description(),
            command.expenseDate(),
            command.paymentMethod(),
            command.createdBy()
        );

        Expense saved = expenseRepository.save(expense);
        return saved.getId();
    }
}
