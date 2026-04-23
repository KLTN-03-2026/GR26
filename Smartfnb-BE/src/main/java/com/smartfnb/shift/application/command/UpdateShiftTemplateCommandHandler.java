package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.exception.ShiftTemplateNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler cập nhật ca mẫu (shift template) (S-16).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateShiftTemplateCommandHandler {

    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    /**
     * Cập nhật thông tin ca mẫu.
     *
     * @param command thông tin cập nhật
     * @throws ShiftTemplateNotFoundException nếu không tìm thấy ca mẫu
     * @throws IllegalArgumentException       nếu thông tin không hợp lệ
     */
    @Transactional
    public void handle(UpdateShiftTemplateCommand command) {
        log.info("Cập nhật ca mẫu: templateId={}", command.templateId());

        // 1. Tìm ca mẫu
        ShiftTemplateJpaEntity template = shiftTemplateJpaRepository
                .findByIdAndTenantId(command.templateId(), command.tenantId())
                .orElseThrow(() -> new ShiftTemplateNotFoundException(command.templateId()));

        // 2. Validate giờ
        if (!command.endTime().isAfter(command.startTime())) {
            throw new IllegalArgumentException(
                    "Giờ kết thúc ca phải sau giờ bắt đầu");
        }

        // 3. Validate maxStaff >= minStaff
        if (command.maxStaff() < command.minStaff()) {
            throw new IllegalArgumentException(
                    "Số nhân viên tối đa phải >= tối thiểu");
        }

        // 4. Kiểm tra tên trùng (trừ bản thân)
        boolean nameExists = shiftTemplateJpaRepository.existsByBranchIdAndNameExcluding(
                template.getBranchId(), command.name(), command.templateId());
        if (nameExists) {
            throw new IllegalArgumentException(
                    "Tên ca '" + command.name() + "' đã tồn tại trong chi nhánh này");
        }

        // 5. Cập nhật qua method update()
        template.update(
                command.name(),
                command.startTime(),
                command.endTime(),
                command.minStaff(),
                command.maxStaff(),
                command.color(),
                command.active());

        shiftTemplateJpaRepository.save(template);
        log.info("Cập nhật ca mẫu thành công: templateId={}", command.templateId());
    }
}
