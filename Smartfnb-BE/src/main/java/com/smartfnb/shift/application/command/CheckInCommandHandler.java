package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.event.StaffCheckedInEvent;
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
 * Handler check-in bắt đầu ca làm việc (S-16).
 *
 * <p>Validate:
 * <ul>
 *   <li>Shift schedule tồn tại và thuộc đúng tenant</li>
 *   <li>userId trùng với user_id trong schedule (tự check-in)</li>
 *   <li>Status phải là SCHEDULED</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckInCommandHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;
    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Thực hiện check-in ca làm việc.
     *
     * @param command thông tin check-in
     * @throws ShiftNotFoundException nếu không tìm thấy shift schedule
     * @throws IllegalStateException  nếu ca không ở trạng thái SCHEDULED
     * @throws SecurityException      nếu nhân viên check-in nhầm ca
     */
    @Transactional
    public void handle(CheckInCommand command) {
        log.info("Check-in ca: scheduleId={}, userId={}", command.scheduleId(), command.userId());

        // 1. Tìm shift schedule
        ShiftScheduleJpaEntity schedule = shiftScheduleJpaRepository
                .findByIdAndTenantId(command.scheduleId(), command.tenantId())
                .orElseThrow(() -> new ShiftNotFoundException(command.scheduleId()));

        // 2. Validate nhân viên đúng ca
        if (!schedule.getUserId().equals(command.userId())) {
            throw new SecurityException(
                    "Nhân viên không được check-in ca của người khác: scheduleId="
                    + command.scheduleId());
        }

        // 3. Validate trạng thái
        if (!schedule.isScheduled()) {
            throw new IllegalStateException(
                    "Không thể check-in: ca đang ở trạng thái " + schedule.getStatus()
                    + " (cần SCHEDULED). scheduleId=" + command.scheduleId());
        }

        // 4. Load template để lấy tên ca cho event
        ShiftTemplateJpaEntity template = shiftTemplateJpaRepository
                .findByIdAndTenantId(schedule.getShiftTemplateId(), command.tenantId())
                .orElse(null);
        String shiftName = template != null ? template.getName() : "Unknown";

        // 5. Thực hiện check-in
        Instant now = Instant.now();
        schedule.checkIn(now, LocalTime.now());
        shiftScheduleJpaRepository.save(schedule);

        // 6. Publish domain event
        eventPublisher.publishEvent(new StaffCheckedInEvent(
                command.tenantId(),
                schedule.getBranchId(),
                command.userId(),
                command.scheduleId(),
                schedule.getShiftTemplateId(),
                schedule.getDate(),
                shiftName,
                now));

        log.info("Check-in thành công: scheduleId={}", command.scheduleId());
    }
}
