package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.exception.ShiftTemplateNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler tạo ca mẫu (shift template) cho chi nhánh (S-16).
 *
 * <p>Luồng xử lý:
 * <ol>
 *   <li>Validate tên ca không trùng trong branch</li>
 *   <li>Validate endTime > startTime</li>
 *   <li>Validate maxStaff >= minStaff</li>
 *   <li>Tạo và lưu entity</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreateShiftTemplateCommandHandler {

    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    /**
     * Tạo ca mẫu mới cho chi nhánh.
     *
     * @param command thông tin ca mẫu cần tạo
     * @return UUID của ca mẫu vừa tạo
     * @throws IllegalArgumentException nếu giờ bắt đầu/kết thúc không hợp lệ
     * @throws ShiftTemplateNotFoundException.DuplicateNameException nếu tên ca đã tồn tại
     */
    @Transactional
    public UUID handle(CreateShiftTemplateCommand command) {
        log.info("Tạo ca mẫu mới: name={}, branch={}", command.name(), command.branchId());

        // 1. Validate giờ: endTime phải sau startTime
        if (!command.endTime().isAfter(command.startTime())) {
            throw new IllegalArgumentException(
                    "Giờ kết thúc ca phải sau giờ bắt đầu: startTime=" + command.startTime()
                    + ", endTime=" + command.endTime());
        }

        // 2. Validate maxStaff >= minStaff
        if (command.maxStaff() < command.minStaff()) {
            throw new IllegalArgumentException(
                    "Số nhân viên tối đa phải >= tối thiểu: min=" + command.minStaff()
                    + ", max=" + command.maxStaff());
        }

        // 3. Kiểm tra tên ca trùng trong branch
        boolean nameExists = shiftTemplateJpaRepository.existsByBranchIdAndNameExcluding(
                command.branchId(), command.name(), null);
        if (nameExists) {
            throw new IllegalArgumentException(
                    "Tên ca '" + command.name() + "' đã tồn tại trong chi nhánh này");
        }

        // 4. Tạo entity và lưu
        ShiftTemplateJpaEntity template = ShiftTemplateJpaEntity.create(
                command.tenantId(), command.branchId(),
                command.name(), command.startTime(), command.endTime(),
                command.minStaff(), command.maxStaff(), command.color()
        );
        shiftTemplateJpaRepository.save(template);

        log.info("Tạo ca mẫu thành công: id={}, name={}", template.getId(), command.name());
        return template.getId();
    }
}
