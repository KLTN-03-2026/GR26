/**
 * @author Đào Thu Thiên
 * @description Type definitions cho module Kiểm kho (PB31)
 * @created 2026-04-16
 */

/**
 * Trạng thái phiếu kiểm kho
 * - DRAFT: Đang kiểm (chưa nộp)
 * - SUBMITTED: Đã nộp
 * - APPROVED: Đã được phê duyệt
 * - CANCELLED: Đã hủy
 */
export type InventoryCheckStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CANCELLED';

/**
 * Phiếu kiểm kho (Session)
 */
export interface InventoryCheckSession {
    id: string;
    branchId: string;
    branchName: string;
    checkDate: string;          // Ngày kiểm (ISO date)
    status: InventoryCheckStatus;
    systemSnapshotDate: string; // Thời điểm chốt số lượng tồn hệ thống
    submittedAt?: string;
    submittedBy?: string;
    submittedByName?: string;
    notes?: string;             // Ghi chú chung của phiếu
    totalDeviationValue?: number; // Tổng giá trị chênh lệch
    createdAt: string;
    updatedAt: string;
}

/**
 * Chi tiết kiểm kho cho từng nguyên liệu
 */
export interface InventoryCheckDetail {
    id: string;
    sessionId: string;
    itemId: string;
    itemName: string;
    unit: string;
    systemQuantity: number;      // Số lượng theo hệ thống (đã chốt)
    actualQuantity: number | null; // Số lượng thực tế đếm được
    deviationQuantity: number | null; // Chênh lệch = actual - system
    deviationValue: number | null;    // Giá trị chênh lệch
    costPerUnit: number;          // Giá nhập trung bình tại thời điểm kiểm
    note?: string;                // Ghi chú giải thích (bắt buộc nếu lệch > 10%)
}

/**
 * DTO tạo phiếu kiểm kho mới
 */
export interface CreateInventoryCheckRequest {
    branchId: string;
}

/**
 * DTO cập nhật số lượng thực tế
 */
export interface UpdateCheckDetailRequest {
    actualQuantity: number;
    note?: string;
}

/**
 * DTO nộp phiếu kiểm kho
 */
export interface SubmitInventoryCheckRequest {
    notes?: string;
}

/**
 * DTO hủy phiếu kiểm kho
 */
export interface CancelInventoryCheckRequest {
    reason: string;
}

/**
 * Báo cáo lệch kho (sau khi nộp phiếu)
 */
export interface DeviationReport {
    sessionId: string;
    session: InventoryCheckSession;
    deviations: DeviationReportItem[];
    totalDeviationValue: number;
    checkedBy: string;
    checkedByName: string;
    checkedAt: string;
}

/**
 * Chi tiết một nguyên liệu bị lệch trong báo cáo
 */
export interface DeviationReportItem {
    itemId: string;
    itemName: string;
    unit: string;
    systemQuantity: number;
    actualQuantity: number;
    deviationQuantity: number;
    deviationValue: number;
    deviationPercentage: number;
    note?: string;
}

/**
 * Filter cho danh sách phiếu kiểm kho
 */
export interface InventoryCheckFilters {
    branchId?: string;
    status?: InventoryCheckStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}

/**
 * Kết quả phân trang danh sách phiếu kiểm kho
 */
export interface InventoryCheckListResult {
    data: InventoryCheckSession[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

/**
 * Ngưỡng cảnh báo chênh lệch (theo đặc tả PB31: 10%)
 */
export const DEVIATION_THRESHOLD_PERCENT = 10;

/**
 * Kiểm tra một detail có vượt quá ngưỡng chênh lệch không
 */
export const isDeviationExceedThreshold = (detail: InventoryCheckDetail): boolean => {
    if (detail.actualQuantity === null || detail.systemQuantity === 0) return false;
    const deviationPercent = Math.abs(
        (detail.deviationQuantity || 0) / detail.systemQuantity * 100
    );
    return deviationPercent > DEVIATION_THRESHOLD_PERCENT;
};

/**
 * Kết quả tính toán lại phiếu kiểm
 */
export interface RecalcResult {
    totalDeviationValue: number;
    hasExceededThreshold: boolean;
    itemsExceedThreshold: InventoryCheckDetail[];
}

/**
 * Tính toán lại toàn bộ phiếu dựa trên details
 */
export const recalcSession = (details: InventoryCheckDetail[]): RecalcResult => {
    let totalDeviationValue = 0;
    const itemsExceedThreshold: InventoryCheckDetail[] = [];

    for (const detail of details) {
        if (detail.deviationValue !== null) {
            totalDeviationValue += detail.deviationValue;
        }
        if (isDeviationExceedThreshold(detail)) {
            itemsExceedThreshold.push(detail);
        }
    }

    return {
        totalDeviationValue,
        hasExceededThreshold: itemsExceedThreshold.length > 0,
        itemsExceedThreshold,
    };
};