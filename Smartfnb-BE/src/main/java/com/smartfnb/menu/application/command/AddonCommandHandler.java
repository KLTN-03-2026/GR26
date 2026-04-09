package com.smartfnb.menu.application.command;

import com.smartfnb.menu.application.dto.AddonResponse;
import com.smartfnb.menu.application.dto.CreateAddonRequest;
import com.smartfnb.menu.application.dto.UpdateAddonRequest;
import com.smartfnb.menu.domain.exception.AddonNotFoundException;
import com.smartfnb.menu.domain.exception.DuplicateAddonNameException;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaRepository;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Command Handler xử lý CRUD cho Addon/Topping.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AddonCommandHandler {

    private final AddonJpaRepository addonJpaRepository;

    /**
     * Tạo Addon/Topping mới.
     * Validate: tên chưa tồn tại trong tenant.
     *
     * @param request thông tin addon cần tạo
     * @return DTO response chứa thông tin addon vừa tạo
     * @throws DuplicateAddonNameException nếu tên đã tồn tại
     */
    @Transactional
    public AddonResponse createAddon(CreateAddonRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Tạo addon mới '{}' cho tenant {}", request.name(), tenantId);

        if (addonJpaRepository.existsByTenantIdAndName(tenantId, request.name())) {
            throw new DuplicateAddonNameException(request.name());
        }

        AddonJpaEntity entity = new AddonJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setName(request.name());
        entity.setExtraPrice(request.extraPrice());
        entity.setIsActive(true);

        AddonJpaEntity saved = addonJpaRepository.save(entity);
        log.info("Đã tạo addon {} - '{}'", saved.getId(), saved.getName());

        return AddonResponse.from(saved);
    }

    /**
     * Cập nhật thông tin Addon/Topping.
     *
     * @param addonId ID addon cần cập nhật
     * @param request thông tin cập nhật
     * @return DTO response sau cập nhật
     * @throws AddonNotFoundException      nếu addon không tồn tại
     * @throws DuplicateAddonNameException nếu tên mới đã tồn tại
     */
    @Transactional
    public AddonResponse updateAddon(UUID addonId, UpdateAddonRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Cập nhật addon {} cho tenant {}", addonId, tenantId);

        AddonJpaEntity entity = addonJpaRepository
                .findByIdAndTenantId(addonId, tenantId)
                .orElseThrow(() -> new AddonNotFoundException(addonId));

        if (!entity.getName().equals(request.name()) &&
                addonJpaRepository.existsByTenantIdAndNameAndIdNot(tenantId, request.name(), addonId)) {
            throw new DuplicateAddonNameException(request.name());
        }

        entity.setName(request.name());
        entity.setExtraPrice(request.extraPrice());
        if (request.isActive() != null) {
            entity.setIsActive(request.isActive());
        }

        AddonJpaEntity saved = addonJpaRepository.save(entity);
        log.info("Đã cập nhật addon {} thành công", addonId);

        return AddonResponse.from(saved);
    }

    /**
     * Xóa Addon/Topping (soft delete — đặt is_active = false).
     *
     * @param addonId ID addon cần xóa
     * @throws AddonNotFoundException nếu addon không tồn tại
     */
    @Transactional
    public void deleteAddon(UUID addonId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Xóa addon {} của tenant {}", addonId, tenantId);

        AddonJpaEntity entity = addonJpaRepository
                .findByIdAndTenantId(addonId, tenantId)
                .orElseThrow(() -> new AddonNotFoundException(addonId));

        entity.setIsActive(false);
        addonJpaRepository.save(entity);

        log.info("Đã xóa addon {} thành công", addonId);
    }
}
