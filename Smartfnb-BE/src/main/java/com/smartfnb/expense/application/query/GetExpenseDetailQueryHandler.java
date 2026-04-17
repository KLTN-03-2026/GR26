package com.smartfnb.expense.application.query;

import com.smartfnb.expense.application.dto.ExpenseResponse;
import com.smartfnb.expense.domain.exception.ExpenseNotFoundException;
import com.smartfnb.expense.infrastructure.persistence.ExpenseJpaEntity;
import com.smartfnb.expense.infrastructure.persistence.SpringDataExpenseRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetExpenseDetailQueryHandler {

    private final SpringDataExpenseRepository springDataRepository;

    @Transactional(readOnly = true)
    public ExpenseResponse handle(UUID id, UUID tenantId, UUID branchId) {
        ExpenseJpaEntity entity = springDataRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new ExpenseNotFoundException(id));

        if (!entity.getTenantId().equals(tenantId) || !entity.getBranchId().equals(branchId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Không có quyền xem phiếu chi này", 403);
        }

        return new ExpenseResponse(
            entity.getId(),
            entity.getAmount(),
            entity.getCategoryName(),
            entity.getDescription(),
            entity.getExpenseDate(),
            entity.getPaymentMethod(),
            entity.getStatus().name(),
            entity.getCreatedBy(),
            entity.getCreatedAt()
        );
    }
}
