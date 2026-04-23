package com.smartfnb.menu.application.query;

import com.smartfnb.menu.application.dto.CategoryResponse;
import com.smartfnb.menu.domain.exception.CategoryNotFoundException;
import com.smartfnb.menu.infrastructure.persistence.CategoryJpaRepository;
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
import java.util.UUID;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho danh mục.
 * Không có @Transactional — chỉ đọc dữ liệu.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryQueryHandler {

    private final CategoryJpaRepository categoryJpaRepository;

    /**
     * Lấy danh sách danh mục theo tenant, hỗ trợ tìm kiếm và phân trang.
     *
     * @param keyword từ khóa tìm kiếm (null = lấy tất cả)
     * @param page    trang (0-indexed)
     * @param size    số bản ghi mỗi trang
     * @return trang danh sách danh mục
     */
    public PageResponse<CategoryResponse> listCategories(String keyword, int page, int size) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("displayOrder").ascending().and(Sort.by("name").ascending()));

        Page<CategoryResponse> result;
        if (keyword != null && !keyword.isBlank()) {
            result = categoryJpaRepository
                    .findByTenantIdAndNameContainingIgnoreCase(tenantId, keyword.trim(), pageable)
                    .map(CategoryResponse::from);
        } else {
            result = categoryJpaRepository
                    .findByTenantId(tenantId, pageable)
                    .map(CategoryResponse::from);
        }

        return PageResponse.from(result);
    }

    /**
     * Lấy tất cả danh mục đang active — dùng cho dropdown tại POS.
     *
     * @return danh sách danh mục active
     */
    public List<CategoryResponse> listActiveCategories() {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return categoryJpaRepository
                .findByTenantIdAndIsActiveOrderByDisplayOrderAsc(tenantId, true)
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /**
     * Lấy chi tiết một danh mục theo ID.
     *
     * @param categoryId ID danh mục
     * @return thông tin danh mục
     * @throws CategoryNotFoundException nếu không tìm thấy
     */
    public CategoryResponse getCategoryById(UUID categoryId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        return categoryJpaRepository
                .findByIdAndTenantId(categoryId, tenantId)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));
    }
}
