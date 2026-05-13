package com.smartfnb.shift.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng pos_sessions (phiên POS).
 * Quy tắc nghiệp vụ: mỗi branch chỉ có 1 session OPEN tại 1 thời điểm.
 *
 * @author vutq
 * @since 2026-04-06
 */
public interface PosSessionJpaRepository
        extends JpaRepository<PosSessionJpaEntity, UUID> {

    /**
     * Tìm phiên POS đang OPEN tại branch.
     * Dùng để validate "không được mở 2 session cùng lúc".
     *
     * @param branchId UUID chi nhánh
     * @param status   trạng thái session (OPEN)
     * @return Optional phiên đang mở
     */
    Optional<PosSessionJpaEntity> findByBranchIdAndStatus(UUID branchId, String status);

    /**
     * Kiểm tra branch đã có session OPEN chưa.
     *
     * @param branchId UUID chi nhánh
     * @param status   trạng thái (OPEN)
     * @return true nếu đã có session mở
     */
    boolean existsByBranchIdAndStatus(UUID branchId, String status);

    /**
     * Tìm session theo ID và tenantId (kiểm tra ownership).
     *
     * @param id       UUID session
     * @param tenantId UUID tenant
     * @return Optional PosSessionJpaEntity
     */
    Optional<PosSessionJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy lịch sử sessions của branch (sắp xếp mới nhất trước).
     *
     * @param branchId UUID chi nhánh
     * @param tenantId UUID tenant
     * @param pageable Thông tin phân trang và sort
     * @return Page sessions
     */
    // author: Hoàng | date: 2026-05-11 | note: Repository phân trang lịch sử ca POS theo branch/tenant hiện tại.
    Page<PosSessionJpaEntity> findByBranchIdAndTenantId(
            UUID branchId,
            UUID tenantId,
            Pageable pageable);
}
