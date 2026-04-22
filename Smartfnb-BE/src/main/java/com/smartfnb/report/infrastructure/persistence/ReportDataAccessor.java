package com.smartfnb.report.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Service helper để lấy thông tin branch + item từ các module khác.
 * Thực hiện lazy load data từ database để avoid N+1 query.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class ReportDataAccessor {
    
    private final com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository branchRepository;

    /**
     * Lấy tên branch từ ID (placeholder).
     */
    public Optional<String> getBranchName(UUID branchId) {
        return branchRepository.findById(branchId).map(b -> b.getName());
    }
    
    /**
     * Lấy tên item từ ID.
     * TODO: Implement actual repository query.
     */
    public Optional<String> getItemName(UUID itemId) {
        // TODO: Query từ items table
        return Optional.of("Item Name");
    }
}
