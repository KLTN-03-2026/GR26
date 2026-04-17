package com.smartfnb.expense.domain.repository;

import com.smartfnb.expense.domain.model.Expense;

import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository {
    Expense save(Expense expense);
    Optional<Expense> findById(UUID id);
}
