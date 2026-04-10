package com.smartfnb.order.infrastructure.websocket;

import com.smartfnb.order.application.dto.TableResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Service broadcast cập nhật sơ đồ bàn qua WebSocket STOMP.
 * Topic: /topic/tables/{branchId}
 *
 * <p>Được gọi sau mỗi thao tác làm thay đổi trạng thái hoặc vị trí bàn:
 * <ul>
 *   <li>Batch update positions (Drag & Drop)</li>
 *   <li>Thay đổi trạng thái bàn (AVAILABLE → OCCUPIED → CLEANING)</li>
 * </ul>
 * </p>
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableMapBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast danh sách bàn cập nhật tới tất cả client đang xem sơ đồ chi nhánh.
     * Client subscribe /topic/tables/{branchId} để nhận cập nhật realtime.
     *
     * @param branchId ID chi nhánh cần broadcast
     * @param tables   danh sách bàn hiện tại (sau khi đã cập nhật)
     */
    public void broadcastTableMap(UUID branchId, List<TableResponse> tables) {
        String topic = "/topic/tables/" + branchId;

        log.debug("Broadcast {} bàn tới topic {}", tables.size(), topic);

        messagingTemplate.convertAndSend(topic, tables);
    }

    /**
     * Broadcast thông tin một bàn đơn lẻ (dùng khi chỉ 1 bàn thay đổi trạng thái).
     * Tránh broadcast toàn bộ danh sách khi chỉ 1 bàn thay đổi.
     *
     * @param branchId ID chi nhánh
     * @param table    thông tin bàn vừa thay đổi
     */
    public void broadcastSingleTable(UUID branchId, TableResponse table) {
        String topic = "/topic/tables/" + branchId;

        log.debug("Broadcast single table {} tới topic {}", table.id(), topic);

        messagingTemplate.convertAndSend(topic, table);
    }
}
