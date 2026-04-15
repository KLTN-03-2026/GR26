package com.smartfnb.inventory.application.query;

import com.smartfnb.inventory.application.dto.InventoryItemResponse;
import com.smartfnb.inventory.domain.exception.IngredientNotFoundException;
import com.smartfnb.inventory.infrastructure.persistence.InventoryItemJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler xử lý các truy vấn chỉ đọc (READ-ONLY) liên quan đến định nghĩa nguyên liệu.
 * 
 * Nghiệp vụ:
 * - Cung cấp dữ liệu cho Web API để hiển thị danh sách và chi tiết.
 * - Luôn đảm bảo lọc dữ liệu theo TenantId hiện tại của người dùng.
 * - Sử dụng JpaRepository trực tiếp để tối ưu hiệu năng cho các thao tác đọc thuần túy.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryItemQueryHandler {

    private final InventoryItemJpaRepository itemJpaRepository;

    /**
     * Lấy danh sách nguyên liệu của tenant hiện tại, có phân trang.
     * Tự động áp dụng bộ lọc @Where để chỉ lấy các loại INGREDIENT/SUB_ASSEMBLY.
     *
     * @param page Số thứ tự trang (bắt đầu từ 0)
     * @param size Số lượng bản ghi trên mỗi trang
     * @return Trang kết quả chứa danh sách DTO InventoryItemResponse
     */
    public PageResponse<InventoryItemResponse> listItems(int page, int size) {
        // Lấy TenantId từ Context bắt buộc (bảo mật đa thuê)
        UUID tenantId = TenantContext.requireCurrentTenantId();
        
        // Cấu hình phân trang và sắp xếp mặc định theo tên A-Z
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("name").ascending());

        // Thực hiện query và map kết quả từ JpaEntity sang Response DTO
        return PageResponse.from(
                itemJpaRepository.findAll(pageable)
                        .map(InventoryItemResponse::from)
        );
    }

    /**
     * Lấy thông tin chi tiết của một nguyên liệu cụ thể.
     * 
     * @param id ID của nguyên liệu cần lấy
     * @return DTO chứa thông tin chi tiết nguyên liệu
     * @throws IngredientNotFoundException Nếu không tìm thấy hoặc nguyên liệu không thuộc về tenant
     */
    public InventoryItemResponse getItemDetail(UUID id) {
        UUID tenantId = TenantContext.requireCurrentTenantId();
        return itemJpaRepository.findByIdAndTenantId(id, tenantId)
                .map(InventoryItemResponse::from)
                .orElseThrow(() -> new IngredientNotFoundException(id));
    }
}
