package com.smartfnb.report.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pagination info for paginated API responses
 * 
 * Used by:
 * - Inventory movement report
 * - Inventory COGS report
 * - HR violations report
 * - HR checkin history report
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginationInfo {
    
    private int page;                      // 0-indexed (page 0 = first page)
    private int pageSize;                  // Items per page
    private long total;                    // Total items count
    private int totalPages;                // Total number of pages
    private boolean hasNext;               // true if there are more pages
    private boolean hasPrevious;           // true if not first page
    
    /**
     * Factory method to create pagination info from Spring Data Page object
     */
    public static <T> PaginationInfo from(org.springframework.data.domain.Page<T> page) {
        return PaginationInfo.builder()
                .page(page.getNumber())
                .pageSize(page.getSize())
                .total(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
