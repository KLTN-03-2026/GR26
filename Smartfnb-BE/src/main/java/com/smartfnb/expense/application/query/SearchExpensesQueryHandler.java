package com.smartfnb.expense.application.query;

import com.smartfnb.expense.application.dto.ExpenseResponse;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.expense.infrastructure.persistence.ExpenseJpaEntity;
import com.smartfnb.expense.infrastructure.persistence.SpringDataExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchExpensesQueryHandler {

    private final SpringDataExpenseRepository springDataRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> handle(SearchExpensesQuery query) {
        log.info("Searching expenses for tenant={}, branch={}, category={}", query.tenantId(), query.branchId(), query.categoryName());
        PageRequest pageRequest = PageRequest.of(query.page(), query.size());
        
        String categoryPattern = (query.categoryName() != null && !query.categoryName().isBlank()) 
            ? "%" + query.categoryName().toLowerCase() + "%" 
            : null;

        Page<ExpenseJpaEntity> pageResult = springDataRepository.searchExpenses(
            query.tenantId(), query.branchId(), categoryPattern, pageRequest
        );
        log.info("Found {} expenses", pageResult.getTotalElements());

        // Pre-fetch users to avoid N+1 query
        Set<UUID> userIds = pageResult.getContent().stream()
            .map(ExpenseJpaEntity::getCreatedBy)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        log.info("Pre-fetching {} users", userIds.size());
        
        Map<UUID, String> userNameMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(user -> {
                userNameMap.put(user.getId(), user.getFullName() != null ? user.getFullName() : "Unknown");
            });
        }
        log.info("Mapped {} users to names", userNameMap.size());

        return pageResult.map(entity -> {
            String createdByName = entity.getCreatedBy() != null ? 
                userNameMap.getOrDefault(entity.getCreatedBy(), "Unknown") : "Unknown";
            
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
        });
    }
}
