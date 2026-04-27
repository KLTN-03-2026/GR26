package com.smartfnb.payment.infrastructure.event;

import com.smartfnb.payment.domain.event.InvoiceCreatedEvent;
import com.smartfnb.payment.infrastructure.persistence.TableAdapter;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event Listener để xử lý InvoiceCreatedEvent.
 * Cập nhật Table.status = CLEANING sau khi hóa đơn được tạo.
 *
 * @author vutq
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceCreatedEventListener {

    private final TableAdapter tableAdapter;

    /**
     * Khi Invoice được tạo → cập nhật bàn thành CLEANING.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvoiceCreated(InvoiceCreatedEvent event) {
        log.info("Nhận InvoiceCreatedEvent cho hóa đơn {} (đơn {})", 
            event.invoiceNumber(), event.orderId());

        // Nếu không có tableId (delivery/takeaway) thì skip
        if (event.tableId() == null) {
            log.debug("Skip update table status — đơn hàng không có bàn (delivery/takeaway)");
            return;
        }

        try {
            // author: Hoàng | date: 27-04-2026 | note: Event chạy AFTER_COMMIT nên TenantContext của request/webhook có thể đã bị clear.
            TenantContext.setCurrentTenantId(event.tenantId());
            // Cập nhật trạng thái bàn thành AVAILABLE để đón khách tiếp theo
            tableAdapter.updateTableStatus(event.tableId(), "AVAILABLE");
            log.info("Cập nhật bàn {} thành AVAILABLE", event.tableId());
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái bàn sau Invoice creation", e);
            // Không throw exception để không block Invoice creation
        } finally {
            TenantContext.clear();
        }
    }
}
