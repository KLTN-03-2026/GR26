import { useMemo, useState } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useSelectBranch } from '@modules/auth/hooks/useSelectBranch';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useAdjustStock } from '@modules/inventory/hooks/useAdjustStock';
import { useImportStock } from '@modules/inventory/hooks/useImportStock';
import { useInventoryBalances } from '@modules/inventory/hooks/useInventoryBalances';
import { useInventoryIngredientOptions } from '@modules/inventory/hooks/useInventoryIngredientOptions';
import { useInventorySemiProductOptions } from '@modules/inventory/hooks/useInventorySemiProductOptions';
import { useRecordProductionBatch } from '@modules/inventory/hooks/useRecordProductionBatch';
import { useRecordWaste } from '@modules/inventory/hooks/useRecordWaste';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryBalance,
  InventoryFilters,
  InventoryItemOption,
  RecordProductionBatchPayload,
  WasteRecordPayload,
} from '@modules/inventory/types/inventory.types';
import { usePermission } from '@shared/hooks/usePermission';

const INVENTORY_PAGE_SIZE = 12;

const DEFAULT_INVENTORY_FILTERS = (branchId: string | null): InventoryFilters => ({
  search: '',
  branchId: branchId ?? 'all',
  lowStockOnly: false,
});

const normalizeSearch = (value: string) => value.trim().toLowerCase();

export type InventoryManagementSection = 'ingredients' | 'semi-products';

/**
 * Hook quản lý toàn bộ state và xử lý dữ liệu cho trang kho.
 * Logic lọc, phân trang và điều phối mutation được gom về module thay vì để trong page.
 */
export const useInventoryManagement = (section: InventoryManagementSection = 'ingredients') => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const { can, isOwner } = usePermission();
  const { mutateAsync: selectBranch, isPending: isSelectingBranch } = useSelectBranch();
  const { data: branchList = [] } = useBranches();
  const { data, isLoading, isError, refetch, isFetching } = useInventoryBalances();
  const {
    data: ingredientOptions = [],
    refetch: refetchIngredientOptions,
  } = useInventoryIngredientOptions();
  const {
    data: semiProductOptions = [],
    refetch: refetchSemiProductOptions,
  } = useInventorySemiProductOptions();
  const { mutate: importStock, isPending: isImporting } = useImportStock();
  const { mutate: adjustStock, isPending: isAdjusting } = useAdjustStock();
  const { mutate: recordProductionBatch, isPending: isRecordingProduction } = useRecordProductionBatch();
  const { mutate: recordWaste, isPending: isRecordingWaste } = useRecordWaste();

  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_INVENTORY_FILTERS(currentBranchId));
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [isWasteDialogOpen, setIsWasteDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [activeActionBranchId, setActiveActionBranchId] = useState<string | null>(null);

  const balances = useMemo<InventoryBalance[]>(() => data?.data ?? [], [data?.data]);

  const branchOptions = useMemo(() => {
    return branchList.map((branch) => ({
      id: branch.id,
      name: branch.name,
    }));
  }, [branchList]);

  const branchNameMap = useMemo(() => {
    return new Map(branchList.map((branch) => [branch.id, branch.name]));
  }, [branchList]);
  const isSemiProductSection = section === 'semi-products';
  const sectionBalances = useMemo(() => {
    return balances.filter((balance) => {
      if (isSemiProductSection) {
        return balance.itemType === 'SUB_ASSEMBLY';
      }

      return balance.itemType !== 'SUB_ASSEMBLY';
    });
  }, [balances, isSemiProductSection]);

  const resolveBranchName = (branchId: string) => {
    return branchNameMap.get(branchId) ?? 'Chi nhánh không xác định';
  };

  const effectiveBranchFilter = isOwner ? filters.branchId : (currentBranchId ?? 'all');
  const selectedFilterBranchId = effectiveBranchFilter === 'all' ? null : effectiveBranchFilter;
  const actionBranchId = isOwner ? (selectedFilterBranchId ?? currentBranchId) : currentBranchId;
  const resolvedActionBranchId = activeActionBranchId ?? actionBranchId;

  const stockItemOptions = useMemo<InventoryItemOption[]>(() => {
    const seen = new Set<string>();
    const balancesForActions = resolvedActionBranchId
      ? sectionBalances.filter((balance) => balance.branchId === resolvedActionBranchId)
      : sectionBalances;

    return balancesForActions
      .filter((balance) => {
        if (seen.has(balance.itemId)) {
          return false;
        }

        seen.add(balance.itemId);
        return true;
      })
      .map((balance) => ({
        itemId: balance.itemId,
        itemName:
          balance.itemName?.trim() ||
          `${isSemiProductSection ? 'Bán thành phẩm' : 'Nguyên liệu'} ${balance.itemId.slice(0, 8)}`,
        unit: balance.unit,
      }))
      .sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi'));
  }, [isSemiProductSection, resolvedActionBranchId, sectionBalances]);

  /**
   * Dữ liệu tồn kho được lọc hoàn toàn tại module để component render chỉ việc tiêu thụ kết quả.
   */
  const filteredBalances = useMemo(() => {
    const keyword = normalizeSearch(filters.search);

    return sectionBalances.filter((balance) => {
      const matchesSearch =
        keyword.length === 0 ||
        balance.itemId.toLowerCase().includes(keyword) ||
        (balance.itemName?.toLowerCase().includes(keyword) ?? false);
      const matchesBranch = effectiveBranchFilter === 'all' || balance.branchId === effectiveBranchFilter;
      const matchesLowStock = !filters.lowStockOnly || balance.isLowStock;

      return matchesSearch && matchesBranch && matchesLowStock;
    });
  }, [effectiveBranchFilter, filters.lowStockOnly, filters.search, sectionBalances]);

  const totalPages = Math.max(1, Math.ceil(filteredBalances.length / INVENTORY_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBalances = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * INVENTORY_PAGE_SIZE;
    return filteredBalances.slice(startIndex, startIndex + INVENTORY_PAGE_SIZE);
  }, [filteredBalances, safeCurrentPage]);

  const totalItems = sectionBalances.length;
  const lowStockCount = sectionBalances.filter((balance) => balance.isLowStock).length;
  const visibleBranchCount = new Set(sectionBalances.map((balance) => balance.branchId)).size;
  const hasActiveFilters =
    Boolean(filters.search.trim()) || effectiveBranchFilter !== 'all' || filters.lowStockOnly;
  const isActionLocked = !actionBranchId;
  const canImport = can('INVENTORY_IMPORT');
  const canAdjust = can('INVENTORY_ADJUST');
  const canWaste = can('INVENTORY_WASTE');
  const canRecordProduction = isSemiProductSection && canImport;
  const selectedBranchName = resolvedActionBranchId ? resolveBranchName(resolvedActionBranchId) : null;
  const actionHint = (() => {
    if (!canImport && !canAdjust && !canWaste) {
      return null;
    }

    if (isOwner && !actionBranchId) {
      return 'Bạn đang ở chế độ xem tổng quan toàn chuỗi. Chọn một chi nhánh trong bộ lọc hoặc thao tác trực tiếp trên từng dòng tồn kho để làm việc nhanh.';
    }

    if (isOwner && effectiveBranchFilter === 'all' && currentBranchId) {
      return `Bạn đang xem toàn chuỗi. Nếu bấm thao tác từ toolbar, hệ thống sẽ áp dụng cho chi nhánh đang làm việc: ${resolveBranchName(currentBranchId)}.`;
    }

    if (isOwner && selectedFilterBranchId && selectedFilterBranchId !== currentBranchId) {
      return `Thao tác từ toolbar sẽ tự chuyển sang chi nhánh ${resolveBranchName(selectedFilterBranchId)} trước khi mở form.`;
    }

    return null;
  })();

  /**
   * Đồng bộ branch context trước khi gọi mutation kho.
   * Backend hiện suy ra chi nhánh thao tác từ JWT đang hoạt động.
   */
  const ensureActionBranchContext = async (targetBranchId?: string | null) => {
    const nextBranchId = targetBranchId ?? actionBranchId;

    if (!nextBranchId) {
      return false;
    }

    if (nextBranchId === currentBranchId) {
      return true;
    }

    try {
      await selectBranch(nextBranchId);
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenAdjust = async (itemId?: string, branchId?: string) => {
    const nextBranchId = branchId ?? actionBranchId;
    const hasContext = await ensureActionBranchContext(nextBranchId);

    if (!hasContext) {
      return;
    }

    setActiveActionBranchId(nextBranchId ?? null);
    setSelectedItemId(itemId);
    setIsAdjustDialogOpen(true);
  };

  const handleOpenWaste = async (itemId?: string, branchId?: string) => {
    const nextBranchId = branchId ?? actionBranchId;
    const hasContext = await ensureActionBranchContext(nextBranchId);

    if (!hasContext) {
      return;
    }

    setActiveActionBranchId(nextBranchId ?? null);
    setSelectedItemId(itemId);
    setIsWasteDialogOpen(true);
  };

  const handleOpenImport = async () => {
    const hasContext = await ensureActionBranchContext();

    if (!hasContext) {
      return;
    }

    if (isSemiProductSection) {
      void refetchSemiProductOptions();
    } else {
      void refetchIngredientOptions();
    }

    setActiveActionBranchId(actionBranchId);
    setSelectedItemId(undefined);
    setIsImportDialogOpen(true);
  };

  const handleOpenProduction = async (itemId?: string, branchId?: string) => {
    const nextBranchId = branchId ?? actionBranchId;
    const hasContext = await ensureActionBranchContext(nextBranchId);

    if (!hasContext) {
      return;
    }

    void refetchSemiProductOptions();
    setActiveActionBranchId(nextBranchId ?? null);
    setSelectedItemId(itemId);
    setIsProductionDialogOpen(true);
  };

  const handleImportSubmit = (payload: ImportStockPayload) => {
    importStock(payload, {
      onSuccess: () => {
        setIsImportDialogOpen(false);
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      },
    });
  };

  const handleAdjustSubmit = (payload: AdjustStockPayload) => {
    adjustStock(payload, {
      onSuccess: () => {
        setIsAdjustDialogOpen(false);
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      },
    });
  };

  const handleProductionSubmit = (payload: RecordProductionBatchPayload) => {
    recordProductionBatch(payload, {
      onSuccess: () => {
        setIsProductionDialogOpen(false);
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      },
    });
  };

  const handleWasteSubmit = (payload: WasteRecordPayload) => {
    recordWaste(payload, {
      onSuccess: () => {
        setIsWasteDialogOpen(false);
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      },
    });
  };

  return {
    branchOptions,
    canAdjust,
    canFilterByBranch: isOwner,
    canImport,
    canRecordProduction,
    canWaste,
    currentPage: safeCurrentPage,
    filteredBalances,
    filters: {
      ...filters,
      branchId: effectiveBranchFilter,
    },
    hasActiveFilters,
    isActionLocked,
    isAdjustDialogOpen,
    isAdjusting,
    isSelectingBranch,
    isError,
    isFetching,
    isImportDialogOpen,
    isImporting,
    isLoading,
    isProductionDialogOpen,
    isRecordingProduction,
    isRecordingWaste,
    isWasteDialogOpen,
    importItemOptions: isSemiProductSection ? semiProductOptions : ingredientOptions,
    lowStockCount,
    actionHint,
    onAdjustSubmit: handleAdjustSubmit,
    onClearFilters: () => {
      setFilters(DEFAULT_INVENTORY_FILTERS(currentBranchId));
      setCurrentPage(1);
    },
    onImportSubmit: handleImportSubmit,
    onOpenAdjust: handleOpenAdjust,
    onOpenImport: handleOpenImport,
    onOpenProduction: handleOpenProduction,
    onOpenWaste: handleOpenWaste,
    onPageChange: setCurrentPage,
    onRefetch: () => {
      void refetch();
    },
    onSearchChange: (value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));
      setCurrentPage(1);
    },
    onSelectAdjustDialogOpen: (open: boolean) => {
      setIsAdjustDialogOpen(open);

      if (!open) {
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      }
    },
    onSelectImportDialogOpen: (open: boolean) => {
      setIsImportDialogOpen(open);

      if (!open) {
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      }
    },
    onSelectProductionDialogOpen: (open: boolean) => {
      setIsProductionDialogOpen(open);

      if (!open) {
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      }
    },
    onSelectWasteDialogOpen: (open: boolean) => {
      setIsWasteDialogOpen(open);

      if (!open) {
        setActiveActionBranchId(null);
        setSelectedItemId(undefined);
      }
    },
    onSetBranchFilter: (value: string) => {
      setFilters((prev) => ({ ...prev, branchId: value }));
      setCurrentPage(1);
    },
    onSetLowStockFilter: (value: boolean) => {
      setFilters((prev) => ({ ...prev, lowStockOnly: value }));
      setCurrentPage(1);
    },
    stockItemOptions,
    onProductionSubmit: handleProductionSubmit,
    onWasteSubmit: handleWasteSubmit,
    pageSize: INVENTORY_PAGE_SIZE,
    paginatedBalances,
    resolveBranchName,
    selectedBranchName,
    selectedItemId,
    totalItems,
    totalPages,
    visibleBranchCount,
  };
};
