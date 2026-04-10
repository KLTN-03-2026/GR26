package com.smartfnb.staff.application.command;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.staff.infrastructure.persistence.RoleJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffRoleJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler xử lý lệnh tạo vai trò mới (S-15).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreateRoleCommandHandler {

    private final StaffRoleJpaRepository roleJpaRepository;

    /**
     * Tạo vai trò mới trong tenant.
     *
     * @param command thông tin vai trò
     * @return UUID vai trò mới tạo
     * @throws SmartFnbException nếu tên vai trò đã tồn tại
     */
    @Transactional
    public UUID handle(CreateRoleCommand command) {
        log.info("Tạo vai trò mới: name={}, tenant={}", command.name(), command.tenantId());

        if (roleJpaRepository.existsByTenantIdAndName(command.tenantId(), command.name())) {
            throw new SmartFnbException("DUPLICATE_ROLE_NAME",
                    "Tên vai trò '" + command.name() + "' đã tồn tại trong hệ thống.");
        }

        RoleJpaEntity role = RoleJpaEntity.create(
                command.tenantId(), command.name(), command.description());
        roleJpaRepository.save(role);

        log.info("Tạo vai trò thành công: roleId={}", role.getId());
        return role.getId();
    }
}
