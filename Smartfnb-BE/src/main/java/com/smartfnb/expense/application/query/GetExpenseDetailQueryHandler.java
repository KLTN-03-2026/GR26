package com.smartfnb.expense.application.query;

import com.smartfnb.expense.application.dto.ExpenseResponse;
import com.smartfnb.expense.domain.exception.ExpenseNotFoundException;
import com.smartfnb.expense.infrastructure.persistence.ExpenseJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
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
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ExpenseResponse handle(UUID id, UUID tenantId, UUID branchId) {
        ExpenseJpaEntity entity = springDataRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new ExpenseNotFoundException(id));

        if (!entity.getTenantId().equals(tenantId) || !entity.getBranchId().equals(branchId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Không có quyền xem phiếu chi này", 403);
        }

        String createdByName = "Unknown";
        if (entity.getCreatedBy() != null) {
            createdByName = userRepository.findById(entity.getCreatedBy())
                .map(u -> u.getFullName())
                .orElse("Unknown");
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
            createdByName,
            entity.getCreatedAt()
        );
    }
}
