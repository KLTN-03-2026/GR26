/**
 * Module Table - Định nghĩa kiểu dữ liệu
 * Dùng cho toàn bộ module quản lý bàn
 */

// Sử dụng union type thay vì enum (do cấu hình TypeScript)
export type TableStatus = 'active' | 'inactive';

// Trạng thái sử dụng bàn
export type TableUsageStatus = 'available' | 'occupied' | 'unpaid' | 'reserved';

// Thông tin khu vực bàn
export interface TableArea {
  id: string;
  name: string;
}

// Thông tin chi nhánh (dùng để hiển thị trong table)
export interface BranchInfo {
  id: string;
  name: string;
}

// Kiểu dữ liệu cho 1 bàn (dùng trong danh sách)
export interface TableItem {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
  capacity: number;
  branchId: string;
  branchName: string;
  status: TableStatus;
  usageStatus: TableUsageStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

// Kiểu dữ liệu chi tiết bàn (mở rộng từ TableItem)
export interface TableDetail extends TableItem {
  description?: string;
}

// Filters cho danh sách bàn
export interface TableFilters {
  search: string;
  status: TableStatus | 'all';
  area: string | 'all';
  usageStatus: TableUsageStatus | 'all';
  branch: string | 'all';
}

// Payload cho tạo bàn mới
export interface CreateTablePayload {
  name: string;
  areaId: string;
  capacity: number;
  branchId: string;
  description?: string;
}

// Payload cho cập nhật bàn
export interface UpdateTablePayload extends CreateTablePayload {
  status?: TableStatus;
}

// Pagination state
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Helper constants
export const TableStatusValues = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
} as const;

export const TableUsageStatusValues = {
  AVAILABLE: 'available' as const,
  OCCUPIED: 'occupied' as const,
  UNPAID: 'unpaid' as const,
  RESERVED: 'reserved' as const,
} as const;