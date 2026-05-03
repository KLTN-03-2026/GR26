/**
 * Trạng thái kinh doanh của món ăn
 */
export type MenuStatus = 'selling' | 'hidden';

/**
 * Danh mục món ăn
 */
export type MenuCategory = string;

/**
 * Tùy chọn sắp xếp
 */
export type MenuSortOption = 'availability-az' | 'newest' | 'price-asc' | 'price-desc';

/**
 * Tùy chọn lọc GP%
 */
export type GpMarginFilter = 'above-50' | 'below-50' | 'all';

/**
 * Interface cho món ăn trong thực đơn
 */
export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  categoryName?: string;
  price: number;              // Giá bán
  basePrice?: number;         // Giá gốc cấu hình toàn hệ thống
  branchPrice?: number | null;// Giá override tại chi nhánh đang chọn
  effectivePrice?: number;    // Giá thực tế sau khi ghép cấu hình chi nhánh
  cost?: number;              // Giá vốn (dùng để tính GP%)
  gpPercent: number;          // Lợi nhuận gộp %
  image: string;              // URL ảnh
  status: MenuStatus;
  tags?: MenuTag[];           // Tags: mới, hot, bestseller
  soldCount: number;          // Số lượng đã bán
  createdAt: number;          // Timestamp
  description?: string;
  ingredients?: string[];     // Thành phần
  isAvailable?: boolean;      // Sẵn sàng để bán (toggle)
  unit?: string;
  isSyncDelivery?: boolean;
  isActive?: boolean;
  branchId?: string | null;
  branchName?: string;
  usesBranchPrice?: boolean;
}

/**
 * Tags cho món ăn
 */
export type MenuTag = 'moi' | 'hot' | 'bestseller' | 'recommend';

/**
 * Bộ lọc cho danh sách menu
 */
export interface MenuFilters {
  search: string;
  categories: MenuCategory[];
  statuses: MenuStatus[];
  sortBy: MenuSortOption;
}

/**
 * State cho pagination
 */
export interface MenuPaginationState {
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
}

/**
 * Params cho API call
 */
export interface MenuListParams extends Record<string, unknown>  {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

/**
 * Loại item trong hệ thống menu — đồng bộ với backend.
 */
export type MenuItemType = 'SELLABLE' | 'INGREDIENT' | 'SUB_ASSEMBLY';

/**
 * Payload cho tạo mới món ăn
 */
export interface CreateMenuPayload {
  name: string;
  category: MenuCategory;
  price: number;
  cost?: number;
  imageFile?: File | null;
  unit?: string;
  isSyncDelivery?: boolean;
  /** Loại item: SELLABLE (mặc định), INGREDIENT, SUB_ASSEMBLY */
  type?: MenuItemType;
}

/**
 * Payload cho tạo mới danh mục món ăn
 */
export interface CreateMenuCategoryPayload {
  name: string;
  description?: string;
  displayOrder?: number;
}

/**
 * Payload cho cập nhật danh mục món ăn
 */
export interface UpdateMenuCategoryPayload extends CreateMenuCategoryPayload {
  isActive: boolean;
}

/**
 * Payload cho cập nhật món ăn
 */
export interface UpdateMenuPayload extends Partial<CreateMenuPayload> {
  status?: MenuStatus;
  isAvailable?: boolean;
  isActive?: boolean;
}

/**
 * Cấu hình món ăn theo từng chi nhánh.
 * Backend trả về giá gốc, giá override và trạng thái phục vụ thực tế.
 */
export interface BranchMenuItemConfig {
  branchId: string;
  itemId: string;
  itemName: string;
  basePrice: number;
  branchPrice: number | null;
  effectivePrice: number;
  isAvailable: boolean;
}

/**
 * Payload cập nhật cấu hình món ăn theo chi nhánh.
 */
export interface UpdateBranchMenuItemPayload {
  branchPrice: number | null;
  isAvailable: boolean;
}

/**
 * Thông tin addon/topping trong menu.
 */
export interface MenuAddonInfo {
  id: string;
  name: string;
  extraPrice: number;
  isActive?: boolean;
}

/**
 * Payload cho tạo mới addon.
 */
export interface CreateMenuAddonPayload {
  name: string;
  extraPrice: number;
}

/**
 * Payload cho cập nhật addon.
 */
export interface UpdateMenuAddonPayload extends CreateMenuAddonPayload {
  isActive: boolean;
}

/**
 * Category info
 */
export interface MenuCategoryInfo {
  id: MenuCategory;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
  isActive?: boolean;
  displayOrder?: number;
}
