/**
 * Module Table - Định nghĩa kiểu dữ liệu
 * Dùng cho toàn bộ module quản lý bàn
 */

// Sử dụng union type thay vì enum (do cấu hình TypeScript)
export type TableStatus = 'active' | 'inactive';

// Trạng thái sử dụng bàn (backend: OCCUPIED, RESERVED, UNPAID, FREE)
export type TableUsageStatus = 'available' | 'occupied' | 'unpaid' | 'reserved';

// Trạng thái tổng hợp dùng cho toolbar quản lý bàn
export type TableFilterState = 'all' | 'active' | 'occupied' | 'inactive';

// Shape bàn (backend yêu cầu)
export type TableShape = 'square' | 'round';

// Thông tin khu vực bàn
export interface TableArea {
  id: string;
  branchId: string;
  name: string;
  floorNumber: number;  // backend có floorNumber
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
  zoneId: string;        // backend gọi là zoneId, không phải areaId
  zoneName?: string;      // thêm để lưu tên khu vực sau khi join
  capacity: number;
  branchId: string;
  branchName?: string;
  status: TableStatus;    // active/inactive (từ isActive)
  usageStatus: TableUsageStatus;  // từ status của backend (OCCUPIED, FREE,...)
  positionX: number;      // backend có positionX, positionY cho drag-drop
  positionY: number;
  shape: TableShape;      // backend có shape (square/round)
  createdAt: string;
  updatedAt: string;
  description?: string;
}

/**
 * Model hiển thị bàn sau khi đã resolve tên chi nhánh và khu vực từ dữ liệu liên quan.
 * UI chỉ nên render model này để tránh join dữ liệu lặp lại trong JSX.
 */
export interface TableDisplayItem extends TableItem {
  zoneName: string;
  branchName: string;
}

// Kiểu dữ liệu chi tiết bàn
export type TableDetail = TableItem;

// Filters cho danh sách bàn
export interface TableFilters {
  search: string;
  state: TableFilterState;
  area: string | 'all';
}

// Payload cho tạo bàn mới
export interface CreateTablePayload {
  name: string;
  zoneId: string;        // backend dùng zoneId
  capacity: number;
  shape?: TableShape;    // optional, default 'square'
}

// Payload cho tạo khu vực bàn
export interface CreateZonePayload {
  name: string;
  floorNumber: number;
}

// Payload cho cập nhật khu vực bàn
export interface UpdateZonePayload {
  name: string;
  floorNumber: number;
}

// Payload cho cập nhật bàn
export interface UpdateTablePayload {
  name: string;
  zoneId: string;
  capacity: number;
  shape?: TableShape;
  isActive?: boolean;    // thêm để set active/inactive
}

// Payload cho batch update vị trí (Drag & Drop)
export interface UpdateTablePositionPayload {
  tableId: string;
  positionX: number;
  positionY: number;
}

export interface BatchUpdatePositionsPayload {
  positions: UpdateTablePositionPayload[];
}

// Payload cho tạo bàn hàng loạt ở FE
export interface CreateBulkTablesPayload {
  zoneId: string;
  namePrefix: string;
  startNumber: number;
  quantity: number;
  capacity: number;
}

// Kết quả lỗi của từng bàn khi tạo hàng loạt
export interface BulkCreateTableFailure {
  name: string;
  message: string;
}

// Kết quả tổng hợp sau khi FE gọi nhiều request tạo bàn
export interface CreateBulkTablesResult {
  createdTables: TableItem[];
  failedTables: BulkCreateTableFailure[];
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

export const TableShapeValues = {
  SQUARE: 'square' as const,
  ROUND: 'round' as const,
} as const;
