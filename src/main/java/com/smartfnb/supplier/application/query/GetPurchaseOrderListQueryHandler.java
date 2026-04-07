package com.smartfnb.supplier.application.query;

import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Query handler lấy danh sách đơn mua hàng với filter.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetPurchaseOrderListQueryHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;

    public Page<PurchaseOrderSummaryResult> handle(UUID tenantId, UUID branchId,
                                                    String status, int page, int size) {
        log.debug("Lấy danh sách PO: tenant={}, branch={}, status={}", tenantId, branchId, status);

        PageRequest pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<PurchaseOrderJpaEntity> entities;

        if (status != null && !status.isBlank()) {
            entities = purchaseOrderJpaRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        } else if (branchId != null) {
            entities = purchaseOrderJpaRepository.findByTenantIdAndBranchId(tenantId, branchId, pageable);
        } else {
            entities = purchaseOrderJpaRepository.findByTenantId(tenantId, pageable);
        }

        return entities.map(PurchaseOrderSummaryResult::from);
    }

    public record PurchaseOrderSummaryResult(
            UUID id,
            String orderNumber,
            String status,
            UUID supplierId,
            UUID branchId,
            BigDecimal totalAmount,
            Instant createdAt
    ) {
        public static PurchaseOrderSummaryResult from(PurchaseOrderJpaEntity e) {
            return new PurchaseOrderSummaryResult(
                    e.getId(), e.getOrderNumber(), e.getStatus(),
                    e.getSupplierId(), e.getBranchId(),
                    e.getTotalAmount(), e.getCreatedAt()
            );
        }
    }
}
