import { useMemo, useState } from 'react';
import { selectCurrentBranchId, useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { usePermission } from '@shared/hooks/usePermission';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PERMISSIONS } from '@shared/constants/permissions';
import { DEFAULT_PAGE_SIZE } from '../constants/menu.constants';
import { useAddons } from './useAddons';
import { useBranchMenuItems } from './useBranchMenuItems';
import { useCategories } from './useCategories';
import { useDeleteMenu } from './useDeleteMenu';
import { useMenus } from './useMenus';
import { useToggleMenu } from './useToggleMenu';
import { useUpdateBranchMenuItem } from './useUpdateBranchMenuItem';
import type {
  MenuFilters,
  MenuItem,
  MenuPaginationState,
  UpdateBranchMenuItemPayload,
} from '../types/menu.types';
import {
  DEFAULT_MENU_FILTERS,
  buildBranchConfigMap,
  buildCategoryCountMap,
  buildCategoryManagementItems,
  buildFilterCategories,
  buildGlobalMenuItems,
  buildMenuCategoryMap,
  buildMenuQueryParams,
  buildMenuStatusCounts,
  buildNextCategoryDisplayOrder,
  countActiveMenuFilters,
  filterAndSortMenus,
  mergeBranchMenuItems,
  paginateMenuItems,
  resolveSelectedBranchName,
} from '../utils';

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
  const selectedBranchId = useAuthStore(selectCurrentBranchId);
  const isBranchMode = Boolean(selectedBranchId);

  const menuQueryParams = useMemo(() => {
    return buildMenuQueryParams(debouncedSearch);
  }, [debouncedSearch]);

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

  const {
    data: branchMenuConfigs = [],
    isLoading: isBranchConfigLoading,
    isFetching: isBranchConfigFetching,
    isError: isBranchConfigError,
  } = useBranchMenuItems(selectedBranchId);

  /**
   * Map danh mục theo ID để card món ăn hiển thị đúng tên từ backend.
   */
  const categoryMap = useMemo(() => {
    return buildMenuCategoryMap(rawCategories);
  }, [rawCategories]);

  /**
   * Dữ liệu món ăn ở chế độ global, chưa ghép cấu hình riêng theo chi nhánh.
   */
  const globalMenuItems = useMemo<MenuItem[]>(() => {
    return buildGlobalMenuItems({
      rawMenuItems,
      categoryMap,
    });
  }, [categoryMap, rawMenuItems]);

  /**
   * Map cấu hình món ăn theo item ID để ghép giá/trạng thái khi đang thao tác trong chi nhánh.
   */
  const branchConfigMap = useMemo(() => {
    return buildBranchConfigMap(branchMenuConfigs);
  }, [branchMenuConfigs]);

  const selectedBranchName = useMemo(() => {
    return resolveSelectedBranchName({
      branches,
      selectedBranchId,
    });
  }, [branches, selectedBranchId]);

  /**
   * Ghép menu global với cấu hình branch để UI luôn hiển thị đúng giá bán và trạng thái phục vụ.
   */
  const menuItems = useMemo<MenuItem[]>(() => {
    return mergeBranchMenuItems({
      globalMenuItems,
      branchConfigMap,
      selectedBranchId,
      selectedBranchName,
    });
  }, [branchConfigMap, globalMenuItems, selectedBranchId, selectedBranchName]);

  /**
   * Gom số lượng món theo từng danh mục để tái sử dụng cho filter và dialog quản lý danh mục.
   */
  const categoryCountMap = useMemo(() => {
    return buildCategoryCountMap(menuItems);
  }, [menuItems]);

  /**
   * Danh mục thật từ backend, có kèm số món để hiển thị trong dialog quản lý.
   */
  const categoryManagementItems = useMemo(() => {
    return buildCategoryManagementItems({
      rawCategories,
      categoryCountMap,
    });
  }, [categoryCountMap, rawCategories]);

  /**
   * Danh sách danh mục hiển thị trong bộ lọc, có bổ sung nhóm "chưa phân loại" khi cần.
   */
  const categories = useMemo(() => {
    return buildFilterCategories({
      categoryManagementItems,
      categoryCountMap,
    });
  }, [categoryCountMap, categoryManagementItems]);

  /**
   * Thứ tự gợi ý cho danh mục mới để backend có thể render ổn định nếu chưa tự sinh order.
   */
  const nextCategoryDisplayOrder = useMemo(() => {
    return buildNextCategoryDisplayOrder(rawCategories);
  }, [rawCategories]);

  /**
   * Đếm số món theo trạng thái để chip filter hiển thị số liệu thực tế.
   */
  const statusCounts = useMemo(() => {
    return buildMenuStatusCounts(menuItems);
  }, [menuItems]);

  const activeFilterCount = useMemo(() => {
    return countActiveMenuFilters(filters);
  }, [filters]);

  /**
   * Tất cả lọc/sort được xử lý ở module để page không còn business logic trong render.
   */
  const filteredAndSortedMenus = useMemo(() => {
    return filterAndSortMenus({
      menuItems,
      filters,
    });
  }, [filters, menuItems]);

  const { currentPage, totalPages, paginatedMenus } = useMemo(() => {
    return paginateMenuItems({
      items: filteredAndSortedMenus,
      pagination,
    });
  }, [filteredAndSortedMenus, pagination]);

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
    selectedBranchId,
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
