package com.smartfnb.staff.application.command;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.StaffAuditLogJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh vô hiệu hoá nhân viên (soft delete — S-15).
 * Ghi audit_log bắt buộc khi xoá nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeactivateStaffCommandHandler {

    private final StaffJpaRepository staffJpaRepository;
    private final StaffAuditLogJpaRepository auditLogJpaRepository;

    /**
     * Vô hiệu hoá nhân viên (soft delete).
     * Không xoá cứng để giữ tính toàn vẹn lịch sử đơn hàng, ca làm việc...
     *
     * @param command lệnh vô hiệu hoá với lý do bắt buộc
     * @throws StaffNotFoundException nếu nhân viên không tồn tại
     */
    @Transactional
    public void handle(DeactivateStaffCommand command) {
        log.info("Vô hiệu hoá nhân viên: staffId={}, reason={}", command.staffId(), command.reason());

        // 1. Tìm nhân viên (+ kiểm tra tenant isolation)
        StaffJpaEntity staff = staffJpaRepository
                .findByIdAndTenantId(command.staffId(), command.tenantId())
                .orElseThrow(() -> new StaffNotFoundException(command.staffId()));

        // 2. Soft delete
        staff.softDelete();
        staffJpaRepository.save(staff);

        // 3. Ghi audit_log (bắt buộc theo coding guidelines § 6.3)
        String detail = String.format(
                "{\"staffId\":\"%s\",\"fullName\":\"%s\",\"reason\":\"%s\"}",
                staff.getId(), staff.getFullName(), command.reason());
        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forStaffAction(
                command.tenantId(), command.performedByUserId(),
                command.staffId(), "STAFF_DELETED", detail);
        auditLogJpaRepository.save(auditLog);

        log.info("Vô hiệu hoá nhân viên thành công: staffId={}", command.staffId());
    }
}
