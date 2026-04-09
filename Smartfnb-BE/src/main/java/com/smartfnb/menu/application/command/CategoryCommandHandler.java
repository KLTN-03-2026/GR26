package com.smartfnb.menu.application.command;

import com.smartfnb.menu.application.dto.CreateCategoryRequest;
import com.smartfnb.menu.application.dto.CategoryResponse;
import com.smartfnb.menu.domain.event.CategoryDeactivatedEvent;
import com.smartfnb.menu.domain.exception.CategoryNotFoundException;
import com.smartfnb.menu.domain.exception.DuplicateCategoryNameException;
import com.smartfnb.menu.application.dto.UpdateCategoryRequest;
import com.smartfnb.menu.infrastructure.persistence.CategoryJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.CategoryJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Command Handler xử lý toàn bộ CRUD cho danh mục thực đơn.
 * Bao gồm: tạo, cập nhật, và xóa (soft delete ngầm qua is_active = false).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryCommandHandler {

    private final CategoryJpaRepository categoryJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Tạo danh mục mới trong thực đơn.
     * Validate: tên chưa tồn tại trong tenant.
     *
     * @param request thông tin danh mục cần tạo
     * @return DTO response chứa thông tin danh mục vừa tạo
     * @throws DuplicateCategoryNameException nếu tên đã tồn tại
     */
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Tạo danh mục mới '{}' cho tenant {}", request.name(), tenantId);

        // Kiểm tra tên unique trong tenant
        if (categoryJpaRepository.existsByTenantIdAndName(tenantId, request.name())) {
            throw new DuplicateCategoryNameException(request.name());
        }

        CategoryJpaEntity entity = new CategoryJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        entity.setIsActive(true);

        CategoryJpaEntity saved = categoryJpaRepository.save(entity);
        log.info("Đã tạo danh mục {} - '{}'", saved.getId(), saved.getName());

        return CategoryResponse.from(saved);
    }

    /**
     * Cập nhật thông tin danh mục.
     * Nếu isActive = false → cascade deactivate tất cả MenuItem trong danh mục.
     *
     * @param categoryId ID danh mục cần cập nhật
     * @param request    thông tin cập nhật
     * @return DTO response sau cập nhật
     * @throws CategoryNotFoundException       nếu danh mục không tồn tại
     * @throws DuplicateCategoryNameException  nếu tên mới đã tồn tại
     */
    @Transactional
    public CategoryResponse updateCategory(UUID categoryId, UpdateCategoryRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Cập nhật danh mục {} cho tenant {}", categoryId, tenantId);

        // Lấy entity — kết hợp tenantId để chống IDOR
        CategoryJpaEntity entity = categoryJpaRepository
                .findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        // Kiểm tra tên unique (loại trừ bản ghi đang sửa)
        if (!entity.getName().equals(request.name()) &&
                categoryJpaRepository.existsByTenantIdAndNameAndIdNot(tenantId, request.name(), categoryId)) {
            throw new DuplicateCategoryNameException(request.name());
        }

        boolean wasActive = Boolean.TRUE.equals(entity.getIsActive());
        boolean willBeInactive = request.isActive() != null && !request.isActive();

        entity.setName(request.name());
        entity.setDescription(request.description());
        if (request.displayOrder() != null) {
            entity.setDisplayOrder(request.displayOrder());
        }
        if (request.isActive() != null) {
            entity.setIsActive(request.isActive());
        }

        // Cascade deactivate MenuItem nếu Category bị vô hiệu hóa
        if (wasActive && willBeInactive) {
            log.info("Danh mục {} bị vô hiệu hóa — cascade deactivate tất cả MenuItem", categoryId);
            List<MenuItemJpaEntity> items = menuItemJpaRepository
                    .findByCategoryIdAndTenantIdAndDeletedAtIsNull(categoryId, tenantId);
            items.forEach(item -> item.setIsActive(false));
            menuItemJpaRepository.saveAll(items);

            // Publish event để các module khác biết
            eventPublisher.publishEvent(new CategoryDeactivatedEvent(
                    categoryId, tenantId, entity.getName(), Instant.now()));
        }

        CategoryJpaEntity saved = categoryJpaRepository.save(entity);
        log.info("Đã cập nhật danh mục {} thành công", categoryId);

        return CategoryResponse.from(saved);
    }

    /**
     * Xóa danh mục (soft delete — đặt is_active = false).
     * Không hard delete để bảo toàn dữ liệu lịch sử.
     *
     * @param categoryId ID danh mục cần xóa
     * @throws CategoryNotFoundException nếu danh mục không tồn tại
     */
    @Transactional
    public void deleteCategory(UUID categoryId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Xóa danh mục {} (soft delete) cho tenant {}", categoryId, tenantId);

        CategoryJpaEntity entity = categoryJpaRepository
                .findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        entity.setIsActive(false);
        categoryJpaRepository.save(entity);

        // Cascade deactivate tất cả MenuItem trong danh mục
        List<MenuItemJpaEntity> items = menuItemJpaRepository
                .findByCategoryIdAndTenantIdAndDeletedAtIsNull(categoryId, tenantId);
        items.forEach(item -> item.setIsActive(false));
        menuItemJpaRepository.saveAll(items);

        log.info("Đã xóa danh mục {} và {} món liên quan", categoryId, items.size());
    }
}
