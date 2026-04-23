package com.smartfnb.report.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Service helper để lấy thông tin branch + item từ các module khác.
 * Thực hiện lazy load data từ database để avoid N+1 query.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class ReportDataAccessor {
    
    /**
     * Lấy tên branch từ ID (placeholder).
     * TODO: Implement actual repository query.
     */
    public Optional<String> getBranchName(UUID branchId) {
        // TODO: Query từ branches table
        return Optional.of("Branch Name");
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
