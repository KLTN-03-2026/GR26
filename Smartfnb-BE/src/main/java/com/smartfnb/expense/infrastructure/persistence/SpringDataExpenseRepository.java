package com.smartfnb.expense.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataExpenseRepository extends JpaRepository<ExpenseJpaEntity, UUID> {
    
    Optional<ExpenseJpaEntity> findByIdAndDeletedFalse(UUID id);

    @Query("SELECT e FROM ExpenseJpaEntity e WHERE e.tenantId = :tenantId AND e.branchId = :branchId AND e.deleted = false " +
           "AND (:categoryName IS NULL OR LOWER(e.categoryName) LIKE LOWER(CONCAT('%', :categoryName, '%'))) " +
           "ORDER BY e.expenseDate DESC")
    Page<ExpenseJpaEntity> searchExpenses(UUID tenantId, UUID branchId, String categoryName, Pageable pageable);
}
