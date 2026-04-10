package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.domain.event.PurchaseOrderStatusChangedEvent;
import com.smartfnb.supplier.domain.exception.PurchaseOrderNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.PurchaseOrderJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Handler chuyển PO sang trạng thái SENT.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SendPurchaseOrderCommandHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;
    private final ApplicationEventPublisher  eventPublisher;

    @Transactional
    public void handle(SendPurchaseOrderCommand command) {
        log.info("Gửi đơn mua hàng: poId={}", command.purchaseOrderId());

        PurchaseOrderJpaEntity po = purchaseOrderJpaRepository
                .findByIdAndTenantId(command.purchaseOrderId(), command.tenantId())
                .orElseThrow(() -> new PurchaseOrderNotFoundException(command.purchaseOrderId()));

        String oldStatus = po.getStatus();
        po.send();
        purchaseOrderJpaRepository.save(po);

        eventPublisher.publishEvent(new PurchaseOrderStatusChangedEvent(
                po.getId(), po.getTenantId(), po.getBranchId(),
                po.getOrderNumber(), oldStatus, "SENT",
                command.userId(), Instant.now()
        ));

        log.info("Gửi đơn mua hàng thành công: poId={}", po.getId());
    }
}
