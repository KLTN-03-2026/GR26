/**
 * Trạng thái ca làm việc theo backend
 * REGISTERED: Đã đăng ký (chờ check-in)
 * CHECKED_IN: Đã check-in (đang làm)
 * COMPLETED: Đã kết thúc (đã check-out)
 * ABSENT: Vắng mặt
 * CANCELLED: Đã hủy
 */
export type ShiftStatus = 'REGISTERED' | 'CHECKED_IN' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';

/**
 * LocalTime format từ backend (hour, minute, second, nano)
 * Dùng cho response từ backend
 */
export interface LocalTime {
    hour: number;
    minute: number;
    second: number;
    nano: number;
}

/**
 * Shift Template entity - Ca mẫu (lặp lại hàng ngày)
 */
export interface ShiftTemplate {
    id: string;
    branchId: string;
    name: string;
    startTime: LocalTime;
    endTime: LocalTime;
    minStaff: number;
    maxStaff: number;
    color: string;
    active: boolean;
    durationMinutes?: number;
}

/**
 * Shift Schedule entity - Lịch ca cụ thể của nhân viên
 */
export interface ShiftSchedule {
    id: string;
    userId: string;
    shiftTemplateId: string;
    branchId: string;
    date: string; // YYYY-MM-DD
    status: ShiftStatus;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    actualStartTime: LocalTime | null;
    actualEndTime: LocalTime | null;
    overtimeMinutes: number;
    note: string | null;
}

/**
 * Dữ liệu form tạo ca mẫu (UI)
 */
export interface CreateShiftTemplateFormData {
    name: string;
    startTime: LocalTime;
    endTime: LocalTime;
    minStaff: number;
    maxStaff: number;
    color: string;
    active: boolean;
}

/**
 * Alias dữ liệu form cho luồng tạo/sửa ca mẫu
 */
export type ShiftTemplateFormData = CreateShiftTemplateFormData;

/**
 * Payload gửi lên khi tạo ca mẫu
 */
export type CreateShiftTemplatePayload = {
    name: string;
    startTime: string;
    endTime: string;
    minStaff: number;
    maxStaff: number;
    color?: string;
    active?: boolean;
};

/**
 * Payload gửi lên khi cập nhật ca mẫu
 */
export type UpdateShiftTemplatePayload = CreateShiftTemplatePayload;

/**
 * Dữ liệu đăng ký ca
 */
export interface RegisterShiftFormData {
    userId: string;
    shiftTemplateId: string;
    date: string;
}

/**
 * Payload gửi lên khi đăng ký ca
 */
export type RegisterShiftPayload = {
    userId: string;
    shiftTemplateId: string;
    date: string;
};

/**
 * Filter cho danh sách ca mẫu
 */
export type ShiftTemplateFilters = {
    search: string;
    active: boolean | 'all';
};

/**
 * Filter cho danh sách lịch ca
 */
export type ShiftScheduleFilters = {
    startDate: string;
    endDate: string;
    status: ShiftStatus | 'all';
};

/**
 * Pagination state
 */
export type PaginationState = {
    page: number;
    pageSize: number;
    total: number;
};
