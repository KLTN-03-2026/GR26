import { Status } from '@shared/types/common.types';

/**
 * Trạng thái kinh doanh của món ăn
 */
export type MenuStatus = 'selling' | 'hidden' | 'pending';

/**
 * Danh mục món ăn
 */
export type MenuCategory = 'ca-phe' | 'tra-trai-cay' | 'banh-ngot' | 'da-ep' | 'sua-hat' | 'khac';

/**
 * Tùy chọn sắp xếp
 */
export type MenuSortOption = 'newest' | 'price-asc' | 'price-desc' | 'bestseller';

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
  price: number;              // Giá bán
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
  priceRange: [number, number];
  gpMargin: GpMarginFilter;
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
 * Payload cho tạo mới món ăn
 */
export interface CreateMenuPayload {
  name: string;
  category: MenuCategory;
  price: number;
  cost?: number;
  description?: string;
  ingredients?: string[];
  image?: string;
  tags?: MenuTag[];
}

/**
 * Payload cho cập nhật món ăn
 */
export interface UpdateMenuPayload extends Partial<CreateMenuPayload> {
  status?: MenuStatus;
  isAvailable?: boolean;
}

/**
 * Category info
 */
export interface MenuCategoryInfo {
  id: MenuCategory;
  name: string;
  icon?: string;
  count?: number;
}
