/**
 * Entity chức vụ trả về từ API `/positions`.
 */
export interface StaffPosition {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

/**
 * Payload tạo chức vụ mới.
 */
export interface CreatePositionRequest {
  name: string;
  description?: string;
}

/**
 * Payload cập nhật chức vụ hiện có.
 */
export interface UpdatePositionRequest {
  name: string;
  description?: string;
}

/**
 * View model dùng để render danh sách chức vụ trên FE.
 * `assignedStaffCount` được FE suy ra từ danh sách nhân viên hiện tại.
 */
export interface StaffPositionListItem extends StaffPosition {
  assignedStaffCount: number;
}

/**
 * Summary card cho trang quản lý chức vụ.
 */
export interface StaffPositionSummary {
  totalPositions: number;
  usedPositions: number;
  vacantPositions: number;
}
