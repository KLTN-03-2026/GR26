package com.smartfnb.staff.application.command;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler xử lý lệnh tạo chức vụ mới (S-15).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreatePositionCommandHandler {

    private final PositionJpaRepository positionJpaRepository;

    /**
     * Tạo chức vụ mới trong tenant.
     *
     * @param command thông tin chức vụ
     * @return UUID chức vụ mới tạo
     * @throws SmartFnbException nếu tên chức vụ đã tồn tại trong tenant
     */
    @Transactional
    public UUID handle(CreatePositionCommand command) {
        log.info("Tạo chức vụ mới: name={}, tenant={}", command.name(), command.tenantId());

        // Kiểm tra tên chức vụ unique trong tenant
        if (positionJpaRepository.existsByTenantIdAndName(command.tenantId(), command.name())) {
            throw new SmartFnbException("DUPLICATE_POSITION_NAME",
                    "Tên chức vụ '" + command.name() + "' đã tồn tại trong hệ thống.");
        }

        PositionJpaEntity position = PositionJpaEntity.create(
                command.tenantId(), command.name(), command.description());
        positionJpaRepository.save(position);

        log.info("Tạo chức vụ thành công: positionId={}", position.getId());
        return position.getId();
    }
}
