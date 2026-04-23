package com.smartfnb.shift.application.command;

import com.smartfnb.shift.domain.exception.ShiftTemplateNotFoundException;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xoá (deactivate) ca mẫu (S-16).
 * Xoá mềm: set active = false để không hiển thị trong tương lai
 * nhưng vẫn giữ dữ liệu lịch sử ca đã đăng ký.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeleteShiftTemplateCommandHandler {

    private final ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    /**
     * Deactivate ca mẫu (soft delete).
     *
     * @param command thông tin ca mẫu cần deactivate
     * @throws ShiftTemplateNotFoundException nếu không tìm thấy ca mẫu
     */
    @Transactional
    public void handle(DeleteShiftTemplateCommand command) {
        log.info("Deactivate ca mẫu: templateId={}", command.templateId());

        ShiftTemplateJpaEntity template = shiftTemplateJpaRepository
                .findByIdAndTenantId(command.templateId(), command.tenantId())
                .orElseThrow(() -> new ShiftTemplateNotFoundException(command.templateId()));

        // Deactivate thay vì xoá cứng để giữ lịch sử
        template.deactivate();
        shiftTemplateJpaRepository.save(template);

        log.info("Đã deactivate ca mẫu: templateId={}", command.templateId());
    }
}
