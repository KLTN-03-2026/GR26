package com.smartfnb.order.application.query;

import com.smartfnb.order.application.dto.TableResponse;
import com.smartfnb.order.application.dto.TableZoneResponse;
import com.smartfnb.order.domain.exception.TableNotFoundException;
import com.smartfnb.order.domain.exception.TableZoneNotFoundException;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
import com.smartfnb.order.infrastructure.persistence.TableZoneJpaRepository;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho Table và TableZone.
 * Không có @Transactional — chỉ đọc dữ liệu.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableQueryHandler {

    private final TableZoneJpaRepository tableZoneJpaRepository;
    private final TableJpaRepository tableJpaRepository;

    // ============================== TABLE ZONE ===============================

    /**
     * Lấy tất cả khu vực bàn trong chi nhánh, sắp theo tầng và tên.
     *
     * @param branchId ID chi nhánh
     * @return danh sách zone
     */
    public List<TableZoneResponse> listZones(UUID branchId) {
        return tableZoneJpaRepository
                .findByBranchIdOrderByFloorNumberAscNameAsc(branchId)
                .stream()
                .map(TableZoneResponse::from)
                .toList();
    }

    /**
     * Lấy chi tiết một khu vực bàn.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone
     * @return thông tin zone
     * @throws TableZoneNotFoundException nếu không tìm thấy
     */
    public TableZoneResponse getZoneById(UUID branchId, UUID zoneId) {
        return tableZoneJpaRepository
                .findByIdAndBranchId(zoneId, branchId)
                .map(TableZoneResponse::from)
                .orElseThrow(() -> new TableZoneNotFoundException(zoneId));
    }

    // ============================== TABLE ====================================

    /**
     * Lấy tất cả bàn trong chi nhánh (dùng cho sơ đồ bàn).
     * Kết quả sắp xếp theo zone rồi theo tên bàn.
     *
     * @param branchId ID chi nhánh
     * @return danh sách bàn chưa xóa
     */
    public List<TableResponse> listTables(UUID branchId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return tableJpaRepository
                .findByBranchIdAndTenantIdAndDeletedAtIsNullOrderByZoneIdAscNameAsc(
                        branchId, tenantId)
                .stream()
                .map(TableResponse::from)
                .toList();
    }

    /**
     * Lấy chi tiết một bàn.
     *
     * @param tableId ID bàn
     * @return thông tin bàn
     * @throws TableNotFoundException nếu không tìm thấy hoặc đã xóa
     */
    public TableResponse getTableById(UUID tableId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return tableJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)
                .map(TableResponse::from)
                .orElseThrow(() -> new TableNotFoundException(tableId));
    }

    /**
     * Đếm số bàn đang có khách trong chi nhánh.
     * Dùng cho dashboard nhanh.
     *
     * @param branchId ID chi nhánh
     * @return số bàn OCCUPIED
     */
    public long countOccupiedTables(UUID branchId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();
        return tableJpaRepository.countOccupiedTables(branchId, tenantId);
    }
}
