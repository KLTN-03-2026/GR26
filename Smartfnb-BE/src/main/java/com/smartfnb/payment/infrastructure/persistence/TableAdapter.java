package com.smartfnb.payment.infrastructure.persistence;

import java.util.UUID;

/**
 * Adapter để gọi Table Module API.
 * Implementation sẽ gọi trực tiếp Table repository hoặc REST API.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface TableAdapter {
    /**
     * Cập nhật trạng thái bàn.
     * Status: AVAILABLE, OCCUPIED, CLEANING
     */
    void updateTableStatus(UUID tableId, String status);
}
