package com.smartfnb.report.application.query.handler.financial;

import com.smartfnb.report.application.dto.financial.FinancialInvoiceDto;
import com.smartfnb.report.application.query.financial.GetFinancialInvoicesQuery;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class GetFinancialInvoicesQueryHandler {

    private final EntityManager entityManager;

    public Page<FinancialInvoiceDto> handle(GetFinancialInvoicesQuery query) {
        // Convert LocalDate (Asia/Ho_Chi_Minh or UTC) to boundaries. Usually default zone is safely UTC on servers.
        // But let's assume UTC to match DB timestamps generally.
        Instant startInstant = query.startDate().atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant endInstant = query.endDate().plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant();

        String baseQuery = """
            SELECT 
                id, 
                'INCOME' as type, 
                invoice_number as reference_code, 
                total_amount as amount, 
                created_at as transaction_date, 
                payment_method as payment_method, 
                CAST('' AS varchar) as description 
            FROM invoices 
            WHERE tenant_id = :tenantId 
              AND (CAST(:branchId AS uuid) IS NULL OR branch_id = CAST(:branchId AS uuid))
              AND created_at >= :startDate AND created_at < :endDate
            
            UNION ALL
            
            SELECT 
                id, 
                'EXPENSE' as type, 
                category_name as reference_code, 
                amount as amount, 
                expense_date as transaction_date, 
                payment_method as payment_method, 
                description as description 
            FROM expenses 
            WHERE deleted = false 
              AND tenant_id = :tenantId 
              AND (CAST(:branchId AS uuid) IS NULL OR branch_id = CAST(:branchId AS uuid))
              AND expense_date >= :startDate AND expense_date < :endDate
        """;

        String countSql = "SELECT COUNT(*) FROM (" + baseQuery + ") as unified_table";
        Query countNativeQuery = entityManager.createNativeQuery(countSql)
                .setParameter("tenantId", query.tenantId())
                .setParameter("branchId", query.branchId())
                .setParameter("startDate", startInstant)
                .setParameter("endDate", endInstant);

        long totalElements;
        Object countObj = countNativeQuery.getSingleResult();
        if (countObj instanceof Number n) {
            totalElements = n.longValue();
        } else {
            totalElements = Long.parseLong(countObj.toString());
        }

        String dataSql = baseQuery + " ORDER BY transaction_date DESC LIMIT :limit OFFSET :offset";
        Query dataNativeQuery = entityManager.createNativeQuery(dataSql)
                .setParameter("tenantId", query.tenantId())
                .setParameter("branchId", query.branchId())
                .setParameter("startDate", startInstant)
                .setParameter("endDate", endInstant)
                .setParameter("limit", query.pageSize())
                .setParameter("offset", query.page() * query.pageSize());

        @SuppressWarnings("unchecked")
        List<Object[]> rawList = dataNativeQuery.getResultList();
        List<FinancialInvoiceDto> resultList = new ArrayList<>();

        for (Object[] row : rawList) {
            UUID r_id = UUID.fromString(row[0].toString());
            String r_type = (row[1] != null) ? row[1].toString() : "";
            String r_ref = (row[2] != null) ? row[2].toString() : "";
            BigDecimal r_amount = (row[3] != null) ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
            
            Instant r_date = null;
            if (row[4] instanceof Timestamp ts) {
                r_date = ts.toInstant();
            } else if (row[4] != null) {
                // H2/PostgreSQL varying typings (Timestamp or Instant handling)
                r_date = Instant.parse(row[4].toString().replace(" ", "T") + (row[4].toString().contains("T") ? "" : "Z"));
            }
            
            String r_method = (row[5] != null) ? row[5].toString() : "";
            String r_desc = (row[6] != null) ? row[6].toString() : "";

            resultList.add(new FinancialInvoiceDto(
                r_id, r_type, r_ref, r_amount, r_date, r_method, r_desc
            ));
        }

        return new PageImpl<>(resultList, PageRequest.of(query.page(), query.pageSize()), totalElements);
    }
}
