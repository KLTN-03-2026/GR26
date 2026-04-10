package com.smartfnb.payment.infrastructure.event;

import com.smartfnb.payment.domain.event.InvoiceCreatedEvent;
import com.smartfnb.payment.infrastructure.persistence.TableAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event Listener để xử lý InvoiceCreatedEvent.
 * Cập nhật Table.status = CLEANING sau khi hóa đơn được tạo.
 *
 * @author SmartF&B Team
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
    @EventListener
    @Transactional
    public void onInvoiceCreated(InvoiceCreatedEvent event) {
        log.info("Nhận InvoiceCreatedEvent cho hóa đơn {} (đơn {})", 
            event.invoiceNumber(), event.orderId());

        // Nếu không có tableId (delivery/takeaway) thì skip
        if (event.tableId() == null) {
            log.debug("Skip update table status — đơn hàng không có bàn (delivery/takeaway)");
            return;
        }

        try {
            // Cập nhật trạng thái bàn thành CLEANING
            tableAdapter.updateTableStatus(event.tableId(), "CLEANING");
            log.info("Cập nhật bàn {} thành CLEANING", event.tableId());
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái bàn sau Invoice creation", e);
            // Không throw exception để không block Invoice creation
        }
    }
}
