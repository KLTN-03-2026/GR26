import type { MenuCategory, MenuStatus, MenuSortOption, MenuCategoryInfo } from '@modules/menu/types/menu.types';

/**
 * Trạng thái menu và label hiển thị
 */
export const MENU_STATUS: Record<MenuStatus, { label: string; color: string }> = {
  selling: { label: 'Đang bán', color: 'green' },
  hidden: { label: 'Tạm ẩn', color: 'red' },
  pending: { label: 'Đang xử lý', color: 'orange' },
};

/**
 * Danh mục và label hiển thị
 */
export const MENU_CATEGORIES: MenuCategoryInfo[] = [
  { id: 'ca-phe', name: 'Cà phê' },
  { id: 'tra-trai-cay', name: 'Trà trái cây' },
  { id: 'banh-ngot', name: 'Bánh ngọt' },
  { id: 'da-ep', name: 'Đá ép' },
  { id: 'sua-hat', name: 'Sữa hạt' },
  { id: 'khac', name: 'Khác' },
];

/**
 * Tùy chọn sắp xếp
 */
export const MENU_SORT_OPTIONS: Record<MenuSortOption, { label: string }> = {
  newest: { label: 'Mới nhất' },
  'price-asc': { label: 'Giá tăng dần' },
  'price-desc': { label: 'Giá giảm dần' },
  bestseller: { label: 'Bán chạy nhất' },
};

/**
 * Tags và label hiển thị
 */
export const MENU_TAGS: Record<string, { label: string; color: string }> = {
  moi: { label: 'Mới', color: 'blue' },
  hot: { label: 'Hot', color: 'red' },
  bestseller: { label: 'Bán chạy', color: 'orange' },
  recommend: { label: 'Đề xuất', color: 'green' },
};

/**
 * Khoảng giá mặc định
 */
export const DEFAULT_PRICE_RANGE: [number, number] = [0, 200000];

/**
 * Page size mặc định
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * GP Margin threshold
 */
export const GP_MARGIN_THRESHOLD = 50;
