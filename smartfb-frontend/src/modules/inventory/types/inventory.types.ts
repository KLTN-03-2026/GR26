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
  itemType: InventoryResolvedItemType;
  quantity: number;
  minLevel: number;
  isLowStock: boolean;
  updatedAt: string;
}

/**
 * Loại item kho mà FE đang quản lý trên trang inventory.
 */
export type InventoryCatalogItemType = 'INGREDIENT' | 'SUB_ASSEMBLY';

/**
 * Loại item sau khi FE enrich từ catalog.
 * `UNKNOWN` dùng cho dữ liệu tồn kho chưa map được sang catalog hiện tại.
 */
export type InventoryResolvedItemType = InventoryCatalogItemType | 'UNKNOWN';

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
 * Payload ghi nhận một mẻ sản xuất bán thành phẩm.
 * `expectedOutputQuantity` là sản lượng chuẩn để backend suy ra mức trừ đầu vào.
 */
export interface RecordProductionBatchPayload {
  subAssemblyItemId: string;
  expectedOutputQuantity: number;
  actualOutputQuantity: number;
  unit: string;
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
  type: InventoryCatalogItemType;
}

/**
 * Dòng dữ liệu dùng cho tab danh mục nguyên liệu.
 * Giúp FE hiển thị cả nguyên liệu đã tạo nhưng chưa có tồn kho.
 */
export interface InventoryIngredientCatalogRow {
  itemId: string;
  itemName: string;
  unit: string | null;
  hasStock: boolean;
  stockBranchCount: number;
  totalQuantity: number;
}

/**
 * Các loại giao dịch kho từ backend.
 */
export type InventoryTransactionType =
  | 'IMPORT'
  | 'SALE_DEDUCT'
  | 'WASTE'
  | 'ADJUSTMENT'
  | 'PRODUCTION_IN'
  | 'PRODUCTION_OUT';

/**
 * Một bản ghi giao dịch kho (nhập, xuất, điều chỉnh...).
 * quantity > 0 là nhập vào, < 0 là xuất ra.
 */
export interface InventoryTransaction {
  id: string;
  type: InventoryTransactionType;
  itemId: string;
  itemName: string | null;
  quantity: number;
  costPerUnit: number | null;
  userId: string | null;
  staffName: string | null;
  referenceId: string | null;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
}

/**
 * Params để lọc lịch sử giao dịch kho (server-side).
 */
export interface InventoryTransactionParams {
  type?: InventoryTransactionType | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

/**
 * Kết quả phân trang lịch sử giao dịch kho.
 */
export interface InventoryTransactionListResult {
  data: InventoryTransaction[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * Payload cập nhật mức tồn tối thiểu để hệ thống cảnh báo low-stock.
 */
export interface UpdateThresholdPayload {
  balanceId: string;
  minLevel: number;
}

/**
 * Dữ liệu kiểm kho một dòng: số lượng thực tế người dùng nhập vào.
 */
export interface StockCheckEntry {
  balanceId: string;
  itemId: string;
  itemName: string | null;
  unit: string | null;
  currentQuantity: number;
  actualQuantity: string; // string để bind vào input
  isDirty: boolean;
  isSaving: boolean;
}
