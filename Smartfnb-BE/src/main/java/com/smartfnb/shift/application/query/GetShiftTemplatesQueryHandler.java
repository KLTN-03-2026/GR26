package com.smartfnb.shift.application.query;

import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Query handler lấy danh sách ca mẫu của chi nhánh (S-16).
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetShiftTemplatesQueryHandler {

    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    /**
     * Lấy danh sách ca mẫu active của chi nhánh.
     *
     * @param branchId UUID chi nhánh
     * @return Danh sách {@link ShiftTemplateResult}
     */
    public List<ShiftTemplateResult> handleByBranch(UUID branchId) {
        return shiftTemplateJpaRepository.findByBranchIdAndActiveTrue(branchId)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Lấy tất cả ca mẫu (kể cả inactive) của tenant (OWNER xem toàn bộ).
     *
     * @param tenantId UUID tenant
     * @return Danh sách tất cả ca mẫu
     */
    public List<ShiftTemplateResult> handleByTenant(UUID tenantId) {
        return shiftTemplateJpaRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toResult)
                .toList();
    }

    /**
     * Chuyển đổi JPA entity sang DTO kết quả.
     *
     * @param entity ShiftTemplateJpaEntity
     * @return ShiftTemplateResult
     */
    private ShiftTemplateResult toResult(ShiftTemplateJpaEntity entity) {
        return new ShiftTemplateResult(
                entity.getId(),
                entity.getBranchId(),
                entity.getName(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getMinStaff(),
                entity.getMaxStaff(),
                entity.getColor(),
                entity.isActive(),
                entity.getDurationMinutes()
        );
    }
}
