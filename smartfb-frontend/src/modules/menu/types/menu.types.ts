import React from 'react';
import { Status } from '@shared/types/common.types';

/**
 * Trạng thái kinh doanh của món ăn
 */
export type MenuStatus = 'selling' | 'hidden' | 'pending';

/**
 * Danh mục món ăn (Dùng cho POS)
 */
export interface MenuItemCategory {
  id: string;
  name: string;
  icon?: React.ReactNode;
  count?: number;
}

/**
 * DTO response từ backend cho Category
 */
export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: string;
}

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
  category: string;           // ID của danh mục
  price: number;              // Giá bán
  cost?: number;              // Giá vốn (dùng để tính GP%)
  gpPercent?: number;         // Lợi nhuận gộp %
  image: string;              // URL ảnh
  status: MenuStatus;
  tags?: MenuTag[];           // Tags: mới, hot, bestseller
  soldCount?: number;         // Số lượng đã bán
  createdAt: number;          // Timestamp
  description?: string;
  ingredients?: string[];     // Thành phần
  isAvailable?: boolean;      // Sẵn sàng để bán (toggle)
  unit?: string;              // Đơn vị tính
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
  categories: string[];
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
  categoryId: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  unit?: string;
}

/**
 * Payload cho cập nhật món ăn
 */
export interface UpdateMenuPayload extends Partial<CreateMenuPayload> {
  isActive?: boolean;
}

/**
 * Category info (Legacy, used in some places)
 */
export interface MenuCategoryInfo extends MenuItemCategory {}
