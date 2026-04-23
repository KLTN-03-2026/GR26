package com.smartfnb.inventory.application.query;

import com.smartfnb.inventory.application.query.result.InventoryBalanceResult;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Query Handler lấy danh sách tồn kho theo chi nhánh.
 * READ ONLY — không có @Transactional để tránh overhead.
 *
 * <p>Phân quyền:
 * <ul>
 *   <li>OWNER: branchId = null → xem tất cả chi nhánh trong tenant</li>
 *   <li>Non-OWNER: branchId lấy từ JWT, bắt buộc filter</li>
 * </ul>
 * </p>
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetInventoryQueryHandler {

    private final InventoryBalanceJpaRepository inventoryBalanceJpaRepository;

    /**
     * Lấy danh sách tồn kho có phân trang.
     *
     * @param query query chứa tenantId, branchId, page, size
     * @return danh sách InventoryBalanceResult
     */
    public List<InventoryBalanceResult> handle(GetInventoryQuery query) {
        log.debug("Lấy tồn kho: tenant={}, branch={}, page={}/{}",
            query.tenantId(), query.branchId(), query.page(), query.size());

        int safeSize = Math.min(query.size(), 100);
        PageRequest pageable = PageRequest.of(query.page(), safeSize);

        List<InventoryBalanceJpaEntity> entities = inventoryBalanceJpaRepository
            .findByTenantAndBranch(query.tenantId(), query.branchId(), pageable);

        return entities.stream()
            .map(InventoryBalanceResult::from)
            .collect(Collectors.toList());
    }

    /**
     * Đếm tổng số bản ghi tồn kho (dùng cho metadata phân trang).
     *
     * @param query query chứa tenantId, branchId
     * @return tổng số bản ghi
     */
    public long count(GetInventoryQuery query) {
        return inventoryBalanceJpaRepository
            .countByTenantAndBranch(query.tenantId(), query.branchId());
    }
}
