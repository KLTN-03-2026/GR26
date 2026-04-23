package com.smartfnb.menu.application.query;

import com.smartfnb.menu.application.dto.AddonResponse;
import com.smartfnb.menu.domain.exception.AddonNotFoundException;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho Addon/Topping.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AddonQueryHandler {

    private final AddonJpaRepository addonJpaRepository;

    /**
     * Lấy danh sách addon theo tenant, hỗ trợ phân trang.
     *
     * @param page trang (0-indexed)
     * @param size số bản ghi mỗi trang
     * @return trang danh sách addon
     */
    public PageResponse<AddonResponse> listAddons(int page, int size) {
        UUID tenantId = TenantContext.requireCurrentTenantId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("name").ascending());

        return PageResponse.from(
                addonJpaRepository.findByTenantId(tenantId, pageable)
                        .map(AddonResponse::from)
        );
    }

    /**
     * Lấy tất cả addon đang active — dùng cho POS khi nhân viên chọn topping.
     *
     * @return danh sách addon active
     */
    public List<AddonResponse> listActiveAddons() {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return addonJpaRepository
                .findByTenantIdAndIsActive(tenantId, true)
                .stream()
                .map(AddonResponse::from)
                .toList();
    }

    /**
     * Lấy chi tiết một addon theo ID.
     *
     * @param addonId ID addon
     * @return thông tin addon
     * @throws AddonNotFoundException nếu không tìm thấy
     */
    public AddonResponse getAddonById(UUID addonId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return addonJpaRepository
                .findByIdAndTenantId(addonId, tenantId)
                .map(AddonResponse::from)
                .orElseThrow(() -> new AddonNotFoundException(addonId));
    }
}
