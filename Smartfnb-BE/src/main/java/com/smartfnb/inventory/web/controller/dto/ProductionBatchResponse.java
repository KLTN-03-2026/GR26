package com.smartfnb.inventory.web.controller.dto;

import com.smartfnb.inventory.infrastructure.persistence.ProductionBatchJpaEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO response cho một mẻ sản xuất bán thành phẩm.
 * Đã enrich tên bán thành phẩm và tên nhân viên để FE không cần gọi thêm API phụ.
 *
 * @param id                    ID mẻ sản xuất
 * @param subAssemblyItemId     ID bán thành phẩm đầu ra
 * @param subAssemblyItemName   Tên bán thành phẩm (đã enrich)
 * @param expectedOutput        Sản lượng chuẩn theo công thức
 * @param actualOutput          Sản lượng thực tế nhân viên báo cáo
 * @param deltaOutput           Chênh lệch (actual - expected): dương = vượt, âm = thiếu
 * @param unit                  Đơn vị tính đầu ra
 * @param producedBy            ID nhân viên thực hiện
 * @param staffName             Tên nhân viên (đã enrich)
 * @param producedAt            Thời điểm sản xuất
 * @param note                  Ghi chú mẻ sản xuất
 * @param status                Trạng thái (CONFIRMED)
 * @param createdAt             Thời điểm tạo record
 *
 * @author vutq
 * @since 2026-04-14
 */
public record ProductionBatchResponse(
        UUID id,
        UUID subAssemblyItemId,
        String subAssemblyItemName,
        BigDecimal expectedOutput,
        BigDecimal actualOutput,
        BigDecimal deltaOutput,
        String unit,
        UUID producedBy,
        String staffName,
        Instant producedAt,
        String note,
        String status,
        Instant createdAt
) {

    /**
     * Factory method tạo response từ entity, cần truyền tên đã enrich.
     *
     * @param entity    JPA entity
     * @param itemName  tên bán thành phẩm (đã lookup)
     * @param staffName tên nhân viên (đã lookup)
     * @return DTO response
     */
    public static ProductionBatchResponse from(
            ProductionBatchJpaEntity entity,
            String itemName,
            String staffName) {
        return new ProductionBatchResponse(
                entity.getId(),
                entity.getSubAssemblyItemId(),
                itemName,
                entity.getExpectedOutput(),
                entity.getActualOutput(),
                entity.getDelta(),
                entity.getUnit(),
                entity.getProducedBy(),
                staffName,
                entity.getProducedAt(),
                entity.getNote(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
