package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.exception.InventoryItemAlreadyExistsException;
import com.smartfnb.inventory.domain.model.InventoryItem;
import com.smartfnb.inventory.domain.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Xử lý Command tạo mới nguyên liệu hoặc bán thành phẩm.
 * 
 * Nghiệp vụ:
 * 1. Kiểm tra tính duy nhất của Tên trong cùng một Tenant để tránh nhầm lẫn.
 * 2. Kiểm tra tính duy nhất của Mã SKU (nếu có) để đảm bảo định danh kho.
 * 3. Khởi tạo đối tượng Domain và lưu trữ thông qua Repository.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
public class CreateInventoryItemCommandHandler {

    private final InventoryItemRepository repository;

    /**
     * Thực thi việc tạo mới nguyên liệu.
     * Sử dụng @Transactional để đảm bảo tính toàn vẹn dữ liệu khi lưu trữ.
     *
     * @param command Dữ liệu yêu cầu tạo mới
     * @return UUID của nguyên liệu vừa được tạo
     */
    @Transactional
    public UUID handle(CreateInventoryItemCommand command) {
        // 1. Kiểm tra tính duy nhất của tên trong tenant
        // Business Rule: Không được trùng tên nguyên liệu trong cùng một cửa hàng/hệ thống
        if (repository.existsByNameAndTenantId(command.name(), command.tenantId())) {
            throw new InventoryItemAlreadyExistsException("Tên nguyên liệu '" + command.name() + "' đã tồn tại.");
        }

        // 2. Kiểm tra tính duy nhất của SKU (nếu người dùng có cung cấp SKU)
        // Lưu ý: SKU là mã định danh quan trọng cho việc quét mã vạch và kiểm kho sau này
        if (command.sku() != null && !command.sku().isBlank()) {
            if (repository.existsBySkuAndTenantId(command.sku(), command.tenantId())) {
                throw new InventoryItemAlreadyExistsException("Mã SKU '" + command.sku() + "' đã tồn tại.");
            }
        }

        // 3. Tạo domain model thông qua Factory method
        InventoryItem item = InventoryItem.create(
                command.tenantId(),
                command.name(),
                command.sku(),
                command.type(),
                command.unit(),
                command.categoryId()
        );

        // 4. Lưu dữ liệu vào hạ tầng persistence thông qua Repository
        repository.save(item);

        return item.getId();
    }
}
