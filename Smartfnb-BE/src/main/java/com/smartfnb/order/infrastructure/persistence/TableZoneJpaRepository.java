package com.smartfnb.order.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng table_zones.
 * Tất cả query đều được scope theo branchId để đảm bảo data isolation.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface TableZoneJpaRepository extends JpaRepository<TableZoneJpaEntity, UUID> {

    /**
     * Lấy tất cả zone của một chi nhánh, sắp xếp theo tầng rồi theo tên.
     *
     * @param branchId ID chi nhánh
     * @return danh sách zone
     */
    List<TableZoneJpaEntity> findByBranchIdOrderByFloorNumberAscNameAsc(UUID branchId);

    /**
     * Lấy zone theo ID và branchId (chống IDOR).
     *
     * @param id       ID zone
     * @param branchId ID chi nhánh
     * @return Optional zone
     */
    Optional<TableZoneJpaEntity> findByIdAndBranchId(UUID id, UUID branchId);

    /**
     * Kiểm tra tên zone đã tồn tại trong chi nhánh chưa.
     *
     * @param branchId ID chi nhánh
     * @param name     tên zone
     * @return true nếu đã tồn tại
     */
    boolean existsByBranchIdAndName(UUID branchId, String name);

    /**
     * Kiểm tra tên zone trùng khi update, loại trừ bản ghi đang sửa.
     *
     * @param branchId   ID chi nhánh
     * @param name       tên zone mới
     * @param excludedId ID bản ghi đang sửa
     * @return true nếu tên đã tồn tại ở zone khác
     */
    boolean existsByBranchIdAndNameAndIdNot(UUID branchId, String name, UUID excludedId);
}
