package com.smartfnb.menu.application.query;

import com.smartfnb.menu.application.dto.BranchItemResponse;
import com.smartfnb.menu.application.dto.MenuItemResponse;
import com.smartfnb.menu.domain.exception.MenuItemNotFoundException;
import com.smartfnb.menu.infrastructure.persistence.BranchItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.BranchItemJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho món ăn và branch items.
 * Hỗ trợ tìm kiếm pg_trgm và lấy giá theo chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MenuItemQueryHandler {

    private final MenuItemJpaRepository menuItemJpaRepository;
    private final BranchItemJpaRepository branchItemJpaRepository;

    /**
     * Lấy danh sách món ăn, hỗ trợ tìm kiếm pg_trgm.
     *
     * @param keyword  từ khóa tìm kiếm (null = lấy tất cả)
     * @param page     trang (0-indexed)
     * @param size     số bản ghi mỗi trang
     * @return trang danh sách món ăn
     */
    public PageResponse<MenuItemResponse> listMenuItems(String keyword, int page, int size) {
        UUID tenantId = TenantContext.requireCurrentTenantId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("name").ascending());

        Page<MenuItemResponse> result;
        if (keyword != null && !keyword.isBlank()) {
            // Dùng pg_trgm native query cho fuzzy search
            result = menuItemJpaRepository
                    .searchByNameTrgm(tenantId, keyword.trim(), pageable)
                    .map(MenuItemResponse::from);
        } else {
            result = menuItemJpaRepository
                    .findByTenantIdAndTypeAndDeletedAtIsNull(tenantId, "SELLABLE", pageable)
                    .map(MenuItemResponse::from);
        }

        return PageResponse.from(result);
    }

    /**
     * Lấy chi tiết một món ăn theo ID.
     *
     * @param itemId ID món ăn
     * @return thông tin món ăn
     * @throws MenuItemNotFoundException nếu không tìm thấy hoặc đã xóa
     */
    public MenuItemResponse getMenuItemById(UUID itemId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return menuItemJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(itemId, tenantId)
                .map(MenuItemResponse::from)
                .orElseThrow(() -> new MenuItemNotFoundException(itemId));
    }

    /**
     * Lấy tất cả món đang active — dùng cho POS dropdown.
     *
     * @return danh sách món ăn active
     */
    public List<MenuItemResponse> listActiveMenuItems() {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return menuItemJpaRepository
                .findAllActiveByTenant(tenantId)
                .stream()
                .map(MenuItemResponse::from)
                .toList();
    }

    /**
     * Lấy thông tin món ăn kết hợp với giá chi nhánh cụ thể.
     * effectivePrice = branchPrice nếu có, ngược lại dùng basePrice.
     *
     * @param branchId ID chi nhánh
     * @param itemId   ID món ăn
     * @return thông tin kết hợp giá branch
     * @throws MenuItemNotFoundException nếu món ăn không tồn tại
     */
    public BranchItemResponse getBranchItemPrice(UUID branchId, UUID itemId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        MenuItemJpaEntity item = menuItemJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(itemId, tenantId)
                .orElseThrow(() -> new MenuItemNotFoundException(itemId));

        Optional<BranchItemJpaEntity> branchItem = branchItemJpaRepository
                .findByIdBranchIdAndIdItemId(branchId, itemId);

        return BranchItemResponse.from(item, branchItem.orElse(null), branchId);
    }
}
