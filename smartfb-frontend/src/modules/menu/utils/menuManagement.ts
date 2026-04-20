import {
  NO_MENU_CATEGORY_LABEL,
  NO_MENU_CATEGORY_VALUE,
} from '@modules/menu/constants/menu.constants';
import type {
  BranchMenuItemConfig,
  MenuCategoryInfo,
  MenuFilters,
  MenuItem,
  MenuPaginationState,
  MenuStatus,
} from '@modules/menu/types/menu.types';

interface MenuBranchSummary {
  id: string;
  name: string;
}

/**
 * Bộ lọc mặc định của màn quản lý thực đơn.
 * Giữ ở một chỗ để hook và test không bị lệch state khởi tạo.
 */
export const DEFAULT_MENU_FILTERS: MenuFilters = {
  search: '',
  categories: [],
  statuses: [],
  sortBy: 'newest',
};

/**
 * Chỉ gửi search lên API sau khi debounce xong để tránh request thừa khi người dùng đang gõ.
 */
export const buildMenuQueryParams = (debouncedSearch: string) => {
  return {
    search: debouncedSearch || undefined,
  };
};

export const buildMenuCategoryMap = (rawCategories: MenuCategoryInfo[]) => {
  return new Map(rawCategories.map((category) => [category.id, category]));
};

/**
 * Dữ liệu món ăn ở chế độ global, chưa ghép cấu hình riêng theo chi nhánh.
 */
export const buildGlobalMenuItems = ({
  rawMenuItems,
  categoryMap,
}: {
  rawMenuItems: MenuItem[];
  categoryMap: Map<string, MenuCategoryInfo>;
}): MenuItem[] => {
  return rawMenuItems.map((menu) => ({
    ...menu,
    categoryName:
      categoryMap.get(menu.category)?.name ??
      menu.categoryName ??
      NO_MENU_CATEGORY_LABEL,
  }));
};

export const buildBranchConfigMap = (
  branchMenuConfigs: BranchMenuItemConfig[]
) => {
  return new Map(branchMenuConfigs.map((config) => [config.itemId, config]));
};

export const resolveSelectedBranchName = ({
  branches,
  selectedBranchId,
}: {
  branches: MenuBranchSummary[];
  selectedBranchId: string | null;
}) => {
  if (!selectedBranchId) {
    return '';
  }

  return (
    branches.find((branch) => branch.id === selectedBranchId)?.name ??
    'chi nhánh đang chọn'
  );
};

/**
 * Ghép menu global với cấu hình branch để UI luôn hiển thị đúng giá bán và trạng thái phục vụ.
 */
export const mergeBranchMenuItems = ({
  globalMenuItems,
  branchConfigMap,
  selectedBranchId,
  selectedBranchName,
}: {
  globalMenuItems: MenuItem[];
  branchConfigMap: Map<string, BranchMenuItemConfig>;
  selectedBranchId: string | null;
  selectedBranchName: string;
}): MenuItem[] => {
  if (!selectedBranchId) {
    return globalMenuItems;
  }

  return globalMenuItems.map((menu) => {
    const branchConfig = branchConfigMap.get(menu.id);

    if (!branchConfig) {
      return {
        ...menu,
        branchId: selectedBranchId,
        branchName: selectedBranchName,
        usesBranchPrice: false,
      };
    }

    const isGloballyActive = menu.isActive ?? menu.isAvailable ?? true;

    return {
      ...menu,
      price: branchConfig.effectivePrice,
      basePrice: branchConfig.basePrice,
      branchPrice: branchConfig.branchPrice,
      effectivePrice: branchConfig.effectivePrice,
      isAvailable: branchConfig.isAvailable,
      status: isGloballyActive && branchConfig.isAvailable ? 'selling' : 'hidden',
      branchId: selectedBranchId,
      branchName: selectedBranchName,
      usesBranchPrice: branchConfig.branchPrice !== null,
    };
  });
};

/**
 * Gom số lượng món theo từng danh mục để tái sử dụng cho filter và dialog quản lý danh mục.
 */
export const buildCategoryCountMap = (menuItems: MenuItem[]) => {
  const nextCategoryCountMap = new Map<string, number>();

  menuItems.forEach((menu) => {
    const currentCount = nextCategoryCountMap.get(menu.category) ?? 0;
    nextCategoryCountMap.set(menu.category, currentCount + 1);
  });

  return nextCategoryCountMap;
};

/**
 * Danh mục thật từ backend, có kèm số món để hiển thị trong dialog quản lý.
 */
export const buildCategoryManagementItems = ({
  rawCategories,
  categoryCountMap,
}: {
  rawCategories: MenuCategoryInfo[];
  categoryCountMap: Map<string, number>;
}): MenuCategoryInfo[] => {
  return rawCategories
    .map((category) => ({
      ...category,
      count: categoryCountMap.get(category.id) ?? 0,
    }))
    .sort((left, right) => {
      const orderDiff =
        (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.displayOrder ?? Number.MAX_SAFE_INTEGER);

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return left.name.localeCompare(right.name, 'vi');
    });
};

/**
 * Danh sách danh mục hiển thị trong bộ lọc, có bổ sung nhóm chưa phân loại khi cần.
 */
export const buildFilterCategories = ({
  categoryManagementItems,
  categoryCountMap,
}: {
  categoryManagementItems: MenuCategoryInfo[];
  categoryCountMap: Map<string, number>;
}): MenuCategoryInfo[] => {
  const mappedCategories = categoryManagementItems.map((category) => ({
    ...category,
  }));
  const uncategorizedCount = categoryCountMap.get(NO_MENU_CATEGORY_VALUE) ?? 0;

  if (uncategorizedCount > 0) {
    mappedCategories.push({
      id: NO_MENU_CATEGORY_VALUE,
      name: NO_MENU_CATEGORY_LABEL,
      count: uncategorizedCount,
    });
  }

  return mappedCategories;
};

/**
 * Thứ tự gợi ý cho danh mục mới để backend có thể render ổn định nếu chưa tự sinh order.
 */
export const buildNextCategoryDisplayOrder = (
  rawCategories: MenuCategoryInfo[]
) => {
  return (
    rawCategories.reduce((maxOrder, category) => {
      return Math.max(maxOrder, category.displayOrder ?? 0);
    }, -1) + 1
  );
};

/**
 * Đếm số món theo trạng thái để chip filter hiển thị số liệu thực tế.
 */
export const buildMenuStatusCounts = (menuItems: MenuItem[]) => {
  return menuItems.reduce<Partial<Record<MenuStatus, number>>>((acc, menu) => {
    acc[menu.status] = (acc[menu.status] ?? 0) + 1;
    return acc;
  }, {});
};

export const countActiveMenuFilters = (filters: MenuFilters) => {
  return [
    filters.search ? 1 : 0,
    filters.categories.length > 0 ? 1 : 0,
    filters.statuses.length > 0 ? 1 : 0,
    filters.sortBy !== 'newest' ? 1 : 0,
  ].reduce((total, current) => total + current, 0);
};

/**
 * Tất cả lọc và sort được gom vào util để hook chính chỉ còn orchestration state.
 */
export const filterAndSortMenus = ({
  menuItems,
  filters,
}: {
  menuItems: MenuItem[];
  filters: MenuFilters;
}) => {
  let result = [...menuItems];

  if (filters.categories.length > 0) {
    result = result.filter((menu) => filters.categories.includes(menu.category));
  }

  if (filters.statuses.length > 0) {
    result = result.filter((menu) => filters.statuses.includes(menu.status));
  }

  switch (filters.sortBy) {
    case 'newest':
      result.sort((left, right) => right.createdAt - left.createdAt);
      break;
    case 'price-asc':
      result.sort((left, right) => left.price - right.price);
      break;
    case 'price-desc':
      result.sort((left, right) => right.price - left.price);
      break;
  }

  return result;
};

export const paginateMenuItems = ({
  items,
  pagination,
}: {
  items: MenuItem[];
  pagination: Pick<MenuPaginationState, 'page' | 'pageSize'>;
}) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pagination.pageSize));
  const currentPage = Math.min(pagination.page, totalPages);
  const startIndex = (currentPage - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;

  return {
    currentPage,
    totalPages,
    paginatedMenus: items.slice(startIndex, endIndex),
  };
};
