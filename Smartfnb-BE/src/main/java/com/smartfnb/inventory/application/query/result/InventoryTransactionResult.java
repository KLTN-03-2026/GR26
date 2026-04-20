package com.smartfnb.inventory.application.query.result;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO kết quả trả về cho một dòng lịch sử giao dịch kho.
 * Đã enrich tên item và tên nhân viên để FE không cần gọi thêm API phụ.
 *
 * @param id            ID giao dịch
 * @param type          Loại: IMPORT | SALE_DEDUCT | WASTE | ADJUSTMENT | PRODUCTION_IN | PRODUCTION_OUT
 * @param itemId        ID nguyên liệu
 * @param itemName      Tên nguyên liệu (đã enrich)
 * @param quantity      Số lượng thay đổi (dương = nhập, âm = xuất)
 * @param costPerUnit   Đơn giá tại thời điểm giao dịch
 * @param userId        ID nhân viên thực hiện
 * @param staffName     Tên nhân viên (đã enrich)
 * @param referenceId   ID tham chiếu (orderId, productionBatchId...)
 * @param referenceType Loại tham chiếu: ORDER | MANUAL | PRODUCTION
 * @param note          Ghi chú lý do
 * @param createdAt     Thời điểm giao dịch
 *
 * @author SmartF&B Team
 * @since 2026-04-14
 */
public record InventoryTransactionResult(
        UUID id,
        String type,
        UUID itemId,
        String itemName,
        BigDecimal quantity,
        BigDecimal costPerUnit,
        UUID userId,
        String staffName,
        UUID referenceId,
        String referenceType,
        String note,
        Instant createdAt
) {}
