import type { MenuCategoryInfo, MenuSortOption, MenuStatus } from '@modules/menu/types/menu.types';

/**
 * Trạng thái menu và label hiển thị
 */
export const MENU_STATUS: Record<MenuStatus, { label: string; color: string }> = {
  selling: { label: 'Đang bán', color: 'green' },
  hidden: { label: 'Tạm ẩn', color: 'red' },
};

/**
 * Danh mục fallback để tránh UI bị rỗng khi API danh mục chưa sẵn sàng.
 */
export const MENU_CATEGORIES: MenuCategoryInfo[] = [
  { id: 'fallback-ca-phe', name: 'Cà phê' },
  { id: 'fallback-tra', name: 'Trà trái cây' },
  { id: 'fallback-banh', name: 'Bánh ngọt' },
];

/**
 * Tùy chọn sắp xếp
 */
export const MENU_SORT_OPTIONS: Record<MenuSortOption, { label: string }> = {
  'availability-az': { label: 'Đang bán trước, A-Z' },
  newest: { label: 'Mới nhất' },
  'price-asc': { label: 'Giá tăng dần' },
  'price-desc': { label: 'Giá giảm dần' },
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
export const DEFAULT_PAGE_SIZE = 12;

/**
 * Giá trị đại diện cho món chưa được gán danh mục.
 */
export const NO_MENU_CATEGORY_VALUE = '__no_category__';

/**
 * Label hiển thị cho danh mục rỗng.
 */
export const NO_MENU_CATEGORY_LABEL = 'Chưa phân loại';
