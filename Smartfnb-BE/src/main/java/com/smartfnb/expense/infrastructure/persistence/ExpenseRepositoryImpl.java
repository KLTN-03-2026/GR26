package com.smartfnb.expense.infrastructure.persistence;

import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ExpenseRepositoryImpl implements ExpenseRepository {

    private final SpringDataExpenseRepository springDataRepository;

    @Override
    public Expense save(Expense expense) {
        ExpenseJpaEntity entity = toEntity(expense);
        ExpenseJpaEntity saved = springDataRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Expense> findById(UUID id) {
        return springDataRepository.findByIdAndDeletedFalse(id).map(this::toDomain);
    }

    private ExpenseJpaEntity toEntity(Expense expense) {
        ExpenseJpaEntity entity = new ExpenseJpaEntity();
        entity.setId(expense.getId());
        entity.setTenantId(expense.getTenantId());
        entity.setBranchId(expense.getBranchId());
        entity.setAmount(expense.getAmount());
        entity.setCategoryName(expense.getCategoryName());
        entity.setDescription(expense.getDescription());
        entity.setExpenseDate(expense.getExpenseDate());
        entity.setPaymentMethod(expense.getPaymentMethod());
        entity.setStatus(expense.getStatus());
        entity.setCreatedBy(expense.getCreatedBy());
        entity.setCreatedAt(expense.getCreatedAt());
        entity.setUpdatedAt(expense.getUpdatedAt());
        entity.setDeleted(expense.isDeleted());
        return entity;
    }

    private Expense toDomain(ExpenseJpaEntity entity) {
        return Expense.reconstruct(
            entity.getId(),
            entity.getTenantId(),
            entity.getBranchId(),
            entity.getAmount(),
            entity.getCategoryName(),
            entity.getDescription(),
            entity.getExpenseDate(),
            entity.getPaymentMethod(),
            entity.getStatus(),
            entity.getCreatedBy(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.isDeleted()
        );
    }
}
