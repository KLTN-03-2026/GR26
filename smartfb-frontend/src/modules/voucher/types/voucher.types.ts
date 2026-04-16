/**
 * @author Đào Thu Thiên
 * @description Type definitions cho module voucher
 * @created 2026-04-16
 */

/**
 * Trạng thái voucher theo backend
 * ACTIVE: Đang kích hoạt (còn hạn và đang dùng)
 * INACTIVE: Vô hiệu hóa (ngừng hoạt động)
 * EXPIRED: Hết hạn (auto theo thời gian)
 */
export type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

/**
 * Loại giảm giá
 * PERCENT: Giảm theo phần trăm
 * FIXED_AMOUNT: Giảm theo số tiền cố định
 */
export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT';

/**
 * Voucher entity theo backend response
 */
export interface Voucher {
    id: string;
    tenantId: string;
    code: string;           // Mã voucher (unique)
    name: string;           // Tên chương trình
    discountType: DiscountType;
    discountValue: number;  // 10 = 10%, hoặc 50000 = 50,000đ
    minOrderValue: number | null;  // Điều kiện áp dụng (tối thiểu)
    startDate: string;      // Thời gian bắt đầu (ISO)
    endDate: string;        // Thời gian kết thúc (ISO)
    status: VoucherStatus;
    createdAt: string;
    updatedAt: string;
}

/**
 * Trạng thái dùng cho filter
 */
export type VoucherFilterStatus = VoucherStatus | 'all';

export type VoucherFilters = {
    search: string;         // Tìm theo code hoặc name
    status: VoucherFilterStatus;
};

/**
 * Item hiển thị trên bảng voucher
 * Thêm computed field cho UI
 */
export type VoucherListItem = Voucher & {
    discountDisplay: string;     // "10%" hoặc "50,000đ"
    periodDisplay: string;       // "01/01/2024 - 31/12/2024"
    conditionDisplay: string;    // "Đơn tối thiểu 100,000đ" hoặc "Không"
};

/**
 * Dữ liệu form tạo voucher
 */
export type CreateVoucherFormData = {
    code: string;
    name: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderValue: number | null;
    startDate: string;
    endDate: string;
};

/**
 * Dữ liệu form chỉnh sửa voucher (giống create)
 */
export type EditVoucherFormData = CreateVoucherFormData;

/**
 * Payload gửi API khi tạo voucher
 */
export type CreateVoucherPayload = CreateVoucherFormData;

/**
 * Payload gửi API khi cập nhật voucher
 */
export type UpdateVoucherPayload = CreateVoucherFormData;

/**
 * Payload cập nhật trạng thái (kích hoạt/vô hiệu hóa)
 */
export type UpdateVoucherStatusPayload = {
    status: VoucherStatus;
};

/**
 * Pagination state dùng chung cho các bảng
 */
export type PaginationState = {
    page: number;
    pageSize: number;
    total: number;
};