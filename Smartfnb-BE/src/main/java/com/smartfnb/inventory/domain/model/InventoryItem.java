package com.smartfnb.inventory.domain.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho một mặt hàng trong kho (Nguyên liệu hoặc Bán thành phẩm).
 *
 * Nghiệp vụ:
 * - Đối tượng này định nghĩa các thuộc tính cơ bản của một mặt hàng kho.
 * - Không trực tiếp quản lý số lượng tồn kho (số lượng thực tế được quản lý bởi InventoryStock).
 * - Phân biệt loại mặt hàng qua ItemType: NGUYÊN LIỆU (mua ngoài) hoặc BÁN THÀNH PHẨM (tự chế biến).
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryItem {
    /** Khóa chính duy nhất của mặt hàng */
    private UUID id;
    /** ID của Tenant sở hữu mặt hàng này (đa thuê) */
    private UUID tenantId;
    /** Tên gọi của nguyên liệu (ví dụ: Thịt bò, Nước sốt) */
    private String name;
    /** Mã SKU - dùng để định danh duy nhất trong quản lý kho */
    private String sku;
    /** Loại mặt hàng: INGREDIENT hoặc SUB_ASSEMBLY */
    private ItemType type;
    /** Đơn vị tính (ví dụ: kg, lít, gram) */
    private String unit;
    /** Danh mục quản lý (ví dụ: Đồ tươi, Gia vị) */
    private UUID categoryId;
    /** Trạng thái sử dụng: true (đang dùng), false (ngưng dùng) */
    private boolean isActive;
    
    /** Thời gian tạo bản ghi */
    private LocalDateTime createdAt;
    /** Thời gian cập nhật sau cùng */
    private LocalDateTime updatedAt;
    /** Version dùng cho Optimistic Locking */
    private Long version;

    private InventoryItem(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Khởi tạo một mặt hàng kho mới.
     * Mặc định khi tạo mới trạng thái sẽ là Active.
     *
     * @param tenantId   ID của tenant thực hiện
     * @param name       Tên nguyên liệu
     * @param sku        Mã SKU định danh
     * @param type       Loại (Nguyên liệu/Bán thành phẩm)
     * @param unit       Đơn vị tính
     * @param categoryId ID danh mục
     * @return Đối tượng InventoryItem mới
     */
    public static InventoryItem create(UUID tenantId, String name, String sku, ItemType type, String unit, UUID categoryId) {
        InventoryItem item = new InventoryItem(tenantId);
        item.id = UUID.randomUUID();
        item.name = name;
        item.sku = sku;
        item.type = type;
        item.unit = unit;
        item.categoryId = categoryId;
        item.isActive = true;
        return item;
    }

    /**
     * Cập nhật thông tin cơ bản của nguyên liệu.
     * Lưu ý: Không cập nhật 'type' vì đây là thuộc tính cố định khi đã định nghĩa.
     */
    public void update(String name, String sku, String unit, UUID categoryId) {
        this.name = name;
        this.sku = sku;
        this.unit = unit;
        this.categoryId = categoryId;
    }

    /**
     * Đảo trạng thái hoạt động (Active <-> Inactive).
     * Dùng để tạm ngưng sử dụng nguyên liệu mà không xóa khỏi hệ thống để giữ tính toàn vẹn dữ liệu.
     */
    public void toggleActivation() {
        this.isActive = !this.isActive;
    }

    /**
     * Khôi phục đối tượng từ dữ liệu đã lưu (Persistence mapping).
     * Dùng cho mục đích tái cấu trúc (reconstruct) Aggregate từ cơ sở dữ liệu.
     */
    public static InventoryItem reconstruct(
            UUID id, UUID tenantId, String name, String sku, ItemType type, 
            String unit, UUID categoryId, boolean isActive, 
            LocalDateTime createdAt, LocalDateTime updatedAt, Long version) {
        
        InventoryItem item = new InventoryItem(tenantId);
        item.id = id;
        item.name = name;
        item.sku = sku;
        item.type = type;
        item.unit = unit;
        item.categoryId = categoryId;
        item.isActive = isActive;
        item.createdAt = createdAt;
        item.updatedAt = updatedAt;
        item.version = version;
        return item;
    }
}
