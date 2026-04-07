package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.domain.event.PurchaseOrderReceivedEvent;
import com.smartfnb.supplier.domain.event.PurchaseOrderStatusChangedEvent;
import com.smartfnb.supplier.domain.exception.PurchaseOrderNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderItemJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Handler xác nhận nhận hàng: SENT → RECEIVED.
 *
 * <p>Sau khi đổi trạng thái, publish {@link PurchaseOrderReceivedEvent} để
 * Inventory module tự động tạo StockBatch cho từng item.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReceivePurchaseOrderCommandHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;
    private final ApplicationEventPublisher  eventPublisher;

    @Transactional
    public void handle(ReceivePurchaseOrderCommand command) {
        log.info("Xác nhận nhận hàng PO: poId={}", command.purchaseOrderId());

        PurchaseOrderJpaEntity po = purchaseOrderJpaRepository
                .findByIdAndTenantId(command.purchaseOrderId(), command.tenantId())
                .orElseThrow(() -> new PurchaseOrderNotFoundException(command.purchaseOrderId()));

        String oldStatus = po.getStatus();
        po.receive();
        purchaseOrderJpaRepository.save(po);

        // Build event items từ PO items
        List<PurchaseOrderReceivedEvent.ReceivedItem> eventItems = po.getItems().stream()
                .map(item -> new PurchaseOrderReceivedEvent.ReceivedItem(
                        item.getItemId(),
                        item.getItemName(),
                        item.getUnit(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        // Publish event → Inventory module lắng nghe và tạo StockBatch
        eventPublisher.publishEvent(new PurchaseOrderReceivedEvent(
                po.getId(),
                po.getTenantId(),
                po.getBranchId(),
                po.getSupplierId(),
                po.getOrderNumber(),
                command.userId(),
                eventItems,
                Instant.now()
        ));

        // Publish status change event (audit)
        eventPublisher.publishEvent(new PurchaseOrderStatusChangedEvent(
                po.getId(), po.getTenantId(), po.getBranchId(),
                po.getOrderNumber(), oldStatus, "RECEIVED",
                command.userId(), Instant.now()
        ));

        log.info("Xác nhận nhận hàng thành công: poId={}, {} items", po.getId(), eventItems.size());
    }
}
