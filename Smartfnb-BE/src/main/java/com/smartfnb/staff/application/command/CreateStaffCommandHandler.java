package com.smartfnb.staff.application.command;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import com.smartfnb.staff.domain.exception.DuplicatePhoneException;
import com.smartfnb.staff.domain.exception.PositionNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffAuditLogJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler xử lý lệnh tạo nhân viên mới (S-15).
 *
 * <p>Luồng xử lý:
 * <ol>
 *   <li>Validate phone unique trong tenant</li>
 *   <li>Validate positionId tồn tại trong tenant (nếu cung cấp)</li>
 *   <li>Tạo staff entity và lưu DB</li>
 *   <li>Ghi audit_log</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreateStaffCommandHandler {

    private final StaffJpaRepository staffJpaRepository;
    private final PositionJpaRepository positionJpaRepository;
    private final StaffAuditLogJpaRepository auditLogJpaRepository;

    /**
     * Tạo nhân viên mới trong tenant.
     *
     * @param command thông tin nhân viên cần tạo
     * @return UUID nhân viên mới tạo
     * @throws DuplicatePhoneException   nếu số điện thoại đã tồn tại trong tenant
     * @throws PositionNotFoundException nếu positionId không hợp lệ
     */
    @Transactional
    public UUID handle(CreateStaffCommand command) {
        log.info("Tạo nhân viên mới: phone={}, tenant={}", command.phone(), command.tenantId());

        // 1. Kiểm tra phone unique trong tenant
        boolean phoneExists = staffJpaRepository.existsByTenantIdAndPhoneExcluding(
                command.tenantId(), command.phone(), null);
        if (phoneExists) {
            throw new DuplicatePhoneException(command.phone());
        }

        // 2. Validate positionId tồn tại trong tenant (nếu có)
        if (command.positionId() != null) {
            positionJpaRepository.findByIdAndTenantId(command.positionId(), command.tenantId())
                    .orElseThrow(() -> new PositionNotFoundException(command.positionId()));
        }

        // 3. Tạo staff entity
        StaffJpaEntity staff = StaffJpaEntity.create(
                command.tenantId(),
                command.fullName(),
                command.phone(),
                command.email(),
                command.positionId(),
                command.employeeCode(),
                command.hireDate()
        );

        // Gán thêm thông tin nếu có
        if (command.dateOfBirth() != null) {
            staff.setDateOfBirth(command.dateOfBirth());
        }
        if (command.gender() != null) {
            staff.setGender(command.gender());
        }
        if (command.address() != null) {
            staff.setAddress(command.address());
        }

        staffJpaRepository.save(staff);

        // 4. Ghi audit_log
        String detail = String.format("{\"staffId\":\"%s\",\"fullName\":\"%s\",\"phone\":\"%s\"}",
                staff.getId(), command.fullName(), command.phone());
        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forStaffAction(
                command.tenantId(), command.createdByUserId(),
                staff.getId(), "STAFF_CREATED", detail);
        auditLogJpaRepository.save(auditLog);

        log.info("Tạo nhân viên thành công: staffId={}, phone={}", staff.getId(), command.phone());
        return staff.getId();
    }
}
