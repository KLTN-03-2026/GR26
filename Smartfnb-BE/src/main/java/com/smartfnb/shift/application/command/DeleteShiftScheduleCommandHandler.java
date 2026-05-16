package com.smartfnb.shift.application.command;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.shift.domain.exception.ShiftNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh xoá đăng ký ca làm việc.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeleteShiftScheduleCommandHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;

    @Transactional
    public void handle(DeleteShiftScheduleCommand command) {
        log.info("Xoá ca làm việc: scheduleId={}", command.scheduleId());

        ShiftScheduleJpaEntity schedule = shiftScheduleJpaRepository
                .findByIdAndTenantId(command.scheduleId(), command.tenantId())
                .orElseThrow(() -> new ShiftNotFoundException(command.scheduleId()));

        if (!schedule.getBranchId().equals(command.branchId())) {
            throw new SmartFnbException("INVALID_BRANCH", "Không có quyền xoá ca của chi nhánh khác", 403);
        }

        // Kiểm tra quyền: STAFF chỉ được xoá ca của chính mình
        if (command.isStaffRole() && !schedule.getUserId().equals(command.currentUserId())) {
            throw new SmartFnbException("FORBIDDEN", "Nhân viên chỉ được xoá ca của chính mình", 403);
        }

        if (!schedule.isScheduled()) {
            throw new SmartFnbException("INVALID_STATUS", "Chỉ có thể xoá ca khi chưa check-in", 400);
        }

        shiftScheduleJpaRepository.delete(schedule);

        log.info("Xoá ca làm việc thành công: scheduleId={}", command.scheduleId());
    }
}
