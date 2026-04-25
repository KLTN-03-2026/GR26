package com.smartfnb.inventory.infrastructure.event;

import com.smartfnb.inventory.application.command.ImportStockCommand;
import com.smartfnb.inventory.application.command.ImportStockCommandHandler;
import com.smartfnb.supplier.domain.event.PurchaseOrderReceivedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inventory Module — Lắng nghe PurchaseOrderReceivedEvent và tự động tạo StockBatch
 * cho từng item trong đơn mua hàng.
 *
 * <p>Luồng:
 * <ol>
 *   <li>Supplier module publish PurchaseOrderReceivedEvent khi PO chuyển sang RECEIVED</li>
 *   <li>Handler này import từng item vào kho thông qua ImportStockCommandHandler</li>
 * </ol>
 *
 * @author vutq
 * @since 2026-04-07
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderReceivedEventHandler {

    private final ImportStockCommandHandler importStockCommandHandler;

    /**
     * Xử lý sự kiện nhận hàng từ PO — tạo StockBatch cho từng item.
     *
     * @param event sự kiện chứa danh sách items đã nhận
     */
    @EventListener
    @Async
    @Transactional
    public void onPurchaseOrderReceived(PurchaseOrderReceivedEvent event) {
        log.info("Bắt đầu tạo StockBatch từ PO: {}, {} items",
                event.orderNumber(), event.items().size());

        for (PurchaseOrderReceivedEvent.ReceivedItem item : event.items()) {
            try {
                ImportStockCommand command = new ImportStockCommand(
                        event.tenantId(),
                        event.branchId(),
                        event.receivedByUserId(),  // userId (3rd param)
                        item.itemId(),              // itemId (4th param)
                        event.supplierId(),         // supplierId (5th param)
                        item.quantity(),
                        item.unitPrice(),
                        null,   // expiresAt
                        "Nhập kho từ PO " + event.orderNumber()
                );
                importStockCommandHandler.handle(command);
                log.debug("Đã tạo StockBatch cho item={}, qty={}", item.itemId(), item.quantity());
            } catch (Exception e) {
                log.error("Lỗi tạo StockBatch cho item={} trong PO={}: {}",
                        item.itemId(), event.orderNumber(), e.getMessage(), e);
                // Không throw để không ảnh hưởng các item khác
            }
        }

        log.info("Hoàn tất tạo StockBatch từ PO: {}", event.orderNumber());
    }
}
