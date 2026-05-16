package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.order.application.dto.TableResponse;
import com.smartfnb.order.domain.exception.TableNotFoundException;
import com.smartfnb.order.infrastructure.persistence.TableJpaEntity;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
// Author: Hoàng | date: 2026-05-04 | note: inject TableMapBroadcaster để broadcast WebSocket sau khi đổi trạng thái bàn
import com.smartfnb.order.infrastructure.websocket.TableMapBroadcaster;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Triển khai TableAdapter để giao tiếp với Table Module (ằm trong Order Module).
 *
 * @author vutq
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableAdapterImpl implements TableAdapter {

    private final TableJpaRepository tableJpaRepository;
    // Author: Hoàng | date: 2026-05-04 | note: broadcast WS để máy khác nhận trạng thái bàn mới ngay lập tức
    private final TableMapBroadcaster tableMapBroadcaster;

    @Override
    @Transactional
    public void updateTableStatus(UUID tableId, String status) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        log.debug("Payment Module đang cập nhật trạng thái Table {} thành {}", tableId, status);

        TableJpaEntity table = tableJpaRepository.findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)
                .orElseThrow(() -> new TableNotFoundException(tableId));

        table.setStatus(status);
        // Author: Hoàng | date: 2026-05-04 | note: lưu vào biến để lấy entity đã cập nhật (có branchId) dùng cho broadcast
        TableJpaEntity saved = tableJpaRepository.save(table);

        // Author: Hoàng | date: 2026-05-04 | note: broadcast WebSocket để các máy khác (Máy B, C...) nhận trạng thái bàn mới ngay
        // Trước đây chỉ update DB, Máy khác không biết bàn đã đổi trạng thái cho tới khi reload
        tableMapBroadcaster.broadcastSingleTable(saved.getBranchId(), TableResponse.from(saved));

        log.info("Đã cập nhật và broadcast trạng thái bàn {} -> {}", tableId, status);
    }
}
