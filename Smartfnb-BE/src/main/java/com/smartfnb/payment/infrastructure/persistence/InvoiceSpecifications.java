package com.smartfnb.payment.infrastructure.persistence;

import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

/**
 * Specification để dynamic query Invoice với các điều kiện.
 * Bao gồm: date range (90 ngày), branchId, invoiceNumber.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public class InvoiceSpecifications {

    /**
     * Tất cả Invoice thuộc chi nhánh.
     */
    public static Specification<InvoiceJpaEntity> forBranch(UUID branchId) {
        return (root, query, cb) -> cb.equal(root.get("branchId"), branchId);
    }

    /**
     * Invoice trong 90 ngày gần nhất.
     */
    public static Specification<InvoiceJpaEntity> within90Days() {
        return (root, query, cb) -> {
            Instant ninetyDaysAgo = LocalDate.now()
                .minusDays(90)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();
            return cb.greaterThanOrEqualTo(root.get("issuedAt"), ninetyDaysAgo);
        };
    }

    /**
     * Search theo invoice number (contains, không phân biệt hoa thường).
     */
    public static Specification<InvoiceJpaEntity> invoiceNumberContains(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("invoiceNumber")),
            "%" + keyword.toLowerCase() + "%"
        );
    }

    /**
     * Combine: forBranch + within90Days + optional search keyword.
     */
    public static Specification<InvoiceJpaEntity> searchInvoices(UUID branchId, String keyword) {
        Specification<InvoiceJpaEntity> spec = forBranch(branchId).and(within90Days());

        if (keyword != null && !keyword.isBlank()) {
            Specification<InvoiceJpaEntity> keywordSpec = invoiceNumberContains(keyword);
            if (keywordSpec != null) {
                spec = spec.and(keywordSpec);
            }
        }

        return spec;
    }
}

