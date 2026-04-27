package com.smartfnb.report.infrastructure.repository;

import com.smartfnb.report.application.dto.inventory.*;
import com.smartfnb.report.domain.repository.InventoryReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ✅ FIXED: Inventory Report Repository Implementation
 * Adjusted to handle TIMESTAMP to LocalDate conversion safely and fix column references.
 * Fully aligned with InventoryReportRepository interface and DTO structures.
 */
@Repository
public class InventoryReportRepositoryImpl implements InventoryReportRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public InventoryReportRepositoryImpl(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return new BigDecimal(n.toString());
        return BigDecimal.ZERO;
    }

    private LocalDate toLocalDate(Object val) {
        if (val == null) return null;
        if (val instanceof java.sql.Date d) return d.toLocalDate();
        if (val instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        if (val instanceof LocalDate ld) return ld;
        return null;
    }

    @Override
    public List<InventoryStockDto> findStockByBranch(UUID branchId, UUID tenantId) {
        
        String sql = """
                SELECT
                    i.id as itemId,
                    i.name as itemName,
                    i.unit as unit,
                    COALESCE(ib_bal.quantity, 0) as currentQuantity,
                    COALESCE(ib_bal.min_level, 0) as minLevel,
                    COALESCE((
                        SELECT SUM(sb.quantity_remaining * sb.cost_per_unit)
                        FROM stock_batches sb
                        WHERE sb.item_id = i.id
                          AND sb.branch_id = :branchId
                          AND sb.tenant_id = :tenantId
                    ), 0) as currentValue,
                    (
                        SELECT sb.expires_at
                        FROM stock_batches sb
                        WHERE sb.item_id = i.id
                          AND sb.branch_id = :branchId
                          AND sb.tenant_id = :tenantId
                          AND sb.expires_at IS NOT NULL
                          AND sb.quantity_remaining > 0
                        ORDER BY sb.expires_at ASC
                        LIMIT 1
                    ) as nearestExpiryDate,
                    CASE
                        WHEN COALESCE(ib_bal.quantity, 0) = 0 THEN 'OUT_OF_STOCK'
                        WHEN COALESCE(ib_bal.quantity, 0) <= COALESCE(ib_bal.min_level, 0) THEN 'LOW'
                        ELSE 'ENOUGH'
                    END as stockStatus,
                    b.id as branchId,
                    b.name as branchName
                FROM items i
                LEFT JOIN inventory_balances ib_bal ON i.id = ib_bal.item_id
                    AND ib_bal.branch_id = :branchId
                    AND ib_bal.tenant_id = :tenantId
                LEFT JOIN branches b ON b.id = :branchId
                WHERE i.tenant_id = :tenantId
                  AND i.type IN ('INGREDIENT', 'SUB_ASSEMBLY')
                  AND i.deleted_at IS NULL
                ORDER BY i.name, i.id
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
                BigDecimal currentValue = toBigDecimal(rs.getObject("currentValue"));
                BigDecimal currentQty = toBigDecimal(rs.getObject("currentQuantity"));
                BigDecimal minLevel = toBigDecimal(rs.getObject("minLevel"));
                BigDecimal unitCost = BigDecimal.ZERO;
                if (currentQty.compareTo(BigDecimal.ZERO) > 0) {
                    unitCost = currentValue.divide(currentQty, 4, java.math.RoundingMode.HALF_UP);
                }
                
                return InventoryStockDto.builder()
                        .itemId(UUID.fromString(rs.getString("itemId")))
                        .itemName(rs.getString("itemName"))
                        .unit(rs.getString("unit"))
                        .currentQty(currentQty.intValue())
                        .minLevel(minLevel.intValue())
                        .unitCost(unitCost)
                        .totalValue(currentValue)
                        .nearestExpiryDate(toLocalDate(rs.getObject("nearestExpiryDate")))
                        .status(rs.getString("stockStatus"))
                        .branchId(rs.getString("branchId") != null ? UUID.fromString(rs.getString("branchId")) : branchId)
                        .branchName(rs.getString("branchName"))
                        .build();
        });
    }

    @Override
    public List<ExpiringItemsDto> findExpiringItems(UUID branchId, UUID tenantId, int daysThreshold) {
        LocalDate thresholdDate = LocalDate.now().plusDays(daysThreshold);

        String sql = """
                SELECT
                    i.id as itemId,
                    i.name as itemName,
                    i.unit as unit,
                    sb.id as batchId,
                    sb.cost_per_unit as unitCost,
                    sb.quantity_remaining as quantityRemaining,
                    sb.expires_at as expiryDate,
                    EXTRACT(DAY FROM (sb.expires_at - CURRENT_TIMESTAMP))::INTEGER as daysToExpire,
                    b.id as branchId,
                    b.name as branchName
                FROM stock_batches sb
                JOIN items i ON sb.item_id = i.id
                JOIN branches b ON sb.branch_id = b.id
                WHERE sb.branch_id = :branchId
                  AND sb.tenant_id = :tenantId
                  AND sb.quantity_remaining > 0
                  AND sb.expires_at <= :thresholdDate
                ORDER BY sb.expires_at ASC, sb.id
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("thresholdDate", thresholdDate);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                ExpiringItemsDto.builder()
                        .itemId(UUID.fromString(rs.getString("itemId")))
                        .itemName(rs.getString("itemName"))
                        .unit(rs.getString("unit"))
                        .batchId(rs.getString("batchId") != null ? UUID.fromString(rs.getString("batchId")) : null)
                        .unitCost(toBigDecimal(rs.getObject("unitCost")))
                        .quantityRemaining(toBigDecimal(rs.getObject("quantityRemaining")).intValue())
                        .expiryDate(toLocalDate(rs.getObject("expiryDate")))
                        .daysToExpire(rs.getInt("daysToExpire"))
                        .urgency(rs.getInt("daysToExpire") <= 3 ? "CRITICAL" : "WARNING")
                        .branchId(rs.getString("branchId") != null ? UUID.fromString(rs.getString("branchId")) : branchId)
                        .branchName(rs.getString("branchName"))
                        .build()
        );
    }

    @Override
    public Page<InventoryMovementDto> findInventoryMovement(UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate, String groupBy, Pageable pageable) {
        String countSql = """
                SELECT COUNT(*)
                FROM items i
                WHERE i.tenant_id = :tenantId
                  AND i.type IN ('INGREDIENT', 'SUB_ASSEMBLY')
                  AND i.deleted_at IS NULL
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("limit", pageable.getPageSize());
        params.put("offset", pageable.getOffset());

        long total = jdbcTemplate.queryForObject(countSql, params, Long.class);

        String sql = """
                WITH movement_summary AS (
                    SELECT
                        item_id,
                        COALESCE(SUM(CASE WHEN type = 'IMPORT' THEN quantity ELSE 0 END), 0) as imports,
                        COALESCE(SUM(CASE WHEN type IN ('SALE_DEDUCT', 'WASTE') THEN ABS(quantity) ELSE 0 END), 0) as exports
                    FROM inventory_transactions
                    WHERE branch_id = :branchId
                      AND tenant_id = :tenantId
                      AND created_at >= :startDate
                      AND created_at < :endDate + INTERVAL '1 day'
                    GROUP BY item_id
                ),
                stock_at_start AS (
                    SELECT
                        item_id,
                        COALESCE(SUM(quantity), 0) as beginning_balance
                    FROM inventory_balances
                    WHERE branch_id = :branchId
                      AND tenant_id = :tenantId
                    GROUP BY item_id
                )
                SELECT
                    i.id as itemId,
                    i.name as itemName,
                    i.unit as unit,
                    COALESCE(s.beginning_balance, 0)::INTEGER as beginningBalance,
                    COALESCE(m.imports, 0)::INTEGER as importQty,
                    COALESCE(m.exports, 0)::INTEGER as exportQty,
                    (COALESCE(s.beginning_balance, 0) + COALESCE(m.imports, 0) - COALESCE(m.exports, 0))::INTEGER as endingBalance,
                    COALESCE(ib.quantity * (
                        SELECT AVG(sb.cost_per_unit)
                        FROM stock_batches sb
                        WHERE sb.item_id = i.id AND sb.branch_id = :branchId
                    ), 0) as endingValue,
                    CASE
                        WHEN COALESCE(m.exports, 0) > 0 THEN 'STABLE'
                        ELSE 'NO_MOVEMENT'
                    END as varianceStatus,
                    TO_CHAR(:startDate, 'YYYY-MM') as month
                FROM items i
                LEFT JOIN movement_summary m ON i.id = m.item_id
                LEFT JOIN stock_at_start s ON i.id = s.item_id
                LEFT JOIN inventory_balances ib ON i.id = ib.item_id AND ib.branch_id = :branchId
                WHERE i.tenant_id = :tenantId
                  AND i.type IN ('INGREDIENT', 'SUB_ASSEMBLY')
                  AND i.deleted_at IS NULL
                ORDER BY i.name
                LIMIT :limit OFFSET :offset
                """;

        params.put("startDate", startDate);
        params.put("endDate", endDate);

        List<InventoryMovementDto> content = jdbcTemplate.query(sql, params, (rs, rowNum) ->
                InventoryMovementDto.builder()
                        .itemId(UUID.fromString(rs.getString("itemId")))
                        .itemName(rs.getString("itemName"))
                        .unit(rs.getString("unit"))
                        .beginningBalance(toBigDecimal(rs.getObject("beginningBalance")).intValue())
                        .importQty(toBigDecimal(rs.getObject("importQty")).intValue())
                        .exportQty(toBigDecimal(rs.getObject("exportQty")).intValue())
                        .endingBalance(toBigDecimal(rs.getObject("endingBalance")).intValue())
                        .endingValue(toBigDecimal(rs.getObject("endingValue")))
                        .varianceStatus(rs.getString("varianceStatus"))
                        .month(rs.getString("month"))
                        .build()
        );

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public List<WasteReportDto> findWasteReport(UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate) {
        String sql = """
                SELECT
                    i.id as itemId,
                    i.name as itemName,
                    i.unit as unit,
                    COALESCE(SUM(ABS(it.quantity)), 0) as wasteQty,
                    COALESCE(SUM(ABS(it.quantity) * it.cost_per_unit), 0) as wasteValue,
                    'WASTE' as reason
                FROM inventory_transactions it
                JOIN items i ON it.item_id = i.id
                WHERE it.branch_id = :branchId
                  AND it.tenant_id = :tenantId
                  AND it.type = 'WASTE'
                  AND it.created_at >= :startDate
                  AND it.created_at < :endDate + INTERVAL '1 day'
                GROUP BY i.id, i.name, i.unit
                ORDER BY wasteValue DESC
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("startDate", startDate);
        params.put("endDate", endDate);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                WasteReportDto.builder()
                        .itemId(UUID.fromString(rs.getString("itemId")))
                        .itemName(rs.getString("itemName"))
                        .unit(rs.getString("unit"))
                        .totalWasteQty(toBigDecimal(rs.getObject("wasteQty")).intValue())
                        .totalWasteCost(toBigDecimal(rs.getObject("wasteValue")))
                        .primaryReason(rs.getString("reason"))
                        .build()
        );
    }

    @Override
    public Page<CogsDto> findCogs(UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String countSql = """
                SELECT COUNT(*)
                FROM inventory_transactions
                WHERE branch_id = :branchId
                  AND tenant_id = :tenantId
                  AND type = 'SALE_DEDUCT'
                  AND created_at >= :startDate
                  AND created_at < :endDate + INTERVAL '1 day'
                """;

        String sql = """
                SELECT
                    it.reference_id as orderId,
                    it.item_id as itemId,
                    i.name as itemName,
                    i.unit as unit,
                    ABS(it.quantity) as quantity,
                    it.cost_per_unit as unitCost,
                    (ABS(it.quantity) * COALESCE(it.cost_per_unit, 0)) as totalCost,
                    it.created_at as soldAt,
                    it.type as transactionType,
                    it.note as notes,
                    it.batch_id as batchId,
                    sb.imported_at as batchImportedAt,
                    it.branch_id as branchId,
                    b.name as branchName
                FROM inventory_transactions it
                JOIN items i ON it.item_id = i.id
                LEFT JOIN stock_batches sb ON it.batch_id = sb.id AND sb.tenant_id = it.tenant_id
                LEFT JOIN branches b ON it.branch_id = b.id
                WHERE it.branch_id = :branchId
                  AND it.tenant_id = :tenantId
                  AND it.type = 'SALE_DEDUCT'
                  AND it.created_at >= :startDate
                  AND it.created_at < :endDate + INTERVAL '1 day'
                ORDER BY it.created_at DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("limit", pageable.getPageSize());
        params.put("offset", pageable.getOffset());

        long total = jdbcTemplate.queryForObject(countSql, params, Long.class);

        List<CogsDto> content = jdbcTemplate.query(sql, params, (rs, rowNum) ->
                CogsDto.builder()
                        .itemId(UUID.fromString(rs.getString("itemId")))
                        .itemName(rs.getString("itemName"))
                        .unit(rs.getString("unit"))
                        .relatedOrderId(rs.getString("orderId") != null ? UUID.fromString(rs.getString("orderId")) : null)
                        .qtyUsed(toBigDecimal(rs.getObject("quantity")).intValue())
                        .unitCost(toBigDecimal(rs.getObject("unitCost")))
                        .totalCost(toBigDecimal(rs.getObject("totalCost")))
                        .date(toLocalDate(rs.getObject("soldAt")))
                        .transactionType(rs.getString("transactionType"))
                        .notes(rs.getString("notes"))
                        .batchId(rs.getString("batchId") != null ? UUID.fromString(rs.getString("batchId")) : null)
                        .batchImportedAt(toLocalDate(rs.getObject("batchImportedAt")))
                        .branchId(UUID.fromString(rs.getString("branchId")))
                        .branchName(rs.getString("branchName"))
                        .build()
        );

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public <T> List<T> executeNativeQuery(String sql, Class<T> resultClass, Object... params) {
        return jdbcTemplate.getJdbcOperations().query(sql, new BeanPropertyRowMapper<>(resultClass), params);
    }
}
