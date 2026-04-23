package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho production_batches.
 * Hỗ trợ filter theo chi nhánh và bán thành phẩm.
 *
 * @author SmartF&B Team
 * @since 2026-04-14
 */
@Repository
public interface ProductionBatchJpaRepository
        extends JpaRepository<ProductionBatchJpaEntity, UUID> {

    /**
     * Lấy danh sách mẻ sản xuất theo chi nhánh, sắp xếp mới nhất trước.
     *
     * @param tenantId ID tenant (multi-tenant filter)
     * @param branchId ID chi nhánh
     * @param pageable phân trang
     * @return trang mẻ sản xuất
     */
    @Query("SELECT p FROM ProductionBatchJpaEntity p " +
           "WHERE p.tenantId = :tenantId AND p.branchId = :branchId " +
           "ORDER BY p.producedAt DESC")
    Page<ProductionBatchJpaEntity> findByTenantAndBranch(
            @Param("tenantId") UUID tenantId,
            @Param("branchId") UUID branchId,
            Pageable pageable);

    /**
     * Lấy chi tiết mẻ sản xuất — kèm filter tenantId để chống IDOR.
     *
     * @param id       ID mẻ sản xuất
     * @param tenantId ID tenant
     * @return Optional chứa entity hoặc empty
     */
    Optional<ProductionBatchJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}
