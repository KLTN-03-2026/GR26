package com.smartfnb.supplier.application.query;

import com.smartfnb.supplier.domain.exception.PurchaseOrderNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderItemJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Query handler lấy chi tiết đơn mua hàng kèm items.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetPurchaseOrderDetailQueryHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;

    public PurchaseOrderDetailResult handle(UUID purchaseOrderId, UUID tenantId) {
        log.debug("Lấy chi tiết PO: id={}", purchaseOrderId);

        PurchaseOrderJpaEntity po = purchaseOrderJpaRepository
                .findByIdAndTenantId(purchaseOrderId, tenantId)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(purchaseOrderId));

        return PurchaseOrderDetailResult.from(po);
    }

    public record PurchaseOrderDetailResult(
            UUID id,
            String orderNumber,
            String status,
            UUID supplierId,
            UUID branchId,
            String note,
            LocalDate expectedDate,
            BigDecimal totalAmount,
            Instant receivedAt,
            Instant cancelledAt,
            String cancelReason,
            Instant createdAt,
            List<ItemResult> items
    ) {
        public static PurchaseOrderDetailResult from(PurchaseOrderJpaEntity e) {
            List<ItemResult> items = e.getItems().stream().map(ItemResult::from).toList();
            return new PurchaseOrderDetailResult(
                    e.getId(), e.getOrderNumber(), e.getStatus(),
                    e.getSupplierId(), e.getBranchId(), e.getNote(),
                    e.getExpectedDate(), e.getTotalAmount(),
                    e.getReceivedAt(), e.getCancelledAt(), e.getCancelReason(),
                    e.getCreatedAt(), items
            );
        }

        public record ItemResult(
                UUID id,
                UUID itemId,
                String itemName,
                String unit,
                BigDecimal quantity,
                BigDecimal unitPrice,
                BigDecimal totalPrice
        ) {
            public static ItemResult from(PurchaseOrderItemJpaEntity i) {
                return new ItemResult(
                        i.getId(), i.getItemId(), i.getItemName(), i.getUnit(),
                        i.getQuantity(), i.getUnitPrice(), i.getTotalPrice()
                );
            }
        }
    }
}
