package com.smartfnb.order.application.command;

import com.smartfnb.order.application.dto.*;
import com.smartfnb.order.domain.exception.*;
import com.smartfnb.order.infrastructure.persistence.*;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Command Handler xử lý CRUD cho TableZone và Table.
 * Bao gồm: tạo/sửa/xóa zone, tạo/sửa/xóa bàn (soft delete),
 * và batch update vị trí Drag & Drop.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableCommandHandler {

    private final TableZoneJpaRepository tableZoneJpaRepository;
    private final TableJpaRepository tableJpaRepository;

    // ============================== TABLE ZONE ===============================

    /**
     * Tạo khu vực bàn mới trong chi nhánh.
     * Validate: tên chưa tồn tại trong chi nhánh.
     *
     * @param branchId ID chi nhánh (từ path variable)
     * @param request  thông tin zone cần tạo
     * @return DTO response zone vừa tạo
     * @throws DuplicateZoneNameException nếu tên đã tồn tại trong chi nhánh
     */
    @Transactional
    public TableZoneResponse createZone(UUID branchId, CreateTableZoneRequest request) {
        log.info("Tạo khu vực bàn '{}' tại chi nhánh {}", request.name(), branchId);

        if (tableZoneJpaRepository.existsByBranchIdAndName(branchId, request.name())) {
            throw new DuplicateZoneNameException(request.name());
        }

        TableZoneJpaEntity entity = new TableZoneJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setBranchId(branchId);
        entity.setName(request.name());
        entity.setFloorNumber(request.floorNumber() != null ? request.floorNumber() : 1);

        TableZoneJpaEntity saved = tableZoneJpaRepository.save(entity);
        log.info("Đã tạo khu vực bàn {} - '{}'", saved.getId(), saved.getName());

        return TableZoneResponse.from(saved);
    }

    /**
     * Cập nhật thông tin khu vực bàn.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone cần cập nhật
     * @param request  thông tin cập nhật
     * @return DTO response sau cập nhật
     * @throws TableZoneNotFoundException nếu zone không tồn tại
     * @throws DuplicateZoneNameException nếu tên mới đã tồn tại
     */
    @Transactional
    public TableZoneResponse updateZone(UUID branchId, UUID zoneId, UpdateTableZoneRequest request) {
        log.info("Cập nhật khu vực bàn {} tại chi nhánh {}", zoneId, branchId);

        TableZoneJpaEntity entity = tableZoneJpaRepository
                .findByIdAndBranchId(zoneId, branchId)
                .orElseThrow(() -> new TableZoneNotFoundException(zoneId));

        if (!entity.getName().equals(request.name()) &&
                tableZoneJpaRepository.existsByBranchIdAndNameAndIdNot(
                        branchId, request.name(), zoneId)) {
            throw new DuplicateZoneNameException(request.name());
        }

        entity.setName(request.name());
        if (request.floorNumber() != null) {
            entity.setFloorNumber(request.floorNumber());
        }

        TableZoneJpaEntity saved = tableZoneJpaRepository.save(entity);
        log.info("Đã cập nhật khu vực bàn {} thành công", zoneId);

        return TableZoneResponse.from(saved);
    }

    /**
     * Xóa khu vực bàn.
     * Kiểm tra không còn bàn nào trong zone trước khi xóa.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone cần xóa
     * @throws TableZoneNotFoundException nếu zone không tồn tại
     * @throws SmartFnbException          nếu zone còn bàn chưa xóa
     */
    @Transactional
    public void deleteZone(UUID branchId, UUID zoneId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Xóa khu vực bàn {} tại chi nhánh {}", zoneId, branchId);

        tableZoneJpaRepository
                .findByIdAndBranchId(zoneId, branchId)
                .orElseThrow(() -> new TableZoneNotFoundException(zoneId));

        // Kiểm tra còn bàn nào trong zone không
        List<TableJpaEntity> tablesInZone = tableJpaRepository
                .findByZoneIdAndTenantIdAndDeletedAtIsNull(zoneId, tenantId);

        if (!tablesInZone.isEmpty()) {
            throw new SmartFnbException("ZONE_HAS_TABLES",
                    "Không thể xóa khu vực còn " + tablesInZone.size() +
                    " bàn. Hãy xóa hoặc chuyển bàn sang khu vực khác trước.",
                    409);
        }

        tableZoneJpaRepository.deleteById(zoneId);
        log.info("Đã xóa khu vực bàn {} thành công", zoneId);
    }

    // ============================== TABLE ====================================

    /**
     * Tạo bàn mới trong chi nhánh.
     * Validate: tên chưa tồn tại trong (branch, zone).
     *
     * @param branchId ID chi nhánh
     * @param request  thông tin bàn cần tạo
     * @return DTO response bàn vừa tạo
     * @throws DuplicateTableNameException nếu tên bàn đã tồn tại trong zone
     */
    @Transactional
    public TableResponse createTable(UUID branchId, CreateTableRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Tạo bàn '{}' tại chi nhánh {}, zone {}",
                request.name(), branchId, request.zoneId());

        // Validate unique name trong (branch, zone)
        if (tableJpaRepository.existsByBranchIdAndZoneIdAndNameAndDeletedAtIsNull(
                branchId, request.zoneId(), request.name())) {
            throw new DuplicateTableNameException(request.name());
        }

        TableJpaEntity entity = new TableJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setBranchId(branchId);
        entity.setZoneId(request.zoneId());
        entity.setName(request.name());
        entity.setCapacity(request.capacity() != null ? request.capacity() : 4);
        entity.setShape(request.shape() != null ? request.shape() : "square");
        entity.setStatus("AVAILABLE");
        entity.setIsActive(true);

        TableJpaEntity saved = tableJpaRepository.save(entity);
        log.info("Đã tạo bàn {} - '{}'", saved.getId(), saved.getName());

        return TableResponse.from(saved);
    }

    /**
     * Cập nhật thông tin bàn.
     *
     * @param branchId ID chi nhánh
     * @param tableId  ID bàn cần cập nhật
     * @param request  thông tin cập nhật
     * @return DTO response sau cập nhật
     * @throws TableNotFoundException      nếu bàn không tồn tại
     * @throws DuplicateTableNameException nếu tên mới đã tồn tại
     */
    @Transactional
    public TableResponse updateTable(UUID branchId, UUID tableId, UpdateTableRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Cập nhật bàn {} tại chi nhánh {}", tableId, branchId);

        TableJpaEntity entity = tableJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)
                .orElseThrow(() -> new TableNotFoundException(tableId));

        // Kiểm tra bàn thuộc chi nhánh đang thao tác
        if (!entity.getBranchId().equals(branchId)) {
            throw new TableNotFoundException(tableId);
        }

        // Validate unique name khi đổi tên hoặc zone
        boolean nameOrZoneChanged = !entity.getName().equals(request.name()) ||
                !java.util.Objects.equals(entity.getZoneId(), request.zoneId());

        if (nameOrZoneChanged &&
                tableJpaRepository.existsByBranchIdAndZoneIdAndNameAndIdNotAndDeletedAtIsNull(
                        branchId, request.zoneId(), request.name(), tableId)) {
            throw new DuplicateTableNameException(request.name());
        }

        entity.setZoneId(request.zoneId());
        entity.setName(request.name());
        if (request.capacity() != null) entity.setCapacity(request.capacity());
        if (request.shape() != null) entity.setShape(request.shape());
        if (request.isActive() != null) entity.setIsActive(request.isActive());

        TableJpaEntity saved = tableJpaRepository.save(entity);
        log.info("Đã cập nhật bàn {} thành công", tableId);

        return TableResponse.from(saved);
    }

    /**
     * Soft delete bàn.
     * Kiểm tra bàn không đang bị OCCUPIED (có đơn hàng chưa hoàn tất).
     *
     * @param branchId ID chi nhánh
     * @param tableId  ID bàn cần xóa
     * @throws TableNotFoundException nếu bàn không tồn tại
     * @throws SmartFnbException      nếu bàn đang có khách
     */
    @Transactional
    public void deleteTable(UUID branchId, UUID tableId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Soft delete bàn {} tại chi nhánh {}", tableId, branchId);

        TableJpaEntity entity = tableJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(tableId, tenantId)
                .orElseThrow(() -> new TableNotFoundException(tableId));

        if (!entity.getBranchId().equals(branchId)) {
            throw new TableNotFoundException(tableId);
        }

        // Không cho xóa bàn đang có khách
        if ("OCCUPIED".equals(entity.getStatus())) {
            throw new SmartFnbException("TABLE_IS_OCCUPIED",
                    "Không thể xóa bàn đang có khách. Hãy hoàn tất đơn hàng trước.",
                    409);
        }

        entity.softDelete();
        tableJpaRepository.save(entity);

        log.info("Đã soft delete bàn {} thành công", tableId);
    }

    /**
     * Batch update vị trí các bàn sau khi nhân viên Drag & Drop trên sơ đồ.
     * Mỗi entry trong request chứa tableId + position_x + position_y mới.
     * Chạy trong 1 transaction — thành công all hoặc rollback all.
     *
     * @param branchId ID chi nhánh (dùng để verify bàn thuộc đúng chi nhánh)
     * @param request  danh sách các bàn cần cập nhật vị trí
     * @throws TableNotFoundException nếu bất kỳ bàn nào không thuộc chi nhánh/tenant
     */
    @Transactional
    public void batchUpdatePositions(UUID branchId, UpdateTablePositionsRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Batch update vị trí {} bàn tại chi nhánh {}", 
                request.positions().size(), branchId);

        // Validate tất cả bàn thuộc chi nhánh & tenant trước khi update
        for (var item : request.positions()) {
            TableJpaEntity table = tableJpaRepository
                    .findByIdAndTenantIdAndDeletedAtIsNull(item.tableId(), tenantId)
                    .orElseThrow(() -> new TableNotFoundException(item.tableId()));

            if (!table.getBranchId().equals(branchId)) {
                throw new TableNotFoundException(item.tableId());
            }
        }

        // Thực hiện update từng bàn bằng native UPDATE (hiệu quả hơn load entity)
        request.positions().forEach(item ->
            tableJpaRepository.updatePosition(
                item.tableId(), tenantId, item.positionX(), item.positionY())
        );

        log.info("Đã cập nhật vị trí {} bàn thành công", request.positions().size());
    }
}
