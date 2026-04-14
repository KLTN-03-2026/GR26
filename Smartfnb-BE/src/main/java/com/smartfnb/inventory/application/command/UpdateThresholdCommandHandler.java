package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateThresholdCommandHandler {

    private final InventoryBalanceJpaRepository repository;

    @Transactional
    public void handle(UpdateThresholdCommand command) {
        log.info("Cập nhật minLevel={} cho balanceId={} tại branchId={}", 
            command.minLevel(), command.balanceId(), command.branchId());

        int updated = repository.updateThreshold(
            command.balanceId(), 
            command.tenantId(), 
            command.branchId(), 
            command.minLevel()
        );

        if (updated == 0) {
            throw new SmartFnbException("BALANCE_NOT_FOUND", "Không tìm thấy tồn kho hợp lệ để cập nhật");
        }
    }
}
