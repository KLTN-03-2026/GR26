package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.exception.ShiftConflictException;
import com.smartfnb.shift.domain.exception.ShiftTemplateNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler đăng ký ca làm việc thực tế cho nhân viên (S-16).
 *
 * <p>Luồng xử lý:
 * <ol>
 *   <li>Validate shift template tồn tại và thuộc đúng tenant</li>
 *   <li>Validate nhân viên chưa đăng ký trùng ca (unique: userId + templateId + date)</li>
 *   <li>Tạo shift schedule với status = SCHEDULED</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RegisterShiftCommandHandler {

    private final ShiftScheduleJpaRepository shiftScheduleJpaRepository;
    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    /**
     * Đăng ký ca làm việc cho nhân viên.
     *
     * @param command thông tin ca cần đăng ký
     * @return UUID của shift schedule vừa tạo
     * @throws ShiftTemplateNotFoundException nếu ca mẫu không tồn tại
     * @throws ShiftConflictException         nếu nhân viên đã đăng ký trùng ca
     */
    @Transactional
    public UUID handle(RegisterShiftCommand command) {
        log.info("Đăng ký ca: userId={}, templateId={}, date={}",
                command.userId(), command.shiftTemplateId(), command.date());

        // 1. Validate template tồn tại trong tenant
        shiftTemplateJpaRepository.findByIdAndTenantId(
                        command.shiftTemplateId(), command.tenantId())
                .orElseThrow(() -> new ShiftTemplateNotFoundException(command.shiftTemplateId()));

        // 2. Kiểm tra trùng ca (user + template + date phải unique)
        boolean conflict = shiftScheduleJpaRepository.existsByUserIdAndShiftTemplateIdAndDate(
                command.userId(), command.shiftTemplateId(), command.date());
        if (conflict) {
            throw new ShiftConflictException(
                    command.userId().toString(), command.date().toString());
        }

        // 3. Tạo shift schedule
        ShiftScheduleJpaEntity schedule = ShiftScheduleJpaEntity.register(
                command.tenantId(), command.branchId(),
                command.userId(), command.shiftTemplateId(),
                command.date(), command.registeredBy()
        );
        shiftScheduleJpaRepository.save(schedule);

        log.info("Đăng ký ca thành công: scheduleId={}", schedule.getId());
        return schedule.getId();
    }
}
