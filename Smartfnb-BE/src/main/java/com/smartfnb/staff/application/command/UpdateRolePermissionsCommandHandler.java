package com.smartfnb.staff.application.command;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import com.smartfnb.staff.domain.event.PermissionChangedEvent;
import com.smartfnb.staff.domain.exception.RoleNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Handler xử lý cập nhật ma trận Role-Permission (S-15 — RBAC matrix).
 *
 * <p>Luồng:
 * <ol>
 *   <li>Validate roleId thuộc tenant</li>
 *   <li>Đọc permissions hiện tại (để ghi old_value vào audit)</li>
 *   <li>Xóa toàn bộ permissions cũ</li>
 *   <li>Thêm permissions mới</li>
 *   <li>Ghi audit_log (bắt buộc) với old_value và new_value</li>
 *   <li>Publish PermissionChangedEvent</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateRolePermissionsCommandHandler {

    private final StaffRoleJpaRepository             roleJpaRepository;
    private final StaffRolePermissionJpaRepository   rolePermissionJpaRepository;
    private final StaffPermissionJpaRepository       permissionJpaRepository;
    private final StaffAuditLogJpaRepository    auditLogJpaRepository;
    private final ApplicationEventPublisher     eventPublisher;

    /**
     * Cập nhật toàn bộ permissions của một vai trò.
     * Thao tác replace-all: xóa cũ, thêm mới trong cùng transaction.
     *
     * @param command lệnh với danh sách permissions mới
     * @throws RoleNotFoundException nếu roleId không tồn tại
     * @throws com.smartfnb.shared.exception.SmartFnbException nếu permissionId không hợp lệ
     */
    @Transactional
    public void handle(UpdateRolePermissionsCommand command) {
        log.info("Cập nhật permissions cho role: roleId={}, permissions={}",
                command.roleId(), command.permissionIds());

        // 1. Validate role thuộc tenant
        roleJpaRepository.findByIdAndTenantId(command.roleId(), command.tenantId())
                .orElseThrow(() -> new RoleNotFoundException(command.roleId()));

        // 2. Lấy permissions hiện tại (để ghi audit old_value)
        List<String> oldPermissions = rolePermissionJpaRepository
                .findPermissionIdsByRoleId(command.roleId());

        // 3. Validate các permissionId mới tồn tại trong hệ thống
        List<String> validPermIds = permissionJpaRepository.findAllById(command.permissionIds())
                .stream().map(p -> p.getId()).toList();
        List<String> invalidIds = command.permissionIds().stream()
                .filter(id -> !validPermIds.contains(id))
                .toList();
        if (!invalidIds.isEmpty()) {
            throw new com.smartfnb.shared.exception.SmartFnbException("INVALID_PERMISSION_IDS",
                    "Các permission không hợp lệ: " + invalidIds);
        }

        // 4. Xóa toàn bộ permissions cũ
        rolePermissionJpaRepository.deleteAllByRoleId(command.roleId());

        // 5. Thêm permissions mới
        List<RolePermissionJpaEntity> newEntities = command.permissionIds().stream()
                .map(permId -> RolePermissionJpaEntity.of(command.roleId(), permId))
                .toList();
        rolePermissionJpaRepository.saveAll(newEntities);

        // 6. Ghi audit_log (BẮT BUỘC theo coding guidelines § 6.3)
        String oldVal = "{\"permissions\":" + toJsonArray(oldPermissions) + "}";
        String newVal = "{\"permissions\":" + toJsonArray(command.permissionIds()) + "}";
        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forPermissionChange(
                command.tenantId(), command.performedByUserId(),
                command.roleId(), oldVal, newVal);
        auditLogJpaRepository.save(auditLog);

        // 7. Publish domain event (consumer: auth module cập nhật cache)
        eventPublisher.publishEvent(new PermissionChangedEvent(
                command.tenantId(),
                command.roleId(),
                null,   // roleName — không cần query thêm
                command.performedByUserId(),
                oldPermissions,
                command.permissionIds(),
                Instant.now()
        ));

        log.info("Cập nhật permissions thành công: roleId={}, count={}",
                command.roleId(), command.permissionIds().size());
    }

    /**
     * Chuyển list string thành JSON array string.
     *
     * @param items danh sách string
     * @return JSON array string: ["A","B","C"]
     */
    private String toJsonArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            sb.append("\"").append(items.get(i)).append("\"");
            if (i < items.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
