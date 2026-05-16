/**
 * Module Table - Định nghĩa kiểu dữ liệu
 * Backend vẫn dùng contract table, FE hiển thị nghiệp vụ là thẻ gọi khách.
 */

// Sử dụng union type thay vì enum (do cấu hình TypeScript)
export type TableStatus = 'active' | 'inactive';

// Trạng thái sử dụng thẻ gọi khách (backend: OCCUPIED, RESERVED, UNPAID, FREE)
export type TableUsageStatus = 'available' | 'occupied' | 'unpaid' | 'reserved';

// Trạng thái tổng hợp dùng cho toolbar quản lý thẻ
export type TableFilterState = 'all' | 'active' | 'occupied' | 'inactive';

// Shape table do backend yêu cầu, FE thẻ gọi khách không hiển thị field này
export type TableShape = 'square' | 'round';

// Thông tin máy gọi thẻ, backend vẫn trả qua entity zone
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

// Kiểu dữ liệu cho 1 thẻ gọi khách, map từ response table của backend
export interface TableItem {
  id: string;
  name: string;
  zoneId: string;        // backend gọi là zoneId, không phải areaId
  zoneName?: string;      // thêm để lưu tên máy gọi thẻ sau khi join
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
 * Model hiển thị thẻ sau khi đã resolve tên chi nhánh và máy gọi thẻ từ dữ liệu liên quan.
 * UI chỉ nên render model này để tránh join dữ liệu lặp lại trong JSX.
 */
export interface TableDisplayItem extends TableItem {
  zoneName: string;
  branchName: string;
}

// Kiểu dữ liệu chi tiết thẻ gọi khách
export type TableDetail = TableItem;

// Filters cho danh sách thẻ gọi khách
export interface TableFilters {
  search: string;
  state: TableFilterState;
  area: string | 'all';
}

// Payload cho tạo thẻ mới, backend vẫn nhận qua API table
export interface CreateTablePayload {
  name: string;
  zoneId: string;        // backend dùng zoneId
  capacity: number;
  shape?: TableShape;    // optional, default 'square'
}

// Payload cho tạo máy gọi thẻ, backend vẫn nhận qua API zone
export interface CreateZonePayload {
  name: string;
  floorNumber: number;
}

// Payload cho cập nhật máy gọi thẻ, backend vẫn nhận qua API zone
export interface UpdateZonePayload {
  name: string;
  floorNumber: number;
}

// Payload cho cập nhật thẻ gọi khách
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

// Payload cho tạo thẻ hàng loạt ở FE
export interface CreateBulkTablesPayload {
  zoneId: string;
  namePrefix: string;
  startNumber: number;
  quantity: number;
  capacity: number;
}

// Kết quả lỗi của từng thẻ khi tạo hàng loạt
export interface BulkCreateTableFailure {
  name: string;
  message: string;
}

// Kết quả tổng hợp sau khi FE gọi nhiều request tạo thẻ
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
