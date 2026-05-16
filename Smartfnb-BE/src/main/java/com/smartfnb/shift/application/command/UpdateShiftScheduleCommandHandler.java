package com.smartfnb.shift.application.command;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.shift.domain.exception.ShiftConflictException;
import com.smartfnb.shift.domain.exception.ShiftNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import com.smartfnb.shift.domain.exception.ShiftTemplateNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh cập nhật đăng ký ca làm việc.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateShiftScheduleCommandHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;
    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    @Transactional
    public void handle(UpdateShiftScheduleCommand command) {
        log.info("Cập nhật ca làm việc: scheduleId={}", command.scheduleId());

        ShiftScheduleJpaEntity schedule = shiftScheduleJpaRepository
                .findByIdAndTenantId(command.scheduleId(), command.tenantId())
                .orElseThrow(() -> new ShiftNotFoundException(command.scheduleId()));

        if (!schedule.getBranchId().equals(command.branchId())) {
            throw new SmartFnbException("INVALID_BRANCH", "Không có quyền sửa ca của chi nhánh khác", 403);
        }

        // Kiểm tra quyền: STAFF chỉ được sửa ca của chính mình
        if (command.isStaffRole() && !schedule.getUserId().equals(command.currentUserId())) {
            throw new SmartFnbException("FORBIDDEN", "Nhân viên chỉ được sửa ca của chính mình", 403);
        }

        // Validate shift template mới tồn tại
        shiftTemplateJpaRepository.findByIdAndTenantId(command.shiftTemplateId(), command.tenantId())
                .orElseThrow(() -> new ShiftTemplateNotFoundException(command.shiftTemplateId()));

        // Kiểm tra conflict: (userId + shiftTemplateId + date) phải unique, ngoại trừ bản ghi hiện tại
        boolean conflict = shiftScheduleJpaRepository
                .existsByUserIdAndShiftTemplateIdAndDateAndIdNot(
                        command.userId(), command.shiftTemplateId(), command.date(), command.scheduleId());
        if (conflict) {
            throw new ShiftConflictException(command.userId().toString(), command.date().toString());
        }

        // Thực hiện cập nhật thông tin
        try {
            schedule.update(command.userId(), command.shiftTemplateId(), command.date());
            shiftScheduleJpaRepository.save(schedule);
        } catch (IllegalStateException e) {
            throw new SmartFnbException("INVALID_STATUS", e.getMessage(), 400);
        }

        log.info("Cập nhật ca làm việc thành công: scheduleId={}", command.scheduleId());
    }
}
