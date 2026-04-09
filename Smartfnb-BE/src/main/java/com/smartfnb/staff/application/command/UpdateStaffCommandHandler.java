package com.smartfnb.staff.application.command;

import com.smartfnb.staff.domain.exception.DuplicatePhoneException;
import com.smartfnb.staff.domain.exception.PositionNotFoundException;
import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh cập nhật thông tin nhân viên (S-15).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateStaffCommandHandler {

    private final StaffJpaRepository staffJpaRepository;
    private final PositionJpaRepository positionJpaRepository;

    /**
     * Cập nhật thông tin nhân viên.
     *
     * @param command thông tin cập nhật
     * @throws StaffNotFoundException    nếu nhân viên không tồn tại
     * @throws DuplicatePhoneException   nếu số điện thoại mới đã tồn tại
     * @throws PositionNotFoundException nếu positionId không hợp lệ
     */
    @Transactional
    public void handle(UpdateStaffCommand command) {
        log.info("Cập nhật nhân viên: staffId={}", command.staffId());

        // 1. Tìm nhân viên (+ kiểm tra tenant isolation)
        StaffJpaEntity staff = staffJpaRepository
                .findByIdAndTenantId(command.staffId(), command.tenantId())
                .orElseThrow(() -> new StaffNotFoundException(command.staffId()));

        // 2. Validate phone mới nếu thay đổi
        if (command.phone() != null && !command.phone().equals(staff.getPhone())) {
            boolean phoneExists = staffJpaRepository.existsByTenantIdAndPhoneExcluding(
                    command.tenantId(), command.phone(), command.staffId());
            if (phoneExists) {
                throw new DuplicatePhoneException(command.phone());
            }
            staff.setPhone(command.phone());
        }

        // 3. Validate positionId nếu thay đổi
        if (command.positionId() != null) {
            positionJpaRepository.findByIdAndTenantId(command.positionId(), command.tenantId())
                    .orElseThrow(() -> new PositionNotFoundException(command.positionId()));
            staff.setPositionId(command.positionId());
        }

        // 4. Cập nhật các trường còn lại
        if (command.fullName() != null) staff.setFullName(command.fullName());
        if (command.email() != null) staff.setEmail(command.email());
        if (command.employeeCode() != null) staff.setEmployeeCode(command.employeeCode());
        if (command.hireDate() != null) staff.setHireDate(command.hireDate());
        if (command.dateOfBirth() != null) staff.setDateOfBirth(command.dateOfBirth());
        if (command.gender() != null) staff.setGender(command.gender());
        if (command.address() != null) staff.setAddress(command.address());

        staffJpaRepository.save(staff);
        log.info("Cập nhật nhân viên thành công: staffId={}", command.staffId());
    }
}
