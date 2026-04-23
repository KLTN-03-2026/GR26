package com.smartfnb.payment.application.query;

import com.smartfnb.payment.infrastructure.persistence.InvoiceJpaEntity;
import com.smartfnb.payment.infrastructure.persistence.InvoiceJpaRepository;
import com.smartfnb.payment.infrastructure.persistence.InvoiceSpecifications;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * QueryHandler tìm kiếm Invoice theo criteria.
 * Constraints: giới hạn 90 ngày, branchId của nhân viên hiện tại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchInvoiceQueryHandler {

    private final InvoiceJpaRepository invoiceRepository;

    public SearchInvoiceResult handle(SearchInvoiceQuery query) {
        log.info("Tìm kiếm Invoice: branchId={}, invoiceNumber={}, page={}, size={}",
            query.branchId(), query.invoiceNumber(), query.pageNumber(), query.pageSize());

        // 1. Validate tenant access
        // (CASHIER chỉ xem branch của mình; OWNER xem tất cả nên không cần filter)
        // Giả định query.branchId đã được validate ở controller

        // 2. Build Specification
        Specification<InvoiceJpaEntity> spec = InvoiceSpecifications.searchInvoices(
            query.branchId(), query.invoiceNumber());

        // 3. Create Pageable (sort by issuedAt DESC)
        Pageable pageable = PageRequest.of(
            query.pageNumber(), query.pageSize(),
            Sort.by(Sort.Direction.DESC, "issuedAt")
        );

        // 4. Query database
        Page<InvoiceJpaEntity> page = invoiceRepository.findAll(spec, pageable);

        // 5. Map to result
        List<SearchInvoiceResult.InvoiceSearchItem> items = page.getContent().stream()
            .map(entity -> new SearchInvoiceResult.InvoiceSearchItem(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getOrderId(),
                entity.getTotal(),
                entity.getIssuedAt()
            ))
            .toList();

        return new SearchInvoiceResult(
            items,
            (int) page.getTotalElements(),
            query.pageNumber(),
            query.pageSize(),
            page.getTotalPages()
        );
    }
}
