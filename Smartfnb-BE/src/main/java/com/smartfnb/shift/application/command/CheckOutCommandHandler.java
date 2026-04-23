package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.event.StaffCheckedOutEvent;
import com.smartfnb.shift.domain.exception.ShiftNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;

/**
 * Handler check-out kết thúc ca làm việc (S-16).
 * Tính overtime dựa trên template endTime vs actual end time.
 *
 * <p>Validate:
 * <ul>
 *   <li>Shift schedule tồn tại</li>
 *   <li>userId phải khớp với schedule</li>
 *   <li>Status phải là CHECKED_IN</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckOutCommandHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;
    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Thực hiện check-out ca làm việc.
     *
     * @param command thông tin check-out
     * @throws ShiftNotFoundException nếu không tìm thấy shift schedule
     * @throws IllegalStateException  nếu ca không ở trạng thái CHECKED_IN
     * @throws SecurityException      nếu nhân viên check-out nhầm ca
     */
    @Transactional
    public void handle(CheckOutCommand command) {
        log.info("Check-out ca: scheduleId={}, userId={}", command.scheduleId(), command.userId());

        // 1. Tìm shift schedule
        ShiftScheduleJpaEntity schedule = shiftScheduleJpaRepository
                .findByIdAndTenantId(command.scheduleId(), command.tenantId())
                .orElseThrow(() -> new ShiftNotFoundException(command.scheduleId()));

        // 2. Validate nhân viên đúng ca
        if (!schedule.getUserId().equals(command.userId())) {
            throw new SecurityException(
                    "Nhân viên không được check-out ca của người khác: scheduleId="
                    + command.scheduleId());
        }

        // 3. Validate trạng thái
        if (!schedule.isCheckedIn()) {
            throw new IllegalStateException(
                    "Không thể check-out: ca đang ở trạng thái " + schedule.getStatus()
                    + " (cần CHECKED_IN). scheduleId=" + command.scheduleId());
        }

        // 4. Lấy template để tính overtime
        LocalTime templateEndTime = shiftTemplateJpaRepository
                .findByIdAndTenantId(schedule.getShiftTemplateId(), command.tenantId())
                .map(ShiftTemplateJpaEntity::getEndTime)
                .orElse(LocalTime.now()); // fallback nếu template bị xoá

        // 5. Thực hiện check-out
        Instant now = Instant.now();
        LocalTime actualEndTime = LocalTime.now();
        schedule.checkOut(now, actualEndTime, templateEndTime);
        shiftScheduleJpaRepository.save(schedule);

        // 6. Publish domain event
        eventPublisher.publishEvent(new StaffCheckedOutEvent(
                command.tenantId(),
                schedule.getBranchId(),
                command.userId(),
                command.scheduleId(),
                schedule.getDate(),
                schedule.getCheckedInAt(),
                now,
                schedule.getOvertimeMinutes()));

        log.info("Check-out thành công: scheduleId={}, overtime={}min",
                command.scheduleId(), schedule.getOvertimeMinutes());
    }
}
