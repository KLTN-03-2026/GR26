package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.exception.IngredientNotFoundException;
import com.smartfnb.inventory.domain.exception.InventoryItemAlreadyExistsException;
import com.smartfnb.inventory.domain.model.InventoryItem;
import com.smartfnb.inventory.domain.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý Command cập nhật thông tin nguyên liệu đã tồn tại.
 * 
 * Nghiệp vụ:
 * 1. Kiểm tra sự tồn tại của nguyên liệu (Soft-delete awareness).
 * 2. Nếu thay đổi Tên hoặc SKU, phải kiểm tra lại tính duy nhất để tránh xung đột dữ liệu.
 * 3. Cập nhật trạng thái mới cho Domain model và lưu trữ.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
public class UpdateInventoryItemCommandHandler {

    private final InventoryItemRepository repository;

    /**
     * Thực thi việc cập nhật thông tin nguyên liệu.
     * Đảm bảo tính nhất quán dữ liệu bằng Transaction.
     *
     * @param command Dữ liệu cập nhật từ người dùng
     */
    @Transactional
    public void handle(UpdateInventoryItemCommand command) {
        // 1. Tìm item hiện tại trong database
        // Phải thuộc về tenant đang thực hiện để đảm bảo bảo mật dữ liệu
        InventoryItem item = repository.findByIdAndTenantId(command.id(), command.tenantId())
                .orElseThrow(() -> new IngredientNotFoundException(command.id()));

        // 2. Nếu người dùng đổi tên, kiểm tra tên mới xem có trùng với item khác không
        if (!item.getName().equalsIgnoreCase(command.name())) {
            if (repository.existsByNameAndTenantId(command.name(), command.tenantId())) {
                throw new InventoryItemAlreadyExistsException("Tên nguyên liệu '" + command.name() + "' đã tồn tại.");
            }
        }

        // 3. Nếu người dùng đổi SKU, kiểm tra tính duy nhất của mã SKU mới
        if (command.sku() != null && !command.sku().isBlank() && !command.sku().equalsIgnoreCase(item.getSku())) {
            if (repository.existsBySkuAndTenantId(command.sku(), command.tenantId())) {
                throw new InventoryItemAlreadyExistsException("Mã SKU '" + command.sku() + "' đã tồn tại.");
            }
        }

        // 4. Gọi phương thức nghiệp vụ của Domain Model để thực hiện cập nhật
        item.update(
                command.name(),
                command.sku(),
                command.unit(),
                command.categoryId()
        );

        // 5. Đồng bộ thay đổi xuống cơ sở dữ liệu
        repository.save(item);
    }
}
