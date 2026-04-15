package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.exception.IngredientNotFoundException;
import com.smartfnb.inventory.domain.model.InventoryItem;
import com.smartfnb.inventory.domain.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý Command bật/tắt (Active/Inactive) một nguyên liệu.
 * 
 * Nghiệp vụ:
 * - Dùng để ngưng sử dụng một mặt hàng trong kho mà không làm mất dữ liệu lịch sử.
 * - Cho phép tái kích hoạt khi cần thiết.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
public class ToggleInventoryItemCommandHandler {

    private final InventoryItemRepository repository;

    /**
     * Thực thi việc chuyển đổi trạng thái hoạt động.
     *
     * @param command Thông tin định danh nguyên liệu cần chuyển đổi
     */
    @Transactional
    public void handle(ToggleInventoryItemCommand command) {
        // 1. Tìm nguyên liệu theo ID và Tenant
        InventoryItem item = repository.findByIdAndTenantId(command.id(), command.tenantId())
                .orElseThrow(() -> new IngredientNotFoundException(command.id()));

        // 2. Thay đổi trạng thái thông qua logic nghiệp vụ tại Domain model
        item.toggleActivation();

        // 3. Lưu lại thay đổi vào cơ sở dữ liệu
        repository.save(item);
    }
}
