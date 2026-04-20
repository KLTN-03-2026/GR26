package com.smartfnb.staff.application.query;

import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Handler truy vấn chi tiết một nhân viên (S-15).
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetStaffDetailQueryHandler {

    private final StaffJpaRepository    staffJpaRepository;
    private final PositionJpaRepository positionJpaRepository;
    private final StaffUserRoleJpaRepository userRoleJpaRepository;
    private final StaffRoleJpaRepository     roleJpaRepository;

    /**
     * Lấy thông tin chi tiết nhân viên.
     * Kiểm tra tenantId để chống IDOR.
     *
     * @param staffId  UUID nhân viên
     * @param tenantId UUID tenant hiện tại
     * @return StaffDetailResult
     * @throws StaffNotFoundException nếu không tìm thấy (hoặc không thuộc tenant)
     */
    public StaffDetailResult handle(UUID staffId, UUID tenantId) {
        StaffJpaEntity staff = staffJpaRepository
                .findByIdAndTenantId(staffId, tenantId)
                .orElseThrow(() -> new StaffNotFoundException(staffId));

        // Map positionName
        String positionName = null;
        if (staff.getPositionId() != null) {
            positionName = positionJpaRepository
                    .findByIdAndTenantId(staff.getPositionId(), tenantId)
                    .map(p -> p.getName())
                    .orElse(null);
        }

        // Load roles
        List<UUID> roleIds = userRoleJpaRepository.findRoleIdsByUserId(staffId);
        List<StaffDetailResult.RoleInfo> roles = roleIds.isEmpty() ? List.of() :
                roleJpaRepository.findAllById(roleIds).stream()
                        .map(r -> new StaffDetailResult.RoleInfo(r.getId(), r.getName()))
                        .toList();

        return new StaffDetailResult(
                staff.getId(), staff.getFullName(), staff.getPhone(), staff.getEmail(),
                staff.getEmployeeCode(), staff.getStatus(), staff.getGender(),
                staff.getAddress(), staff.getAvatarUrl(), staff.getDateOfBirth(),
                staff.getHireDate(), staff.getPositionId(), positionName,
                staff.getCreatedAt(), roles
        );
    }
}
