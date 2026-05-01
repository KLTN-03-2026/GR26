package com.smartfnb.expense.infrastructure.persistence;

import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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

    // author: Hoàng | date: 2026-04-30 | note: Tổng chi tiền mặt từ két POS trong ca — dùng để tính endingCashExpected.
    @Override
    public BigDecimal sumCashExpensesByPosSessionId(UUID posSessionId) {
        BigDecimal result = springDataRepository.sumCashExpensesByPosSessionId(posSessionId);
        return result != null ? result : BigDecimal.ZERO;
    }

    // author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId vào mapper để lưu liên kết ca POS.
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
        entity.setPosSessionId(expense.getPosSessionId());
        return entity;
    }

    // author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId vào reconstruct để đồng bộ schema V26.
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
            entity.isDeleted(),
            entity.getPosSessionId()
        );
    }
}
