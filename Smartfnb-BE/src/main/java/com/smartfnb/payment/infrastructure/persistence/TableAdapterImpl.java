package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.order.domain.exception.TableNotFoundException;
import com.smartfnb.order.infrastructure.persistence.TableJpaEntity;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Triển khai TableAdapter để giao tiếp với Table Module (ằm trong Order Module).
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableAdapterImpl implements TableAdapter {

    private final TableJpaRepository tableJpaRepository;

    @Override
    @Transactional
    public void updateTableStatus(UUID tableId, String status) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        log.debug("Payment Module đang cập nhật trạng thái Table {} thành {}", tableId, status);

        TableJpaEntity table = tableJpaRepository.findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)
                .orElseThrow(() -> new TableNotFoundException(tableId));

        table.setStatus(status);
        tableJpaRepository.save(table);
        
        log.info("Đã cập nhật trạng thái bàn {} -> {}", tableId, status);
    }
}
