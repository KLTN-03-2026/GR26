package com.smartfnb.staff.application.command;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.staff.domain.exception.RoleNotFoundException;
import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Handler xử lý gán vai trò cho nhân viên (S-15 — RBAC).
 *
 * <p>Thao tác replace-all: xóa toàn bộ roles cũ → thêm roles mới.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AssignRoleToStaffCommandHandler {

    private final StaffJpaRepository     staffJpaRepository;
    private final StaffRoleJpaRepository      roleJpaRepository;
    private final StaffUserRoleJpaRepository  userStaffRoleJpaRepository;

    /**
     * Gán (thay thế toàn bộ) vai trò cho nhân viên.
     *
     * @param command lệnh với danh sách roleIds mới
     * @throws StaffNotFoundException nếu nhân viên không tồn tại
     * @throws RoleNotFoundException  nếu role không thuộc tenant
     */
    @Transactional
    public void handle(AssignRoleToStaffCommand command) {
        log.info("Gán roles cho nhân viên: staffId={}, roles={}",
                command.staffId(), command.roleIds());

        // 1. Validate staff thuộc tenant
        staffJpaRepository.findByIdAndTenantId(command.staffId(), command.tenantId())
                .orElseThrow(() -> new StaffNotFoundException(command.staffId()));

        // 2. Validate tất cả roleIds thuộc tenant
        for (UUID roleId : command.roleIds()) {
            roleJpaRepository.findByIdAndTenantId(roleId, command.tenantId())
                    .orElseThrow(() -> new RoleNotFoundException(roleId));
        }

        // 3. Xóa toàn bộ roles cũ
        userStaffRoleJpaRepository.deleteAllByUserId(command.staffId());

        // 4. Thêm roles mới
        List<UserRoleJpaEntity> newEntities = command.roleIds().stream()
                .map(roleId -> UserRoleJpaEntity.of(command.staffId(), roleId))
                .toList();
        userStaffRoleJpaRepository.saveAll(newEntities);

        log.info("Gán roles thành công: staffId={}, count={}",
                command.staffId(), command.roleIds().size());
    }
}
