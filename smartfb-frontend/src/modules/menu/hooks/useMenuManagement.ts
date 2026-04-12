import { useMemo, useState } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { usePermission } from '@shared/hooks/usePermission';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PERMISSIONS } from '@shared/constants/permissions';
import {
  useAddons,
  useBranchMenuItems,
  useCategories,
  useDeleteMenu,
  useMenus,
  useToggleMenu,
  useUpdateBranchMenuItem,
} from './index';
import {
  DEFAULT_PAGE_SIZE,
  NO_MENU_CATEGORY_LABEL,
  NO_MENU_CATEGORY_VALUE,
} from '../constants/menu.constants';
import type {
  MenuCategoryInfo,
  MenuFilters,
  MenuItem,
  MenuPaginationState,
  MenuStatus,
  UpdateBranchMenuItemPayload,
} from '../types/menu.types';

const DEFAULT_MENU_FILTERS: MenuFilters = {
  search: '',
  categories: [],
  statuses: [],
  sortBy: 'newest',
};

/**
 * Hook gom toàn bộ state và business logic cho màn quản lý thực đơn.
 * Page chỉ nên render UI, còn việc đồng bộ dữ liệu, lọc và phân trang được dồn về module.
 */
export const useMenuManagement = () => {
  const { can } = usePermission();
  const [showFilter, setShowFilter] = useState(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [configuringBranchMenu, setConfiguringBranchMenu] = useState<MenuItem | null>(null);
  const [filters, setFilters] = useState<MenuFilters>(DEFAULT_MENU_FILTERS);
  const [pagination, setPagination] = useState<Pick<MenuPaginationState, 'page' | 'pageSize'>>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const debouncedSearch = useDebounce(filters.search.trim(), 400);
  const canManageMenu = can(PERMISSIONS.MENU_EDIT);
  const selectedBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const isBranchMode = Boolean(selectedBranchId);

  const menuQueryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch]
  );

  const { data, isLoading, isError, refetch, isFetching } = useMenus(menuQueryParams);
  const {
    data: addonResponse,
    isLoading: isAddonLoading,
    isError: isAddonError,
    isFetching: isAddonFetching,
    refetch: refetchAddons,
  } = useAddons();
  const {
    data: categoryResponse,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    isFetching: isCategoryFetching,
    refetch: refetchCategories,
  } = useCategories();
  const { data: branches = [] } = useBranches();
  const { mutate: toggleMenu } = useToggleMenu();
  const { mutate: deleteMenu } = useDeleteMenu();
  const { mutate: updateBranchMenuItem, isPending: isUpdatingBranchMenuItem } = useUpdateBranchMenuItem();

  const rawMenuItems = useMemo(() => data?.data ?? [], [data?.data]);
  const rawAddons = useMemo(() => addonResponse?.data ?? [], [addonResponse?.data]);
  const rawCategories = useMemo(() => categoryResponse?.data ?? [], [categoryResponse?.data]);
  const rawMenuItemIds = useMemo(() => rawMenuItems.map((menu) => menu.id), [rawMenuItems]);

  const {
    data: branchMenuConfigs = [],
    isLoading: isBranchConfigLoading,
    isFetching: isBranchConfigFetching,
    isError: isBranchConfigError,
  } = useBranchMenuItems(selectedBranchId, rawMenuItemIds);

  /**
   * Map danh mục theo ID để card món ăn hiển thị đúng tên từ backend.
   */
  const categoryMap = useMemo(() => {
    return new Map(rawCategories.map((category) => [category.id, category]));
  }, [rawCategories]);

  /**
   * Dữ liệu món ăn ở chế độ global, chưa ghép cấu hình riêng theo chi nhánh.
   */
  const globalMenuItems = useMemo<MenuItem[]>(() => {
    return rawMenuItems.map((menu) => ({
      ...menu,
      categoryName:
        categoryMap.get(menu.category)?.name ??
        menu.categoryName ??
        NO_MENU_CATEGORY_LABEL,
    }));
  }, [categoryMap, rawMenuItems]);

  /**
   * Map cấu hình món ăn theo item ID để ghép giá/trạng thái khi đang thao tác trong chi nhánh.
   */
  const branchConfigMap = useMemo(() => {
    return new Map(branchMenuConfigs.map((config) => [config.itemId, config]));
  }, [branchMenuConfigs]);

  const selectedBranchName = useMemo(() => {
    if (!selectedBranchId) {
      return '';
    }

    return branches.find((branch) => branch.id === selectedBranchId)?.name ?? 'chi nhánh đang chọn';
  }, [branches, selectedBranchId]);

  /**
   * Ghép menu global với cấu hình branch để UI luôn hiển thị đúng giá bán và trạng thái phục vụ.
   */
  const menuItems = useMemo<MenuItem[]>(() => {
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
  }, [branchConfigMap, globalMenuItems, selectedBranchId, selectedBranchName]);

  /**
   * Gom số lượng món theo từng danh mục để tái sử dụng cho filter và dialog quản lý danh mục.
   */
  const categoryCountMap = useMemo(() => {
    const nextCategoryCountMap = new Map<string, number>();

    menuItems.forEach((menu) => {
      const currentCount = nextCategoryCountMap.get(menu.category) ?? 0;
      nextCategoryCountMap.set(menu.category, currentCount + 1);
    });

    return nextCategoryCountMap;
  }, [menuItems]);

  /**
   * Danh mục thật từ backend, có kèm số món để hiển thị trong dialog quản lý.
   */
  const categoryManagementItems = useMemo<MenuCategoryInfo[]>(() => {
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
  }, [categoryCountMap, rawCategories]);

  /**
   * Danh sách danh mục hiển thị trong bộ lọc, có bổ sung nhóm "chưa phân loại" khi cần.
   */
  const categories = useMemo<MenuCategoryInfo[]>(() => {
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
  }, [categoryCountMap, categoryManagementItems]);

  /**
   * Thứ tự gợi ý cho danh mục mới để backend có thể render ổn định nếu chưa tự sinh order.
   */
  const nextCategoryDisplayOrder = useMemo(() => {
    return rawCategories.reduce((maxOrder, category) => {
      return Math.max(maxOrder, category.displayOrder ?? 0);
    }, -1) + 1;
  }, [rawCategories]);

  /**
   * Đếm số món theo trạng thái để chip filter hiển thị số liệu thực tế.
   */
  const statusCounts = useMemo<Partial<Record<MenuStatus, number>>>(() => {
    return menuItems.reduce<Partial<Record<MenuStatus, number>>>((acc, menu) => {
      acc[menu.status] = (acc[menu.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [menuItems]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.search ? 1 : 0,
      filters.categories.length > 0 ? 1 : 0,
      filters.statuses.length > 0 ? 1 : 0,
      filters.sortBy !== 'newest' ? 1 : 0,
    ].reduce((total, current) => total + current, 0);
  }, [filters]);

  /**
   * Tất cả lọc/sort được xử lý ở module để page không còn business logic trong render.
   */
  const filteredAndSortedMenus = useMemo(() => {
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
  }, [filters, menuItems]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMenus.length / pagination.pageSize));
  const currentPage = Math.min(pagination.page, totalPages);

  const paginatedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredAndSortedMenus.slice(startIndex, endIndex);
  }, [currentPage, filteredAndSortedMenus, pagination.pageSize]);

  const handleFiltersChange = (nextFilters: MenuFilters) => {
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_MENU_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    // Trên mobile/tablet, nút áp dụng chủ yếu dùng để đóng sheet sau khi người dùng rà lại bộ lọc.
    setIsFilterSheetOpen(false);
  };

  const handleToggleMenu = (menu: MenuItem, isAvailable: boolean) => {
    if (selectedBranchId) {
      updateBranchMenuItem({
        branchId: selectedBranchId,
        itemId: menu.id,
        itemName: menu.name,
        payload: {
          branchPrice: menu.branchPrice ?? null,
          isAvailable,
        },
      });
      return;
    }

    toggleMenu({ menu, isAvailable });
  };

  const handleDeleteMenu = (menuId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      deleteMenu(menuId);
    }
  };

  const handleEditMenu = (menuId: string) => {
    const menu = globalMenuItems.find((item) => item.id === menuId) ?? null;
    setEditingMenu(menu);
  };

  const handleConfigureBranchMenu = (menu: MenuItem) => {
    setConfiguringBranchMenu(menu);
  };

  const handleSubmitBranchConfig = (payload: UpdateBranchMenuItemPayload) => {
    if (!selectedBranchId || !configuringBranchMenu) {
      return;
    }

    updateBranchMenuItem(
      {
        branchId: selectedBranchId,
        itemId: configuringBranchMenu.id,
        itemName: configuringBranchMenu.name,
        payload,
      },
      {
        onSuccess: () => {
          setConfiguringBranchMenu(null);
        },
      }
    );
  };

  return {
    categories,
    categoryManagementItems,
    canManageMenu,
    configuringBranchMenu,
    currentPage,
    debouncedSearch,
    editingMenu,
    filteredMenuCount: filteredAndSortedMenus.length,
    filters,
    isAddonError,
    isAddonFetching,
    isAddonLoading,
    isBranchConfigError,
    isBranchConfigFetching,
    isBranchConfigLoading,
    isBranchMode,
    isCategoryError,
    isCategoryFetching,
    isCategoryLoading,
    isError,
    isFetching,
    isFilterSheetOpen,
    isLoading,
    isUpdatingBranchMenuItem,
    nextCategoryDisplayOrder,
    paginatedMenus,
    rawAddons,
    selectedBranchName,
    showFilter,
    statusCounts,
    totalPages,
    activeFilterCount,
    setIsFilterSheetOpen,
    setShowFilter,
    onApplyFilters: handleApplyFilters,
    onConfigureBranchMenu: handleConfigureBranchMenu,
    onDeleteMenu: handleDeleteMenu,
    onEditMenu: handleEditMenu,
    onFilterChange: handleFiltersChange,
    onFilterReset: handleResetFilters,
    onPageChange: (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
    },
    onRefetchCategories: () => {
      void refetchCategories();
    },
    onRefetchMenus: () => {
      void refetch();
    },
    onRetryAddons: () => {
      void refetchAddons();
    },
    onSubmitBranchConfig: handleSubmitBranchConfig,
    onToggleMenu: handleToggleMenu,
    onUpdateEditingMenuOpen: (open: boolean) => {
      if (!open) {
        setEditingMenu(null);
      }
    },
    onUpdateBranchConfigOpen: (open: boolean) => {
      if (!open) {
        setConfiguringBranchMenu(null);
      }
    },
  };
};
