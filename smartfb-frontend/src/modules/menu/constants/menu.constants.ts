import type { MenuSortOption, MenuStatus } from '@modules/menu/types/menu.types';

/**
 * Trạng thái menu và label hiển thị
 */
export const MENU_STATUS: Record<MenuStatus, { label: string; color: string }> = {
  selling: { label: 'Đang bán', color: 'green' },
  hidden: { label: 'Tạm ẩn', color: 'red' },
};

/**
 * Tùy chọn sắp xếp
 */
export const MENU_SORT_OPTIONS: Record<MenuSortOption, { label: string }> = {
  'availability-az': { label: 'Đang bán trước, A-Z' },
  newest: { label: 'Mới cập nhật nhất' },
  'price-asc': { label: 'Giá tăng dần' },
  'price-desc': { label: 'Giá giảm dần' },
};

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
