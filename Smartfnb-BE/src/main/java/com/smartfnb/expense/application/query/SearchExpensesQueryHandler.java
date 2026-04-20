package com.smartfnb.expense.application.query;

import com.smartfnb.expense.application.dto.ExpenseResponse;
import com.smartfnb.expense.infrastructure.persistence.ExpenseJpaEntity;
import com.smartfnb.expense.infrastructure.persistence.SpringDataExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchExpensesQueryHandler {

    private final SpringDataExpenseRepository springDataRepository;

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> handle(SearchExpensesQuery query) {
        PageRequest pageRequest = PageRequest.of(query.page(), query.size());
        
        Page<ExpenseJpaEntity> pageResult = springDataRepository.searchExpenses(
            query.tenantId(), query.branchId(), query.categoryName(), pageRequest
        );

        return pageResult.map(entity -> new ExpenseResponse(
            entity.getId(),
            entity.getAmount(),
            entity.getCategoryName(),
            entity.getDescription(),
            entity.getExpenseDate(),
            entity.getPaymentMethod(),
            entity.getStatus().name(),
            entity.getCreatedBy(),
            entity.getCreatedAt()
        ));
    }
}
