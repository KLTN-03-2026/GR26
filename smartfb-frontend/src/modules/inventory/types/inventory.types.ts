import type { PaginatedResult } from '@shared/types/api.types';

/**
 * Bản ghi tồn kho nguyên liệu trả về từ backend.
 */
export interface InventoryBalance {
  id: string;
  branchId: string;
  itemId: string;
  itemName: string | null;
  unit: string | null;
  quantity: number;
  minLevel: number;
  isLowStock: boolean;
  updatedAt: string;
}

/**
 * Metadata phân trang chuẩn hóa cho danh sách tồn kho.
 */
export interface InventoryListMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Kết quả danh sách tồn kho theo format frontend đang dùng.
 */
export type InventoryListResult = PaginatedResult<InventoryBalance>;

/**
 * Bộ lọc hiển thị tồn kho phía frontend.
 */
export interface InventoryFilters {
  search: string;
  branchId: string;
  lowStockOnly: boolean;
}

/**
 * Payload nhập kho nguyên liệu.
 */
export interface ImportStockPayload {
  itemId: string;
  supplierId?: string | null;
  quantity: number;
  costPerUnit: number;
  expiresAt?: string | null;
  note?: string | null;
}

/**
 * Payload điều chỉnh tồn kho thủ công.
 */
export interface AdjustStockPayload {
  itemId: string;
  newQuantity: number;
  reason: string;
}

/**
 * Payload ghi nhận hao hụt nguyên liệu.
 */
export interface WasteRecordPayload {
  itemId: string;
  quantity: number;
  reason: string;
}

/**
 * Option nguyên liệu dùng cho form thao tác kho.
 */
export interface InventoryItemOption {
  itemId: string;
  itemName: string;
  unit: string | null;
}

/**
 * Dữ liệu nguyên liệu ở mức danh mục `items`.
 * Khác với `InventoryBalance` là chưa chắc đã có tồn kho tại chi nhánh hiện tại.
 */
export interface InventoryCatalogItem {
  id: string;
  name: string;
  unit: string | null;
}
